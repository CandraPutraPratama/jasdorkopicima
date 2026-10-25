'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Outlet } from '@/types/domain';
import { isOutletClosed } from '@/lib/orderability';

interface OutletSearchCardProps {
  outlet: Outlet;
}

export function OutletSearchCard({ outlet }: OutletSearchCardProps) {
  const router = useRouter();
  const isClosed = isOutletClosed(outlet);
  const isOrderable = !isClosed;
  const statusBadgeText = isOrderable ? 'Buka' : outlet.orderReason || 'Tutup';

  const handleCardClick = () => {
    // Selalu izinkan pembeli membuka outlet untuk melihat katalog menu
    router.push(`/outlet/${outlet.code}`);
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/outlet/${outlet.code}`);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Pilih outlet ${outlet.name} - ${statusBadgeText}`}
      className={`p-4 rounded-2xl border-2 transition outline-hidden cursor-pointer ${
        isOrderable
          ? 'bg-[#FFFDF9] border-[#2B1D12] shadow-[4px_4px_0px_#2B1D12] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:ring-2 focus-visible:ring-[#C67D0A]'
          : 'bg-[#FFFDF9]/95 border-[#2B1D12]/70 shadow-[3px_3px_0px_#2B1D12] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:ring-2 focus-visible:ring-[#C67D0A]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display font-black text-base text-[#2B1D12] leading-snug">
          {outlet.name}
        </h3>
        <span
          className={`shrink-0 px-2.5 py-0.5 text-[11px] font-black rounded-lg border-2 border-[#2B1D12] shadow-[1px_1px_0px_#2B1D12] ${
            isOrderable
              ? 'bg-[#D9F3EA] text-[#2B1D12]'
              : 'bg-[#FEF2F2] text-[#DC2626]'
          }`}
        >
          {statusBadgeText}
        </span>
      </div>

      <p className="text-xs text-[#4A3628] leading-relaxed line-clamp-2 mb-3 font-medium">
        {outlet.address || 'Alamat outlet resmi'}
      </p>

      {outlet.openTime && outlet.closeTime && (
        <div
          className={`flex items-center gap-1.5 text-[11px] mb-3 ${
            isOrderable ? 'text-[#4A3628]' : 'text-[#7A6658]'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 ${
              isOrderable ? 'text-[#C67D0A]' : 'text-[#7A6658]'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.3}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className={isOrderable ? 'font-bold text-[#2B1D12]' : 'font-semibold text-[#7A6658]'}>
            {outlet.openTime.slice(0, 5)} - {outlet.closeTime.slice(0, 5)} WIB
          </span>
          {outlet.distanceStr && (
            <>
              <span className="text-[#2B1D12]/30 font-black">•</span>
              <span className="font-bold text-[#2B1D12]">
                {outlet.distanceStr}
              </span>
            </>
          )}
        </div>
      )}

      <div className="pt-2.5 border-t-2 border-[#2B1D12]/10 flex items-center justify-between">
        <span className="text-[11px] text-[#4A3628] font-bold">
          {isOrderable ? 'Pickup jasa order tersedia' : 'Tidak menerima pesanan'}
        </span>

        {isOrderable ? (
          <Link
            href={`/outlet/${outlet.code}`}
            prefetch={true}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="min-h-[44px] px-4 py-2.5 bg-[#2B1D12] text-[#FAF4E8] hover:bg-[#3D2817] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-display font-black rounded-xl flex items-center gap-1.5 transition-all border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A]"
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
          <Link
            href={`/outlet/${outlet.code}`}
            prefetch={true}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="min-h-[44px] px-4 py-2.5 bg-[#FAF4E8] hover:bg-[#F3EAD8] text-[#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-display font-black rounded-xl flex items-center gap-1.5 transition-all border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]"
          >
            <span>Lihat Menu</span>
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
        )}
      </div>
    </div>
  );
}
