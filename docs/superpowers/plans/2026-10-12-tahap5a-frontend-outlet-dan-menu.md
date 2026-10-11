# Tahap 5A: Frontend Pemilihan Outlet & Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun frontend mobile-first untuk pemilihan outlet Kopi Kenangan, penegakan jam operasional jasdor, penjelajahan katalog menu dengan kalkulasi 3 harga promo & fee, serta modal bottom sheet detail varian/topping dengan validasi SKU kombinasi. Keranjang, checkout, dan WhatsApp secara ketat tidak dibuat (disimpan untuk 5B).

**Architecture:**
- Next.js App Router (React 19) dengan Tailwind CSS v4 untuk mobile-first responsive styling (360px - 430px).
- Modul domain & utilitas murni di `src/lib/orderability.ts` dan `src/lib/currency.ts` dengan 100% unit test coverage via Node test runner.
- Hook operasional `useOperationalStatus` dengan polling 60 detik untuk mendeteksi status jam buka (08.00 - 23.20 WIB) dengan server sebagai acuan, merender layar TUTUP TOTAL saat di luar jam.
- Halaman pencarian `/` dengan debounce 300ms, petunjuk pencarian awal, badge status orderability ("Buka", "Tutup", "Pesan online dinonaktifkan"), dan penonaktifan tombol pilih untuk outlet non-orderable.
- Halaman menu `/outlet/[code]` dengan header status buka segar, category tab scrollable sticky, kartu produk dengan 3 harga (asli coret, promo 50%, fee +Rp2.000/item dari config), dan badge "Habis".
- Bottom sheet produk dengan pilihan varian, disabling kombinasi yang tidak valid di `option_product_map`, pilihan topping/addon, kalkulasi harga seketika, qty, catatan, dan tombol "Tambah ke Keranjang" disabled.
- Halaman `not-found.tsx` dan `error.tsx` bergaya konsisten dengan identitas brand Jasdor Kopi Cima.

**Tech Stack:** Next.js 16.4.0, React 19.3.0, Tailwind CSS v4, TypeScript, Node.js test runner, OpenNext Cloudflare adapter.

---

## Global Constraints

- Warna: Utama `#111111`, Aksen `#D4AF37`, Background `#FFFFFF`, Teks `#1F2937`.
- Logo: `/brand/logo-cima.webp`.
- Mobile-first: lebar 360px - 430px (`max-w-md mx-auto`), target sentuh minimal 44px, zero horizontal overflow pada body.
- Format mata uang: `Rp21.000` tanpa desimal (bahasa Indonesia).
- Semua data melalui API route Next.js lokal (`/api/operational-status`, `/api/outlets`, `/api/outlets/[code]`, `/api/outlets/[code]/menu`, `/api/outlets/[code]/products/[bundleCode]/options`). Browser tidak boleh langsung memanggil KK API.
- Fee dan diskon diambil dari `BUSINESS_CONFIG` / `pricing.ts`, tidak boleh di-hardcode.
- Item combo tetap disembunyikan. Produk sold out diberi badge "Habis" dan nonaktif.
- Keranjang, checkout, dan WhatsApp TIDAK dibuat di tahap ini.

---

## Review Focus

1. **Outlet non-orderable:** Outlet dengan `status !== 'Active'`, `order_type` tanpa 101, atau `order_msg !== 'Pesan Sekarang'` harus menampilkan badge alasan dan tombol pilihnya nonaktif.
2. **Jam Operasional Tutup Total:** Di luar 08.00 - 23.20 WIB, aplikasi harus menampilkan layar tutup total (logo, jam buka, pesan tutup) tanpa kolom cari atau menu. Polling 60 detik di background.
3. **Kombinasi Varian Tidak Valid:** Jika kombinasi dimensi varian tidak terdapat di `option_product_map`, opsi yang tidak kompatibel harus di-disable di bottom sheet.
4. **Kalkulasi 3 Harga:** Kartu produk wajib menampilkan harga asli dicoret, harga promo (diskon 50% dari harga dasar), dan keterangan fee jasa (+Rp2.000/item) dengan rumus dari `pricing.ts`.
5. **View 404 & Error Boundaries:** Rute outlet yang tidak ada atau gangguan jaringan harus menampilkan tampilan ramah berbahasa Indonesia dengan tombol kembali ke beranda.

