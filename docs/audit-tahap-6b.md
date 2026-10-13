# Dokumen Audit Menu, Brand Tersembunyi, dan Cek Keamanan (Tahap 6B-A)

Dokumen ini memuat hasil audit data mentah (*raw data*) dari Kopi Kenangan Unofficial Web Order API, perbandingan dengan hasil filtering sistem saat ini, inventarisasi brand produk non-Kopi Kenangan, investigasi outlet tanpa brand, cek keamanan endpoint production, dan baseline skor performa Lighthouse mobile.

---

## 1. Langkah 1 — Audit Menu Mentah vs Hasil Filter

Audit dilakukan pada 6 outlet:
1. `TANJUNGDUREN` (Ruko Tanjung Duren — Outlet Gabungan KK + Chigo)
2. `JKT.RUKORWM` (Ruko Rawamangun Jl. Paus — Outlet Gabungan KK + Chigo)
3. `JKT.CFPIM2` (Pondok Indah Mall 2 — Outlet Gabungan Mall KK + Chigo)
4. `KK.SBY.MERRNGKTDT` (MERR Rungkut Surabaya DT — Outlet Murni Kopi Kenangan)
5. `BKS.RKBNTR` (Ruko Bintara Bekasi — Outlet Gabungan Pilihan 1: Ruko suburban komersial)
6. `JKT.RMHKNGN` (Rumah Kenangan Senopati — Outlet Gabungan Pilihan 2: Flagship multi-brand store)

---

### A. Rincian Khusus: Outlet TANJUNGDUREN (Bukti Tak Terbantahkan)

- **Jumlah Kelompok Menu di Data Mentah KK**: Tepat **5 Kelompok**
- **Jumlah Total Produk di Data Mentah KK**: Tepat **22 Produk**
- **Jumlah Total Produk Lolos Filter (Tampil di Katalog)**: **8 Produk** (4 di Baru!, 1 di Coffee, 3 di Non Coffee)

#### Daftar Lengkap Seluruh Kelompok & Produk di Data Mentah TANJUNGDUREN:

| Kelompok Mentah | Kode Kelompok | Nama Produk | Brand | Harga | Status Combo | Status Sold Out | Tahap / Alasan Filter | Hasil Akhir |
|---|---|---|---|---|---|---|---|---|
| **Promo & Combo** | `Menu0005` | Buy 2 Disc 25% | Kopi Kenangan | Rp28.500 | Ya | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| Promo & Combo | `Menu0005` | Chi-Gourmet A | Chigo | Rp40.000 | Ya | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| **Baru!** | `ArenSeries` | Taro Cloud Matcha | Kopi Kenangan | Rp22.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Baru! | `ArenSeries` | Taro Milk | Kopi Kenangan | Rp19.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Baru! | `ArenSeries` | Taro Cloud Latte | Kopi Kenangan | Rp22.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Baru! | `ArenSeries` | Taro Cloud Milk Tea | Kopi Kenangan | Rp19.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Baru! | `ArenSeries` | Krunchi Truffle Mushroom Sauce | Chigo | Rp21.000 | Tidak | Tidak | (3) Pola tersembunyi (`krunchi`) | Dibuang |
| Baru! | `ArenSeries` | Chicken Burger Truffle Mushroom Sauce | Chigo | Rp26.000 | Tidak | Tidak | (5) Filter brand non-KK (`Chigo`) | Dibuang |
| Baru! | `ArenSeries` | Loaded Fries Truffle Mushroom Sauce | Chigo | Rp20.000 | Tidak | Tidak | (5) Filter brand non-KK (`Chigo`) | Dibuang |
| Baru! | `ArenSeries` | Chicken Spaghetti Truffle Mushroom Sauce | Chigo | Rp22.500 | Tidak | Tidak | (5) Filter brand non-KK (`Chigo`) | Dibuang |
| Baru! | `ArenSeries` | Boneless Chicken Truffle Mushroom Sauce Set | Chigo | Rp30.000 | Tidak | Tidak | (5) Filter brand non-KK (`Chigo`) | Dibuang |
| Baru! | `ArenSeries` | ChiMate Chicken Burger Truffle Mushroom | FLIP | Rp45.000 | Ya | Tidak | (2) Item Combo (`is_combo_v2`) | Dibuang |
| **Coffee** | `Menu0002` | Taro Cloud Latte | Kopi Kenangan | Rp22.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| **Non Coffee** | `Menu0003` | Taro Cloud Matcha | Kopi Kenangan | Rp22.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Non Coffee | `Menu0003` | Taro Milk | Kopi Kenangan | Rp19.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| Non Coffee | `Menu0003` | Taro Cloud Milk Tea | Kopi Kenangan | Rp19.000 | Tidak | Tidak | - | **LOLOS (Tampil)** |
| **New! Chi-Gourmet Italian Truffle Series** | `APPChi-GourmetItalianTruffleSeri` | Krunchi Truffle Mushroom Sauce | Chigo | Rp21.000 | Tidak | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| New! Chi-Gourmet Italian Truffle Series | `APPChi-GourmetItalianTruffleSeri` | Chicken Burger Truffle Mushroom Sauce | Chigo | Rp26.000 | Tidak | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| New! Chi-Gourmet Italian Truffle Series | `APPChi-GourmetItalianTruffleSeri` | Chicken Spaghetti Truffle Mushroom Sauce | Chigo | Rp22.500 | Tidak | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| New! Chi-Gourmet Italian Truffle Series | `APPChi-GourmetItalianTruffleSeri` | Loaded Fries Truffle Mushroom Sauce | Chigo | Rp20.000 | Tidak | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| New! Chi-Gourmet Italian Truffle Series | `APPChi-GourmetItalianTruffleSeri` | Boneless Chicken Truffle Mushroom Sauce Set | Chigo | Rp30.000 | Tidak | Tidak | (1) Kelompok di luar allowlist | Dibuang |
| New! Chi-Gourmet Italian Truffle Series | `APPChi-GourmetItalianTruffleSeri` | ChiMate Chicken Burger Truffle Mushroom | FLIP | Rp45.000 | Ya | Tidak | (1) Kelompok di luar allowlist | Dibuang |

