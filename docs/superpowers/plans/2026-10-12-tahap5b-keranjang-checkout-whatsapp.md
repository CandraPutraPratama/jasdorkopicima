# Tahap 5B: Keranjang, Checkout, dan WhatsApp (+ Perbaikan 5A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelesaikan perbaikan 5A (hapus bypass simulasi di production, footer disclaimer independen di semua halaman, perbaikan teks promo akurat) serta membangun Tahap 5B: state keranjang (sessionStorage + reducer), floating cart bar, drawer keranjang, form checkout (nama, pick up sekarang / terjadwal), validasi pra-kirim WhatsApp, generator pesan WhatsApp murni (`buildWhatsAppMessage`), dan alur pembukaan wa.me dengan cadangan tombol salin pesan.

**Architecture:**
- **Perbaikan 5A:**
  - `/api/operational-status`: mode simulasi HANYA aktif jika `process.env.ALLOW_SIMULATE === 'true'`. Di production (Cloudflare tanpa ALLOW_SIMULATE), parameter `?simulate=` diabaikan 100%.
  - `src/app/layout.tsx`: tambahkan footer disclaimer: `"Layanan jasa titip independen, bukan afiliasi resmi Kopi Kenangan."` di semua halaman.
  - Teks promo diubah menjadi: `"Diskon 50% dari harga dasar menu. Tambahan varian, topping, dan biaya jasa dibayar normal."`
- **Tahap 5B Pure Modules & State:**
  - `src/lib/whatsapp.ts`: fungsi murni `buildWhatsAppMessage` yang menghasilkan format string pesan persis sesuai template instruksi. Dilengkapi unit test dengan contoh wajib spesifik (Creamy Caramel Latte & Cookie).
  - `src/lib/cart-reducer.ts`: reducer murni untuk operasi keranjang (tambah, gabung item identik, ubah kuantitas, hapus, kosongkan).
  - `src/lib/schedule-slots.ts`: kalkulator slot waktu jadwal pickup kelipatan 5 menit (hari ini saja, minimal 10 menit dari sekarang, dalam jam buka jasdor dan outlet).
  - `src/hooks/useCart.ts`: hook pengelola state keranjang berbasis `sessionStorage` dengan deteksi perpindahan outlet.
- **Tahap 5B UI Components:**
  - `src/components/FloatingCartBar.tsx`: bar melayang di bawah layar yang menampilkan jumlah item, total harga promo, dan membuka drawer keranjang.
  - `src/components/CartDrawer.tsx`: lembar rincian keranjang dengan ubah/hapus qty, rincian varian/topping, ringkasan harga (asli coret, subtotal promo, fee jasa, total, hemat), dan form checkout (nama, pilihan pick up).
  - `src/components/CheckoutModal.tsx` & Konfirmasi WhatsApp: dialog validasi pra-kirim (cek jasdor buka, outlet buka, cek ketersediaan item terbaru dari menu), link `wa.me`, tombol salin pesan jika URL > 1800 karakter atau sebagai cadangan, dan dialog konfirmasi "Sudah mengirim pesan di WhatsApp?".
  - `src/components/OrderSuccessScreen.tsx`: layar terima kasih setelah konfirmasi kirim.

---

## Global Constraints

- Nomor WhatsApp jasdor: `6287793420768` dari `BUSINESS_CONFIG.whatsappNumber` (tidak hardcode di komponen).
- Footer di semua halaman: `"Layanan jasa titip independen, bukan afiliasi resmi Kopi Kenangan."`
- Teks promo akurat: `"Diskon 50% dari harga dasar menu. Tambahan varian, topping, dan biaya jasa dibayar normal."`
- Format mata uang: `Rp21.000` tanpa desimal.
- Tidak ada penyimpanan pesanan di database server dan tidak ada akun customer.
- Tidak ada fitur "pesan ulang".
- Rumus harga menggunakan `calculateItemPricing` dan `calculateOrderPricing` dari `src/lib/pricing.ts`.

---

### Task 1: Perbaikan 5A (Simulate Flag, Disclaimer Footer, Accurate Promo Copy)

