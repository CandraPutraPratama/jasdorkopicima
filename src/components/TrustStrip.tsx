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
      className={`bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl py-2 px-1 shadow-[3px_3px_0px_#2B1D12] ${className}`}
    >
      <div className="grid grid-cols-3 divide-x-2 divide-[#2B1D12]/20 items-center text-center">
        {/* Segmen 1: Total Orderan */}
        <div className="px-1 flex flex-col items-center justify-center">
          <span className="font-display font-black text-xs sm:text-sm text-[#2B1D12] leading-tight">
            {formatTotalOrders(counts.total)}
          </span>
          <span className="text-[10px] text-[#6A584D] font-bold leading-tight mt-0.5 whitespace-nowrap">
            Total Orderan
          </span>
        </div>

        {/* Segmen 2: Orderan Hari Ini */}
        <div className="px-1 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1 leading-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] border border-[#2B1D12] animate-pulse" />
            <span className="font-display font-black text-xs sm:text-sm text-[#15803D]">
              {counts.today} Order
            </span>
          </div>
          <span className="text-[10px] text-[#6A584D] font-bold leading-tight mt-0.5 whitespace-nowrap">
            Hari Ini
          </span>
        </div>

        {/* Segmen 3: Link Testimoni */}
        <Link
          href="/testimoni"
          className="px-1 flex flex-col items-center justify-center group hover:bg-[#FFF8E7] rounded-xl transition-colors py-0.5"
        >
          <div className="flex items-center justify-center gap-0.5 text-[#C67D0A] text-xs sm:text-sm leading-tight">
            <span>★</span>
            <span className="font-display font-black text-[#2B1D12] text-xs sm:text-sm">Real</span>
          </div>
          <span className="text-[10px] text-[#DC2626] font-black underline decoration-[#DC2626]/40 group-hover:decoration-[#DC2626] leading-tight mt-0.5 whitespace-nowrap">
            Testimoni
          </span>
        </Link>
      </div>
    </div>
  );
}
