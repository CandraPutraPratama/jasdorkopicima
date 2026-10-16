<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Workflow & Standar Kerja Jasdor (Wajib Dipatuhi)

Gunakan skill ECC yang terinstall di `.agents/skills`:

1. **Sebelum ngoding:**
   - Baca skill `intent-driven-development`.
   - Jabarkan tugas menjadi Acceptance Criteria yang terukur (checklist).
2. **Selama ngoding:**
   - Ikuti `tdd-workflow` (red → green → refactor; kode baru wajib ada test unit/integrasi).
   - Terapkan pola `error-handling` untuk TypeScript (typed errors, safe fallbacks, error boundary).
3. **Setelah ngoding:**
   - Jalankan `verification-loop` PENUH: build, typecheck (`tsc --noEmit`), lint (`npm run lint`), test (`npm test`), security audit, diff review.
   - Tugas **BELUM selesai** sampai seluruh checks lolos.
4. **Setelah deploy:**
   - Jalankan `browser-qa`: cek console errors, tes interaksi yang diubah, dan verifikasi visual pada 3 breakpoint (390px / 768px / 1440px).

## Batasan Kritis (Strict Invariants)

- **JANGAN ubah**:
  - `operational-gate` flag logic (`src/lib/operational.ts`, `useOperationalStatus`, dll.).
  - `checkout flow` & format WhatsApp (`src/lib/whatsapp.ts`).
  - `pricing / fee` calculation (`src/lib/pricing.ts`, margin guard, flat additions).
  - `cart code` & drawer state (`src/lib/cart-context.tsx`, `CartDrawer.tsx`).
- **Terminologi Bisnis**: Copy wajib menggunakan istilah **"jasa order"**, **DILARANG** menggunakan "jastip".
- **Integritas Pelaporan**: Laporkan tiap tahap dengan jujur dan transparan: apa yang lolos, apa yang gagal, dan apa yang belum sempat diverifikasi. Jangan menyatakan "semua beres" jika ada tahap yang di-skip atau belum diverifikasi.
