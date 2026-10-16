import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, OrderNotFoundError } from '@/lib/order-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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

  try {
    const order = await getOrderById(id);
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data pesanan' },
      { status: 500 }
    );
  }
}
