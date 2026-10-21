import { NextRequest, NextResponse } from 'next/server.js';
import { getOrderById, OrderNotFoundError, verifyOrderAccessToken } from '../../../../lib/order-service.ts';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit.ts';
import type { OrderRecord } from '../../../../types/order.ts';

/**
 * Pesanan hanya boleh dibaca oleh pemiliknya. Token akses dikirim sebagai
 * query param `t` dan TIDAK pernah dikembalikan di dalam response body.
 */
function toPublicOrder(order: OrderRecord): Omit<OrderRecord, 'access_token'> {
  const { access_token: _accessToken, ...publicOrder } = order;
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
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`order-get:${clientIp}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' },
      { status: 429 }
    );
  }

  const { id } = await segmentData.params;
  if (!id) {
    return NextResponse.json({ error: 'ID pesanan wajib disertakan' }, { status: 400 });
  }

  const providedToken = readAccessToken(request);

  try {
    const order = await getOrderById(id);

    // Jawaban seragam 404 agar penyerang tidak bisa membedakan
    // "ID tidak ada" dari "token salah" (anti-enumerasi).
    if (!verifyOrderAccessToken(order, providedToken)) {
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
