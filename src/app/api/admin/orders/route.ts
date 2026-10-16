import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { listOrdersForAdmin } from '@/lib/order-service';

export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Akses ditolak: otorisasi admin diperlukan' }, { status: 401 });
  }

  try {
    const orders = await listOrdersForAdmin(100);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('[AdminOrders] Gagal mengambil daftar order:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil daftar pesanan' },
      { status: 500 }
    );
  }
}
