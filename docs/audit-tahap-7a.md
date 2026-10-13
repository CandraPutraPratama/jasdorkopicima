# Dokumen Audit Salinan Data & Foto (Tahap 7-A)

Dokumen ini memuat hasil audit menyeluruh terhadap data menu, inventaris foto, variasi harga dasar antar-outlet di 1.338 outlet resmi Kopi Kenangan, kesiapan Cloudflare R2, pemetaan sumber data halaman menu, serta penelusuran status penjadwal otomatis sinkronisasi outlet.

---

## 1. Inventaris Foto Produk (Seluruh Outlet dalam Lingkup)

### Metodologi
Pemindaian dilakukan pada seluruh **1.338 outlet in-scope** di Supabase menggunakan skrip audit [`scripts/audit-tahap-7a.mjs`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/scripts/audit-tahap-7a.mjs). Setiap outlet dipanggil ke endpoint resmi KK API `query_web_order_product_menu`, kemudian hasilnya diproses melalui fungsi normalisasi dan filter production (`normalizeMenu`) sehingga hanya produk yang benar-benar lolos tampil ke pelanggan yang diinventarisasi.

### Hasil Angka Nyata
| Indikator | Angka Nyata | Keterangan / Analisis |
|---|---|---|
| **Total Outlet In-Scope Dipindai** | **1.338 outlet** | 100% terpindai, 0 error pemanggilan. |
| **Total Produk Muncul di Katalog** | **255 produk unik** | Berdasarkan kode produk (`productCode`). |
| **Total URL Gambar Unik** | **118 URL** | Seluruh katalog KK se-Indonesia hanya menggunakan 118 gambar aset unik. |
| **URL Gambar Dipakai Bersama (>1 Produk)** | **66 URL** | 66 gambar digunakan bersama oleh 2 hingga 6 kode produk (misal: varian kode berbeda untuk produk yang sama atau minuman serumpun). |
| **Produk dengan URL Gambar Berbeda Antar-Outlet** | **0 produk (0%)** | Untuk setiap kode produk tertentu, URL gambarnya **100% konsisten dan identik di seluruh outlet**. Tidak ada inkonsistensi gambar antar-wilayah. |
| **Produk Tanpa Gambar (Gambar Kosong)** | **0 produk (0%)** | Seluruh 255 produk yang lolos filter memiliki URL gambar valid dari CDN Kopi Kenangan. |

---

## 2. Ukuran Penyimpanan & Estimasi Cloudflare R2 (Sampel Terbatas)

### Metodologi
Sesuai batasan keamanan audit, diambil **sampel terbatas 30 URL foto unik** (maksimal sampel yang diizinkan) yang mewakili berbagai kategori menu (Coffee, Non-Coffee, Frappe, Toast, Food). Setiap foto diperiksa secara langsung menggunakan HTTP `HEAD` request (dengan timeout 10 detik) ke CDN asal (`cdn.kopikenangan.com`) untuk memeriksa `Content-Type` dan `Content-Length`.

### Hasil Pengukuran Sampel (30 Foto)
- **Tipe File (Content-Type)**: **100% `image/jpeg`**.
- **Ukuran Terkecil (Min Size)**: **12.267 bytes** (~**11,98 KB**) pada foto *OG Aren Speculoos Latte*.
- **Ukuran Terbesar (Max Size)**: **619.744 bytes** (~**605,22 KB**) pada foto *Cafe Malt Latte*.
- **Ukuran Rata-Rata (Average Size)**: **234.667 bytes** (~**229,17 KB**).

### Estimasi Total Kebutuhan Penyimpanan R2
> **PERINGATAN METODE**: Angka total di bawah ini adalah **estimasi berbasis rata-rata sampel 30 foto**, bukan hasil unduh massal (sesuai larangan keras audit).

$$\text{Estimasi Total Ukuran} = 118 \text{ foto unik} \times 234.667 \text{ bytes} \approx \mathbf{27.690.730 \text{ bytes}} \approx \mathbf{26,41 \text{ MB}}$$

### Kesimpulan Kapasitas R2:
- Total ukuran seluruh foto katalog Kopi Kenangan se-Indonesia diperkirakan hanya **~26,4 MB**.
- Kuota penyimpanan gratis (Free Tier) Cloudflare R2 adalah **10 GB per bulan**.
- Kebutuhan 26,4 MB hanya memakan **~0,26% dari kuota gratis Cloudflare R2**. Biaya penyimpanan R2 untuk foto menu praktis **Rp0 / gratis**.

