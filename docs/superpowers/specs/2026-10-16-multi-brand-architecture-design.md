# Arsitektur Multi-Brand Jasdor (Portal Cima Group + Halaman Per-Brand) - Design Spec

**Date:** 2026-10-16  
**Status:** Approved by User  
**Scope:** Portal Root (`/`), Brand Pages (`/[brandSlug]`), Provider Outlet Abstraction, Outlet Routing Compatibility (`/outlet/[code]`).

---

## 1. Intent & The Why
Jasdor berkembang dari layanan pemesanan satu brand (Kopi Kenangan) menjadi portal grup kuliner (*"mal jajan hemat"*) di bawah Cima Group. Pengguna perlu segera melihat dan memahami dalam 3 detik pertama bahwa mereka memiliki banyak pilihan brand kuliner dengan promo hemat hingga 50%, tanpa membaca paragraf panjang.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. Mengubah root (`/`) menjadi Portal Cima Group berbasis Varian C ("Food Court + Trust Strip"):
   - Header ramping (Cima Group + Chat Admin WhatsApp).
   - Hero kompak: judul *"Jajan Favorit, Setengah Harga"* + subcopy padat 1 baris.
   - Trust strip ringkas *above the fold*: Pembayaran (QRIS, Jago/Blu, E-Wallet) + Status Admin Fast Respon.
   - Grid 2 kolom kartu brand (Kopi Kenangan aktif dengan visual banner & promo Hemat 50%; Tomoro Coffee sebagai pilot *"Segera Hadir"* grayscale tanpa teks "0 outlet").
   - Strip 3 langkah kompak di bawah grid: ① Brand → ② Outlet → ③ WhatsApp.
   - Section testimoni dengan 3 placeholder bertanda TODO JELAS untuk diganti testimoni asli di kemudian hari.
2. Memindahkan katalog & pengalaman Kopi Kenangan ke `/[brandSlug]` (mis. `/kopi-kenangan`).
3. Menambahkan pilot brand Tomoro Coffee di `/tomoro` (halaman "Segera Hadir" elegan tanpa data outlet palsu).
4. Menjaga URL `/outlet/[code]` (mis. `/outlet/LIPPO-PURI`) tetap bekerja penuh tanpa breaking change, dengan tombol back / "Pilih Outlet Lain" secara cerdas mengarah kembali ke halaman brand yang sesuai (`/kopi-kenangan`), bukan terlempar ke portal root.
5. Membangun abstraksi `BrandOutletProvider` (`listOutlets()`, `getOutlet(code)`, `searchOutlets(q)`).

### Non-Goals
- Tidak mengubah logika internal harga/fee (Rp2.000/item, Rp4.000 untuk 1 item), cart reducer, sanitize inputs, atau WhatsApp message generator.
- Tidak mengubah halaman info global (`/faq`, `/syarat-ketentuan`, `/kebijakan-privasi`, `/kontak`).
- Tidak membuat mock/dummy outlet palsu untuk Tomoro Coffee.

### Anti-Goals
- Menghindari penggunaan istilah "jastip" / "jasa titip" (selalu "jasa order").
- Menghindari perusakan single source of truth `isOutletClosed` hasil Batch 3.
- Menghindari hilangnya proteksi outlet tutup (banner kuning, disabled '+' button, bottom sheet disabled, validate-cart blocking).

---

## 3. Constraints
- **Design Tokens**: Palet Warm Coffee (`#FBF8F4`, `#26150B`, `#F2EBE1`, `#C67D0A`), Merah Promo (`#DC2626`/`#E11D48`) HANYA untuk harga promo dan badge diskon, Font Outfit (display) + Plus Jakarta Sans (body), WhatsApp Green (`#15803D`/`#25D366`).
- **Feature Flags**: Logika `OPERATIONAL_GATE_ENABLED` di `src/lib/feature-flags.ts` dan `src/hooks/useOperationalStatus.ts` tidak boleh diubah/dihapus.
- **Reserved Slugs**: `faq`, `syarat-ketentuan`, `kebijakan-privasi`, `kontak`, `outlet`, `api` tidak boleh digunakan sebagai brand slug.

---

## 4. Architecture & Decisions Decided

### A. Konfigurasi Brand Terpusat (`src/lib/site-config.ts`)
```ts
export interface BrandConfig {
  slug: string;
  name: string;
  tagline: string;
  promoBadge: string;
  description: string;
  accentColor: string;
  themeColor: string;
  bannerGradient: string;
  status: 'active' | 'coming_soon';
  outletCountLabel?: string;
  adminWhatsApp?: string;
  operatingHoursText?: string;
  feeConfig?: {
    singleItemFee: number;
    multiItemFee: number;
  };
}
```
Brands terdaftar:
- `kopi-kenangan`: active, "Kopi Kenangan", "Hemat 50%", "12 outlet", `#8B1E19`.
- `tomoro`: coming_soon, "Tomoro Coffee", "Segera Hadir", `#E11D48`.

Helper functions:
- `getBrandConfig(slug: string): BrandConfig | null`
- `resolveBrandSlugFromOutletCode(code: string): string` (default: `'kopi-kenangan'`)
- `isReservedSlug(slug: string): boolean`

### B. Routing Structure
- `src/app/page.tsx`: Portal Cima Group (Varian C)
- `src/app/[brandSlug]/page.tsx`: Halaman Brand dinamis
  - Jika `brand.status === 'coming_soon'`: Render tampilan "Segera Hadir" elegan dengan tombol kembali ke portal Cima Group dan tombol Chat Admin.
  - Jika `brand.status === 'active'`: Render pengalaman penuh brand (hero ramping, search outlet, quick chips, daftar outlet pilihan, proteksi jam operasional).
- `src/app/outlet/[code]/page.tsx`:
  - Mengambil brand yang sesuai via `resolveBrandSlugFromOutletCode(outletCode)`.
  - Tombol kembali dan "Pilih Outlet Lain" mengarah ke `/${brandSlug}`.

### C. Provider Outlet Per-Brand (`src/lib/brand-provider.ts`)
- Interface `BrandOutletProvider`:
  - `listFeaturedOutlets(): Promise<Outlet[]>`
  - `searchOutlets(query: string): Promise<Outlet[]>`
  - `getOutlet(code: string): Promise<Outlet | null>`
- `KopiKenanganOutletProvider`: menggunakan implementasi aktif KK API + adapter normalizer.
- `TomoroOutletProvider`: stub provider yang mengembalikan array kosong dengan komentar TODO jelas untuk integrasi data source di masa depan.
- Registry: `getBrandOutletProvider(brandSlug: string): BrandOutletProvider`.

---

## 5. Verification Plan
1. Unit tests:
   - Tes routing brand dan helper config (`getBrandConfig`, `isReservedSlug`, `resolveBrandSlugFromOutletCode`).
   - Tes fallback dan stub provider.
2. Type check: `npx tsc --noEmit` bersih (0 error).
3. Linter: `npm run lint` bersih (0 error).
4. Test suite: `npm test` seluruh tes lulus.
5. Deploy ke Cloudflare via `npm run deploy`.
6. Live browser testing:
   - Root `/` menampilkan portal Cima Group dengan Varian C (trust strip "Jago/Blu", Tomoro Coffee "Segera Hadir" tanpa "0 outlet").
   - `/kopi-kenangan` menampilkan pengalaman pemesanan penuh Kopi Kenangan.
   - `/tomoro` menampilkan halaman segera hadir yang rapi.
   - `/outlet/LIPPO-PURI` tetap bekerja dan tombol back kembali ke `/kopi-kenangan`.
