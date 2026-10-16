import { NextRequest, NextResponse } from 'next/server';
import {
  confirmOrderPayment,
  OrderNotFoundError,
  OrderStateError,
} from '@/lib/order-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`order-confirm:${clientIp}`, {
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

  try {
    const updatedOrder = await confirmOrderPayment(id);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
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