#### Jawaban & Vonis untuk TANJUNGDUREN:
1. **Apakah Coffee memang cuma 1 produk dari sananya?**
   - **YA, BENAR.** Di data mentah KK (`query_web_order_product_menu`), kelompok `Coffee` untuk outlet TANJUNGDUREN memang hanya berisi 1 produk: *Taro Cloud Latte*. Kopi reguler KK lainnya (seperti Kopi Kenangan Mantan, Americano, Latte, Avocado Coffee) sama sekali tidak terdaftar di respons API KK untuk outlet ini.
2. **Apakah kelompok Kenangan Frappe, Kenangan Toast, dan Food memang tidak ada di data mentah atau kebuang filter?**
   - **MEMANG TIDAK ADA DI DATA MENTAH DARI SANANYA.** Ketiga kelompok tersebut (`Kenangan Frappe`, `Kenangan Toast`, `Food`) sama sekali tidak ada di dalam array `menu_groups` API KK untuk outlet TANJUNGDUREN. Ketiadaan produk bukan akibat filter yang salah membuang, melainkan karena outlet TANJUNGDUREN di sistem backend Kopi Kenangan saat ini hanya mengaktifkan menu seasonal Taro series dan menu Chigo.
3. **Perilaku Produk Sold Out**:
   - Produk sold out (`is_sold_out: true`) **TETAP TAMPIL** di menu dengan badge "Habis", foto bernuansa grayscale, dan kartu dinonaktifkan (tidak bisa diklik). Sold-out **tidak menghapus** produk dari daftar menu.

---

### B. Ringkasan 5 Outlet Lainnya

