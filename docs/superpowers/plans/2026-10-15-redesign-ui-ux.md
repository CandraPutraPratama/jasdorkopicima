# Total UI/UX Redesign — "Warm Coffee + Promo Punch" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign total UI/UX website Jasdor agar bernuansa premium "warm coffee + promo punch", terasa appetizing, angka diskon 50% & hemat mencolok, transparan & terpercaya untuk jastip independen, tipografi berkarakter (Outfit + Plus Jakarta Sans), dan bebas dari ciri khas "AI slop".

**Architecture:** Menerapkan design system hangat (krem/susu, espresso gelap, aksen karamel & promo punch) ke seluruh layer aplikasi mobile-first Next.js App Router + Tailwind v4: Design Tokens di `globals.css` & `layout.tsx`, komponen inti (`Header`, `OutletSearchCard`, `ProductCard`, `MenuCategoryNav`, `ProductBottomSheet`, `CartDrawer`, `FloatingCartBar`, `ClosedScreen`, `Skeleton`, `NotFound`), dan halaman utama (`/`, `/outlet/[code]`).

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, `next/font/google` (Outfit & Plus Jakarta Sans), Lucide/Heroicons SVG.

**Spec:** Persisted Master Design System di `design-system/jasdor-kopi-cima/MASTER.md` dan panduan UI/UX Pro Max untuk Food Delivery / Cafe.

## Global Constraints

- Dilarang mengubah logika bisnis: alur keranjang, checkout WhatsApp, validasi stok KK API (`/api/outlets/[code]/validate-cart`), perhitungan harga diskon & fee di `lib/pricing.ts`, dan feature flag `OPERATIONAL_GATE_ENABLED` di `src/lib/feature-flags.ts`.
- Dilarang mengganti framework CSS (tetap Tailwind CSS v4).
- PWA-friendly, mobile-first responsive (375px viewport target), touch target minimal 44×44px, kontras rasio minimal 4.5:1.
- Setiap task harus lulus `npm run lint` dan `npx tsc --noEmit`.

## Review Focus

1. **Scroll & Touch lock integrity:** Memastikan `useScrollLock` dan navigasi kategori sticky tidak rusak atau glitch saat transisi visual dipercantik.
2. **Promo visibility hierarchy:** Harga promo dan nominal "Hemat RpX" harus paling kontras dan seketika ditangkap mata dibanding harga asli dan fee.
3. **Appetite appeal vs clarity:** Background krem tidak boleh membuat teks pudar atau susah dibaca; teks utama wajib espresso pekat (`#23150D` / `#2C1810`).
4. **Touch targets & responsive spacing:** Tombol stepper (+/-), chip kategori, tombol pilih outlet, dan CTA WhatsApp memiliki min-height/width 44px dan padding nyaman di jari jempol HP.
5. **Trust signals:** Banner info jastip independen, estimasi waktu/slot pickup, cara order 3 langkah yang bersih, dan disclaimer tidak tersembunyi.

---

### Task 1: Design Tokens & Typography Foundation (`globals.css`, `layout.tsx`)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS variables & utility classes: `--font-display`, `--font-sans`, warm coffee palette (`bg-warm-base`, `text-espresso`, `bg-warm-card`, `border-warm`, `text-punch`, `badge-promo`).

- [ ] **Step 1: Setup Google Fonts di `src/app/layout.tsx`**
  Import `Outfit` (display, angka harga, judul) dan `Plus_Jakarta_Sans` (body, metadata) via `next/font/google`, inject variables ke tag `<html>` / `<body>`.

