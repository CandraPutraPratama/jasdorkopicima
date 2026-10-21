import type { NextRequest } from 'next/server';
import { getEnvVar } from './env.ts';
import { ADMIN_CONFIG } from './site-config.ts';
import { validateAdminSession } from './admin-session.ts';

export function getExpectedAdminPassword(): string {
  return getEnvVar('ADMIN_PASSWORD') || '';
}

/**
 * Membaca token sesi admin dari cookie permintaan.
 * Mendukung NextRequest.cookies maupun header `cookie` standar.
 */
export function readAdminSessionToken(request: Request | NextRequest): string | null {
  const fromNextCookies = (request as { cookies?: { get?: (name: string) => { value?: string } } })
    .cookies?.get?.(ADMIN_CONFIG.cookieName)?.value;
  if (typeof fromNextCookies === 'string' && fromNextCookies.length > 0) {
    return fromNextCookies;
  }

  const rawCookie = request.headers.get('cookie') || '';
  const match = rawCookie.match(
    new RegExp(`(?:^|; )${ADMIN_CONFIG.cookieName}=([^;]*)`)
  );
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Memeriksa apakah request memiliki SESI admin yang valid.
 *
 * Token sesi bersifat stateless dan ditandatangani HMAC, sehingga validasinya
 * konsisten di semua isolate Workers tanpa perlu berbagi state.
 *
 * Password admin sendiri tidak pernah disimpan di cookie, dan header lama
 * (`x-admin-password` / `Authorization: Bearer <password>`) sengaja tidak lagi
 * diterima karena keduanya memaksa kredensial jangka panjang ikut terkirim
 * di setiap permintaan.
 */
export async function verifyAdminAuth(
  request: Request | NextRequest
): Promise<boolean> {
  const token = readAdminSessionToken(request);
  return validateAdminSession(token);
}
