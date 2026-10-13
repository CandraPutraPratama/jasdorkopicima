import { BUSINESS_CONFIG } from '../config/business.ts';

export type ImageSource = 'kk' | 'r2';

/**
 * Ekstraksi UUID dari URL foto produk Kopi Kenangan.
 * Menangani 2 pola path yang sah:
 * 1. /ID/release/pub/kk-api-management/product/<uuid>
 * 2. /public/<uuid>
 * Mengembalikan UUID huruf kecil atau null jika tidak cocok / tidak sah.
 */
export function extractProductImageUuid(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/(?:product|public)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Menulis ulang URL foto produk berdasarkan saklar IMAGE_SOURCE.
 * - Saat source === 'kk' (default): URL asli dipertahankan tanpa perubahan.
 * - Saat source === 'r2':
 *   - Jika UUID bisa diekstrak: mengembalikan https://gambar.cimagroup.my.id/product/<uuid>.jpg
 *   - Jika UUID TIDAK bisa diekstrak: PERTAHANKAN URL asal (fallback aman, tidak ada gambar rusak).
 */
export function rewriteProductImageUrl(url?: string | null, sourceOverride?: ImageSource): string {
  const rawUrl = (url || '').trim();
  if (!rawUrl) return '';

  const activeSource: ImageSource = sourceOverride || BUSINESS_CONFIG.imageSource;
  if (activeSource !== 'r2') {
    return rawUrl;
  }

  const uuid = extractProductImageUuid(rawUrl);
  if (!uuid) {
    // Fallback URL asal bila UUID tidak dikenali
    return rawUrl;
  }

  return `${BUSINESS_CONFIG.r2ImageBaseUrl}/${uuid}.jpg`;
}
