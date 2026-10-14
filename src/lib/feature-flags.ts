/**
 * Feature Flags — satu titik kontrol untuk semua fitur yang bisa dinyalakan/dimatikan.
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