- [ ] **Step 2: Update Design Tokens di `src/app/globals.css`**
  Konfigurasi `@theme` Tailwind v4:
  - Background dasar: `#FBF8F4` (krem susu hangat)
  - Card background: `#FFFFFF` dengan warm border `#F2EBE1`
  - Text primary: `#26150B` (espresso pekat, kontras tinggi >10:1)
  - Text secondary: `#6A584D` (warm latte gray)
  - Caramel/Amber accent: `#C67D0A` / `#D97706`
  - Promo Punch accent: `#DC2626` / `#E11D48` (merah berry/crimson segar untuk harga promo & badge diskon)
  - CTA WhatsApp: `#15803D` / `#16A34A` (hijau resmi) atau Espresso Gold
  - Rounded tokens & soft warm shadow: `shadow-warm-sm`, `shadow-warm-md`

- [ ] **Step 3: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/globals.css src/app/layout.tsx
  git commit -m "style: setup warm coffee design tokens and Google typography"
  ```

---

### Task 2: Header, Skeleton & Brand Trust Components

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Skeleton.tsx`
- Modify: `src/components/ClosedScreen.tsx`
- Modify: `src/app/not-found.tsx`

**Interfaces:**
- Produces: Warm appetizing header with logo badge, status badge, refined skeleton loaders, warm 404 & closed screens.

- [ ] **Step 1: Redesign `Header.tsx`**
  - Background warm cream blur (`bg-[#FBF8F4]/95 backdrop-blur-md border-b border-[#F0E6D8]`).
  - Brand identity: Logo bulat dengan ring karamel halus, display font bold `jasdorkopicima`, tagline "JASTIP KOPI KENANGAN • PROMO 50%".
  - Status outlet/jasdor badge: pill badge warm emerald/amber dengan pulse dot.

- [ ] **Step 2: Redesign `Skeleton.tsx`**
  - Ubah warna shimmer abu-abu dingin (`bg-stone-200`) menjadi warm bone shimmer (`bg-[#F0E6DA]` & `bg-[#F8F2EA]`).

- [ ] **Step 3: Redesign `ClosedScreen.tsx` & `not-found.tsx`**
  - Tampilan warm coffee shop: ilustrasi/ikon jam hangat, kartu jam operasional bertekstur kopi krem, tombol aksi berkarakter.

- [ ] **Step 4: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/Header.tsx src/components/Skeleton.tsx src/components/ClosedScreen.tsx src/app/not-found.tsx
  git commit -m "style: redesign header, skeletons, closed screen and 404 with warm coffee theme"
  ```

---

### Task 3: Homepage Redesign (Hero, Trust Strip, Search & Outlet Card)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/OutletSearchCard.tsx`

**Interfaces:**
- Consumes: Header, Skeleton, OutletSearchCard, useOperationalStatus
- Produces: Engaging warm hero, clear 3-step order guide, prominent search bar, rich outlet cards.

- [ ] **Step 1: Redesign Hero & Trust Banner di `src/app/page.tsx`**
  - Hero Card: Nuansa dark espresso hangat (`bg-gradient-to-br from-[#24140D] via-[#321C12] to-[#1E0F09]`), border amber lembut.
  - Value proposition punchy:
    - Badge: "JASTIP INDEPENDEN KOPI KENANGAN"
    - Heading: "Kopi Kenangan Favoritmu, Hemat 50%"
    - Subtext informatif: Penjelasan diskon menu dasar, biaya jasa terjangkau mulai Rp2.000/item, alur WhatsApp praktis.
  - 3-Langkah Cara Order yang transparan (1. Pilih Outlet, 2. Pilih Menu & Topping, 3. Checkout WhatsApp otomatis) — membangun trust agar tidak terlihat seperti situs abal-abal.

- [ ] **Step 2: Redesign Input Pencarian Outlet**
  - Search input yang hangat: border `#E6D9C8`, focus ring amber-caramel, ikon pencarian crisp SVG, tombol clear cepat, placeholder ramah.
  - Quick chips contoh lokasi ("Grand Indonesia", "Puri", "Rungkut") dengan warm pills.

