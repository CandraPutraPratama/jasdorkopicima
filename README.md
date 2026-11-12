# Jasdor Cima

Aplikasi web jasa order minuman kopi. Customer memilih outlet, menu, dan varian dari Kopi Kenangan, Fore Coffee, dan Tomoro Coffee, membayar lewat QRIS, lalu pesanan dikonfirmasi ke admin lewat WhatsApp.

Live: https://jasdor.cimagroup.my.id

## Catatan

- Jasdor Cima adalah layanan independen. Proyek ini bukan mitra resmi dan tidak berafiliasi dengan Kopi Kenangan, Fore Coffee, maupun Tomoro Coffee. Nama dan logo brand dimiliki pemiliknya masing-masing.
- Data outlet dan menu diambil dari endpoint web order brand yang tidak didokumentasikan secara resmi, lalu disimpan sebagai cache. Endpoint itu bisa berubah atau ditutup sewaktu-waktu.
- Pengembangan dibantu AI coding assistant.

## Fitur

Untuk customer:

- Cari outlet (pencarian fuzzy) dan lihat status buka atau tutup serta antrean.
- Pilih menu, varian, dan add-on per brand, termasuk paket bundling.
- Keranjang dengan validasi harga dan stok di sisi server sebelum pesanan dibuat.
- Pesanan grup: satu orang membuat sesi, teman menambahkan item, lalu sesi dikunci.
- Pembayaran QRIS dan konfirmasi pembayaran, lalu pesan pesanan terstruktur ke WhatsApp.
- Halaman "Pesanan Saya" untuk melihat riwayat dan memesan ulang.
- Dapat dipasang sebagai PWA.

Untuk admin:

- Panel pesanan di `/admin/pesanan` dengan login berbasis password dan sesi bertanda tangan.
- Ubah status pesanan dan pengaturan situs.
- Notifikasi pesanan baru dan konfirmasi lewat bot Telegram (webhook).
- Pembatalan otomatis untuk pesanan yang tidak dibayar (cron).

Di sisi sistem:

- Rate limiting per IP, dengan penyimpanan di Cloudflare KV.
- Sanitasi input, header keamanan, dan pembersihan log agar token tidak bocor.
- Margin guard: harga dihitung ulang di server, bukan dipercaya dari klien.
- Sinkronisasi outlet terjadwal lewat GitHub Actions.

## Teknologi

| Bagian | Yang dipakai |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Tampilan | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL), migrasi di `supabase/migrations` |
| Hosting | Cloudflare Workers lewat `@opennextjs/cloudflare`, KV untuk rate limit, R2 untuk gambar |
| Notifikasi | Telegram Bot API, WhatsApp (tautan pesan terstruktur) |
| Pengujian | `node:test`, sekitar 90 file di `tests/` |
| CI | GitHub Actions: deploy dan sinkronisasi outlet |

## Menjalankan secara lokal

Butuh Node.js 22 atau lebih baru dan project Supabase sendiri.

```bash
npm install
cp .env.example .env.local   # isi nilainya, lihat bagian di bawah
npm run dev
```

Perintah lain:

```bash
npm test             # unit dan integration test
npm run lint
npx tsc --noEmit     # cek tipe
npm run deploy       # build untuk Workers lalu wrangler deploy
```

## Environment variable

Daftar lengkap ada di `.env.example`. Yang wajib untuk menjalankan aplikasi:

| Variabel | Fungsi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Koneksi ke Supabase (kunci service role hanya untuk server) |
| `SYNC_SECRET` | Secret untuk endpoint sinkronisasi outlet |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Nomor WhatsApp admin penerima pesanan |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Login dan sesi panel admin |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` | Notifikasi Telegram |

Jangan pernah commit `.env.local`.

## Struktur folder

```text
src/app/          halaman dan API route (outlet, menu, pesanan, grup, admin, cron)
src/components/   komponen UI (keranjang, bottom sheet produk, pembayaran, admin)
src/lib/          logika bisnis: harga, bundling, validasi opsi, rate limit, Telegram
src/hooks/        hook klien (keranjang, status operasional, antrean)
supabase/         migrasi database
tests/            test otomatis
scripts/          skrip bantu untuk sinkronisasi data dan pemeriksaan
docs/             runbook operasional dan catatan audit
```

## Dokumentasi tambahan

Panduan operasional (mengubah harga flat, rotasi secret, menangani error API brand, sinkronisasi manual) ada di [docs/RUNBOOK.md](docs/RUNBOOK.md).
