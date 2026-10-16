# Arsitektur Multi-Brand Jasdor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun arsitektur multi-brand pada Jasdor dengan portal root (`/`) berbasis Varian C (Food Court + Trust Strip), halaman per-brand di `/[brandSlug]` (Kopi Kenangan & pilot Tomoro Coffee), abstraksi `BrandOutletProvider`, serta kompatibilitas penuh URL `/outlet/[code]`.

**Architecture:** Mengembangkan konfigurasi terpusat multi-brand pada `src/lib/site-config.ts` dan abstraksi provider di `src/lib/brand-provider.ts`. Root (`/`) menjadi portal Cima Group dengan brand picker 2 kolom, `/[brandSlug]` melayani pengalaman brand (aktif atau segera hadir), dan `/outlet/[code]` mereferensikan brand slug terkait untuk back navigation.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, OpenNext Cloudflare Workers, Node.js Test Runner.

**Spec:** `docs/superpowers/specs/2026-10-16-multi-brand-architecture-design.md`

## Global Constraints

- **Design System**: Palet Warm Coffee (`#FBF8F4`, `#26150B`, `#F2EBE1`, `#C67D0A`), Merah Promo (`#DC2626`/`#E11D48`) HANYA untuk harga promo dan badge diskon, Font Outfit + Plus Jakarta Sans, Tombol WA hijau (`#15803D`).
- **Feature Flags**: Logika `OPERATIONAL_GATE_ENABLED` di `src/lib/feature-flags.ts` dan `src/hooks/useOperationalStatus.ts` tidak boleh diubah/dihapus.
- **Istilah Bisnis**: Selalu gunakan "jasa order", JANGAN pernah menggunakan "jastip" / "jasa titip".
- **Reserved Slugs**: `faq`, `syarat-ketentuan`, `kebijakan-privasi`, `kontak`, `outlet`, `api` tidak boleh digunakan untuk brand.
- **Integritas Logika**: Jangan ubah perhitungan harga/fee atau single source of truth `isOutletClosed` di `src/lib/orderability.ts`.
- **Kejujuran Data**: Tidak menampilkan outlet/testimoni palsu; placeholder bertanda `TODO` jelas.

## Review Focus

1. *Reserved Slugs Collision*: Navigasi ke `/faq`, `/syarat-ketentuan`, `/kebijakan-privasi`, `/kontak` tidak boleh tertelan oleh `/[brandSlug]`.
2. *Unknown Brand 404*: Mengakses slug sembarang yang tidak terdaftar harus merender 404 cleanly.
3. *Outlet Back-Navigation*: Klik "Kembali" atau "Pilih Outlet Lain" pada `/outlet/[code]` harus kembali ke brand yang benar (`/kopi-kenangan`), bukan ke portal `/`.
4. *Closed Outlet Protection Continuity*: Banner tutup, tombol `+` disabled, bottom sheet disabled, dan API validate-cart tetap bekerja 100% pada rute baru.
5. *Mobile-First Above the Fold*: Pada layar mobile, grid brand dan trust strip pada portal root harus langsung terlihat tanpa scroll.

---

### Task 1: Konfigurasi Brand Terpusat (`src/lib/site-config.ts`)

**Files:**
- Modify: `src/lib/site-config.ts`
- Create: `tests/brand-config.test.ts`

- [x] **Step 1: Tulis tes unit untuk brand config**
  - Uji `getBrandConfig('kopi-kenangan')` mengembalikan data lengkap.
  - Uji `getBrandConfig('tomoro')` mengembalikan status `coming_soon`.
  - Uji `getBrandConfig('unknown-brand')` mengembalikan `null`.
  - Uji `isReservedSlug('faq')` mengembalikan `true`.
  - Uji `resolveBrandSlugFromOutletCode('LIPPO-PURI')` mengembalikan `'kopi-kenangan'`.
