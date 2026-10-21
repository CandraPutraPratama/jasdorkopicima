import { NextRequest } from 'next/server.js';
import { verifyAdminAuth } from '../../../../lib/admin-auth.ts';
import { listOrdersForAdmin } from '../../../../lib/order-service.ts';
import { adminJson } from '../../../../lib/admin-response.ts';

export async function GET(request: NextRequest) {
  if (!(await verifyAdminAuth(request))) {
    return adminJson({ error: 'Akses ditolak: otorisasi admin diperlukan' }, { status: 401 });
  }

  try {
    const orders = await listOrdersForAdmin(100);
    return adminJson({ success: true, orders });
  } catch (err: any) {
    console.error('[AdminOrders] Gagal mengambil daftar order:', err);
    return adminJson(
      { error: err.message || 'Gagal mengambil daftar pesanan' },
      { status: 500 }
    );
  }
}
