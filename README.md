# jasdorkopicima

Website layanan jasa titip (jastip) Kopi Kenangan. Membantu customer memilih outlet, menyusun menu/varian, dan otomatis menghasilkan draft pesanan WhatsApp ke pemilik.

## Tech Stack
- **Framework**: Next.js (App Router) + TypeScript
- **Database/Cache**: Supabase (Postgres)
- **Deployment Target**: Cloudflare (Pages/Workers via OpenNext)

## Persiapan Environment
1. Salin `.env.example` ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Isi variabel yang diperlukan di `.env.local`:
   - `KOPI_KENANGAN_PHONE`: Nomor HP untuk generate token sesi web order KK (`628xxx`).
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kredensial Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Kunci service role Supabase untuk sinkronisasi backend.
   - `NEXT_PUBLIC_WHATSAPP_PHONE`: Nomor WhatsApp pemilik jastip.

> **PENTING**: Jangan pernah melakukan commit file `.env` atau `.env.local` ke git repository.

## Menjalankan Proyek
Instalasi dependensi:
```bash
npm install
```

Jalankan local development server:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

## Skrip Pengujian API Kopi Kenangan (Tahap 2)
Untuk menguji koneksi dan endpoint API Kopi Kenangan:
```bash
npm run test:api
```
*(atau jalankan via `node scripts/test-kk-api.mjs`)*
Hasil sampel respons JSON tersimpan di folder `docs/api-samples/`.
