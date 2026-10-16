[TAMBAH BRAND FORE]

Tambahkan brand FORE COFFEE ke portal multibrand Jasdor sebagai brand full self-order (seperti Kopi Kenangan).

## KONTEKS
- Stack: Next.js App Router + Tailwind, PWA, deploy via OpenNext ke Cloudflare Workers (npm run deploy).
- Arsitektur portal: `/` = brand picker (Variant C), `/[brandSlug]` halaman per brand, BrandOutletProvider abstraction, BrandConfig (id, nama, logo, tagline, badge promo, model fee, template pesan WA, jam/hari operasional per brand), `/outlet/[code]` tetap jalan dengan back-nav brand-aware.
- Brand yang ada: kopi-kenangan (full self-order), tomoro (coming-soon).
- Skill ECC terinstall di `.agents/` — pakai verification-loop untuk eksekusi ini.

## DATA (sudah disediakan user — baca dulu sebelum coding)
- `docs/fore-brand-data.md` — riset lengkap: outlet, menu & harga resmi, info brand.
- `docs/fore-outlets-seed.csv` — **394 outlet Fore AKTIF** dari API resmi Fore (`https://api.fore.coffee/store/all_with_token`, endpoint yang dipakai halaman store locator fore.coffee sendiri), format KOLOM SAMA PERSIS dengan tabel Supabase `outlets` + kolom `timezone` (341 Asia/Jakarta, 52 Asia/Makassar, 1 Asia/Jayapura). Code unik prefix `fore-`. Semua ada latitude/longitude, jam buka/tutup, telepon. (13 outlet `coming_soon` + 1 `inactive` TIDAK ikut di-seed.)
- `docs/fore-menu-cache.json` — payload menu **74 item** (Coffee 23, Non Coffee 10, Tea 6, Fore Deli 17, Ice Blended 4, FOREveryone 1L 14) dalam format YANG SAMA PERSIS dengan cache Kenangan: `{"menuGroups":[{"code","name","products":[{id,name,image,isCombo,basePrice,isSoldOut,bundleCode,description,productCode,originalPrice}]}]}`. Harga = harga NASIONAL outlet (Rupiah penuh). Semua `isSoldOut:false`. **Deskripsi sudah ditulis ulang 100% dengan kata-kata sendiri (bukan copy dari situs jasdor lain). Foto produk: pakai URL R2 self-hosted** `https://gambar.cimagroup.my.id/fore/fore-images-webp-v2/<slug>.webp` (74 foto versi terbaru dari jasdorin, sudah di-upload user ke bucket jasdorkopicima — JANGAN hotlink static.fore.coffee).
- `docs/fore-price-tier-bandara.csv` — 54 item dengan kolom product_name, harga_nasional, harga_bandara, selisih. Outlet bandara +Rp3.000–6.000/item vs nasional (terverifikasi: T3 International Boarding via jasdorin 2026-10-16; koroborasi independen pelanggan T3).
- `docs/fore-outlet-bandara.txt` — 10 code outlet tier bandara (1 terverifikasi, 9 provisional).
- `public/brand-logos/fore.png` — logo Fore (sudah user sediakan di path ini).

## API PUBLIK FORE (ditemukan 2026-10-16 — dipakai website resmi mereka sendiri)
- Endpoint: `GET https://api.fore.coffee/store/all_with_token`
- Header wajib: `Content-Type: application/json`, `wp-token: <token>`, `Origin: https://fore.coffee`, `Referer: https://fore.coffee/id/lokasi-store/`
- Token `wp-token` TERTANAM di HTML publik halaman https://fore.coffee/id/lokasi-store/ (site token, bukan kredensial user) — ambil dari sana. Response: `{status, payload: [ {st_id, st_code, st_name, st_address, st_lat, st_long, st_open, st_close, st_phone, tz_name, tz_utc_offset, is_open (LIVE), st_status (active/coming_soon/inactive), st_default_type, ...} ]}` — 408 row.
- TIDAK ADA endpoint menu publik — menu tetap dari file seed (tugas 3).
- CATATAN: token bisa dirotasi Fore sewaktu-waktu. Jika response 401/500 dengan error auth, ambil ulang token dari HTML halaman lokasi-store.

## ARSITEKTUR DATA (PENTING — baca skema Supabase dulu)
- Tabel `outlets` (id,code,name,address,latitude,longitude,open_time,close_time,is_active,updated_at,brand,is_in_scope) adalah sumber baca daftar outlet — SEKARANG berisi 1340 outlet Kenangan (is_in_scope=true). Website TIDAK baca outlet dari file statis.
- Menu Kenangan TIDAK disimpan sebagai file — diambil dari API Kenangan lalu di-cache di tabel `generic_cache` dengan key `menu:<KODE_OUTLET>`, payload format menuGroups seperti di atas. Karena Fore TIDAK punya API, menu Fore harus di-SEED ke `generic_cache` (bukan di-fetch).
- Tabel `outlets` saat ini TIDAK punya kolom timezone (semua Kenangan dianggap WIB). Fore butuh ini untuk 16 outlet WITA.

