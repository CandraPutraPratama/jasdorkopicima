import { formatRupiah } from './currency.ts';

export interface OrderSummarySnapshot {
  customerName: string;
  totalQuantity: number;
  total: number;
  outletName: string;
}

/**
 * Membuat snapshot ringkasan pesanan sebelum keranjang dikosongkan.
 * Digunakan agar layar sukses checkout menampilkan jumlah item dan total belanja asli,
 * bukan 0 item / Rp0 akibat state keranjang yang telah di-clear.
 */
export function createOrderSummarySnapshot(params: {
  customerName?: string;
  pricing?: { totalQuantity: number; total: number } | null;
  outletName?: string;
}): OrderSummarySnapshot {
  return {
    customerName: (params.customerName || '').trim(),
    totalQuantity: params.pricing?.totalQuantity ?? 0,
    total: params.pricing?.total ?? 0,
    outletName: (params.outletName || '').trim() || 'Kopi Kenangan',
  };
}

/**
 * Format string ringkasan untuk "Detail Ringkas" di layar sukses:
 * Contoh: "3 item • Rp63.500"
 */
export function formatOrderSummaryDetail(snapshot: {
  totalQuantity: number;
  total: number;
}): string {
  return `${snapshot.totalQuantity} item • ${formatRupiah(snapshot.total)}`;
}
