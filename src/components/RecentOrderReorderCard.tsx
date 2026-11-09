'use client';

import { useRouter } from 'next/navigation';
import { useMyOrders } from '@/lib/use-my-orders';
import { formatRupiah } from '@/lib/currency';
import { executeReorder, getReorderItemSummary } from '@/lib/reorder';

export function RecentOrderReorderCard() {
  const router = useRouter();
  const { historyOrders, orders } = useMyOrders();

  // Ambil pesanan masa lalu terbaru (diutamakan yang selesai)
  const lastOrder =
    historyOrders[0] ||
    (orders.length > 0 && orders[0].status === 'selesai' ? orders[0] : null);

  if (!lastOrder || !lastOrder.items || lastOrder.items.length === 0) {
    return null;
  }

  const itemSummary = getReorderItemSummary(lastOrder.items);
  const outletLabel = lastOrder.outlet_name || 'Outlet Sebelumnya';

  return (
    <div
      role="region"
      aria-label="Pesan Lagi Pesanan Terakhir"
      className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[3px_3px_0px_#2B1D12] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">☕</span>
          <span className="font-display font-black text-[11px] uppercase tracking-wider text-[#C67D0A]">
            Pesan Lagi Favoritmu
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#7A6658] truncate max-w-[170px]">
          {outletLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#2B1D12]/15">
        <div className="min-w-0 flex-1">
          <p className="font-display font-black text-xs text-[#2B1D12] truncate">
            {itemSummary}
          </p>
          <p className="text-[10px] text-[#7A6658] font-bold mt-0.5">
            {formatRupiah(lastOrder.total)} • {lastOrder.items.length} menu
          </p>
        </div>

        <button
          type="button"
          onClick={() => executeReorder(lastOrder, router)}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] hover:bg-[#3D2A1C] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Pesan Lagi</span>
        </button>
      </div>
    </div>
  );
}