- [x] **Step 2: Jalankan tes untuk memastikan gagal (Red)**
- [x] **Step 3: Implementasikan konfigurasi brand di `src/lib/site-config.ts`**
  - Definisikan `BrandConfig` interface.
  - Tambahkan dictionary `BRANDS: Record<string, BrandConfig>`.
  - Tambahkan fungsi helper: `getAllBrands()`, `getBrandConfig(slug)`, `isReservedSlug(slug)`, `resolveBrandSlugFromOutletCode(code)`.
- [x] **Step 4: Jalankan tes untuk memastikan lulus (Green)**
- [x] **Step 5: Commit Task 1**

---

### Task 2: Abstraksi Provider Outlet Per-Brand (`src/lib/brand-provider.ts`)

**Files:**
- Create: `src/lib/brand-provider.ts`
- Create: `tests/brand-provider.test.ts`

- [x] **Step 1: Tulis tes unit untuk provider**
  - Uji `getBrandOutletProvider('kopi-kenangan')` mengembalikan instance provider Kopi Kenangan.
  - Uji `getBrandOutletProvider('tomoro')` mengembalikan stub provider yang mengembalikan array kosong `listFeaturedOutlets()` dan `searchOutlets()`.
  - Uji `getBrandOutletProvider('unknown')` melempar error atau mengembalikan null provider.
- [x] **Step 2: Jalankan tes untuk memastikan gagal (Red)**
- [x] **Step 3: Implementasikan `src/lib/brand-provider.ts`**
  - Buat interface `BrandOutletProvider`.
  - Implementasikan `KopiKenanganOutletProvider` (mendelegasikan ke `normalizeStores` / query store).
  - Implementasikan `TomoroOutletProvider` (stub dengan komentar `TODO: Plug Tomoro Coffee API data source here`).
  - Implementasikan factory `getBrandOutletProvider(brandSlug: string)`.
- [x] **Step 4: Jalankan tes untuk memastikan lulus (Green)**
- [x] **Step 5: Commit Task 2**

---

### Task 3: Komponen Brand Card & Halaman Portal Cima Group (`src/app/page.tsx`)

**Files:**
- Create: `src/components/BrandCard.tsx`
- Modify: `src/app/page.tsx`
- Create: `tests/portal-page.test.ts`

- [x] **Step 1: Tulis tes unit untuk BrandCard dan Portal**
  - Verifikasi `BrandCard` merender nama brand, badge promo merah `"Hemat 50%"`, jumlah outlet untuk brand aktif, dan badge `"Segera Hadir"` tanpa teks "0 outlet" untuk brand non-aktif.
  - Verifikasi portal memuat branding Cima Group, tombol Chat Admin, trust strip dengan label `"Jago/Blu"`, dan section Testimoni dengan 3 item placeholder TODO.
- [x] **Step 2: Jalankan tes untuk memastikan gagal (Red)**
- [x] **Step 3: Buat komponen `src/components/BrandCard.tsx`**
  - Card 2-kolom mobile-first, visual banner warna brand, logo, badge promo punch merah `#DC2626`, outlet count (hanya jika aktif), link ke `/[brandSlug]`, dan disabled state untuk brand segera hadir.
- [x] **Step 4: Rombak `src/app/page.tsx` menjadi Portal Cima Group (Varian C)**
  - Header: Logo Cima Group + tombol Chat Admin (tanpa badge ramai).
  - Hero kompak: judul *"Jajan Favorit, Setengah Harga"* + 1 baris subcopy.
  - Trust strip di atas grid: Pembayaran (QRIS, Jago/Blu, E-Wallet) + Admin Fast Respon.
  - 2-kolom grid brand: Kopi Kenangan & Tomoro Coffee.
  - Strip 3-langkah ringkas: ① Brand → ② Outlet → ③ WhatsApp.
  - Section Testimoni terstruktur dari array config dengan 3 placeholder bertanda TODO JELAS.
  - Pakai ulang Footer yang ada.
