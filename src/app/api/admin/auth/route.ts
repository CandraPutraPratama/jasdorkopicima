import { NextRequest } from 'next/server.js';
import { getExpectedAdminPassword, readAdminSessionToken } from '../../../../lib/admin-auth.ts';
import {
  createAdminSession,
  invalidateAdminSession,
  ADMIN_SESSION_TTL_MS,
} from '../../../../lib/admin-session.ts';
import { ADMIN_CONFIG } from '../../../../lib/site-config.ts';
import { checkRateLimitKV, getClientIp } from '../../../../lib/rate-limit-kv.ts';
import { adminJson } from '../../../../lib/admin-response.ts';

/** Perbandingan string constant-time agar pengecekan password tidak bocor lewat timing. */
function timingSafeEqualString(expected: string, provided: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const providedBytes = new TextEncoder().encode(provided);
  const maxLength = Math.max(expectedBytes.length, providedBytes.length);
  let diff = expectedBytes.length ^ providedBytes.length;

  for (let i = 0; i < maxLength; i++) {
    diff |= (expectedBytes[i] ?? 0) ^ (providedBytes[i] ?? 0);
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitKV(`admin-auth:${clientIp}`, {
    maxRequests: 5,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return adminJson(
      { error: 'Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const { password } = body;
  const expectedPassword = getExpectedAdminPassword();

  if (
    !password ||
    !expectedPassword ||
    !timingSafeEqualString(expectedPassword, password)
  ) {
    return adminJson({ error: 'Password admin salah' }, { status: 401 });
  }

  // Buat sesi baru dengan token acak bertanda tangan. Password TIDAK ikut
  // disimpan di cookie.
  const session = await createAdminSession();

  const response = adminJson({ success: true, message: 'Autentikasi berhasil' });

  response.cookies.set({
    name: ADMIN_CONFIG.cookieName,
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  // Cabut sesi di server agar token lama tidak bisa dipakai ulang.
  await invalidateAdminSession(readAdminSessionToken(request));

  const response = adminJson({ success: true, message: 'Logout berhasil' });
  response.cookies.delete(ADMIN_CONFIG.cookieName);
  return response;
}