---

### Task 1: Domain & Pure Logic (Orderability & Currency Helper)

**Files:**
- Create: `src/lib/orderability.ts`
- Create: `src/lib/currency.ts`
- Modify: `src/types/domain.ts`
- Modify: `src/lib/adapter.ts`
- Create: `tests/orderability.test.ts`
- Create: `tests/currency.test.ts`

**Interfaces:**
- Consumes: `KkStoreItem` from `src/types/kk-api.ts`.
- Produces:
  - `checkOutletOrderability(outlet: { orderType?: number[]; status?: string; orderMsg?: string; isOpen?: boolean }): { canOrder: boolean; reason: string }`
  - `formatRupiah(amount: number): string`
  - Updated `Outlet` domain type with `orderType?: number[]`, `status?: string`, `orderMsg?: string`, `canOrder: boolean`, `orderReason?: string`.
  - Updated `ProductOptionDetails` with `optionMap: Record<string, VariantSku>` and `defaultSelectionMap?: Record<string, string>`.

- [ ] **Step 1: Write failing tests for orderability and currency**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement `src/lib/orderability.ts`, `src/lib/currency.ts`, and update `src/types/domain.ts` & `src/lib/adapter.ts`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 2: Backend Search & Status Route Enhancements

**Files:**
- Modify: `src/app/api/operational-status/route.ts`
- Modify: `src/lib/outlet-service.ts`
- Modify: `src/app/api/outlets/route.ts`
- Modify: `src/app/api/outlets/[code]/products/[bundleCode]/options/route.ts`

**Interfaces:**
- Consumes: `kkApiClient.queryStore`, `checkOutletOrderability`.
- Produces:
  - `/api/operational-status`: returns status with support for preview/simulation mode (`?simulate=open` or `?simulate=closed` for testing off-hours).
  - `/api/outlets?q=`: returns empty items when `q` is blank/too short, and when `q` is given, returns search results with `canOrder` and `orderReason`.
  - `/api/outlets/[code]/products/[bundleCode]/options`: returns options with `optionMap` and `defaultSelectionMap`.

- [ ] **Step 1: Update `/api/operational-status/route.ts` and `src/lib/outlet-service.ts`**
- [ ] **Step 2: Update `/api/outlets/route.ts` and options route**
- [ ] **Step 3: Run existing unit tests to verify no regressions**
- [ ] **Step 4: Commit changes**

---

### Task 3: Global Design System & Closed Screen (TUTUP TOTAL)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/hooks/useOperationalStatus.ts`
- Create: `src/components/ClosedScreen.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/Skeleton.tsx`

**Interfaces:**
- Consumes: `/api/operational-status`.
- Produces:
  - Polling hook `useOperationalStatus` (60s interval).
  - `ClosedScreen`: full-page view showing Logo, "Jasdor Sedang Tutup", and operating hours ("Buka kembali pukul 08.00 WIB").
  - `Header`: responsive mobile header with Jasdor logo and brand styling.

- [ ] **Step 1: Update `globals.css` with color variables (`#111111`, `#D4AF37`, `#FFFFFF`, `#1F2937`) and clean base rules**
- [ ] **Step 2: Create `useOperationalStatus.ts` hook with 60-second polling**
- [ ] **Step 3: Create `ClosedScreen.tsx`, `Header.tsx`, and `Skeleton.tsx`**
- [ ] **Step 4: Verify layout renders cleanly**
- [ ] **Step 5: Commit changes**

---

### Task 4: Home Page (Search Outlets with Debounce & Orderability Badges)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/OutletSearchCard.tsx`

**Interfaces:**
- Consumes: `/api/outlets?q=`, `useOperationalStatus`, `ClosedScreen`, `formatRupiah`.
- Produces:
  - Search input with 300ms debounce.
  - Initial guidance state before typing ("Ketik nama outlet, mall, atau jalan...").
  - Outlet list with name, address, distance, status badges:
    - Orderable: Gold badge "Buka" / "Pesan Sekarang" + active "Pilih Outlet" button navigating to `/outlet/[code]`.
    - Non-orderable: Gray/Red badge (e.g. "Tutup" or "Pesan online dinonaktifkan") + disabled "Tidak Tersedia" button.
  - Empty state when search yields no results.
  - Skeleton loading while debounced search is in flight.