| Outlet | Kode | Tipe | Raw Products | Filtered Products | (1) Kelompok Non-Allowlist | (2) Combo | (3) Pola Tersembunyi | (4) Badge Sold Out | (5) Brand Non-KK | Kelompok Lolos & Jumlah Produk |
|---|---|---|---|---|---|---|---|---|---|---|
| **Ruko Rawamangun** | `JKT.RUKORWM` | Gabungan | 108 | 79 | 20 | 0 | 5 | 0 | 4 | Baru! (4), Coffee (25), Non Coffee (24), Frappe (8), Toast (3), Food (15) |
| **Pondok Indah Mall 2** | `JKT.CFPIM2` | Gabungan Mall | 104 | 74 | 21 | 0 | 5 | 0 | 4 | Baru! (4), Coffee (24), Non Coffee (24), Frappe (6), Food (16) |
| **MERR Rungkut Surabaya** | `KK.SBY.MERRNGKTDT` | Murni KK (DT) | 127 | 93 | 28 | 0 | 6 | 0 | 0 | Baru! (5), Coffee (31), Non Coffee (26), Frappe (8), Toast (3), Food (20) |
| **Ruko Bintara Bekasi** | `BKS.RKBNTR` | Gabungan | 106 | 81 | 19 | 0 | 6 | 0 | 0 | Baru! (5), Coffee (25), Non Coffee (24), Frappe (8), Toast (3), Food (16) |
| **Rumah Kenangan Senopati** | `JKT.RMHKNGN` | Flagship Gabungan | 92 | 56 | 26 | 0 | 6 | 0 | 4 | Baru! (4), Coffee (28), Non Coffee (17), Frappe (6), Food (1) |

#### Contoh Sampel Produk Dibuang per Tahap (pada 5 Outlet Lain):
- **Tahap (1) Kelompok Non-Allowlist**: `[Promo & Combo] 2 KKM Hanya 29RBan`, `[Promo & Combo] Buy 2 Disc 25%`, `[New! Chi-Gourmet Italian Truffle Series] Chicken Burger`, `[Kenangan at Home] Drip Bag Coffee`, `[Special Merchandise] Playsonality Bottle`.
- **Tahap (2) Combo**: `ChiMate Chicken Burger Truffle Mushroom` (`is_combo_v2: true`).
- **Tahap (3) Pola Tersembunyi**: `Seliter Kenangan - Americano`, `Seliter Kenangan - Kopi Kenangan Mantan`, `Seliter Kenangan - Latte`, `Krunchi Truffle Mushroom Sauce`.
- **Tahap (5) Brand Non-KK**: `Chicken Burger Truffle Mushroom Sauce (Chigo)`, `Loaded Fries Truffle Mushroom Sauce (Chigo)`, `Chicken Spaghetti Truffle Mushroom Sauce (Chigo)`, `Boneless Chicken Truffle Mushroom Sauce Set (Chigo)`.

---

## 2. Langkah 2 — Inventaris Brand Produk Non-Kopi Kenangan

Survei dilakukan pada 10 outlet campuran (MERR Rungkut DT, CIMB Niaga Sudirman, Gandaria City Mall, Ruko Tanjung Duren, Ruko Rawamangun, PIM 2, Ruko Bintara, Rumah Kenangan Senopati, Ruko Azores Tangerang, Ruko Karang Tengah).

### A. Tabel Rangkuman Brand Non-KK di Menu Mentah

| Brand Mentah | Jumlah Produk Unik | Rentang Harga | Kelompok Menu Asal | Daftar Contoh Produk |
|---|---|---|---|---|
| **Chigo** | 79 produk | Rp8.000 – Rp270.000 | Promo & Combo, Baru!, New! Chi-Gourmet Italian Truffle Series, ChiMilan, Chigo Coupon, Ala Carte, ChiMate, Party Pack, Sides, ChiDrinks | Chi-Gourmet A, Chicken Burger Truffle Mushroom Sauce, Loaded Fries, Boneless Chicken Set, Medium/Jumbo Boneless Ala Carte, Chiparty Berempat |
| **FLIP** | 20 produk | Rp16.500 – Rp54.000 | Baru!, New! Chi-Gourmet, Ala Carte, ChiMate, Sides | ChiMate Chicken Burger, Flip Cheese Burger, Flip Beef Burger, Saudi Spicy Chicken Burger, Smacker, ChiMate Combo B |
| **CHIGO** | 7 produk | Rp5.000 – Rp190.000 | Ala Carte, Sides, ChiDrinks, Chigo Coupon | Medium Boneless Ala Carte, Extra Flavour, Lemon Tea, Iced Chocolate, Chiparty Berempat Boneless |
| **Satu Kenangan** | 6 produk | Rp5.000 – Rp47.000 | Promo & Combo, Fried Chicken Kenangan | B2G1 Ayam-Ayaman Truffle Mushroom, Mini Bungeoppang Keju, Mie Judes Kremes, Spaghetti Imut, Nasi |
| **Cerita Roti** | 6 produk | Rp9.000 – Rp21.000 | Food | Roti Coklat Klasik, Roti Susu Manis, Roti Keju Manis, Roti Srikaya, Join the Dark Side Cookie, Friend Chip Cookie |
| **Kenangan Manis** | 1 produk | Rp14.000 – Rp14.000 | Food | Choco Chip Cookies |

