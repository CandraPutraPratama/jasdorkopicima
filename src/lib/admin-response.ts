import { NextResponse } from 'next/server.js';

/**
 * Header untuk semua respons yang berkaitan dengan admin.
 *
 * Respons admin tidak boleh disimpan di cache mana pun (browser, CDN edge
 * Cloudflare, atau proxy perantara). Tanpa ini, halaman panel admin bisa
 * di-cache di edge dan disajikan ke pengunjung lain, dan respons login bisa
 * membawa sesi yang salah.
 */
export const ADMIN_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  // Header lama untuk proxy yang belum memahami Cache-Control modern.
  Pragma: 'no-cache',
  Expires: '0',
  // Cache harus memisahkan respons per nilai header ini (cookie sesi).
  Vary: 'Cookie',
} as const;

/**
 * Menambahkan header anti-cache ke respons yang sudah ada.
 * Dipakai agar setiap jalur keluar (sukses maupun gagal) tetap no-store.
 */
export function withAdminNoStore<T extends NextResponse>(response: T): T {
  for (const [key, value] of Object.entries(ADMIN_NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Membuat respons JSON admin dengan header anti-cache terpasang.
 * Gunakan ini alih-alih `NextResponse.json` langsung pada route admin.
 */
export function adminJson(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const response = NextResponse.json(body, {
    status: init?.status,
    headers: { ...(init?.headers ?? {}), ...ADMIN_NO_STORE_HEADERS },
  });
  return response;
}
