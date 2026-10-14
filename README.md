# jasdorkopicima

Website layanan jasa order Kopi Kenangan independen. Membantu customer mencari outlet, memesan menu dengan diskon 50% dari harga dasar, memilih varian flat-rate, dan menghasilkan draft pesanan WhatsApp secara terstruktur.

> **Status Proyek**: **Tahap 6 (Production Ready & Launch Hardening Selesai)**.

---

## 🏛️ Arsitektur Singkat

```
[ Customer Browser ]
       │
       ▼ (HTTPS / Custom Domain)
[ Cloudflare Workers Edge (Next.js 16 via @opennextjs/cloudflare) ]
  ├── Rate Limiter (Sliding Window per IP)
  ├── Edge Rendering (Mobile-first, Tailwind CSS, OpenGraph Preview)
  ├── API Routes (/api/outlets, /menu, /options, /validate-cart, /sync-status)
  └── Business Engine (Flat Pricing, Allowlist & Exclusion Rules, Margin Guard)
       │                        │
       ▼                        ▼
[ Supabase PostgreSQL ]   [ Kopi Kenangan API ]
  ├── outlets (pg_trgm)     ├── /create_web_token
  └── generic_cache         ├── /store/query_store & get_store
                            └── /product/query_web_order_product_menu
```

---

## ⚙️ Variabel Lingkungan (Environment Variables)

| Variabel | Lingkungan | Deskripsi |
|---|---|---|
| `KOPI_KENANGAN_API_BASE` | Local / Edge | URL dasar API Kopi Kenangan (`https://order.kopikenangan.com/web_order/api`) |
| `KOPI_KENANGAN_PHONE` | Local / Edge | Nomor HP sesi tamu (dikosongkan `""` untuk guest order resmi) |
| `NEXT_PUBLIC_SUPABASE_URL` | Local / Client / Edge | URL project Supabase |
| `SUPABASE_URL` | Server / Edge | URL project Supabase (untuk service role) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / Edge | Kunci service role Supabase (server-only, bypass RLS) |
| `SYNC_SECRET` | Server / Edge | Secret token acak untuk otorisasi endpoint sync outlet |
| `NEXT_PUBLIC_WHATSAPP_PHONE`| Local / Client | Nomor WhatsApp pemilik penerima pesanan (`628xxx`) |
| `ALLOW_SIMULATE` | Local Only | Diset `"true"` HANYA untuk debug simulasi buka/tutup lokal. Jangan diset di prod! |

---

## 🛡️ Pengamanan & Fitur Tahap 6

1. **Pengecekan Stok Segar (Fresh Stock Validation)**:
   - `POST /api/outlets/[code]/validate-cart`: Memvalidasi ketersediaan produk & SKU di keranjang langsung ke KK sebelum redirect ke WhatsApp, sekaligus menyegarkan cache menu.
   - Jika API KK timeout atau bermasalah, customer diberi modal peringatan ramah dan pilihan melanjutkan konfirmasi via WhatsApp tanpa memblokir pesanan.
2. **Rate Limiting**:
   - Membatasi request per IP di seluruh endpoint `/api/*` untuk mencegah eksploitasi dan scraping berlebih.
3. **Observability & Status Sync**:
   - `GET /api/sync-status`: Memeriksa waktu terakhir sinkronisasi dan jumlah outlet in-scope vs out-of-scope.
   - Error log dari KK disanitasi agar tidak membocorkan token atau data sensitif.
5. **WhatsApp & Social Share Preview**:
   - Dilengkapi metadata OpenGraph, favicon, dan logo jasa order resmi.

---

## 📖 Panduan Operasional Pemilik

Untuk instruksi lengkap pengelolaan jasa order (mengubah harga flat, mengubah nomor WA, rotasi secret, panduan penanganan error API KK, dan sync manual), baca:
👉 [docs/RUNBOOK.md](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/docs/RUNBOOK.md)

---

## 🚀 Perintah Pengembangan

```bash
# Instalasi dependensi (otomatis menjalankan patch-package)
npm install

# Menjalankan unit test suite
npm test

# Menjalankan linter & type check
npm run lint
npx tsc --noEmit

# Menjalankan server dev lokal
npm run dev

# Build dan deploy ke Cloudflare Workers
npm run build:worker
npm run deploy
```