- [x] **Step 5: Jalankan tes untuk memastikan lulus (Green)**
- [x] **Step 6: Commit Task 3**

---

### Task 4: Halaman Brand Dinamis (`src/app/[brandSlug]/page.tsx`)

**Files:**
- Create: `src/app/[brandSlug]/page.tsx`
- Create: `tests/brand-page.test.ts`

- [x] **Step 1: Tulis tes unit untuk halaman brand dinamis**
  - Uji `/kopi-kenangan` merender katalog dan pencarian outlet dengan hero dirampingkan (headline + pill HEMAT 50% menempel, 1 baris subcopy, strip 3-langkah).
  - Uji `/tomoro` merender tampilan "Segera Hadir" elegan dengan opsi kembali ke portal dan chat admin.
  - Uji reserved slug (`/faq`, dll) dan slug tidak dikenal memicu `notFound()`.
- [x] **Step 2: Jalankan tes untuk memastikan gagal (Red)**
- [x] **Step 3: Implementasikan `src/app/[brandSlug]/page.tsx`**
  - Validasi slug dengan `isReservedSlug` dan `getBrandConfig`. Panggil `notFound()` jika tidak valid.
  - Render halaman "Segera Hadir" jika status brand adalah `coming_soon`.
  - Render halaman pencarian outlet lengkap jika status brand adalah `active` menggunakan `BrandConfig` untuk teks, promo, dan provider outlet terkait.
- [x] **Step 4: Jalankan tes untuk memastikan lulus (Green)**
- [x] **Step 5: Commit Task 4**

---

### Task 5: Kompatibilitas Navigasi Balik Halaman Outlet (`/outlet/[code]`)

**Files:**
- Modify: `src/app/outlet/[code]/page.tsx`
- Create: `tests/outlet-brand-nav.test.ts`

- [x] **Step 1: Tulis tes unit untuk back-nav halaman outlet**
  - Verifikasi bahwa `backHref` pada Header mengarah ke `/${brandSlug}` (mis. `/kopi-kenangan`).
  - Verifikasi bahwa tombol "Pilih Outlet Lain" pada banner outlet tutup mengarah ke `/${brandSlug}`.
- [x] **Step 2: Jalankan tes untuk memastikan gagal (Red)**
- [x] **Step 3: Perbarui `src/app/outlet/[code]/page.tsx`**
  - Gunakan `resolveBrandSlugFromOutletCode(outletCode)` untuk mendapatkan brand slug.
  - Arahkan `backHref={`/${brandSlug}`}` dan tombol link outlet tutup ke `/${brandSlug}`.
  - Pertahankan seluruh logika proteksi outlet tutup Batch 3 (`isOutletClosed`, banner, '+' disabled, bottom sheet disabled, validate cart).
- [x] **Step 4: Jalankan tes untuk memastikan lulus (Green)**
- [x] **Step 5: Commit Task 5**

---

### Task 6: Verifikasi Penuh, Linter, Build, & Cloudflare Deployment

**Files:**
- Run checks on whole workspace

- [x] **Step 1: Jalankan `npx tsc --noEmit` (harus 0 error)**
- [x] **Step 2: Jalankan `npm run lint` (harus 0 error)**
- [x] **Step 3: Jalankan `npm test` (seluruh tes harus lulus)**
- [x] **Step 4: Jalankan `npm run deploy` ke Cloudflare Workers**
- [x] **Step 5: Verifikasi Live di Browser via Browser Subagent**
  - Akses `/`: verifikasi portal Cima Group, kartu brand KK & Tomoro, trust strip "Jago/Blu".
  - Akses `/kopi-kenangan`: verifikasi pengalaman penuh brand KK.
  - Akses `/tomoro`: verifikasi tampilan segera hadir.
  - Akses `/outlet/LIPPO-PURI`: verifikasi halaman outlet berjalan normal dan tombol kembali mengarah ke `/kopi-kenangan`.
