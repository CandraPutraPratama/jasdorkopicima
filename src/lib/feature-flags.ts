/**
 * Feature Flags - satu titik kontrol untuk semua fitur yang bisa dinyalakan/dimatikan.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OPERATIONAL_GATE_ENABLED
 * ─────────────────────────────────────────────────────────────────────────────
 * Mengontrol gerbang jam operasional Jasdor (08.00–23.20 WIB).
 *
 * Saat MATI (false):
 *   - Polling ke /api/operational-status dilewati
 *   - Halaman "Memeriksa jam operasional" tidak ditampilkan
 *   - Halaman "TUTUP" (ClosedScreen) tidak ditampilkan
 *   - Validasi jam operasional saat checkout (CartDrawer) dilewati
 *   - Situs bisa diakses 24/7 (untuk masa development)
 *   - Badge Buka/Tutup per outlet tetap tampil sebagai INFO (tidak memblokir)
 *
 * Saat NYALA (true):
 *   - Semua perilaku di atas aktif kembali persis seperti semula
 *
 * ── Cara mengaktifkan kembali ────────────────────────────────────────────────
 * Atur env var berikut menjadi "true" DI DUA TEMPAT:
 *
 *   1. File .env.local (untuk dev lokal):
 *        NEXT_PUBLIC_OPERATIONAL_GATE_ENABLED=true
 *
 *   2. Blok "vars" di wrangler.jsonc (untuk production Cloudflare Workers):
 *        "NEXT_PUBLIC_OPERATIONAL_GATE_ENABLED": "true"
 *
 * Setelah mengubah wrangler.jsonc, jalankan: npm run build:worker && npx wrangler deploy
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const OPERATIONAL_GATE_ENABLED =
  process.env.NEXT_PUBLIC_OPERATIONAL_GATE_ENABLED === 'true';

/**
 * MIN_ORDER_50K_MODE (Sebelumnya: BUNDLING_ONLY_MODE)
 * ─────────────────────────────────────────────────────────────────────────────
 * Mode syarat minimal pembelian Rp50.000 (maksimal Rp60.000) untuk menu reguler.
 *
 * Saat NYALA (true):
 *   - Menu reguler TETAP DIBUKA (tidak disembunyikan).
 *   - Subtotal harga normal item reguler dibatasi: minimal Rp50.000 dan maksimal Rp60.000.
 *   - Paket bundling tetap aktif mengikuti aturan per paket 50k-60k.
 *   - Tampilkan info minimal pembelian di halaman menu dan cart.
 *
 * Saat MATI (false):
 *   - Perilaku normal seperti biasa (default).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function isMinOrder50kMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_MIN_ORDER_50K_MODE === 'true' ||
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE === 'true'
  );
}

export const MIN_ORDER_50K_MODE =
  process.env.NEXT_PUBLIC_MIN_ORDER_50K_MODE === 'true' ||
  process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE === 'true';

// Alias backwards-compatible
export const isBundlingOnlyMode = isMinOrder50kMode;
export const BUNDLING_ONLY_MODE = MIN_ORDER_50K_MODE;

