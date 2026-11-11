'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOTAL_ORDERS_BASELINE } from '@/lib/site-config';
import { formatTotalOrders } from '@/lib/order-stats';
import { fetchBootstrap, getCachedBootstrap } from '@/lib/client-bootstrap';

interface TrustStripProps {
  className?: string;
}

export function TrustStrip({ className = '' }: TrustStripProps) {
  const [counts, setCounts] = useState<{ today: number; total: number }>(() => {
    const cached = getCachedBootstrap();
    if (cached?.orderCounts) {
      return cached.orderCounts;
    }
    return {
      today: 0,
      total: TOTAL_ORDERS_BASELINE,
    };
  });

  useEffect(() => {
    let isCancelled = false;

    // Nomor 3: Ambil dari endpoint bootstrap terpadu untuk efisiensi CPU Worker
    fetchBootstrap().then((bootstrap) => {
      if (!isCancelled && bootstrap?.orderCounts) {
        setCounts(bootstrap.orderCounts);
        return;
      }

      // Fallback ke endpoint individual jika bootstrap belum tersedia
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
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div
      className={`bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl py-2 px-1 shadow-[3px_3px_0px_#2B1D12] ${className}`}
    >
      <div className="grid grid-cols-3 divide-x-2 divide-[#2B1D12]/15 items-center text-center">
        {/* Segmen 1: Total Orderan */}
        <div className="px-1 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-xs sm:text-sm text-[#2B1D12] leading-tight">
            {formatTotalOrders(counts.total)}
          </span>
          <span className="text-[10px] text-[#7A6658] font-medium leading-tight mt-0.5 whitespace-nowrap">
            Total Orderan
          </span>
        </div>

        {/* Segmen 2: Orderan Hari Ini */}
        <div className="px-1 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 leading-tight">
            <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0" />
            <span className="font-display font-bold text-xs sm:text-sm text-[#15803D]">
              {counts.today} Order
            </span>
          </div>
          <span className="text-[10px] text-[#7A6658] font-medium leading-tight mt-0.5 whitespace-nowrap">
            Hari Ini
          </span>
        </div>

        {/* Segmen 3: Link Testimoni */}
        <Link
          href="/testimoni"
          prefetch={false}
          className="px-1 flex flex-col items-center justify-center group hover:bg-[#FFF8E7] rounded-xl transition-colors py-0.5"
        >
          <div className="flex items-center justify-center gap-1 text-[#C67D0A] text-xs sm:text-sm leading-tight">
            <span>★</span>
            <span className="font-display font-bold text-[#2B1D12] text-xs sm:text-sm">4.9/5</span>
          </div>
          <span className="text-[10px] text-[#C67D0A] group-hover:text-[#A66504] font-semibold leading-tight mt-0.5 whitespace-nowrap">
            Testimoni ➔
          </span>
        </Link>
      </div>
    </div>
  );
}
