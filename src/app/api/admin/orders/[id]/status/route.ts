import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { updateOrderStatusByAdmin, OrderValidationError } from '@/lib/order-service';
import type { OrderStatus } from '@/types/order';

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Akses ditolak: otorisasi admin diperlukan' }, { status: 401 });
  }

  const { id } = await segmentData.params;
  if (!id) {
    return NextResponse.json({ error: 'ID pesanan wajib disertakan' }, { status: 400 });
  }

  let body: { status?: OrderStatus; cancellationReason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const { status, cancellationReason } = body;
  if (!status) {
    return NextResponse.json({ error: 'Parameter status wajib disertakan' }, { status: 400 });
  }

  try {
    const updatedOrder = await updateOrderStatusByAdmin(id, status, cancellationReason);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || 'Gagal mengubah status pesanan' },
      { status: 500 }
    );
  }
}
