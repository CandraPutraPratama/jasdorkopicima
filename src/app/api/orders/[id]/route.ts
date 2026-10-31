import { NextRequest, NextResponse } from 'next/server.js';
import { getOrderById, OrderNotFoundError, verifyOrderAccessToken } from '../../../../lib/order-service.ts';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit.ts';
import { verifyAdminAuth } from '../../../../lib/admin-auth.ts';
import type { OrderRecord } from '../../../../types/order.ts';

/**
 * Pesanan hanya boleh dibaca oleh pemiliknya (via query param `t`) atau admin
 * dengan sesi aktif. Token akses TIDAK pernah dikembalikan di response body.
 */
function toPublicOrder(order: OrderRecord): Omit<OrderRecord, 'access_token'> {
  const { access_token: _accessToken, ...publicOrder } = order;
  void _accessToken;
  return publicOrder;
}

/** Membaca token akses dari query param `t` (kompatibel NextRequest & Request). */
function readAccessToken(request: NextRequest): string | null {
  const fromNextUrl = request.nextUrl?.searchParams?.get('t');
  if (typeof fromNextUrl === 'string' && fromNextUrl.length > 0) {
    return fromNextUrl;
  }
  try {
    return new URL(request.url).searchParams.get('t');
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const { id } = await segmentData.params;
  if (!id) {
    return NextResponse.json({ error: 'ID pesanan wajib disertakan' }, { status: 400 });
  }

  // 1. Cek otorisasi admin: Admin resmi dibebaskan dari rate-limiting agar operasional tidak terblokir
  const isAdmin = await verifyAdminAuth(request);

  if (!isAdmin) {
    const clientIp = getClientIp(request.headers);
    // Batas 180 req/menit per IP untuk mengakomodasi polling antrean, multi-tab,
    // dan jaringan WiFi bersama (shared NAT di kantor / kampus / outlet).
    const rateLimit = checkRateLimit(`order-get:${clientIp}`, {
      maxRequests: 180,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' },
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
  }

  const providedToken = readAccessToken(request);

  try {
    const order = await getOrderById(id);

    // Dua jalur akses yang sah:
    // 1. Token akses pesanan yang valid
    // 2. Sesi admin yang valid (cookie token HMAC)
    // Jawaban seragam 404 jika keduanya tidak terpenuhi (anti-enumerasi).
    const isTokenValid = verifyOrderAccessToken(order, providedToken);

    if (!isTokenValid && !isAdmin) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: toPublicOrder(order) });
  } catch (err: any) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data pesanan' },
      { status: 500 }
    );
  }
}
