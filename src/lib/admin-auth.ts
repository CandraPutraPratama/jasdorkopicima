import type { NextRequest } from 'next/server';
import { getEnvVar } from './env.ts';
import { ADMIN_CONFIG } from './site-config.ts';

export function getExpectedAdminPassword(): string {
  return getEnvVar('ADMIN_PASSWORD') || '';
}

/**
 * Memeriksa apakah request memiliki sesi admin yang valid
 * melalui cookie atau header x-admin-password / Authorization.
 */
export function verifyAdminAuth(request: Request | NextRequest): boolean {
  const expectedPassword = getExpectedAdminPassword();
  if (!expectedPassword) {
    return false;
  }

  // 1. Cek Header x-admin-password
  const headerPassword = request.headers.get('x-admin-password');
  if (headerPassword && headerPassword === expectedPassword) {
    return true;
  }

  // 2. Cek Header Authorization: Bearer <password>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer === expectedPassword) {
      return true;
    }
  }

  // 3. Cek Cookie session (mendukung NextRequest.cookies maupun standard Request.headers)
  let cookieValue = (request as any).cookies?.get?.(ADMIN_CONFIG.cookieName)?.value;
  if (!cookieValue) {
    const rawCookie = request.headers.get('cookie') || '';
    const match = rawCookie.match(new RegExp(`(?:^|; )${ADMIN_CONFIG.cookieName}=([^;]*)`));
    cookieValue = match ? decodeURIComponent(match[1]) : undefined;
  }

  if (cookieValue) {
    // Cookie menyimpan token sesi yang valid jika cocok dengan password
    if (cookieValue === expectedPassword) {
      return true;
    }
  }

  return false;
}
