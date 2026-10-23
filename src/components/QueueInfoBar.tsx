'use client';

import { useQueueStatus } from '@/hooks/useQueueStatus';

/**
 * Bar info antrean pemrosesan di halaman outlet.
 * Hanya tampil bila data antrean berhasil dimuat (tidak mengarang angka).
 */
export function QueueInfoBar() {
  const { queue } = useQueueStatus(true);

  if (!queue) return null;

  return (
    <div className="flex items-center gap-2.5 p-3.5 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl shadow-[3px_3px_0px_#2B1D12] text-xs text-[#2B1D12]">
      <span className="text-base shrink-0">⏳</span>
      <p className="font-bold leading-snug">
        Antrean saat ini: {queue.activeOrders} order ({queue.totalItems} item) sedang
        diproses. Order baru estimasi siap ±{queue.estimateMinutes} menit. Pesanan
        diproses satu per satu sesuai urutan masuk.
      </p>
    </div>
  );
}
