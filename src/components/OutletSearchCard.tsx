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
          ? 'border-[#EFE5D8] hover:border-[#D9A74A]/60 hover:shadow-md'
          : 'border-[#EFE5D8]/60 bg-[#FAF7F2]/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display font-bold text-base text-[#26150B] leading-snug">
          {outlet.name}
        </h3>
        <span
          className={`shrink-0 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
            isOrderable
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-[#F2EAE0] text-[#735F52] border-[#E3D6C5]'
          }`}
        >
          {statusBadgeText}
        </span>
      </div>

      <p className="text-xs text-[#6A584D] leading-relaxed line-clamp-2 mb-3">
        {outlet.address || 'Alamat outlet Kopi Kenangan'}
      </p>

      {outlet.openTime && outlet.closeTime && (
        <div
          className={`flex items-center gap-1.5 text-[11px] mb-3 ${
            isOrderable ? 'text-[#735F52]' : 'text-[#3D2817]'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 ${
              isOrderable ? 'text-[#A66908]' : 'text-[#5C4028]'
            }`}
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
          <span className={isOrderable ? 'font-medium' : 'font-semibold text-[#3D2817]'}>
            {outlet.openTime.slice(0, 5)} - {outlet.closeTime.slice(0, 5)} WIB
          </span>
          {outlet.distanceStr && (
            <>
              <span className={isOrderable ? 'text-[#C8B8A6]' : 'text-[#6A584D]'}>•</span>
              <span className={isOrderable ? 'font-medium' : 'font-semibold text-[#3D2817]'}>
                {outlet.distanceStr}
              </span>
            </>
          )}
        </div>
      )}

      <div className="pt-2.5 border-t border-[#F2EAE0] flex items-center justify-between">
        <span className="text-[11px] text-[#735F52] font-medium">
          {isOrderable ? 'Pickup jasa order tersedia' : 'Tidak menerima pesanan'}
        </span>

        {isOrderable ? (
          <Link
            href={`/outlet/${outlet.code}`}
            className="min-h-[44px] px-4 py-2 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] active:scale-95 text-xs font-display font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
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
            className="min-h-[44px] px-4 py-2 bg-[#F2EAE0] text-[#8C7667] text-xs font-semibold rounded-xl cursor-not-allowed opacity-75"
          >
            Tidak Tersedia
          </button>
        )}
      </div>
    </div>
  );
}