- [ ] **Step 1: Create `src/components/OutletSearchCard.tsx`**
- [ ] **Step 2: Implement `src/app/page.tsx` with search state, debounce, guidance, and closed guard**
- [ ] **Step 3: Verify locally and test edge cases**
- [ ] **Step 4: Commit changes**

---

### Task 5: Outlet Menu Page (`/outlet/[code]`)

**Files:**
- Create: `src/app/outlet/[code]/page.tsx`
- Create: `src/components/ProductCard.tsx`
- Create: `src/components/MenuCategoryNav.tsx`

**Interfaces:**
- Consumes: `/api/outlets/[code]`, `/api/outlets/[code]/menu`, `calculateItemPricing`, `BUSINESS_CONFIG`.
- Produces:
  - Sticky fresh store header with back button to search, store name, address, and live open status badge.
  - Horizontally swipeable sticky category navigation bar that highlights the active group.
  - Product catalog showing:
    - Lazy loaded image.
    - Product name and description.
    - 3 prices: original crossed out, promo 50% discount price, and `+Rp2.000/item` fee note (from config).
    - Sold out badge ("Habis") with disabled tap action.
    - Tap handler that opens product bottom sheet.

- [ ] **Step 1: Create `MenuCategoryNav.tsx` and `ProductCard.tsx`**
- [ ] **Step 2: Implement `src/app/outlet/[code]/page.tsx`**
- [ ] **Step 3: Verify menu catalog rendering and sticky navigation**
- [ ] **Step 4: Commit changes**

---

### Task 6: Product Detail Bottom Sheet (Options, Combinations, Real-time Pricing)

**Files:**
- Create: `src/components/ProductBottomSheet.tsx`
- Create: `src/lib/option-validation.ts`
- Create: `tests/option-validation.test.ts`

**Interfaces:**
- Consumes: `/api/outlets/[code]/products/[bundleCode]/options`, `calculateItemPricing`, `BUSINESS_CONFIG`.
- Produces:
  - Variant dimensions selection (temperature, size, beans, milk, sugar, ice level).
  - Validation: combinations not existing in `option_product_map` are disabled.
  - Topping/addon multi-selection.
  - Dynamic price updates: recalculates original price, promo price, variant addition, and topping totals as selections change.
  - Quantity counter (- / +) and customer note input field.
  - Disabled "Tambah ke Keranjang" button (marked as "Keranjang dibuka di Tahap 5B").

- [ ] **Step 1: Write unit tests for option combination validation in `tests/option-validation.test.ts`**
- [ ] **Step 2: Implement `src/lib/option-validation.ts`**
- [ ] **Step 3: Implement `src/components/ProductBottomSheet.tsx`**
- [ ] **Step 4: Integrate bottom sheet into `/outlet/[code]/page.tsx`**
- [ ] **Step 5: Run tests and commit**

---

### Task 7: 404 & Error Boundaries

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`

**Interfaces:**
- Produces:
  - Branded 404 page ("Halaman Tidak Ditemukan") with home redirect.
  - Branded Error page with retry action and home redirect.

- [ ] **Step 1: Implement `src/app/not-found.tsx`**
- [ ] **Step 2: Implement `src/app/error.tsx`**
- [ ] **Step 3: Commit changes**

---

### Task 8: Verification, Lint, Tests, Cloudflare Deployment, and Mobile Browser Inspection

**Files:**
- None (verification & deployment commands)

- [ ] **Step 1: Run linter (`npm run lint`) and all unit tests (`npm test`)**
- [ ] **Step 2: Build worker (`npm run build:worker`) and deploy to Cloudflare (`npm run deploy`)**
- [ ] **Step 3: Inspect live mobile viewport (390px) using browser agent on `https://jasdor.cimagroup.my.id`**
- [ ] **Step 4: Capture screenshots, document findings, and compile final report**
