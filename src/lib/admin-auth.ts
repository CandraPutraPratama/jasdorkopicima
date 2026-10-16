import { NextRequest } from 'next/server';
import { getEnvVar } from './env.ts';
import { ADMIN_CONFIG } from './site-config.ts';

export function getExpectedAdminPassword(): string {
  return getEnvVar('ADMIN_PASSWORD') || 'adminjasdor2026';
}

/**
 * Memeriksa apakah request memiliki sesi admin yang valid
 * melalui cookie atau header x-admin-password / Authorization.
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const expectedPassword = getExpectedAdminPassword();

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

  // 3. Cek Cookie session
  const cookieValue = request.cookies.get(ADMIN_CONFIG.cookieName)?.value;
  if (cookieValue) {
    // Cookie menyimpan token sesi yang valid jika cocok dengan password
    if (cookieValue === expectedPassword) {
      return true;
    }
  }

  return false;
}