---

## 3. Variasi Harga Dasar Produk Antar-Outlet

### Metodologi
Dari 255 produk unik yang ditemukan di 1.338 outlet, kami menyaring produk yang muncul di minimal 2 outlet berbeda (224 produk). Untuk setiap produk, kami mencatat seluruh harga dasar (`price`) yang terdaftar di API KK di semua outlet tempat produk tersebut dijual.

### Hasil Angka Nyata
| Indikator Variasi Harga | Nilai / Angka | Persentase |
|---|---|---|
| **Produk Muncul di $\ge 2$ Outlet** | 224 produk | 100% dari basis perbandingan |
| **Produk dengan Harga SAMA di Semua Outlet** | 33 produk | 14,73% |
| **Produk dengan Harga BERBEDA Antar-Outlet** | **191 produk** | **85,27%** |
| **Selisih Rupiah Terbesar** | **Rp18.000** | Terjadi pada *Fresh Lemonade* |

### Detail Produk dengan Selisih Terbesar:
1. **Fresh Lemonade** (Kode Produk: `7693496002`):
   - **Harga Terendah**: Rp16.000 (muncul di 55 outlet)
   - **Harga Umum**: Rp17.000 (muncul di 269 outlet)
   - **Harga Menengah**: Rp20.000 (muncul di 55 outlet)
   - **Harga Tertinggi**: Rp34.000 (muncul di 3 outlet lokasi khusus/bandara)
   - **Selisih Rupiah**: **Rp18.000** (Rp34.000 - Rp16.000)
2. **Taro Cloud Matcha** (Kode Produk: `1269751000`):
   - Harga: Rp21.000, Rp22.000, Rp25.000, hingga Rp37.000.
   - **Selisih Rupiah**: **Rp16.000**.
3. **Taro Milk** (Kode Produk: `9590924000`):
   - Harga: Rp18.000, Rp19.000, Rp22.000, hingga Rp34.000.
   - **Selisih Rupiah**: **Rp16.000**.
4. **Taro Cloud Latte** (Kode Produk: `7245645000`):
   - Harga: Rp21.000, Rp22.000, Rp25.000, hingga Rp37.000.
   - **Selisih Rupiah**: **Rp16.000**.

### Implikasi Arsitektur untuk Tahap 7-B:
Karena **85,27% produk memiliki harga dasar yang bervariasi antar-outlet**, basis data menu lokal **TIDAK BISA** menggunakan tabel harga tunggal berskala nasional. Salinan menu lokal harus menyimpan harga dasar **berelasi dengan outlet** (misal tabel `outlet_menus` atau snapshot JSON menu per kode outlet).

---

## 4. Kesiapan Cloudflare R2

### Status Konfigurasi Saat Ini
Pemeriksaan konfigurasi dilakukan pada file project [`wrangler.jsonc`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/wrangler.jsonc) dan status akun Cloudflare via Wrangler CLI:

| Komponen R2 | Status Saat Ini | Keterangan |
|---|---|---|
| **Binding R2 di Worker (`wrangler.jsonc`)** | **Belum Ada** | Belum ada blok `r2_buckets` di konfigurasi Worker saat ini. |
| **Bucket R2 di Cloudflare** | **Sudah Ada** | Nama: `jasdorkopicima`<br>Tanggal dibuat: 10 Oktober 2026<br>Lokasi: APAC<br>Storage Class: Standard<br>Objek saat ini: 1 objek (96,3 KB). |
| **Custom Domain Publik** | **Sudah Terhubung & Aktif** | Domain: `gambar.cimagroup.my.id`<br>Status: `Enabled: Yes`, `Ownership: active`, `SSL: active`. |
| **Public dev-url (`r2.dev`)** | **Disabled (Mati)** | Akses hanya lewat custom domain resmi. |
| **Bucket Lain di Akun** | Ada (`cimagroup-media`) | Dibuat September 2026. |

