# Panduan Operasional & Pemeliharaan (Runbook) — Jasdor Kopi Cima

Panduan ini ditujukan bagi pemilik dan pengelola teknis untuk mengoperasikan, mengonfigurasi, dan menangani insiden pada layanan jastip **jasdorkopicima**.

---

## 1. Konfigurasi Bisnis (Satu File Terpusat)

Semua aturan harga, fee, diskon, jam operasional, dan filter menu tersimpan di satu file:
📁 [`src/config/business.ts`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/src/config/business.ts)

### A. Mengubah Persentase Diskon Menu Dasar
Di objek `BUSINESS_CONFIG.pricing`:
```ts
baseDiscountPercent: 0.5, // 0.5 = diskon 50%
```

### B. Mengubah Biaya Jasa (Fee)
```ts
feeSingleItem: 4000, // Rp4.000 jika hanya pesan 1 item
feeMultiItem: 2000,  // Rp2.000 per item jika pesan >= 2 item
```

### C. Mengubah Tambahan Harga Varian Flat
```ts
flatOptionAdditions: {
  'large': 5000,        // Upsize Large +Rp5.000
  'juwara beans': 3000, // Beans Juwara +Rp3.000
  'oatside': 3000,      // Susu Oatside +Rp3.000
}
```

### D. Mengubah Harga Addon / Topping Flat
```ts
addonPrices: {
  whippedCream: 0, // Whipped Cream gratis
  syrup: 6000,     // Syrup +Rp6.000 per pilihan
  topping: 6000,   // Topping +Rp6.000 per pilihan
}
```

### E. Mengganti Nomor WhatsApp Admin
Bisa diatur lewat file `.env.local` / secret Cloudflare:
```env
NEXT_PUBLIC_WHATSAPP_PHONE=628xxxxxxxxxxx
```
Atau nilai fallback di [`src/config/business.ts`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/src/config/business.ts) baris `whatsappNumber`.

### F. Mengubah Daftar Kelompok Menu & Produk Tersembunyi
- **Allowlist Kelompok Menu**:
  ```ts
  menuGroupAllowlist: [
    'Baru!',
    'Coffee',
    'Non Coffee',
    'Kenangan Frappe',
    'Kenangan Toast',
    'Food',
  ]
  ```
- **Pola Nama Produk Tersembunyi** (tidak peka huruf besar/kecil):
  ```ts
  hiddenProductPatterns: [
    'seliter',
    'chigo',
    'chimate',
    'krunchi',
    'flip',
  ]
  ```

---

## 2. Penjelasan Aturan Ruang Lingkup Brand Outlet

Sesuai keputusan pemilik pada Revisi 5C & Perbaikan Lingkup:
1. **HANYA outlet Kopi Kenangan yang masuk ke dalam sistem**.
2. **Kriteria IN-SCOPE (Masuk)**:
   - Memiliki `brand_code: 1` di array `brand_and_image` KK.
   - **TIDAK** memuat `brand_code: 10` (Kenangan Signature) atau `brand_code: 6` (Kenangan Heritage).
   - **Outlet Gabungan Kopi Kenangan + Chigo (brand_code 1 dan 4/8) TETAP MASUK**.
   - Nama toko yang memuat kata "Chigo" tidak menolak outlet selama memiliki `brand_code: 1`.
3. **Kriteria OUT-OF-SCOPE (Ditolak / 404)**:
   - Kenangan Signature (nama/kode memuat Signature, KS., atau brand_code 10).
   - Kenangan Heritage (nama/kode memuat Heritage, KH., jkt.kenhertg, atau brand_code 6).
   - Outlet Chigo saja (hanya brand_code 4 atau 8 tanpa brand_code 1).
   - Outlet testing/booth (`testposstores`, `Internal Testing Only`).
   - Outlet tanpa brand sama sekali (`BCR.JAB.O0001`, `BCR.JAB.O0002`, `KK.BTM.RKTNJGUNCG`).