### B. Distribusi Brand pada Kelompok Khusus (Frappe, Toast, Food)

| Kelompok Menu | Brand Kopi Kenangan | Brand Cerita Roti | Brand Kenangan Manis | Brand Chigo / FLIP | Dampak Jika Brand Non-KK Ditampilkan / Disembunyikan |
|---|---|---|---|---|---|
| **Kenangan Frappe** | 42 item (100%) | 0 | 0 | 0 | Seluruh produk frappe murni brand Kopi Kenangan. Tidak ada pengaruh brand lain. |
| **Kenangan Toast** | 17 item (100%) | 0 | 0 | 0 | Seluruh toast murni brand Kopi Kenangan. Tidak ada pengaruh brand lain. |
| **Food** | 84 item (72,4%) | 27 item (23,3%) | 5 item (4,3%) | 0 | **Sangat Penting:** Kelompok `Food` memuat produk roti dari **Cerita Roti** dan cookies dari **Kenangan Manis** (yang merupakan sister-brand resmi di gerai Kopi Kenangan). Filter saat ini **HANYA membuang Chigo dan FLIP**, sehingga produk Cerita Roti dan Kenangan Manis **TETAP TAMPIL** di kategori Food. Jika seluruh brand non-"Kopi Kenangan" disaring mutlak, 32 produk roti/cookies ini akan hilang dari menu Food! |

### C. Produk dengan Field Brand Kosong / Hilang
- **Total Kemunculan**: **0 item** (100% produk di seluruh 10 outlet memiliki field `brand` yang terisi string valid).
- **Perlakuan Kode Saat Ini**: Jika suatu produk memiliki field brand kosong atau undefined, kode hanya memeriksa `brand.includes('chigo') || brand.includes('flip')` dan allowlist kelompok. Produk tanpa brand akan lolos ke allowlist kelompok selama bukan item combo atau pola tersembunyi.

---

## 3. Langkah 3 — Bukti untuk 3 Outlet Tanpa Brand

Investigasi mendalam terhadap 3 outlet yang memiliki `brand_and_image: null / []`:

| Kode Outlet | Nama Outlet di KK API | `brand_and_image` Mentah | Status Operasional KK API | Status `is_in_scope` di Supabase | Isi Menu di KK API | Bukti Brand Menu |
|---|---|---|---|---|---|---|
| `BCR.JAB.O0001` | KopKen Alfamid Subandi | `null` | `is_open: false`, `order_type: [102]`, `status: Active`, `order_msg: Pesan Langsung Di Outlet` | `false` (`Tanpa Brand`) | **0 Kelompok / 0 Produk** (`{ menu_groups: [] }`) | Tidak memiliki menu web order. Merupakan booth takeaway Alfamidi fisik tanpa pemesanan online. |
| `BCR.JAB.O0002` | Kopi KopKen Alfamidi H. Mansur Gondrong | `null` | `is_open: false`, `order_type: [102]`, `status: Active`, `order_msg: Tutup` | `false` (`Tanpa Brand`) | **0 Kelompok / 0 Produk** (`{ menu_groups: [] }`) | Outlet tutup, tidak ada katalog menu web order. |
| `KK.BTM.RKTNJGUNCG` | Ruko Tanjung Uncang (Batam) | `null` | `is_open: true`, `order_type: [101, 102]`, `status: Active`, `order_msg: Pesan Sekarang` | `false` (`Tanpa Brand`) | **9 Kelompok, 98 Produk Lengkap** | **100% Produk Ber-brand "Kopi Kenangan"** (Coffee: 31 item, Non Coffee: 26 item, Frappe: 5 item, Toast: 1 item, Food: 19 item, Promo: 8 item). |