### Langkah Manual Pemilik di Dashboard Cloudflare
Seluruh instruksi manual yang **hanya bisa dilakukan pemilik di Cloudflare Dashboard** telah didokumentasikan di Bagian 9 [`docs/RUNBOOK.md`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/docs/RUNBOOK.md):
1. **Verifikasi Custom Domain & SSL**: Memastikan domain `gambar.cimagroup.my.id` berstatus *Active* di tab Settings bucket `jasdorkopicima`.
2. **Konfigurasi Kebijakan CORS**: Menambahkan origin `https://jasdor.cimagroup.my.id` jika aset gambar dipanggil via JavaScript `fetch`/Canvas.
3. **Pembuatan R2 API Token**: Membuat token `Object Read & Write` jika proses penyalinan foto dijalankan lewat skrip/cron eksternal.
4. **Binding R2 Worker**: Menghubungkan binding `R2_BUCKET` ke worker di dashboard atau via `wrangler.jsonc`.

---

## 5. Peta Sumber Data Halaman Menu

Untuk merancang arsitektur salinan mandiri Tahap 7, berikut adalah pemetaan lengkap aliran data halaman menu saat ini:

```
[Customer Browser]
       │
       ├─► 1. Detail & Status Outlet ──► /api/outlets/[code] ────► KK getStore (Cache Supabase 90s)
       │
       ├─► 2. Katalog Menu & Harga ────► /api/outlets/[code]/menu ► KK queryMenu (Cache Supabase 15m + Stale)
       │
       ├─► 3. Opsi Varian & Topping ───► /api/.../options ───────► KK getOptions (Cache Supabase 1 jam)
       │
       ├─► 4. Foto Produk ─────────────► cdn.kopikenangan.com ───► (CDN Eksternal KK)
       │
       └─► 5. Hitung Diskon & Biaya ───► Kode Lokal & Env ───────► BUSINESS_CONFIG.pricing (100% Mandiri)
```

### Rincian Peta Sumber Data:
| Komponen Data | Sumber Saat Ini | Mekanisme & TTL Cache | Rekomendasi Salinan Tahap 7 |
|---|---|---|---|
| **Daftar & Alamat Outlet** | Database Supabase (`outlets`) | Disinkronkan harian via cron. | **Sudah mandiri di Supabase**. |
| **Status Buka & Jam Operasional** | Live dari KK API (`/store/get_store`) | `generic_cache` Supabase (TTL 90 detik). | **Tetap live / polling singkat**, karena toko bisa tutup mendadak atau order dinonaktifkan kasir KK secara real-time. |
| **Katalog Menu per Outlet** | Live dari KK API (`/product/query_web_order_product_menu`) | `generic_cache` Supabase (TTL 15 menit) + stale-if-error. | **Disalin ke Supabase / R2**: snapshot berkala per outlet agar situs tetap buka penuh saat API KK gangguan. |
| **Harga Dasar Produk** | Live dari KK API bersama menu | Mengikuti cache menu (15 menit). | **Disalin per-outlet**: karena 85,27% produk harganya berbeda antar-outlet. |
| **Foto Produk** | Live dari CDN KK (`cdn.kopikenangan.com`) | Cache browser pengguna. | **FOKUS UTAMA R2**: Salin 118 foto unik ke bucket `jasdorkopicima` dan sajikan via `https://gambar.cimagroup.my.id/...`. |
| **Opsi Varian, SKU, Addon** | Live dari KK API (`/product/get_web_order_product_options`) | `generic_cache` Supabase (TTL 1 jam). | **Disalin ke Supabase**: snapshot opsi per bundleCode agar bottom sheet tidak bergantung panggilan live KK. |
| **Aturan Diskon & Biaya Jasa** | Internal project ([`src/config/business.ts`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/src/config/business.ts)) | Statis di server/client. | **100% mandiri**, tidak memerlukan API KK. |

---

## 6. Bukti Penjadwal Sinkronisasi Outlet (GitHub Actions)

### Penelusuran dari Mesin Lokal:
1. **GitHub CLI (`gh`)**: Tidak terpasang di sistem (`CommandNotFoundException`).
2. **Git Remote**: Tidak ada konfigurasi remote URL aktif di git lokal (`git remote -v` kosong).
3. **Pernyataan Terus Terang**: Riwayat eksekusi workflow GitHub Actions **TIDAK DAPAT DIBUKTIKAN SECARA OTENTIK HANYA DARI MESIN INI**.