**Files:**
- Modify: `src/app/api/operational-status/route.ts`
- Modify: `src/hooks/useOperationalStatus.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/ClosedScreen.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `tests/operational.test.ts`

- [ ] **Step 1: Enforce `ALLOW_SIMULATE === 'true'` requirement in `/api/operational-status/route.ts`**
- [ ] **Step 2: Add global disclaimer footer to `src/app/layout.tsx`**
- [ ] **Step 3: Update promo copy across `page.tsx` and headers**
- [ ] **Step 4: Run tests to verify operational status behavior**
- [ ] **Step 5: Commit changes**

---

### Task 2: Pure Logic - WhatsApp Message Builder & Tests

**Files:**
- Create: `src/lib/whatsapp.ts`
- Create: `tests/whatsapp.test.ts`
- Modify: `src/config/business.ts`

- [ ] **Step 1: Add `whatsappNumber` to `src/config/business.ts`**
- [ ] **Step 2: Write failing tests in `tests/whatsapp.test.ts` including the exact user scenario**
- [ ] **Step 3: Implement `src/lib/whatsapp.ts` (`buildWhatsAppMessage`, `cleanNotes`, `buildWhatsAppUrl`)**
- [ ] **Step 4: Run tests and ensure exact string match (GREEN)**
- [ ] **Step 5: Commit changes**

---

### Task 3: Pure Logic - Cart Reducer & Schedule Slots Calculator

**Files:**
- Create: `src/lib/cart-reducer.ts`
- Create: `src/lib/schedule-slots.ts`
- Create: `tests/cart-reducer.test.ts`
- Create: `tests/schedule-slots.test.ts`

- [ ] **Step 1: Write failing tests for cart reducer (add, merge identical, change qty, remove, clear)**
- [ ] **Step 2: Write failing tests for schedule slots (5-min intervals, min 10 min ahead, bounds check)**
- [ ] **Step 3: Implement `src/lib/cart-reducer.ts` and `src/lib/schedule-slots.ts`**
- [ ] **Step 4: Run tests and verify all pass (GREEN)**
- [ ] **Step 5: Commit changes**

---

### Task 4: Cart State Hook & Outlet Switching Confirmation

**Files:**
- Create: `src/hooks/useCart.ts`
- Create: `src/components/SwitchOutletModal.tsx`
- Modify: `src/components/ProductBottomSheet.tsx`

- [ ] **Step 1: Implement `useCart.ts` with `sessionStorage` persistence and outletCode tracking**
- [ ] **Step 2: Activate "Tambah ke Keranjang" button in `ProductBottomSheet.tsx`**
- [ ] **Step 3: Implement `SwitchOutletModal.tsx` for clearing cart on outlet change**
- [ ] **Step 4: Commit changes**

---

### Task 5: Floating Cart Bar & Cart Drawer with Pricing Summary

**Files:**
- Create: `src/components/FloatingCartBar.tsx`
- Create: `src/components/CartDrawer.tsx`
- Modify: `src/app/outlet/[code]/page.tsx`

- [ ] **Step 1: Implement `FloatingCartBar.tsx`**
- [ ] **Step 2: Implement `CartDrawer.tsx` with item list, qty change, notes, and pricing breakdown**
- [ ] **Step 3: Integrate floating bar and drawer into `src/app/outlet/[code]/page.tsx`**
- [ ] **Step 4: Commit changes**

---

### Task 6: Checkout Form, Validation & WhatsApp Submission Flow

**Files:**
- Create: `src/components/CheckoutSection.tsx`
- Create: `src/components/WhatsAppConfirmModal.tsx`
- Create: `src/components/OrderSuccessScreen.tsx`
- Modify: `src/components/CartDrawer.tsx`

- [ ] **Step 1: Implement customer name input and pickup mode selection (now vs scheduled)**
- [ ] **Step 2: Implement pre-submission validation (operational status, outlet check, item stock check)**
- [ ] **Step 3: Implement WhatsApp modal (copy message button, wa.me opener, confirmation dialog)**
- [ ] **Step 4: Implement `OrderSuccessScreen.tsx` upon confirmation**
- [ ] **Step 5: Commit changes**

---

### Task 7: Verification, Lint, Tests, Cloudflare Deployment & Mobile HP Inspection

- [ ] **Step 1: Run linter (`npm run lint`), type check (`npx tsc --noEmit`), and all unit tests (`npm test`)**
- [ ] **Step 2: Build Cloudflare worker (`npm run build:worker`) and deploy (`npx wrangler deploy`)**
- [ ] **Step 3: Verify on live mobile viewport (390px) on `https://jasdor.cimagroup.my.id`:**
  - Verify `?simulate=open` does NOT bypass closed screen on production.
  - Verify footer disclaimer on all pages.
  - Verify accurate promo copy.
  - Test end-to-end flow: search -> select outlet -> add product to cart -> change qty -> checkout -> WhatsApp link generation.