4. Semua outlet out-of-scope otomatis dijawab `404 Not Found` pada API dan menampilkan layar "Outlet Tidak Ditemukan" di frontend.

---

## 3. Cara Melakukan Deploy Ulang ke Cloudflare

Setiap kali melakukan perubahan kode atau konfigurasi:
```bash
# 1. Jalankan unit test dan typecheck
npm test
npx tsc --noEmit

# 2. Build worker OpenNext
npm run build:worker

# 3. Deploy ke Cloudflare Workers
npx wrangler deploy
```

Deployment otomatis terhubung ke custom domain: `https://jasdor.cimagroup.my.id`.

---

## 4. Cara Memicu Sinkronisasi Outlet Manual

Sinkronisasi outlet terjadwal otomatis berjalan via GitHub Actions / Cloudflare Cron. Jika ingin memicu sync secara manual:

```bash
# Menggunakan curl di terminal
curl -X POST https://jasdor.cimagroup.my.id/api/cron/sync-outlets \
  -H "Authorization: Bearer <SYNC_SECRET_MILIKMU>"
```

### Memeriksa Status & Waktu Terakhir Sync Berhasil
Buka endpoint:
```
https://jasdor.cimagroup.my.id/api/sync-status
```
Respons menampilkan:
- `totalOutlets`: total outlet di database (1.358)
- `inScopeOutlets`: total outlet Kopi Kenangan yang aktif (1.337)
- `outOfScopeOutlets`: total outlet yang diabaikan (21)
- `lastSyncedAt`: waktu WIB / ISO terakhir database diperbarui.

---

## 5. Cara Memutar Ulang Secret (Key Rotation)

Jika token atau kunci API bocor atau perlu diganti berkala:

1. **`SYNC_SECRET`**:
   - Buat string acak baru (misal 32 karakter hex).
   - Perbarui di GitHub Repository Secrets (`SYNC_SECRET`).
   - Perbarui di Cloudflare Worker Secrets:
     ```bash
     npx wrangler secret put SYNC_SECRET
     ```
2. **Kunci Supabase (`SUPABASE_SERVICE_ROLE_KEY`)**:
   - Generate service role key baru di dashboard Supabase (Project Settings > API).
   - Perbarui di `.env.local` lokal.
   - Perbarui di Cloudflare Worker:
     ```bash
     npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
     ```
3. **`KOPI_KENANGAN_PHONE`**:
   - Jika ingin menggunakan nomor akun KK tertentu untuk token, perbarui secret:
     ```bash
     npx wrangler secret put KOPI_KENANGAN_PHONE
     ```

---

## 6. Pengaman Margin & Cara Membaca Log Peringatan

### Batas Impas Bisnis
- Tambahan Large flat adalah **+Rp5.000**. Karena promo dasar 50%, tambahan ini **impas bila selisih Large di KK adalah Rp10.000** (50% dari Rp10.000 = Rp5.000), dan **menguntungkan pemilik bila selisih di KK di bawah Rp10.000** (contoh Taro Cloud Latte: selisih KK Rp7.000, jastip menarik Rp5.000 dari promo Rp11.000 -> impas/untung).
- Tambahan Juwara Beans flat: **+Rp3.000** (impas pada selisih KK Rp3.000).
- Tambahan Oatside flat: **+Rp3.000** (impas pada selisih KK Rp3.000).

### Log Peringatan di Cloudflare Workers
Jika di masa mendatang Kopi Kenangan menaikkan selisih harga Large atau beans di atas batas tersebut, sistem secara otomatis mencatat peringatan di log:
```
[MarginGuard] PERINGATAN MARGIN: Produk "..." di outlet [...] memiliki selisih Large Rp12.000 (melebihi batas impas Rp10.000). Tambahan flat Large Rp5.000 berpotensi merugikan untuk item ini.
```
- **Cara Melihat**: Di Dashboard Cloudflare Workers > `jasdorkopicima` > Logs > Live tail, atau gunakan `npx wrangler tail`.
- **Tindakan**: Jika peringatan ini muncul untuk banyak produk, pemilik dapat mempertimbangkan menaikkan `flatOptionAdditions.large` di [`src/config/business.ts`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/src/config/business.ts) menjadi Rp6.000.

