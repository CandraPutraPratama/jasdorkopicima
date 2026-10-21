import { NextRequest, NextResponse } from 'next/server.js';
import {
  confirmOrderPayment,
  getOrderById,
  verifyOrderAccessToken,
  OrderNotFoundError,
  OrderStateError,
} from '../../../../../lib/order-service.ts';
import { checkRateLimitKV, getClientIp } from '../../../../../lib/rate-limit-kv.ts';
import type { OrderRecord } from '../../../../../types/order.ts';

/**
 * Pesanan hanya boleh dikonfirmasi oleh pemiliknya. Token akses dikirim
 * sebagai query param `t` dan TIDAK pernah dikembalikan di response body.
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

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitKV(`order-confirm:${clientIp}`, {
    maxRequests: 20,
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
    // Verifikasi kepemilikan sebelum status apa pun diubah.
    const existingOrder = await getOrderById(id);
    if (!verifyOrderAccessToken(existingOrder, providedToken)) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const updatedOrder = await confirmOrderPayment(id);
    return NextResponse.json({ success: true, order: toPublicOrder(updatedOrder) });
  } catch (err: any) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }
    if (err instanceof OrderStateError) {
      return NextResponse.json(
        { error: err.message, currentStatus: err.details },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Gagal mengonfirmasi pembayaran pesanan' },
      { status: 500 }
    );
  }
}