- [ ] **Step 3: Redesign `OutletSearchCard.tsx`**
  - Kartu outlet dengan background putih krem, border `#EFE6DA`, hover lift halus.
  - Badge Buka/Tutup dengan warna jelas (Emerald badge untuk buka, Muted latte untuk tutup).
  - Info jam & jarak dengan ikon SVG hangat.
  - Tombol "Pilih Outlet & Lihat Menu" dengan display font, warna espresso hangat + aksen karamel.

- [ ] **Step 4: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/page.tsx src/components/OutletSearchCard.tsx
  git commit -m "style: redesign homepage hero, trust guide and outlet search cards"
  ```

---

### Task 4: Halaman Outlet, Sticky Category Nav & Product Card

**Files:**
- Modify: `src/app/outlet/[code]/page.tsx`
- Modify: `src/components/MenuCategoryNav.tsx`
- Modify: `src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: MenuCategoryNav, ProductCard, ProductBottomSheet, FloatingCartBar, CartDrawer
- Produces: Appetizing menu page, high-conversion product card with promo punch.

- [ ] **Step 1: Redesign Outlet Info Header di `src/app/outlet/[code]/page.tsx`**
  - Outlet header bersih & hangat: nama outlet tebal dengan display font, alamat jelas, badge status buka, info jam operasional dengan ikon SVG.

- [ ] **Step 2: Redesign `MenuCategoryNav.tsx`**
  - Pertahankan semua logika Sprint 2 Item 3.2 (tap tanpa delay `touch-action: manipulation`, chip aktif selalu di tengah, auto scroll instan).
  - Tampilan visual:
    - Chip aktif: background dark espresso `#24140D` dengan teks caramel/amber `#FBBF24` dan soft shadow.
    - Chip non-aktif: background warm oat `#F2EAE0` dengan teks espresso latte `#5C4638`, hover `#E9DFD3`.
    - Fade gradient kanan: gradasi dari `rgba(251, 248, 244, 1)` ke transparan.

- [ ] **Step 3: Redesign `ProductCard.tsx` (Appetite & Promo Punch)**
  - Foto produk besar (88x88px) dengan sudut rounded-2xl dan warm soft border.
  - Judul menu tebal espresso `#26150B`.
  - Deskripsi singkat 2 baris yang renyah dan appetizing.
  - Baris Harga Promo Punch:
    - Harga diskon tebal dan besar dengan warna punch berry/merah-oranye (`text-[#D92D20]` / `#DC2626`).
    - Harga coret abu-latte (`text-stone-400 line-through text-xs`).
    - Badge "Diskon 50%" / "Hemat RpX" yang tegas dan mencolok.
    - Fee jasa transparan: pill kecil `+fee Rp2rb/item`.

