import { BUSINESS_CONFIG } from '../config/business.ts';
import { IMAGE_MANIFEST } from './image-manifest.ts';

export type ImageSource = 'kk' | 'r2';

/** UUID gambar placeholder KK yang dipakai produk tanpa foto (contoh: Sugar Donut, Chocolate Donut). */
const KK_PLACEHOLDER_IMAGE_UUIDS = new Set(['5376bb69-9e4f-6cb5-5bc7-b1503a7a4032']);

/**
 * Ekstraksi UUID dari URL foto produk atau ikon addon Kopi Kenangan.
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
 * Mencari URL mirror di runtime manifest.
 * Menangani variasi query parameter trailing '?' atau whitespace.
 */
export function lookupManifestMirrorUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (IMAGE_MANIFEST[trimmed]) {
    return IMAGE_MANIFEST[trimmed];
  }
  if (trimmed.endsWith('?') && IMAGE_MANIFEST[trimmed.slice(0, -1)]) {
    return IMAGE_MANIFEST[trimmed.slice(0, -1)];
  }
  if (!trimmed.endsWith('?') && IMAGE_MANIFEST[`${trimmed}?`]) {
    return IMAGE_MANIFEST[`${trimmed}?`];
  }
  return null;
}

/**
 * Menulis ulang URL gambar (menu, foto produk opsi, ikon addon, dan ikon attribute)
 * berdasarkan saklar IMAGE_SOURCE dan runtime IMAGE_MANIFEST.
 * - Saat source === 'kk' (default): URL asli dipertahankan tanpa perubahan.
 * - Saat source === 'r2':
 *   - Dicari di IMAGE_MANIFEST: jika ditemukan, mengembalikan URL mirror Cloudflare R2.
 *   - Jika TIDAK ditemukan di manifest: WAJIB dibiarkan apa adanya (URL KK).
 *     Dilarang menebak / menyusun URL R2 di luar manifest agar tidak pernah menunjuk ke objek yang belum termirror.
 */
export function rewriteProductImageUrl(url?: string | null, sourceOverride?: ImageSource): string {
  const rawUrl = (url || '').trim();
  if (!rawUrl) return '';

  // Gambar placeholder bawaan KK (hati merah bergaris) bukan foto produk: kembalikan kosong
  // agar UI memakai gambar fallback sendiri.
  const uuid = extractProductImageUuid(rawUrl);
  if (uuid && KK_PLACEHOLDER_IMAGE_UUIDS.has(uuid)) return '';

  const activeSource: ImageSource = sourceOverride || BUSINESS_CONFIG.imageSource;
  if (activeSource !== 'r2') {
    return rawUrl;
  }

  const mirrorUrl = lookupManifestMirrorUrl(rawUrl);
  if (mirrorUrl) {
    return mirrorUrl;
  }

  // URL yang tidak ada di manifest WAJIB dibiarkan apa adanya (fallback ke URL KK)
  return rawUrl;
}