---

## 7. Rencana Kontinjensi Insiden (Troubleshooting)

### A. Jika Kopi Kenangan Mengubah Format API atau Memblokir IP
- **Pengecekan Stok**: Endpoint `/api/outlets/[code]/validate-cart` secara otomatis masuk ke mode `uncertain` dan tidak memblokir customer. Customer akan melihat pesan konfirmasi dan tetap dapat mengirim pesanan ke WhatsApp.
- **Cache Stale-if-Error**: Data menu dan outlet yang tersimpan di Supabase akan tetap disajikan ke pengguna walaupun panggilan langsung ke KK gagal.
- **Tindakan Teknis**: Buka log via `npx wrangler tail`, periksa apakah respons error berupa `444` (sesi habis), `403/429` (Cloudflare/WAF KK membatasi IP). Jika IP Cloudflare dibatasi, naikkan jeda sopan `politeDelayMs` di config atau ubah User-Agent.

### B. Jika Database Supabase Terhenti / Gangguan
- Sistem memiliki **In-Memory Fallback Cache** di level Worker, sehingga menu yang sedang aktif tetap dapat diakses.
- Jika pencarian database gagal, sistem otomatis beralih memanggil `kkApiClient.queryStore` secara real-time.
- Periksa status koneksi di dashboard Supabase (Status Page & Compute Usage).

---

## 8. Panduan Pembatasan Laju (Rate Limiting) WAF Cloudflare

### A. Kejujuran Mengenai Rate Limiter In-Memory Bawaan Kode
Rate limiter yang saat ini aktif di dalam kode aplikasi ([`src/lib/rate-limit.ts`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/src/lib/rate-limit.ts)) berjalan secara *in-memory* di dalam setiap isolate/instance Worker.
- **Kelebihan**: Berjalan tanpa biaya tambahan dan tanpa perlu database eksternal.
- **Keterbatasan**: Bersifat *per-instance* (tidak terbagi secara global di seluruh edge Cloudflare). Jika request pengguna diarahkan ke PoP/datacenter Cloudflare yang berbeda (misalnya antara Jakarta, Singapura, atau instance worker yang baru aktif), memori pelacaknya terpisah. Data hitungan juga akan ter-reset setiap kali Worker melakukan restart atau deployment baru.
- **Solusi Ideal**: Untuk proteksi global di level edge jaringan sebelum request menyentuh kode Worker, disarankan mengaktifkan **Cloudflare WAF Rate Limiting Rule** di dashboard Cloudflare (tersedia di paket Cloudflare).

---

### B. Analisis Pola Pemakaian Wajar Pelanggan Asli
Berdasarkan alur pemesanan di antarmuka web, satu sesi pemesanan normal seorang pelanggan menghasilkan rentetan request API sebagai berikut:
1. **Membuka Halaman Beranda**:
   - `GET /api/operational-status` (1x request)
2. **Mencari Outlet**:
   - Mengetik nama outlet/daerah (fitur debounce 300ms): rata-rata 2 s/d 4x request `GET /api/outlets?q=...`
3. **Membuka Detail & Menu Outlet**:
   - `GET /api/outlets/[code]` (1x request)
   - `GET /api/outlets/[code]/menu` (1x request)
4. **Melihat Varian & Opsi Produk (Membuka Bottom Sheet)**:
   - Pelanggan melihat-lihat dan mengklik 2 s/d 6 produk berbeda: 2 s/d 6x request `GET /api/outlets/[code]/products/[bundleCode]/options`