### Bukti Konfigurasi & Respons Production yang Ada:
- File konfigurasi [`.github/workflows/sync-outlets.yml`](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/.github/workflows/sync-outlets.yml) telah memiliki pemicu terjadwal:
  ```yaml
  schedule:
    - cron: '0 21 * * *' # Setiap hari pukul 04:00 WIB (21:00 UTC)
  workflow_dispatch:
  ```
- Pemeriksaan pada endpoint live production:
  ```bash
  curl.exe -m 15 -s https://jasdor.cimagroup.my.id/api/sync-status
  ```
  Menghasilkan data:
  ```json
  {
    "status": "ok",
    "totalOutlets": 1358,
    "inScopeOutlets": 1338,
    "outOfScopeOutlets": 20,
    "lastSyncedAt": "2026-10-13T03:19:51.724+00:00"
  }
  ```
  *Waktu sinkronisasi terakhir*: `2026-10-13T03:19:51` UTC = **10:19:51 WIB** (waktu siang). Waktu ini menunjukkan sinkronisasi dipicu secara manual (`workflow_dispatch` atau skrip lokal), **bukan pada jadwal otomatis jam 04:00 WIB**.

### Yang Perlu Dicek Pemilik di Tab Actions:
Pemilik disarankan membuka halaman repositori di GitHub:
1. Klik tab **Actions** di bagian atas repositori.
2. Pilih workflow **"Sync Outlets Kopi Kenangan"** di panel kiri.
3. Periksa daftar riwayat run:
   - Apakah terdapat run yang dipicu dengan keterangan **"Scheduled"** (ikon jam)?
   - Ataukah seluruhnya hanya berlabel **"manually run by [nama]"** (`workflow_dispatch`)?
   *(Catatan: GitHub secara otomatis menonaktifkan trigger `schedule` pada repositori jika tidak ada aktivitas commit dalam 60 hari).*

---

## 7. Daftar Keputusan yang Perlu Diambil Pemilik untuk Membuka Tahap 7-B

Untuk melangkah ke Tahap 7-B (implementasi salinan foto dan data), pemilik perlu memutuskan:

1. **Strategi Penamaan File Foto di R2**:
   - *Opsi A (Berdasarkan Hash/UUID KK)*: Menggunakan nama asli UUID KK (contoh: `gambar.cimagroup.my.id/products/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg`). Sangat cepat disinkronkan dan tidak perlu mapping nama rumit.
   - *Opsi B (Berdasarkan Slug Produk)*: Menggunakan nama bersih produk (contoh: `gambar.cimagroup.my.id/products/taro-cloud-matcha.jpg`). Lebih rapi, namun memerlukan penanganan jika ada produk dengan nama sama tapi kode berbeda.
   *(Rekomendasi: Opsi A untuk keandalan dan konsistensi 100%)*.

2. **Mekanisme Sinkronisasi Foto**:
   - *Opsi A (One-time Initial Sync Script)*: Menjalankan satu skrip Node.js terpisah dari mesin pengembang/server untuk mengunduh 118 foto dari CDN KK dan mengunggahnya langsung ke bucket R2 via S3 SDK.
   - *Opsi B (On-Demand Cache / Worker Proxy)*: Worker bertindak sebagai reverse-proxy: saat browser meminta gambar, Worker mengambil dari R2; jika belum ada di R2, Worker mengambil dari CDN KK, menyimpannya ke R2, lalu mengembalikannya ke browser.
   *(Rekomendasi: Opsi A karena foto hanya 118 file (~26,4 MB) dan bisa selesai dalam hitungan detik)*.

3. **Tingkat Salinan Data Menu (Fallback Data)**:
   - *Opsi A (Salinan Foto Saja di R2 + Cache Supabase Tetap 15 Menit)*: Foto disajikan dari R2 milik sendiri (`gambar.cimagroup.my.id`), sedangkan menu tetap diambil dari KK API dengan proteksi Supabase `generic_cache` yang sudah ada.
   - *Opsi B (Snapshot Menu Harian di Supabase)*: Selain foto di R2, data menu lengkap seluruh 1.338 outlet dibekukan harian ke tabel Supabase baru (`outlet_menus`), sehingga situs bisa beroperasi mandiri 100% tanpa menyentuh API KK sama sekali kecuali saat order WhatsApp.