### Kesimpulan untuk Pemilik:
- `BCR.JAB.O0001` dan `BCR.JAB.O0002` aman tetap **di luar lingkup** (*out-of-scope*) karena tidak memiliki katalog menu online di API KK.
- `KK.BTM.RKTNJGUNCG` (Ruko Tanjung Uncang) adalah **outlet resmi Kopi Kenangan yang 100% aktif dan lengkap**, namun di database KK pusat kolom `brand_and_image`-nya tidak sengaja bernilai `null`. Outlet ini dapat dimasukkan ke dalam lingkup pada revisi kebijakan berikutnya jika pemilik menginginkan Batam terlayani.

---

## 4. Langkah 4 — Cek Keamanan Production

### A. Endpoint Debug `/api/debug-env`
- Pengujian langsung di production (`https://jasdor.cimagroup.my.id/api/debug-env`):
  - **Status HTTP**: **404 Not Found**
  - **Keterangan**: Rute `/api/debug-env` tidak ada di server production, tidak mengekspos environment variables maupun rahasia apapun.

### B. Audit File Kode & Pengamanan `ALLOW_SIMULATE`
- **File Route Debug**: Tidak ada file route debug lain di `src/app/api/`. Rute yang ada hanya:
  - `/api/operational-status`
  - `/api/outlets`
  - `/api/outlets/[code]`
  - `/api/outlets/[code]/menu`
  - `/api/outlets/[code]/products/[bundleCode]/options`
  - `/api/outlets/[code]/validate-cart`
  - `/api/cron/sync-outlets`
  - `/api/sync-status`
- **Temuan Kritis `ALLOW_SIMULATE`**:
  - Pada pengujian `curl.exe https://jasdor.cimagroup.my.id/api/operational-status?simulate=open`, server membalas dengan status simulasi aktif.
  - **Penyebab**: File `.env.local` di mesin lokal berisi `ALLOW_SIMULATE=true`. Saat proses `npm run build:worker` (`next build`), Turbopack/Next.js membaca `.env.local` lokal dan meng-inline nilai `process.env.ALLOW_SIMULATE` ke dalam bundle Worker.
  - **Rekomendasi Tindakan (untuk tahap perubahan kode berikutnya)**: Mengubah `ALLOW_SIMULATE=false` di `.env.local` saat build production, atau membaca flag simulasi murni dari runtime binding Cloudflare.

---

## 5. Langkah 6 — Baseline Lighthouse Mobile (Tanpa Perbaikan)

Audit dilakukan menggunakan Lighthouse CLI v12.8.2 dalam mode emulasi mobile pada production `https://jasdor.cimagroup.my.id`.

### Skor Baseline

| Halaman | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| **Beranda (`/`)** | **93** | **89** | **100** | **100** |
| **Menu Outlet (`/outlet/KK.SBY.MERRNGKTDT`)** | **80** | **87** | **96** | **100** |

### 3 Temuan Terbesar per Halaman

#### 1. Halaman Beranda (`/`)
1. **Initial Server Response Time (TTFB)** (Root document: 720ms) — Latensi *cold start* worker dan roundtrip ke Supabase.
2. **Largest Contentful Paint (LCP)** (3.010ms) — Elemen teks hero dan logo saat render awal.
3. **Kontras Warna & Viewport**: Teks deskripsi abu-abu terang (`text-stone-400`/`500`) terhadap background putih memiliki rasio kontras di bawah standar WCAG AA, serta meta viewport membatasi skalabilitas pinch-to-zoom.

#### 2. Halaman Menu Outlet (`/outlet/[code]`)
1. **Initial Server Response Time** (Root document: 1.040ms) — Overhead waktu eksekusi SSR/Worker saat memproses query outlet.
2. **Main-Thread Work & JS Execution Time** (Main thread: 3.6s, JS exec: 1.8s) — Beban rendering DOM untuk ~80 produk dalam 6 kategori beserta puluhan gambar dan modal.
3. **Largest Contentful Paint (LCP)** (4.130ms) — Waktu pemuatan kartu produk pertama dan gambar sebelum interaksi.