5. **Checkout & Validasi Keranjang**:
   - Menekan tombol pesan via WhatsApp: 1x request `POST /api/outlets/[code]/validate-cart`

**Total Pemakaian Wajar**:
- Per sesi pemesanan: **7 s/d 14 request** (tersebar dalam rentang 1 s/d 3 menit).
- Puncak aktivitas per menit: **5 s/d 10 request per menit per IP**.

---

### C. Usulan Ambang Batas (Threshold) WAF
Dengan konteks skala operasional **20–30 pesanan per hari**, ambang batas yang disarankan adalah:
👉 **100 request per 1 menit per IP** (10x lipat dari pemakaian wajar 10 req/menit).

**Alasan Pemilihan Angka 100 req/menit**:
1. Tidak mungkin terpicu oleh pelanggan asli, bahkan jika pelanggan mengklik menu dengan sangat cepat atau bolak-balik memeriksa opsi minuman.
2. Memberikan toleransi aman jika ada beberapa pelanggan yang memesan bersamaan dari satu jaringan kantor atau kafe yang menggunakan satu IP publik bersama (NAT).
3. Sangat efektif memblokir bot scraper, script spammer, atau serangan brute force yang mencoba menembus API dengan ratusan request per detik.

---

### D. Panduan Langkah demi Langkah Pembuatan Aturan di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) dan pilih domain/zona Anda (`cimagroup.my.id`).
2. Masuk ke navigasi sebelah kiri: **Security** > **WAF** > pilih tab **Rate limiting rules**.
3. Klik tombol **Create rule**.
4. Beri nama aturan: `Rate Limit API Jasdor`.
5. Pada bagian **If incoming requests match (Filter Expression)**:
   - **Field**: `URI Path`
   - **Operator**: `starts with`
   - **Value**: `/api/`
   - *(Opsional pengaman cron)*: Tambahkan `AND` -> `Header` (`Authorization`) -> `does not contain` -> `Bearer`.
6. Pada bagian **Rate limiting criteria**:
   - **Characteristics**: Pilih `IP` (default).
   - **Requests**: Isi `100`.
   - **Period**: Pilih `1 minute` (atau 60 seconds).
7. Pada bagian **Choose action (Saat Terlampaui)**:
   - Pilih aksi: **Managed Challenge** (Sangat Disarankan) atau **Block**.
   - Jika memilih Block: tentukan durasi mitigasi, misalnya `10 minutes`.
8. Klik **Deploy** untuk mengaktifkan aturan di seluruh edge server Cloudflare.

---

### E. Perbedaan Aksi untuk Pelanggan Asli: Managed Challenge vs Block
- **Managed Challenge (Rekomendasi)**:
  - *Cara Kerja*: Menampilkan verifikasi interaktif non-intrusif (Cloudflare Turnstile centang otomatis).
  - *Dampak Pelanggan Asli*: Jika terjadi *false positive* (misalnya 5 karyawan di 1 kantor memesan jastip berbarengan dari Wi-Fi yang sama dan total request mencapai 100 dalam semenit), pelanggan hanya diminta menyelesaikan verifikasi singkat lalu dapat langsung melanjutkan pesanan tanpa terganggu.
  - *Dampak Bot*: Bot atau skrip otomatis tanpa browser engine akan gagal melewati challenge dan otomatis terhenti.
- **Block (Blokir Sementara)**:
  - *Cara Kerja*: Cloudflare langsung mengembalikan kode status HTTP 429 atau halaman error "Access Denied".
  - *Dampak Pelanggan Asli*: Jika pelanggan terkena batas, mereka akan mengalami error total selama 10 menit dan gagal memesan. Karena itu, aksi Block hanya disarankan jika sistem sedang mengalami serangan DDoS/scraping masif yang jelas-jelas berniat jahat.

---

## 9. Panduan Penyiapan & Pemeliharaan Cloudflare R2 (Tahap 7)

