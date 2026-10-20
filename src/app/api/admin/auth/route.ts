import { NextRequest, NextResponse } from 'next/server';
import { getExpectedAdminPassword } from '@/lib/admin-auth';
import { ADMIN_CONFIG } from '@/lib/site-config';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`admin-auth:${clientIp}`, {
    maxRequests: 5,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
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
    return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const { password } = body;
  const expectedPassword = getExpectedAdminPassword();

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: 'Password admin salah' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: 'Autentikasi berhasil' });

  // Simpan cookie sesi httpOnly
  response.cookies.set({
    name: ADMIN_CONFIG.cookieName,
    value: expectedPassword,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  response.cookies.delete(ADMIN_CONFIG.cookieName);
  return response;
}
