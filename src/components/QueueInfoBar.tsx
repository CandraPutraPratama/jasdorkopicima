'use client';

import { useQueueStatus } from '@/hooks/useQueueStatus';
import { getQueueLoadInfo } from '@/lib/queue';

interface QueueInfoBarProps {
  className?: string;
  variant?: 'banner' | 'compact';
}

/**
 * Bar info status antrean & beban toko real-time.
 * Menampilkan live update antrean dan estimasi proses admin
 * secara transparan agar pelanggan tahu ekspektasi waktu tunggu.
 */
export function QueueInfoBar({ className = '', variant = 'banner' }: QueueInfoBarProps) {
  const { queue } = useQueueStatus(true);

  if (!queue) return null;

  const loadInfo = getQueueLoadInfo(queue.activeOrders);

  if (variant === 'compact') {
    return (
      <div
        aria-label="Status Antrean Pemrosesan"
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 border-[#2B1D12] text-[11px] font-bold shadow-[2px_2px_0px_#2B1D12] ${loadInfo.badgeBg} ${loadInfo.badgeText} ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${loadInfo.dotColor}`} />
          <span className="truncate">
            {loadInfo.label}: {queue.activeOrders} antrean ({queue.totalItems} item)
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-black">
          ±{queue.estimateMinutes} mnt
        </span>
      </div>
    );
  }

  return (
    <aside
      aria-label="Status Antrean Pemrosesan"
      className={`p-3 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl shadow-[3px_3px_0px_#2B1D12] space-y-1.5 text-xs text-[#2B1D12] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${loadInfo.dotColor} opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${loadInfo.dotColor}`}
            />
          </span>
          <span className="font-display font-black text-xs uppercase tracking-wide text-[#2B1D12]">
            Live Antrean Toko
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-[#2B1D12] shadow-[1px_1px_0px_#2B1D12] ${loadInfo.badgeBg} ${loadInfo.badgeText}`}
        >
          {loadInfo.label}
        </span>
      </div>

      <div className="text-[11px] font-medium text-[#4A3628] leading-snug">
        {queue.activeOrders === 0 ? (
          <p>
            <strong className="font-bold text-[#2B1D12]">Toko Lengang:</strong> Belum ada
            antrean di depan. Pesanan baru langsung diproses admin (±1-3 menit) sebelum
            diracik barista.
          </p>
        ) : (
          <p>
            <strong className="font-bold text-[#2B1D12]">{queue.activeOrders} antrean</strong>{' '}
            ({queue.totalItems} item fisik) sedang diproses. Estimasi proses admin{' '}
            <strong className="font-bold text-[#2B1D12]">±{queue.estimateMinutes} menit</strong>{' '}
            sebelum diracik barista.
          </p>
        )}
      </div>
    </aside>
  );
}