Panduan ini mencakup langkah manual yang **HANYA bisa dilakukan oleh pemilik di Dashboard Cloudflare** untuk mengelola penyimpanan mandiri aset foto menu di Cloudflare R2.

### A. Status Konfigurasi R2 Saat Ini
- **Bucket R2**: `jasdorkopicima` (sudah dibuat pada 10 Oktober 2026, lokasi: APAC, storage class: Standard).
- **Domain Publik Custom**: `gambar.cimagroup.my.id` (sudah terhubung dan berstatus aktif dengan SSL Cloudflare).
- **Public dev-url (`r2.dev`)**: Dinonaktifkan (`Disabled`) demi keamanan (akses publik hanya melalui domain custom milik sendiri).
- **Binding Worker**: Belum terhubung di `wrangler.jsonc` (akan ditambahkan saat implementasi Tahap 7-B).

---

### B. Langkah Manual Pemilik di Dashboard Cloudflare

Langkah-langkah berikut memerlukan hak akses akun Cloudflare pemilik:

#### 1. Verifikasi Custom Domain & SSL Bucket
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > Navigasi ke **R2** > Pilih bucket `jasdorkopicima`.
2. Klik tab **Settings** > Gulir ke bagian **Public Access**.
3. Pastikan domain `gambar.cimagroup.my.id` tercantum dengan status:
   - **Ownership status**: `Active`
   - **SSL status**: `Active`
4. Jika status belum aktif, klik **Connect Domain**, masukkan `gambar.cimagroup.my.id`, dan konfirmasi penambahan record DNS CNAME otomatis.

#### 2. Konfigurasi Kebijakan CORS (Jika Diperlukan untuk Fetch/Canvas)
Secara bawaan, elemen HTML `<img>` atau `<Image>` Next.js dapat menampilkan gambar tanpa CORS. Namun, jika aset gambar akan diakses via JavaScript `fetch()` dari origin web:
1. Di halaman bucket `jasdorkopicima` > tab **Settings** > gulir ke **CORS Policy**.
2. Klik **Add CORS Policy** dan masukkan konfigurasi JSON:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://jasdor.cimagroup.my.id",
         "http://localhost:3000"
       ],
       "AllowedMethods": [
         "GET",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "MaxAgeSeconds": 86400
     }
   ]
   ```
3. Simpan perubahan.

#### 3. Pembuatan R2 API Token (Untuk Skrip Sinkronisasi Foto dari Luar Worker)
Jika proses pengunduhan & penyalinan foto dari CDN KK ke R2 dijalankan lewat skrip audit / background worker di server:
1. Di halaman utama Cloudflare Dashboard > **R2** > klik **Manage R2 API Tokens** di sebelah kanan.
2. Klik **Create API token**.
3. Beri nama token: `jasdor-r2-sync`.
4. Beri izin (Permissions): **Object Read & Write**.
5. Batasi cakupan (Apply to specific buckets): Pilih hanya bucket `jasdorkopicima`.
6. Tentukan TTL token atau biarkan tanpa batas sesuai kebutuhan.
7. Simpan **Access Key ID**, **Secret Access Key**, dan **Endpoint S3 URL** ke pengelola rahasia Anda (JANGAN commit ke git).

#### 4. Menghubungkan R2 Binding ke Worker (Untuk Tahap 7-B)
Jika Worker Next.js memerlukan akses langsung via SDK Cloudflare binding:
- Dapat dihubungkan via Dashboard: **Workers & Pages** > `jasdorkopicima` > **Settings** > **Variables and Secrets / Bindings** > **Add binding** (Type: `R2 Bucket`, Variable name: `R2_BUCKET`, Bucket: `jasdorkopicima`).
- Atau otomatis saat deploy via konfigurasi `wrangler.jsonc`:
  ```jsonc
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "jasdorkopicima"
    }
  ]
  ```

---

### C. Saklar IMAGE_SOURCE & Prosedur Rollback Cepat

Sistem dilengkapi saklar konfigurasi `IMAGE_SOURCE` untuk mengendalikan asal URL foto produk di katalog:
- **`IMAGE_SOURCE="r2"` (Aktif)**: URL foto produk diarahkan ke CDN R2 milik sendiri (`https://gambar.cimagroup.my.id/product/<uuid>.jpg`). Jika terdapat URL yang UUID-nya tidak dikenali, sistem otomatis mempertahankan URL asal CDN Kopi Kenangan sehingga tidak akan pernah terjadi gambar pecah.
- **`IMAGE_SOURCE="kk"` (Fallback Asal)**: URL foto produk 100% menunjuk ke CDN resmi Kopi Kenangan (`cdn.kopikenangan.com`).

