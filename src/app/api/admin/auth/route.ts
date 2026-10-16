import { NextRequest, NextResponse } from 'next/server';
import { getExpectedAdminPassword } from '@/lib/admin-auth';
import { ADMIN_CONFIG } from '@/lib/site-config';

export async function POST(request: NextRequest) {
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
