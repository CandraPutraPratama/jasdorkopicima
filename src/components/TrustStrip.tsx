'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOTAL_ORDERS_BASELINE } from '@/lib/site-config';
import { formatTotalOrders } from '@/lib/order-stats';

interface TrustStripProps {
  className?: string;
}

export function TrustStrip({ className = '' }: TrustStripProps) {
  const [counts, setCounts] = useState<{ today: number; total: number }>({
    today: 0,
    total: TOTAL_ORDERS_BASELINE,
  });

  useEffect(() => {
    let isCancelled = false;

    fetch('/api/stats/order-counts')
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat statistik order');
        return res.json();
      })
      .then((data: { today?: number; total?: number }) => {
        if (!isCancelled && typeof data.total === 'number') {
          setCounts({
            today: typeof data.today === 'number' ? data.today : 0,
            total: data.total,
          });
        }
      })
      .catch(() => {
        // Fallback baseline sudah terpasang pada initial state
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div
      className={`bg-white border border-[#EFE5D8] rounded-xl px-3 py-2.5 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5A4537] overflow-x-auto no-scrollbar">
        {/* Item 1: Total Orderan */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>{formatTotalOrders(counts.total)} Total Orderan</span>
        </div>

        <span className="text-[#D9CEBF] shrink-0">•</span>

        {/* Item 2: Orderan Hari Ini */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>{counts.today} Orderan Hari Ini</span>
        </div>

        <span className="text-[#D9CEBF] shrink-0">•</span>

        {/* Item 3: Link Testimoni */}
        <Link
          href="/testimoni"
          className="flex items-center gap-1 shrink-0 text-[#8B1E19] hover:text-[#691410] font-bold transition-colors group"
        >
          <span className="text-amber-500 text-xs">★</span>
          <span className="underline decoration-[#8B1E19]/40 group-hover:decoration-[#8B1E19] underline-offset-2">
            Testimoni
          </span>
        </Link>
      </div>
    </div>
  );
}