- [ ] **Step 4: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/outlet/[code]/page.tsx src/components/MenuCategoryNav.tsx src/components/ProductCard.tsx
  git commit -m "style: redesign outlet menu header, category chips and product cards with promo punch"
  ```

---

### Task 5: Product Bottom Sheet Customizer

**Files:**
- Modify: `src/components/ProductBottomSheet.tsx`

**Interfaces:**
- Consumes: Product, ProductOptionDetails, calculateBottomSheetPricing
- Produces: Polished bottom sheet with smooth pill selectors, clear addon cards, appetizing visuals, sticky bottom CTA bar.

- [ ] **Step 1: Header & Visual Preview Bottom Sheet**
  - Drag handle pill di atas sheet.
  - Foto produk besar dengan badge diskon 50%.
  - Judul produk tebal, deskripsi, dan perbandingan harga awal (asli vs promo).

- [ ] **Step 2: Redesign Opsi Varian, Cup Size, Sugar & Ice**
  - Pill selector dengan touch target 44px:
    - Selected: border 2px caramel-espresso (`border-[#24140D] bg-[#24140D] text-[#FBBF24]`).
    - Unselected: warm oat border & background (`border-[#EAE0D4] bg-[#FDFBF7] text-[#422E22]`).
    - Label tambahan biaya (misal: Large +Rp5.000, Juwara Beans +Rp3.000) terlihat jelas dan transparan.

- [ ] **Step 3: Redesign Topping & Catatan Khusus**
  - Checkbox/card addon yang nyaman disentuh, ada counter jika dipilih.
  - Textarea catatan dengan border hangat dan helper counter karakter.

- [ ] **Step 4: Redesign Sticky Footer & Add to Cart Bar**
  - Breakdown subtotal dan badge penghematan ("Hemat Rp15.000" dalam pill hijau/amber segar).
  - Stepper kuantitas (- 1 +) yang solid dengan min-height 44px.
  - Tombol CTA "Tambah ke Keranjang • RpXX.XXX" dengan warna espresso gelap + aksen emas karamel yang dominan dan percaya diri.

- [ ] **Step 5: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/ProductBottomSheet.tsx
  git commit -m "style: redesign product customizer bottom sheet with warm pill selectors and sticky CTA"
  ```

---

### Task 6: Cart Drawer, Floating Cart Bar & WhatsApp Checkout

**Files:**
- Modify: `src/components/FloatingCartBar.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Modify: `src/components/SwitchOutletModal.tsx`

**Interfaces:**
- Consumes: useCart, CartDrawerProps, buildWhatsAppUrl, useScrollLock
- Produces: Floating cart badge, structured 3-zone Cart Drawer (Header, Scrollable Items, Checkout Summary & Form).

- [ ] **Step 1: Redesign `FloatingCartBar.tsx`**
  - Pill melayang di bawah layar dengan warm espresso background, gold badge jumlah pesanan, display harga jelas, dan tombol panah "Lihat Pesanan".

- [ ] **Step 2: Redesign `CartDrawer.tsx` Zone 1 (Header) & Zone 2 (Item List)**
  - Pertahankan struktur scrollbar `cart-items-scroll` (Sprint 2 Item 1.1) dan fade gradient.
  - Kartu item keranjang dengan thumbnail produk, rincian varian/topping rapi, harga promo, dan stepper +/- yang mudah disentuh.

- [ ] **Step 3: Redesign `CartDrawer.tsx` Zone 3 (Summary & Form Checkout)**
  - Form Nama Pemesan: input field bersih dengan label jelas dan feedback validasi ramah.
  - Pilihan Waktu Pickup: radio tab "Sekarang (Segera)" vs "Pilih Slot Jam" dengan waktu estimasi yang mudah dibaca.
  - Rincian Pembayaran (Receipt style): Subtotal promo, Biaya Jastip, Total Biaya, dan badge "Total Hemat Anda: RpXX.XXX".
  - Tombol Checkout WhatsApp: tombol hijau WhatsApp resmi dengan ikon SVG WhatsApp crisp dan teks jelas "Kirim Pesanan via WhatsApp".
  - Disclaimer cara pembayaran manual yang menenangkan dan transparan.

- [ ] **Step 4: Redesign `SwitchOutletModal.tsx`**
  - Modal konfirmasi ganti outlet dengan pesan peringatan hangat dan tombol konfirmasi yang jelas.

- [ ] **Step 5: Verifikasi build & typecheck**
  Run: `npm run lint` dan `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/FloatingCartBar.tsx src/components/CartDrawer.tsx src/components/SwitchOutletModal.tsx
  git commit -m "style: redesign floating cart bar, cart drawer checkout and switch outlet modal"
  ```

---

### Task 7: Full Verification, Worker Build & Deployment

- [ ] **Step 1: Run comprehensive tests & verification**
  Run: `npm test`
  Run: `npm run lint`
  Run: `npx tsc --noEmit`

- [ ] **Step 2: Build Worker bundle**
  Run: `npm run build:worker`

- [ ] **Step 3: Deploy to Cloudflare Workers**
  Run: `npx wrangler deploy`

- [ ] **Step 4: Production verification via curl**
  Fetch production HTML and inspect HTTP status, typography links, and visual elements.
