# TOMORO COFFEE  -  Brand Data (Jasdor)

> Status: DATA LENGKAP (2026-10-17 ~07:00). Tinggal keputusan user + prompt Antigravity.

## 1. Brand

- **Nama**: TOMORO Coffee (PT Kopi Bintang Indonesia)
- **Slug**: `tomoro`
- **Didirikan**: 9 Agustus 2022  -  founder Star Yuan (ex-J&T Express) & Fish Sun
- **Arti nama**: "tomorrow"  -  embrace the goodness and yearn for tomorrow
- **Skala**: 600+ outlet (Okt 2024)
- **Website**: https://www.tomoro-coffee.id/
- **Instagram**: @tomorocoffee.id
- **Warna brand**: oranye
- **Tagline kandidat**: "Sip of Tomorrow"
- **Logo**: `tomoro-assets/tomoro-logo.png` (1024x1024, sudah diunduh)

## 2. Outlet  -  678 outlet

- **Sumber**: API publik cingops.com `/api/search-outlets?brand=tomoro` (dipakai SPA mereka sendiri,
  unauthenticated, read-only). Tomoro TIDAK punya public store API resmi (situsnya cuma landing Vue).
- **Data per outlet**: code, name, address, latitude, longitude, phone, **isOpen LIVE**,
  businessStatus. TIDAK ada jam operasional (semua null)  -  status buka/tutup hanya via live sync.
- **Timezone** (inferensi dari alamat): 590 Asia/Jakarta, 87 Asia/Makassar, 1 Asia/Jayapura.
- **File**: `tomoro-outlets-seed.csv` (678 rows, kode `tomoro-<code>`, kolom source_code = kode asli).
- **Live sync**: endpoint yang sama bisa dipakai untuk sync isOpen berkala (pattern seperti fore-client.ts).

## 3. Menu  -  79 item

- **Sumber**: API publik cingops `/api/menu?brand=tomoro&storeCode=...` (data `tomoro-dynamic`,
  deskripsi = copywriting resmi Tomoro).
- **Kategori** (13): MASTER S.O.E SERIES (3), MONTHLY PROMO (2), TRIPLE PISTACHIO SERIES (3),
  MATCHA SERIES (7), TOMORO SIGNATURE (5), CLASSIC COFFEE (7), FLAVORED LATTE (10),
  HEALING SERIES (2), CHEESE X NAILOONG SERIES (2), REFRESHING SERIES (8),
  NON COFFEE (7), FOOD (19), FRAPPE (4).
- **Dibuang**: 11 item merchandise murni (tumbler/totebag/keychain/standee/e-money).
- **Harga**: baseline NASIONAL dari outlet Kota Kasablanka Jakarta (JSD-025), harga ASLI
  (originalPrice, bukan promo  -  5 item promo sudah dikoreksi). **HIPOTESIS USER TERBUKTI**:
  harga FLAT di outlet biasa (Surabaya ≈ Jakarta), kecuali BANDARA yang jauh lebih mahal.
  Tier bandara (terverifikasi via cingops menu API + cross-check jasdorin):
  - Palembang (PLB03B-M Gate 3 & PLB03D-M Landside, harga identik): Aren Latte 40rb (vs 21rb),
    Caffe Latte 38rb, Matcha Latte 38rb, Americano 30rb  -  markup +11rb s/d +28rb!
  - Dhoho Kediri (KED01A-M): 1–5rb lebih murah dari Palembang (Aren 26rb).
  - File: `tomoro-price-tier-bandara.csv` (93 rows: nasional/palembang/dhoho) +
    `tomoro-outlet-bandara.txt` (3 outlet).
- **File**: `tomoro-menu-cache.json` (format menuGroups sama seperti Kenangan/Fore).
- **Varian**: `supportsOptions: true`  -  ada kustomisasi (ukuran/gula/es).

## 4. Gambar produk

- **Sumber**: `static.tomoro-coffee.id` (CDN RESMI Tomoro)  -  79 gambar unik.
- **Status**: sedang di-download + convert WebP → `tomoro-images-webp/`
- **Rencana**: upload ke R2 folder `tomoro/`, URL `https://gambar.cimagroup.my.id/tomoro/<slug>.webp`

## 5. Keputusan (perlu konfirmasi user)

- [ ] Mode: full self-order seperti Fore/Kenangan?
- [ ] Payment: sama persis seperti Kenangan (1 QRIS)?
- [ ] Semua 678 outlet?
- [ ] Menu flat available, tanpa toggle manual (seperti Fore)?
- [ ] Harga: pakai baseline Kasablanka untuk semua outlet (v1), atau perlu kalibrasi per kota?
- [ ] Jam operasional: tidak ada data jam  -  andalkan live isOpen saja?
