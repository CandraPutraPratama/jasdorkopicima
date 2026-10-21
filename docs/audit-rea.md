# Audit Keamanan & Hardening (REA)

Dokumen ini mencatat hasil audit keamanan menyeluruh terhadap aplikasi Jasdor
menggunakan [REA (Reverse Engineer Anything)](https://github.com/morluto/rea),
temuan yang didapat, perbaikan yang sudah diterapkan, bukti verifikasi, dan
risiko yang masih tersisa.

Tanggal audit: 21 Oktober 2026
Rentang pekerjaan: 5 tahap (A sampai E)
Total deploy: 5 versi Worker
Status akhir: 415 test lulus, 0 gagal

---

## 1. Metodologi

### Alat yang dipakai

| Alat | Kegunaan | Catatan |
| --- | --- | --- |
| `rea analyze-javascript-application` | Analisis statis seluruh source (AST, import graph, endpoint, storage) | Dijalankan di WSL Ubuntu karena ada bug `dev/ino` di Windows |
| `rea inspect-web-network-capture` | Membaca HAR hasil rekaman browser (request, response, header, payload) | 130 record, 8,3 MB HAR |
| Playwright + Chrome headless | Rekaman HAR, screenshot, uji fungsional di bawah CSP | Dipakai juga untuk verifikasi pasca-deploy |
| `wrangler dev --local` | Uji jalur Cloudflare KV dan `_headers` asli | Bukan emulasi, memakai workerd |
| `wrangler kv` / Supabase REST | Verifikasi state produksi (counter, denylist) | Read-only kecuali pembersihan data uji |

### Catatan keterbatasan REA di Windows

`analyze-javascript-application` gagal di Windows dengan
`integrity_mismatch: Directory entry changed before open` untuk setiap file.
Penyebabnya perbedaan nilai `dev` antara `lstat()` (0) dan `fstat()` pada file
handle (2724547565) di Windows. Ini bug REA, bukan masalah project. Solusi:
jalankan analisis di WSL. Semua temuan statis di dokumen ini berasal dari
analisis di Linux.

### Lingkup analisis

| Metrik | Nilai |
| --- | --- |
| File relevan / parsed | 169 / 162 |
| AST node | 118.930 |
| Findings | 1.911 |
| Parse failure | 0 |
| Endpoint terpetakan | 54 |
| Modul dengan export | 56 |
| Unknown (dynamic call, object flow) | 18.422 |

---

## 2. Ringkasan Temuan Awal

Temuan diurutkan berdasarkan dampak. Semua sudah diperbaiki kecuali yang
ditandai sebagai risiko tersisa (lihat bagian 5).

| # | Severity | Temuan | Status |
| --- | --- | --- | --- |
| 1 | Kritis | Order ID pakai `Math.random()`, endpoint baca order tanpa autentikasi | Diperbaiki (Step A) |
| 2 | Kritis | Cookie admin menyimpan password apa adanya | Diperbaiki (Step B) |
| 3 | Kritis | Sesi admin in-memory, tidak konsisten antar-isolate Workers | Diperbaiki (Step B lanjutan) |
| 4 | Tinggi | Rate limit in-memory, tidak berlaku lintas isolate | Diperbaiki (Step C) |
| 5 | Tinggi | Tidak ada security header sama sekali | Diperbaiki (Step D) |
| 6 | Tinggi | `/api/wifi-today` membuka password WiFi Kopi Kenangan hari ini | Risiko tersisa (keputusan bisnis) |
| 7 | Sedang | `/api/outlets*` proxy tanpa auth ke API Kopi Kenangan | Risiko tersisa |
| 8 | Sedang | `/admin/pesanan` di-cache 1 tahun di edge Cloudflare | Diperbaiki (Step E) |
| 9 | Sedang | `/api/admin/orders` tanpa `Cache-Control` | Diperbaiki (Step E) |
| 10 | Rendah | Cron QRIS integrity check tanpa auth | Risiko tersisa |
| 11 | Rendah | Error 500 membocorkan `err.message` mentah | Risiko tersisa |
| 12 | Rendah | 5 halaman statis disajikan CDN tanpa security header | Diperbaiki (Step D lanjutan) |

---

## 3. Detail Temuan & Perbaikan

### 3.1 Step A — Order ID dan Token Akses Pesanan

**Temuan.**

`generateOrderId()` memakai `Math.random()` dengan 6 karakter dari alfabet 32,
sehingga ruang kemungkinan sekitar 1,07 miliar. Lebih penting:
`GET /api/orders/[id]` dan `POST /api/orders/[id]/confirm-payment` sama sekali
tidak memerlukan autentikasi. Siapa pun bisa mengenumerasi ID lalu membaca nama
pelanggan, nomor WhatsApp, isi pesanan, dan total pembayaran. Endpoint konfirmasi
juga memungkinkan pihak lain menandai pesanan orang sebagai
`menunggu_konfirmasi`.

**Perbaikan.**

- `generateOrderId()` memakai `crypto.getRandomValues()`. Karakter ambigu
  (`I`, `O`, `0`, `1`) dihapus agar mudah dibacakan ke admin.
- Token akses per pesanan: 16 byte acak = 32 hex, disimpan di kolom
  `orders.access_token`.
- Verifikasi token memakai perbandingan constant-time, bukan `===`.
- Kedua endpoint mengembalikan **404 seragam** (bukan 401) agar penyerang tidak
  bisa membedakan "ID tidak ada" dari "token salah".
- Token **tidak pernah** dikembalikan pada respons pembacaan; hanya sekali saat
  pembuatan pesanan.
- Migrasi: `supabase/migrations/007_add_order_access_token.sql`.

**Bukti verifikasi end-to-end (production, order asli di Supabase).**

| Uji | Hasil |
| --- | --- |
| `GET /api/orders/<id>` tanpa token | 404 |
| `GET /api/orders/<id>?t=<salah>` | 404 |
| `GET /api/orders/<id>?t=<benar>` | 200, `access_token` tidak ada di body |
| `POST .../confirm-payment` tanpa/salah token | 404, status pesanan tidak berubah |
| `POST .../confirm-payment?t=<benar>` | 200, status menjadi `menunggu_konfirmasi` |
| `/bayar/<id>` tanpa/salah token | 404 |
| `/bayar/<id>?t=<benar>` | 200 |

**Konsekuensi yang disengaja (fail-closed).** Pesanan lama yang dibuat sebelum
migrasi memiliki `access_token` NULL dan tidak dapat dibuka lagi. Ini dipilih
sadar: lebih baik pesanan lama mati daripada data pelanggan dapat dibaca siapa
pun yang menebak ID. Dampaknya kecil karena pesanan kedaluwarsa otomatis dalam
60 menit dan dibatalkan otomatis pada 00:00 WIB.

---

### 3.2 Step B — Sesi Admin

**Temuan awal.**

`src/app/api/admin/auth/route.ts` menyimpan password admin apa adanya sebagai
nilai cookie (`value: expectedPassword`). Cookie memang `httpOnly`, tetapi satu
kebocoran cookie berarti kebocoran kredensial permanen. Perbandingan password
juga memakai `===`, yang tidak constant-time.

**Perbaikan tahap pertama.** Cookie diganti token sesi acak 256-bit yang dapat
dicabut.

**Temuan baru saat verifikasi production (kritis).**

Setelah deploy, panel admin berubah-ubah antara 401 dan 200:

```
401  a4e198119db1815c-NRT
200  a4e19814bdae6021-SIN
401  a4e1981778c2815c-NRT
200  a4e19818894f6021-SIN
```

Terbukti dari header `cf-ray` bahwa request dilayani **dua isolate berbeda**
(Tokyo dan Singapura). Sesi disimpan di `Map` in-memory, sehingga login di satu
isolate tidak dikenali isolate lain. Panel admin praktis tidak bisa dipakai.

**Perbaikan final: token stateless bertanda tangan HMAC.**

- Format token: `v1.<expiry_base36>.<nonce_hex>.<signature_hex>`
- Signature HMAC-SHA256 atas `v1.<expiry>.<nonce>`, sehingga **semua isolate**
  dapat memvalidasi tanpa berbagi state. Tidak ada I/O, tidak ada eventual
  consistency.
- Secret: `ADMIN_SESSION_SECRET` bila diset (min 16 karakter), jika tidak
  diturunkan dari `ADMIN_PASSWORD`. Bila keduanya tidak ada, pembuatan sesi
  gagal (fail-closed), bukan memakai default yang bisa ditebak.
- Logout tetap bisa mencabut token lebih awal lewat denylist.
- Nonce acak ditambahkan agar dua sesi pada milidetik yang sama tetap berbeda.

**Denylist: dari KV ke Supabase.**

Versi pertama memakai Cloudflare KV. KV bersifat eventually consistent, sehingga
pencabutan bisa terlambat beberapa detik di isolate lain. Karena itu denylist
dipindah ke tabel Supabase `revoked_admin_sessions` yang memberi konsistensi
kuat.

- Yang disimpan adalah **hash SHA-256 penuh** dari token, bukan token mentah.
- Baris memiliki `expires_at` agar bisa dibersihkan setelah token kedaluwarsa.
- Jika penulisan denylist gagal, pencabutan tetap dicatat di memori isolate
  sebagai jaring pengaman, dan kegagalan dilaporkan lewat `console.error`.
- Jika pembacaan denylist gagal, token yang signature-nya sah tetap diterima
  agar admin tidak terkunci keluar karena database down.
- Migrasi: `supabase/migrations/008_create_revoked_admin_sessions.sql`.

**Bukti verifikasi (production).**

| Uji | Hasil |
| --- | --- |
| Login | 200, token 93 karakter, cookie tanpa password |
| Cookie flags | `HttpOnly`, `Secure`, `SameSite=lax` |
| 8 request berurutan dengan token sama | 200 (8/8) |
| Logout lalu pakai token lagi | 401 (6/6, tanpa jeda) |
| Login baru setelah logout | 200, token lain tetap berfungsi |
| Token lama tidak mempengaruhi token baru | A: 401, B: 200 |
| Isi tabel denylist | hash SHA-256 64 hex, TTL 7 hari, tanpa token mentah |

**Rotasi sesi tanpa mengganti password.**

```powershell
npx wrangler secret put ADMIN_SESSION_SECRET
```

Semua sesi langsung mati, password admin tetap sama.

---

### 3.3 Step C — Rate Limiting Terdistribusi

**Temuan.**

`src/lib/rate-limit.ts` memakai `new Map()` in-memory. Cloudflare Workers
menjalankan banyak isolate yang bisa dibuat dan dihentikan kapan saja, sehingga
batas seperti "5 percobaan login per menit" praktis bisa dilewati. Brute force
password admin menjadi realistis.

**Perbaikan.** Counter disimpan di Cloudflare KV (`RATE_LIMIT_KV`), dengan
fallback in-memory bila KV tidak tersedia.

**Temuan baru saat pengujian dengan KV asli.**

Versi KV-only **gagal menahan burst paralel**:

```
8 request paralel dari IP sama, batas 5/menit
hasil: 8/8 lolos (401 semua), 0 diblokir
counter KV setelahnya: count = 2 (seharusnya 8)
```

Penyebab: operasi KV tidak transaksional. Delapan request membaca counter yang
sama (`count: 1`) lalu saling menimpa (last write wins).

**Perbaikan final: pertahanan berlapis.**

- Lapisan 1, in-memory: sinkron, menangkap burst paralel dalam satu isolate.
- Lapisan 2, KV: menangkap akumulasi lintas isolate.
- Ditolak jika **salah satu** lapisan menolak (fail-closed).

Hasil setelah perbaikan, diuji pada workerd dengan KV asli:

```
8 request paralel, batas 5/menit
hasil: 5x 401, 3x 429   (tepat 5 lolos, 3 diblokir)
```

**Bukti verifikasi (production).**

| Uji | Hasil |
| --- | --- |
| 5 percobaan login salah | 401 |
| Percobaan ke-6 | 429, `Retry-After: 57`, `X-RateLimit-Remaining: 0` |
| Password benar saat terblokir | 429 |
| IP berbeda | 401 (tidak terpengaruh) |
| Isi KV | key `rl:admin-auth:<ip>`, value `{"count":N,"resetAt":...}` |

**Batas yang berlaku.**

| Endpoint | Key | Maks | Window |
| --- | --- | --- | --- |
| `POST /api/admin/auth` | `admin-auth:<ip>` | 5 | 60s |
| `POST /api/orders/create` | `order-create:<ip>` | 15 | 60s |
| `POST /api/orders/[id]/confirm-payment` | `order-confirm:<ip>` | 20 | 60s |
| `GET /api/orders/[id]` | `order-get:<ip>` | 60 | 60s |
| `POST /api/outlets/[code]/validate-cart` | `validate-cart:<ip>` | 20 | 60s |
| `GET /api/outlets*` | `search:` / `outlet:` / `menu:` / `options:` | 60 | 60s |
| `GET /api/operational-status` | `operational:<ip>` | 120 | 60s |

Dokumentasi setup: `docs/rate-limit-config.md`.

---

### 3.4 Step D — Security Headers

**Temuan.**

Respons production hanya memiliki `cache-control`, `cf-ray`, dan header CDN
lain. Tidak ada CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, maupun `Permissions-Policy`. Tidak ada `middleware.ts` dan
`next.config.ts` tidak menyetel header. Situs dapat di-iframe, sehingga flow
QRIS rentan clickjacking.

**Perbaikan.**

Satu sumber kebijakan di `src/lib/security-headers.ts`, dipakai oleh
`next.config.ts` untuk seluruh route:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
  https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline';
  font-src 'self' data:; img-src 'self' data: blob:
  https://gambar.cimagroup.my.id https://cdn.kopikenangan.com;
  connect-src 'self' https://cloudflareinsights.com; media-src 'self';
  worker-src 'self' blob:; manifest-src 'self'; object-src 'none';
  base-uri 'self'; form-action 'self'; frame-ancestors 'self';
  upgrade-insecure-requests
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

HSTS tidak dikirim di development agar localhost tidak "teracuni" aturan HTTPS.

**Temuan baru saat verifikasi production.**

Deploy pertama **belum menutup 5 halaman statis**:

```
/faq                CSP=MISSING
/kontak             CSP=MISSING
/kebijakan-privasi  CSP=MISSING
/syarat-ketentuan   CSP=MISSING
/testimoni          CSP=MISSING
```

Penyebab: `scripts/copy-static-info-assets.mjs` menyalin halaman tersebut ke
`.open-next/assets/`, sehingga Cloudflare menyajikannya langsung dari CDN
**tanpa melewati Worker**. Header dari `next.config.ts` tidak pernah berjalan
untuk route itu. Ironisnya justru halaman yang paling statis dan paling mudah
di-iframe.

**Perbaikan final.** `scripts/write-assets-headers.ts` menulis file
`.open-next/assets/_headers` secara otomatis dari sumber kebijakan yang sama,
dan dijalankan sebagai bagian `build:worker`. Cloudflare Assets mendukung
`_headers` untuk kasus ini. Dengan begitu header Worker dan header static tidak
akan pernah berbeda.

**Bukti verifikasi (production).**

Semua route mengembalikan CSP, XFO, nosniff, dan HSTS:

```
/  /faq  /kontak  /kebijakan-privasi  /syarat-ketentuan  /testimoni
/outlet/LIPPO-PURI  /api/operational-status  /manifest.webmanifest
```

**Uji fungsional di browser (risiko utama CSP adalah merusak situs).**

| Uji | Hasil |
| --- | --- |
| CSS teraplikasi | background `rgb(243,236,224)`, font Plus Jakarta Sans |
| React hydration | jalan, tombol interaktif ada |
| Gambar | 10/10 loaded di `/testimoni`, 0 broken |
| Service worker | registered |
| PWA manifest | 200 |
| `fetch` API dari halaman | 200 (`connect-src` benar) |
| CSP violation | 0 |

**Batasan yang jujur.** `script-src` dan `style-src` masih memakai
`'unsafe-inline'` karena Next.js App Router menyisipkan inline script untuk
hydration dan Tailwind menghasilkan atribut style inline. Ini melemahkan
proteksi XSS. Yang tetap didapat: `connect-src` ketat (data tidak bisa dikirim
ke server penyerang), `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'self'` plus XFO (clickjacking tertutup), `form-action 'self'`,
serta whitelist eksplisit untuk `img-src` dan `script-src`. Menghapus
`'unsafe-inline'` memerlukan nonce per-request lewat middleware dinamis.

---

### 3.5 Step E — Cache-Control Respons Admin

**Temuan.**

```
/admin/pesanan          cache-control: s-maxage=31536000
/api/admin/orders       cache-control: (tidak ada)
/api/admin/auth         cache-control: (tidak ada)
```

Halaman panel admin di-cache satu tahun di edge Cloudflare. Respons daftar
pesanan tidak punya `Cache-Control` sama sekali, sehingga proxy atau heuristik
browser boleh menyimpannya. Respons login membawa `Set-Cookie` sesi tanpa
proteksi cache.

**Perbaikan.**

- `src/lib/admin-response.ts`: `adminJson()` dan `ADMIN_NO_STORE_HEADERS`
  (`Cache-Control`, `Pragma`, `Expires`, `Vary: Cookie`).
- Semua jalur keluar route admin memakai helper ini, termasuk 400, 401, 429,
  dan 500, bukan hanya jalur sukses.
- `next.config.ts`: rule `/admin/:path*` memaksa `no-store` pada halaman.

**Bukti verifikasi (production).**

| Path | `Cache-Control` |
| --- | --- |
| `/admin/pesanan` | `private, no-store, max-age=0, must-revalidate`, `Vary: Cookie` |
| `/api/admin/orders` | `private, no-store, max-age=0, must-revalidate`, `Vary: Cookie` |
| `/api/admin/site-settings` | `private, no-store, max-age=0, must-revalidate` |
| `/api/orders/CG-NOPE99` | `private, no-cache, no-store, max-age=0, must-revalidate` |

Halaman publik tidak ikut terpengaruh:

| Path | `Cache-Control` |
| --- | --- |
| `/` | `s-maxage=31536000` (sengaja, halaman publik) |
| `/faq` | `public, max-age=0, must-revalidate` |
| `/api/operational-status` | `no-store, no-cache, must-revalidate` |

---

## 4. Hasil Verifikasi Akhir

Dijalankan pada commit terakhir sebelum dokumen ini ditulis.

```
Tests:  415 lulus, 0 gagal (88 suite)
Types:  tsc --noEmit, 0 error
Lint:   0 error, 18 warning (semua sudah ada sebelum audit)
Build:  PASS
Deploy: version 0739d962
```

### Test baru yang menjaga setiap perbaikan

| File | Menjaga |
| --- | --- |
| `tests/order-access-token.test.ts` | ID crypto, token akses, 404 seragam |
| `tests/admin-session.test.ts` | Token HMAC, validasi lintas isolate, denylist |
| `tests/admin-auth-session.test.ts` | Login/logout, penolakan header password lama |
| `tests/rate-limit-kv.test.ts` | Kontrak limiter KV, fallback, TTL |
| `tests/rate-limit-brute-force.test.ts` | 429 setelah limit, burst paralel, isolasi IP |
| `tests/security-headers.test.ts` | Header wajib, CSP tidak wildcard, HSTS hanya produksi |
| `tests/admin-cache-control.test.ts` | `no-store` pada semua jalur admin |

### Regresi yang dicek ulang setelah setiap deploy

| Uji | Hasil |
| --- | --- |
| Order tanpa/salah token | 404 |
| Login admin 8x berurutan | 200 semua |
| Logout lalu pakai token | 401 semua, instan |
| Security header di `/`, `/faq`, `/admin`, `/api` | ada |
| Browser: CSS, gambar, service worker, API | normal, 0 CSP violation |
| Brute force | 429 setelah limit |

### Riwayat deploy

| Version | Isi |
| --- | --- |
| `a6f51d81` | Sesi admin HMAC stateless (perbaikan 401/200 bergantian) |
| `cd83e1d2` | Denylist sesi di Supabase (migrasi 008) |
| `e04acc39` | Security headers (next.config) |
| `4d993d82` | `_headers` untuk halaman statis |
| `0739d962` | Cache-Control admin (Step E) |

---

## 5. Risiko yang Masih Tersisa

Diurutkan berdasarkan prioritas. Semua di luar lingkup perbaikan yang sudah
dilakukan dan sengaja tidak disentuh tanpa keputusan pemilik produk.

### 5.1 `/api/wifi-today` membuka password WiFi (Tinggi, keputusan bisnis)

Endpoint publik mengembalikan password WiFi Kopi Kenangan untuk hari ini:

```
GET /api/wifi-today
{"ssid":"Teman Kenangan","username":"kopikenangan","password":"KenanganManis#21"}
```

Daftar 31 hari ada di `src/lib/server/wifi-passwords.ts`. Fitur ini mungkin
disengaja (wifi box untuk pelanggan), tetapi:

- Dapat di-scrape siapa pun tanpa batas selain rate limit per IP.
- Menjadikan situs ini sumber resmi password WiFi milik Kopi Kenangan, yang
  berisiko dari sisi ketentuan layanan pihak ketiga.

Opsi: pindahkan ke balik sesi admin, atau tampilkan hanya setelah pelanggan
menyelesaikan pesanan, atau hapus fitur.

### 5.2 `/api/outlets*` proxy tanpa auth (Sedang)

`/api/outlets`, `/api/outlets/[code]`, `/api/outlets/[code]/menu` dan
sejenisnya meneruskan permintaan ke API Kopi Kenangan memakai sesi server.
Tidak ada autentikasi, hanya rate limit per IP. Kuota dan sesi API Kopi
Kenangan dapat dikuras pihak lain.

Opsi: cache lebih agresif, atau wajibkan token sesi ringan untuk endpoint menu.

### 5.3 `'unsafe-inline'` pada CSP (Sedang)

Dijelaskan di bagian 3.4. Perlu nonce per-request lewat middleware untuk
menghapusnya. Berisiko merusak hydration bila salah, jadi butuh pengujian
browser menyeluruh.

### 5.4 Rate limit masih bisa bocor pada burst lintas isolate (Rendah)

Pertahanan berlapis menahan burst dalam satu isolate secara tepat. Bila
Cloudflare menyebar request paralel ke banyak isolate sekaligus, masih ada
kemungkinan sedikit kebocoran karena operasi KV tidak transaksional. Untuk brute
force password admin ini menaikkan biaya serangan dari "praktis tak terbatas"
menjadi "maksimal sekitar 5 per isolate per menit".

Solusi akurat: Durable Object dengan satu titik serialisasi. Antarmuka
`checkRateLimitKV()` tidak perlu berubah.

### 5.5 Cron QRIS integrity check tanpa auth (Rendah)

`GET`/`POST /api/cron/jasdor-qris-integrity-check` dapat dipanggil siapa pun.
Dampaknya hanya pemborosan compute dan pembacaan hash file publik. Tidak
membocorkan data sensitif. Cukup tambahkan pemeriksaan secret yang sama dengan
cron lain bila dianggap perlu.

### 5.6 Pesan error 500 membocorkan detail internal (Rendah)

Beberapa route mengembalikan `err.message` mentah dari Supabase ke klien.
Berguna saat debugging, tetapi bisa membocorkan nama tabel atau constraint.
Opsi: petakan error database ke pesan generik dan catat detail hanya di log
server.

### 5.7 Sesi admin hilang bila isolate berpindah (Selesai, dicatat untuk konteks)

Sudah diperbaiki dengan token stateless. Dicatat di sini karena menjadi pelajaran
penting: penyimpanan state in-memory **tidak pernah** aman sebagai satu-satunya
sumber kebenaran di Cloudflare Workers.

---

## 6. Catatan Proses

### Bug REA yang ditemukan

1. `analyze-javascript-application` selalu gagal di Windows dengan
   `integrity_mismatch` akibat perbedaan `dev` antara `lstat()` dan `fstat()`.
   Solusi: jalankan di WSL.
2. `capture-browser-scenario` gagal membaca file input di Windows (`ESTALE`),
   bahkan untuk file yang baru ditulis. Solusi: pakai Playwright langsung untuk
   merekam HAR.

### Pelajaran teknis

- **Verifikasi pasca-deploy wajib, bukan opsional.** Tiga bug production hanya
  muncul saat diuji di production: sesi antar-isolate, halaman statis tanpa
  header, dan cache admin satu tahun. Unit test tidak menangkapnya.
- **Uji dengan infrastruktur asli.** Bug race condition KV hanya terlihat saat
  dijalankan di `wrangler dev` dengan binding KV asli, bukan di fake KV.
- **Baca header respons, jangan percaya konfigurasi.** `next.config.ts` terlihat
  benar, tetapi 5 halaman tetap tanpa header karena disajikan dari CDN.
- **`cf-ray` adalah alat diagnosis yang berguna.** Perbedaan prefix `cf-ray`
  membuktikan request dilayani isolate berbeda.

---

## 7. Berkas yang Ditambahkan atau Diubah

### Berkas baru

| Berkas | Isi |
| --- | --- |
| `src/lib/admin-session.ts` | Token sesi HMAC, denylist |
| `src/lib/admin-response.ts` | Helper respons admin tanpa cache |
| `src/lib/rate-limit-kv.ts` | Rate limit KV berlapis |
| `src/lib/security-headers.ts` | Sumber kebijakan security header |
| `scripts/write-assets-headers.ts` | Generator `_headers` untuk static asset |
| `supabase/migrations/007_add_order_access_token.sql` | Kolom token akses pesanan |
| `supabase/migrations/008_create_revoked_admin_sessions.sql` | Tabel denylist sesi |
| `docs/rate-limit-config.md` | Panduan setup KV |
| `docs/audit-rea.md` | Dokumen ini |
| 7 berkas test baru | Lihat bagian 4 |

### Berkas utama yang diubah

| Berkas | Perubahan |
| --- | --- |
| `src/lib/order-service.ts` | ID crypto, token akses, guard skema DB |
| `src/types/order.ts` | Field `access_token` |
| `src/lib/admin-auth.ts` | Verifikasi sesi (async), tolak header password lama |
| `src/lib/rate-limit.ts` | Parameter `now` opsional untuk test deterministik |
| `src/lib/my-orders.ts` | Simpan token, helper URL pembayaran |
| `src/app/api/orders/[id]/route.ts` | Wajib token, 404 seragam |
| `src/app/api/orders/[id]/confirm-payment/route.ts` | Wajib token sebelum mutasi |
| `src/app/api/orders/create/route.ts` | Kembalikan token sekali, redirect lengkap |
| `src/app/api/admin/auth/route.ts` | Sesi token, constant-time, no-store |
| `src/app/api/admin/orders/route.ts` | `adminJson`, no-store |
| `src/app/api/admin/site-settings/route.ts` | `adminJson`, no-store |
| 10 route API | `checkRateLimit` menjadi `await checkRateLimitKV` |
| `src/app/bayar/[orderId]/page.tsx` | Validasi token, `notFound` bila salah |
| `src/components/PaymentView.tsx` | Kirim token pada polling dan konfirmasi |
| `src/components/CartDrawer.tsx` | Simpan token, redirect dengan token |
| `src/components/ActiveOrderBanner.tsx` | Link pembayaran dengan token |
| `src/components/MyOrdersView.tsx` | Link pembayaran dengan token |
| `next.config.ts` | Security header, no-store admin |
| `wrangler.jsonc` | Binding `RATE_LIMIT_KV` |
| `package.json` | `build:worker` menjalankan generator `_headers` |

### Berkas test yang disesuaikan

| Berkas | Alasan |
| --- | --- |
| `tests/orders.test.ts` | Format ID baru, field token |
| `tests/my-orders.test.ts` | Token tersimpan di localStorage |
| `tests/bundling-only-mode.test.ts` | Header auth lama diganti cookie sesi |
| `tests/server-price-recalculation.test.ts` | Mock outlet 24 jam agar tidak flaky berdasarkan jam |

---

## 8. Checklist Deploy

Dijalankan sekali saat menerapkan seluruh perubahan.

- [x] Jalankan `supabase/migrations/007_add_order_access_token.sql`
- [x] Jalankan `supabase/migrations/008_create_revoked_admin_sessions.sql`
- [x] Buat namespace KV: `npx wrangler kv namespace create RATE_LIMIT_KV`
- [x] Isi `id` namespace ke `wrangler.jsonc`
- [x] Set secret sesi: `npx wrangler secret put ADMIN_SESSION_SECRET`
- [x] `npm run deploy`
- [x] Login ulang admin (token format lama tidak dikenali)
- [x] Verifikasi header, brute force, logout, dan token pesanan di production

### Perintah verifikasi cepat

```powershell
# Security header
curl -sI https://jasdor.cimagroup.my.id/ | Select-String "content-security-policy|x-frame-options|strict-transport"

# Cache-Control admin
curl -sI https://jasdor.cimagroup.my.id/admin/pesanan | Select-String "cache-control"

# Brute force (harus 429 pada percobaan ke-6)
1..6 | ForEach-Object {
  (Invoke-WebRequest -Uri "https://jasdor.cimagroup.my.id/api/admin/auth" `
    -Method POST -ContentType "application/json" `
    -Body '{"password":"salah"}' -SkipHttpErrorCheck).StatusCode
}
```
