# Jasdor Cima — Project Memory & Architecture Context

Dokumen ini adalah memori persisten dan konteks utama proyek **Jasdor Cima**. Setiap AI Agent (Antigravity IDE, Claude Code, Cursor, dll.) wajib membaca dokumen ini agar memahami seluruh sistem tanpa memerlukan penjelasan ulang dari user.

---

## 1. Profil Bisnis & Terminologi
- **Nama Bisnis**: Jasdor Cima (Jasa Order Kopi & Minuman)
- **Domain Production**: `https://jasdor.cimagroup.my.id`
- **Branding & Terminologi**:
  - Selalu gunakan istilah **"jasa order"** atau **"jasdor"**.
  - **DILARANG KERAS** menggunakan istilah **"jastip"**.
- **Brand yang Didukung**:
  1. **Kopi Kenangan**: Promo diskon 50%, biaya jasa order Rp 2.300/item (minimal 2 item) atau Rp 4.000 (jika hanya 1 item).
  2. **Fore Coffee**: Biaya jasa order Rp 0 (Free Fee Jasa).
  3. **Tomoro Coffee**: Biaya jasa order Rp 1.500/item flat.

---

## 2. Skema Harga & Paket Bundling (Aktif)
- **Single Item Kopi Kenangan**: Biaya jasa Rp 4.000 flat.
- **Multi-Item Kopi Kenangan ($\ge 2$ item)**: Biaya jasa Rp 2.300 / cup.
- **Paket Promo Bundling Kopi Kenangan**:
  - **Bundling 2 Large**: Mulai **Rp 29.500** (2x KKM Large @ 25k normal = 50k $\times$ 50% = 25k + fee Rp 4.500).
  - **Bundling 3 Reguler**: Mulai **Rp 29.500** (3x menu reguler @ 17k normal = 51k $\times$ 50% = 25.5k + fee Rp 4.000).
  - **Bundling 2+2**: Mulai **Rp 32.000** (2 minuman + 2 roti @ 52k normal $\times$ 50% = 26k + fee Rp 6.000).

---

## 3. Fitur WiFi Outlet Kopi Kenangan
- **SSID**: `Teman Kenangan`
- **Username**: `kopikenangan`
- **Password Hari Ini (07 November)**: `KopiTemanPagi@07`
- **Server Module**: [`src/lib/server/wifi-passwords.ts`](src/lib/server/wifi-passwords.ts) (Menyimpan rotasi 31 hari penuh, aman di server, di-cache 60 detik di edge `/api/wifi-today`).

---

## 4. Arsitektur Teknis & Infrastruktur
- **Framework**: Next.js 16 (Turbopack, App Router).
- **Deployment Platform**: Cloudflare Workers menggunakan `@opennextjs/cloudflare` (Bukan Vercel!).
- **Domain & DNS**: `jasdor.cimagroup.my.id` di Cloudflare.
- **Bindings Cloudflare**:
  - `RATE_LIMIT_KV`: KV Namespace untuk proteksi brute force / rate limiting.
  - `ASSETS`: Static asset delivery Cloudflare.
  - `IMAGE_SOURCE`: Menggunakan R2.
  - Analytics: Cloudflare Web Analytics (`NEXT_PUBLIC_CF_ANALYTICS_TOKEN`).
- **Deploy Command**: `npm run deploy` (menjalankan `npm run build:worker && wrangler deploy`).

---

## 5. Invariant Kritis (Strict Invariants - DILARANG DILANGGAR)
1. **Operational Gate**: Jangan ubah logika flag jam operasional (`src/lib/operational.ts`, `useOperationalStatus`).
2. **Checkout Flow**: Jangan ubah struktur checkout dan format pesan WhatsApp (`src/lib/whatsapp.ts`).
3. **Pricing Guard**: Jangan modifikasi formula proteksi margin / pricing tanpa instruksi eksplisit user (`src/lib/pricing.ts`).
4. **Cart Context**: Jaga keutuhan state keranjang dan drawer (`src/lib/cart-context.tsx`, `CartDrawer.tsx`).
5. **No Em Dash**: DILARANG menambahkan karakter em dash (`—` / U+2014) di folder `src/`. Gunakan tanda hubung strip biasa `-`.

---

## 6. Standar Verifikasi (Quality Gate)
Setiap perubahan kode sebelum deploy wajib lolos:
- `npm test`: Wajib lulus 100% (saat ini 656 unit & integration tests).
- `npx tsc --noEmit`: 0 error tipe TypeScript.
- `npm run lint`: 0 error ESLint.
- `git grep -n "—" src/`: 0 match em dash.
