'use client';

import Link from 'next/link';
import type { BrandConfig } from '@/lib/site-config';

interface BrandCardProps {
  brand: BrandConfig;
  outletCount?: number;
}

export function BrandCard({ brand, outletCount }: BrandCardProps) {
  const isActive = brand.status === 'active';

  // Inisial emblem/logo ringkas
  const initials = brand.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cardContent = (
    <div
      className={`bg-white border rounded-2xl overflow-hidden flex flex-col transition shadow-xs relative ${
        isActive
          ? 'border-[#EFE5D8] hover:border-[#D9A74A]/60 hover:shadow-md cursor-pointer active:scale-[0.99]'
          : 'border-[#EFE5D8]/70 bg-[#FAF7F2]/60 opacity-65 grayscale cursor-not-allowed border-dashed'
      }`}
    >
      {/* Visual Logo Brand (Kotak Atas) - Full box tanpa background merah dan tanpa persegi panjang di tengah */}
      <div
        className={`h-24 sm:h-28 relative flex items-center justify-center overflow-hidden border-b border-[#EFE5D8]/80 ${
          isActive ? 'bg-white' : 'bg-[#FAF6F0]'
        }`}
      >
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="eager"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-xs border border-[#E5DACB] flex items-center justify-center font-display font-black text-sm text-[#735F52]">
            <span>{initials}</span>
          </div>
        )}
      </div>

      {/* Konten Kartu Bawah */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-xs sm:text-sm text-[#26150B] leading-tight line-clamp-1">
            {brand.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-[#F2EAE0]">
          {isActive ? (
            <>
              {/* Badge Promo Merah Punch */}
              <span className="text-[10px] font-black text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded uppercase tracking-wide">
                {brand.promoBadge}
              </span>
              {typeof outletCount === 'number' && outletCount > 0 ? (
                <span className="text-[10px] font-semibold text-[#735F52]">
                  {outletCount.toLocaleString('id-ID')} outlet
                </span>
              ) : brand.outletCountLabel ? (
                <span className="text-[10px] font-semibold text-[#735F52]">
                  {brand.outletCountLabel}
                </span>
              ) : null}
            </>
          ) : (
            /* Badge Segera Hadir untuk Brand Pilot Non-Aktif (hanya badge status) */
            <span className="text-[9px] font-bold text-[#6A584D] bg-[#E5DACB] px-2 py-0.5 rounded">
              {brand.promoBadge || 'Segera Hadir'}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isActive) {
    return (
      <Link href={`/${brand.slug}`} className="block focus-visible:outline-hidden">
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}