#### Prosedur Rollback Darurat (Jika R2 / Domain Gambar Mengalami Gangguan):
Jika terjadi kendala pada bucket R2 atau domain gambar:
1. Buka file [`wrangler.jsonc`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/wrangler.jsonc), ubah nilai:
   ```jsonc
   "vars": {
     "IMAGE_SOURCE": "kk"
   }
   ```
   *(atau set env `IMAGE_SOURCE=kk` di Dashboard Cloudflare Workers)*.
2. Jalankan deploy ulang:
   ```bash
   npm run deploy
   ```
3. Seluruh URL foto produk akan langsung kembali menggunakan CDN Kopi Kenangan asli seketika setelah deploy selesai.

#### Skrip Pengelolaan Objek R2:
- **Sinkronisasi / Mirror Ulang**:
  ```bash
  node --env-file=.env.local --experimental-strip-types scripts/mirror-images.mjs
  ```
  *(Bersifat idempotent: hanya mengunggah file baru/berubah, file yang sudah ada otomatis dilewati)*.
- **Hapus Darurat Objek Mirror**:
  ```bash
  # Simulasi (Dry Run) tanpa menghapus apa pun:
  node scripts/purge-mirror.mjs

  # Eksekusi penghapusan sungguhan (hanya prefix product/):
  node scripts/purge-mirror.mjs --confirm
  ```

---

### D. Penanganan Cache 404 Edge (Custom Purge by URL)

Bila terdapat URL mirror yang mengembalikan status HTTP 404 di domain publik (`https://gambar.cimagroup.my.id/...`) padahal objeknya sebenarnya **sudah ada di bucket R2**:
Hal ini terjadi karena Cloudflare Edge secara default menyimpan cache respons 404 hingga beberapa jam jika URL tersebut pernah diakses publik *sebelum* objek selesai diunggah ke R2.

#### Langkah Purge URL di Dashboard Cloudflare:
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) > pilih zona domain `cimagroup.my.id`.
2. Buka menu **Caching** > **Configuration** (atau tab **Purge Cache**).
3. Klik tombol **Purge Cache** > pilih opsi **Custom Purge** (Purge by URL).
4. Masukkan URL mirror spesifik yang mengalami cache 404:
   - URL yang diketahui sempat ter-probe publik sebelum termirror pada Tahap 7-B/7-C:
     `https://gambar.cimagroup.my.id/product/6c925d17-6b7f-4952-9831-b0032ffd62e0.jpg`
     *(Disarankan pemilik melakukan Custom Purge pada URL ini setelah Langkah 2 selesai, untuk berjaga-jaga agar cache 404 lama di edge langsung bersih)*.
5. Klik tombol **Purge**. Cache edge akan langsung terhapus seketika dan request berikutnya akan langsung mengambil objek valid dari R2.

---

## 10. Repositori GitHub, Otomasi Sinkronisasi, & Pemulihan Bencana (Disaster Recovery)

### A. Repositori Proyek
- **URL Repositori**: `https://github.com/CandraPutraPratama/jasdorkopicima`
- **Visibilitas**: Private (hanya dapat diakses oleh pemilik akun).
- **Branch Utama**: `main`

