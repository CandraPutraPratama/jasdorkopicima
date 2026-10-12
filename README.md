# jasdorkopicima

Website layanan jasa titip (jastip) Kopi Kenangan. Membantu customer memilih outlet, menyusun menu/varian, dan otomatis menghasilkan draft pesanan WhatsApp ke pemilik.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database / Cache**: Supabase (PostgreSQL with `pg_trgm` & Row Level Security)
- **Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Domain**: `https://jasdor.cimagroup.my.id`

---

## 1. Persiapan Database Supabase (Tahap 4B)

Aplikasi membutuhkan dua tabel di Supabase: `outlets` dan `generic_cache`.

### Langkah Menjalankan Migrasi SQL:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda.
2. Masuk ke menu **SQL Editor** pada navigasi sisi kiri.
3. Klik tombol **New Query**.
4. Buka file migrasi [supabase/migrations/001_create_outlets_and_cache_tables.sql](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/supabase/migrations/001_create_outlets_and_cache_tables.sql) di repositori ini, salin seluruh kodenya, dan paste ke SQL Editor.
5. Klik **Run** (atau `Ctrl + Enter`).
6. Verifikasi bahwa tabel `outlets` dan `generic_cache` telah berhasil dibuat dengan status **RLS Enabled** dan indeks `pg_trgm` aktif.

### Migrasi 002: Penanda Brand & Ruang Lingkup (Revisi 5C)
Untuk memfilter hanya outlet resmi Kopi Kenangan dan mengecualikan Kenangan Signature serta brand lain:
1. Buka file [supabase/migrations/002_add_brand_and_scope_to_outlets.sql](file:///c:/Users/LENOVO/websitebisnis/jasdorkopicima/supabase/migrations/002_add_brand_and_scope_to_outlets.sql).
2. Salin seluruh isi SQL ke **SQL Editor** di Supabase Dashboard, lalu klik **Run**.
3. Kolom `brand` dan `is_in_scope` beserta indeksnya akan otomatis terpasang dan diperbarui.

---

## 2. Persiapan Environment Variables

1. Salin `.env.example` ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Isi variabel yang diperlukan di `.env.local`:
   - `KOPI_KENANGAN_PHONE`: Kosongkan `""` untuk mode sesi tamu terverifikasi.
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`: URL project Supabase Anda.
   - `SUPABASE_SERVICE_ROLE_KEY`: Kunci service role Supabase (server-only, bypasses RLS).
   - `SYNC_SECRET`: Secret token acak untuk melindungi endpoint sinkronisasi outlet.
   - `NEXT_PUBLIC_WHATSAPP_PHONE`: Nomor WhatsApp pemilik jastip (`628xxx`).

> **PENTING**: Jangan pernah melakukan commit file `.env` atau `.env.local` ke repositori git.

### Mengatur Secret di Cloudflare Workers:
Di Cloudflare Workers, set secret yang sama via Wrangler CLI atau Dashboard:
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SYNC_SECRET
```

---

## 3. Sinkronisasi Berkala Outlet (Cron Trigger / Manual)

Daftar outlet Kopi Kenangan disinkronisasi ke database Supabase melalui endpoint yang dilindungi secret:
```
POST /api/cron/sync-outlets
Header: Authorization: Bearer <SYNC_SECRET>
(atau header x-sync-secret: <SYNC_SECRET>)
```

### Mekanisme Terpilih: Cloudflare Cron Triggers
Mekanisme termudah dan paling efisien adalah memasang Cron Trigger di Cloudflare Workers yang memanggil fungsi sinkronisasi (misal 1 kali sehari pada jam 04:00 WIB), atau menggunakan service HTTP cron eksternal yang memanggil endpoint `POST /api/cron/sync-outlets` dengan menyertakan header authorization token.

---

## 4. Menjalankan Proyek Secara Lokal & Pengujian

Instalasi dependensi:
```bash
npm install
```
*(Catatan: `patch-package` akan otomatis berjalan via `postinstall` untuk menjaga kompatibilitas OpenNext)*

Jalankan test suite:
```bash
npm test
```

Jalankan server lokal Next.js:
```bash
npm run dev
```

Build & Deploy ke Cloudflare:
```bash
npm run build:worker
npm run deploy
```
