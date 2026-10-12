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
