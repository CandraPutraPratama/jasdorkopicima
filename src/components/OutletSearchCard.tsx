'use client';

import Link from 'next/link';
import type { Outlet } from '@/types/domain';

interface OutletSearchCardProps {
  outlet: Outlet;
}

export function OutletSearchCard({ outlet }: OutletSearchCardProps) {
  const isOrderable = Boolean(outlet.canOrder);
  const statusBadgeText = isOrderable ? 'Buka' : outlet.orderReason || 'Tutup';

  return (
    <div
      className={`p-4 bg-white rounded-2xl border transition shadow-xs ${
        isOrderable
          ? 'border-stone-200 hover:border-amber-400 hover:shadow-md'
          : 'border-stone-200/60 bg-stone-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-base text-[#111111] leading-snug">
          {outlet.name}
        </h3>
        <span
          className={`shrink-0 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
            isOrderable
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}
        >
          {statusBadgeText}
        </span>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 mb-3">
        {outlet.address || 'Alamat outlet Kopi Kenangan'}
      </p>

      {outlet.openTime && outlet.closeTime && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {outlet.openTime.slice(0, 5)} - {outlet.closeTime.slice(0, 5)} WIB
          </span>
          {outlet.distanceStr && (
            <>
              <span>•</span>
              <span>{outlet.distanceStr}</span>
            </>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
        <span className="text-[11px] text-stone-400">
          {isOrderable ? 'Pickup tersedia' : 'Tidak menerima pesanan'}
        </span>

        {isOrderable ? (
          <Link
            href={`/outlet/${outlet.code}`}
            className="min-h-[44px] px-4 py-2 bg-[#111111] text-[#D4AF37] hover:bg-stone-800 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Pilih Outlet</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[44px] px-4 py-2 bg-stone-200 text-stone-400 text-xs font-semibold rounded-xl cursor-not-allowed opacity-75"
          >
            Tidak Tersedia
          </button>
        )}
      </div>
    </div>
  );
}