## TUGAS
1. **BrandConfig**: tambah entry `fore` — id `"fore"`, nama `"Fore Coffee"`, logo `/brand-logos/fore.png` (render object-contain dalam white badge, pola sama seperti kopi-kenangan.png), tagline `"Setiap Fore Punya Cerita"`, badge promo DIKOSONGKAN (promo menyusul belakangan), model fee ikut pola Kopi Kenangan, template pesan WA ikut pola Kenangan dengan nama brand/outlet dinamis, jam operasional ikut data per outlet.
2. **Dataset outlet**: JANGAN buat file statis `src/data/fore-outlets.ts` — website membaca outlet dari Supabase. (a) Buat migration `ALTER TABLE outlets ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta'` (agar 1340 row Kenangan existing otomatis WIB). (b) Seed 394 outlet dari `docs/fore-outlets-seed.csv` ke tabel `outlets`: brand='Fore Coffee', is_in_scope=true, is_active=true, timezone sesuai CSV. Validasi: 394 code unik prefix `fore-`, tidak tabrakan dengan code Kenangan existing.
3. **Menu**: JANGAN fetch dari API (tidak ada endpoint menu publik). Seed tabel `generic_cache` dengan 394 row key `menu:<code-outlet-fore>` (satu per outlet, payload dari `docs/fore-menu-cache.json`, 74 item — harga NASIONAL). Atau: implementasikan fallback — jika key `menu:fore-*` tidak ada di cache, sajikan menu Fore statis dari JSON tersebut tanpa memanggil API Kenangan. SEMUA menu dianggap tersedia di SEMUA outlet (flat, `isSoldOut:false` semua). JANGAN buat override ketersediaan per outlet dan JANGAN buat toggle manual tutup/habis (forceClosed/isAvailable) — user secara eksplisit menolak fitur ini.
4. **Tier harga bandara**: harga Fore TIDAK seragam nasional — 10 outlet bandara lebih mahal Rp3.000–6.000/item (data: `docs/fore-price-tier-bandara.csv`, outlet: `docs/fore-outlet-bandara.txt`). Implementasikan mekanisme override harga per outlet: tabel `fore_price_overrides` (outlet_code, product_name, price) ATAU kolom `price_tier` di outlets ('nasional' default, 'bandara') + peta harga tier bandara (cocokkan via product_name, fallback ke harga nasional jika item tidak ada di peta). Seed override untuk 10 outlet bandara dari CSV. Harga yang tampil di katalog & cart & checkout WA HARUS harga setelah override (bukan harga nasional). Tambah test: outlet `fore-t3inb` menampilkan Aren Latte Rp33.000 (bukan Rp29.000).
5. **Halaman `/fore`**: pengalaman full self-order seperti `/kopi-kenangan` (daftar outlet → outlet detail → katalog menu → cart → checkout WA). Reuse komponen yang sama, scope per brand. Cart tetap milik satu brand per order (guard pindah brand yang sudah ada tetap dipakai).
6. **Portal (`/`)**: kartu Fore muncul dengan jumlah outlet dinamis via `getOutletCount()` (harusnya 394), bukan hardcode.
7. **Jam operasional**: outlet Fore tersebar di WIB, WITA, dan WIT — JANGAN pakai satu zona Asia/Jakarta untuk semua. Status buka/tutup tiap outlet dihitung dengan jam LOKAL outlet tersebut (pakai kolom `timezone` dari tabel outlets; `Intl.DateTimeFormat` dengan timeZone per outlet). Pastikan code path baca-outlet juga mengambil kolom timezone baru ini. Ini pelajaran dari bug KRITIS kemarin: jam Bali (WITA) yang dibandingkan dengan clock WIB bakal meleset 1 jam. Tambah test pinning: outlet WITA tutup 22:00 WITA harus tampil tutup pada 21:30 WIB.
8. **Sinkronisasi status live (pola Kenangan)**: buat `fore-client.ts` + service sync yang memanggil `GET https://api.fore.coffee/store/all_with_token` (header lihat bagian API di atas) secara berkala — pola sama seperti `kk-client.ts`/`outlet-service.ts` untuk Kenangan. Yang di-sync: `is_open` (status buka LIVE dari sistem Fore), `st_open`/`st_close`, `st_status`, `tz_name`, dan outlet baru/hilang (tambah yang `active`, nonaktifkan yang tidak lagi `active`; JANGAN hapus row). Interval wajar (mis. tiap 1–2 jam, bukan tiap menit). Jika API error auth (token dirotasi), ambil ulang `wp-token` dari HTML https://fore.coffee/id/lokasi-store/ lalu retry. JANGAN pernah memanggil endpoint lain di luar `/store/all_with_token`, JANGAN kirim kredensial user apapun.
9. **Test**: tambah/extend `brand-config.test.ts` untuk entry fore (slug, logo, 394 outlet unik, sampel harga menu). Seluruh suite harus hijau.

## BATASAN WAJIB
- JANGAN sentuh feature flag operasional (`feature-flags.ts`, `useOperationalStatus.ts`, `NEXT_PUBLIC_OPERATIONAL_GATE_ENABLED`).
- Jangan ubah logika checkout, pricing, fee, atau cart — hanya tambah scoping brand.
- Istilah selalu "jasa order", bukan "jastip"/"jasa titip".
- Metode pembayaran SAMA PERSIS seperti Kopi Kenangan (1 QRIS, rekening & admin WA sama) — ikut site-config yang ada, tidak ada config pembayaran khusus Fore.
- JANGAN tambahkan toggle manual tutup/habis (forceClosed/isAvailable) untuk outlet maupun menu — user menolak; menu flat tersedia di semua outlet.

## VERIFIKASI
- tsc + lint bersih, semua test hijau.
- Build sukses, deploy, verifikasi live: `/fore` tampil, kartu portal tampil 394 outlet, satu outlet dibuka (katalog + harga benar), checkout WA dengan template yang benar, badge buka/tutup benar untuk satu outlet WITA (cek di jam yang berbeda dari WIB).