### B. Otomasi Sinkronisasi Outlet (GitHub Actions)
- **Workflow File**: [`.github/workflows/sync-outlets.yml`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/.github/workflows/sync-outlets.yml)
- **Jadwal Cron Terjadwal**:
  - Pola: `0 21 * * *` (21:00 UTC = **04:00 WIB setiap hari**).
  - *Catatan Verifikasi*: Bukti eksekusi otomatis run **TERJADWAL** pertama baru dapat diverifikasi keesokan harinya setelah pukul 04:00 WIB di tab Actions GitHub. Jangan mengklaim run terjadwal sudah terbukti sebelum jam tersebut terlewati.
- **Daftar Nama Secret GitHub Actions**:
  - `SYNC_SECRET`: Secret token otorisasi yang dikirimkan via header `Authorization: Bearer <SYNC_SECRET>` ke endpoint `https://jasdor.cimagroup.my.id/api/cron/sync-outlets`. (Dikonfigurasi di *Settings > Secrets and variables > Actions*).

### C. Cara Menjalankan Sinkronisasi Manual
Terdapat dua cara untuk memicu sinkronisasi manual:
1. **Lewat Antarmuka GitHub Actions (Tanpa Terminal)**:
   - Buka repositori GitHub > klik tab **Actions**.
   - Pilih workflow **Sync Outlets Kopi Kenangan** di menu sebelah kiri.
   - Klik tombol dropdown **Run workflow** di sebelah kanan.
   - Pastikan branch terpilih adalah `main`, lalu klik tombol hijau **Run workflow**.
   - Pantau status job hingga selesai (ikon centang hijau).
2. **Lewat Terminal / cURL**:
   ```bash
   curl -X POST https://jasdor.cimagroup.my.id/api/cron/sync-outlets \
     -H "Authorization: Bearer <SYNC_SECRET_MILIKMU>"
   ```
3. **Verifikasi Pembaruan**:
   Periksa endpoint status: `https://jasdor.cimagroup.my.id/api/sync-status` dan pastikan `lastSyncedAt` telah berganti ke waktu run terbaru.

### D. Prosedur Pemulihan Bencana (Jika Laptop Pemilik Hilang / Rusak)
Jika perangkat kerja utama rusak, hilang, atau berganti ke laptop baru, berikut langkah pemulihan menyeluruh hingga sistem siap deploy kembali:

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/CandraPutraPratama/jasdorkopicima.git
   cd jasdorkopicima
   ```
2. **Pasang Dependensi**:
   ```bash
   npm install
   ```
3. **Buat File Konfigurasi `.env.local`**:
   Buat file `.env.local` di root proyek dan isi nilai-nilai rahasia berdasarkan daftar acuan di `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Diambil dari Dashboard Supabase (*Project Settings > API*).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Diambil dari Dashboard Supabase (*Project Settings > API*).
   - `SUPABASE_SERVICE_ROLE_KEY`: Diambil dari Dashboard Supabase (*Project Settings > API*).
   - `SYNC_SECRET`: Token acak yang sama dengan yang terdaftar di GitHub Secrets dan Cloudflare Worker secrets.
   - `NEXT_PUBLIC_WHATSAPP_PHONE`: Nomor WhatsApp bisnis (default `6287793420768`).
   - `ALLOW_SIMULATE`: Diset ke `0` (mode simulasi nonaktif).
4. **Verifikasi Integritas Kode**:
   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   ```
5. **Login Cloudflare & Deploy Ulang**:
   ```bash
   npx wrangler login
   npm run build:worker
   npx wrangler deploy
   ```
   *(Sistem akan langsung aktif kembali di domain `https://jasdor.cimagroup.my.id` tanpa kehilangan data, karena database outlet tetap tersimpan aman di Supabase dan foto tersimpan di Cloudflare R2)*.


