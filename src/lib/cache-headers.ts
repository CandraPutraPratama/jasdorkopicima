import type { NextResponse } from 'next/server.js';

/**
 * Kebijakan Cache-Control untuk API outlet yang bersifat publik dan mahal.
 *
 * Tujuan: Cloudflare edge menyerap request berulang sehingga invocation Worker
 * dan panggilan ke API Kopi Kenangan berkurang. Kuota gratis Worker terbatas,
 * jadi ini penghematan yang nyata.
 *
 * Nilai s-maxage mengikuti TTL cache server yang sudah ada di
 * `src/config/business.ts`, bukan angka baru:
 * - menu       15 menit  -> 900 detik
 * - detail      1,5 menit -> 90 detik (storeOpenStatusTtlSeconds)
 * - options     1 jam    -> 3600 detik
 * - pencarian   6 jam TTL server, tetapi responsnya bergantung pada query
 *   (?q=, ?page=, ?brand=), jadi s-maxage sengaja pendek (90 detik) agar tidak
 *   ada kombinasi query lama yang tersaji terlalu lama.
 *
 * `stale-while-revalidate` membuat edge menyajikan versi lama sambil
 * memperbarui di latar belakang, sehingga pengguna tidak menunggu.
 */
export const CACHE_POLICY = {
  menu: 'public, s-maxage=900, stale-while-revalidate=3600',
  search: 'public, s-maxage=90, stale-while-revalidate=300',
  outlet: 'public, s-maxage=90, stale-while-revalidate=300',
  options: 'public, s-maxage=3600, stale-while-revalidate=3600',
  noStore: 'no-store',
} as const;

export type CachePolicy = (typeof CACHE_POLICY)[keyof typeof CACHE_POLICY];

/**
 * Menerapkan kebijakan cache ke respons berdasarkan status code.
 *
 * Aturan keras: header cache publik HANYA untuk status 200. Semua status lain
 * (400, 404, 429, 500, 503, dst) dipaksa `no-store`, termasuk bila respons
 * sudah membawa Cache-Control publik dari tempat lain. Ini mencegah edge
 * menyimpan respons error dan mencegah error ikut tersaji ke pengguna lain.
 *
 * Header lain (Retry-After, X-Cache-Status, X-RateLimit-*) tidak disentuh.
 */
export function applyCachePolicy<T extends NextResponse>(
  response: T,
  policy: CachePolicy
): T {
  const cacheable = policy !== CACHE_POLICY.noStore && response.status === 200;

  response.headers.set('Cache-Control', cacheable ? policy : 'no-store');

  if (cacheable) {
    // Edge dan browser harus memisahkan cache per encoding, jika tidak
    // respons terkompresi bisa tersaji ke klien yang tidak mendukung.
    const existingVary = response.headers.get('Vary');
    if (!existingVary) {
      response.headers.set('Vary', 'Accept-Encoding');
    } else if (!/accept-encoding/i.test(existingVary)) {
      response.headers.set('Vary', `${existingVary}, Accept-Encoding`);
    }
  }

  return response;
}
