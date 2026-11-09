import { NextRequest, NextResponse } from 'next/server.js';
import { createGroupOrderSession, GroupOrderError } from '../../../../lib/group-order-service.ts';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit.ts';
import { validateCustomerName, validateCustomerPhone } from '../../../../lib/sanitizer.ts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  // Rate limit pembuatan group order in-memory: maks 15 request per menit
  const rateLimit = checkRateLimit(`group-create:${clientIp}`, {
    maxRequests: 15,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan pembuatan pesanan bareng. Tunggu sebentar.' },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const valName = validateCustomerName(body?.hostName || '');
  if (!valName.isValid) {
    return NextResponse.json({ error: valName.errorMessage || 'Nama pembuat (Host) tidak valid.' }, { status: 400 });
  }
  const hostName = valName.sanitized;

  const outletCode = String(body?.outletCode || '').trim();
  if (!outletCode) {
    return NextResponse.json({ error: 'Outlet tidak valid.' }, { status: 400 });
  }

  const outletName = String(body?.outletName || 'Outlet Pilihan').trim();
  const brandSlug = String(body?.brandSlug || 'kopi-kenangan').trim();
  let hostWa = '';
  if (body?.hostWa) {
    const valPhone = validateCustomerPhone(body.hostWa);
    if (valPhone.isValid) {
      hostWa = valPhone.sanitized;
    }
  }

  try {
    const session = await createGroupOrderSession({
      brandSlug,
      outletCode,
      outletName,
      hostName,
      hostWa,
    });

    const hostHeader = request.headers.get('host') || 'jasdor.cimagroup.my.id';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const joinUrl = `${proto}://${hostHeader}/group/${session.id}`;

    return NextResponse.json({
      success: true,
      group: session,
      joinUrl,
    });
  } catch (err: any) {
    const status = err instanceof GroupOrderError ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || 'Gagal membuat sesi pesanan bareng' },
      { status }
    );
  }
}
