'use client';

import Link from 'next/link';
import type { BrandConfig } from '@/lib/site-config';

interface BrandCardProps {
  brand: BrandConfig;
}

export function BrandCard({ brand }: BrandCardProps) {
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
      {/* Banner Visual Atas */}
      <div
        className="h-20 relative flex items-center justify-center overflow-hidden"
        style={{
          background: isActive
            ? 'linear-gradient(180deg, #A8201A 0%, #5E0B08 100%)'
            : 'linear-gradient(180deg, #6B7280 0%, #374151 100%)',
        }}
      >
        {/* Subtle accent glow */}
        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />

        {/* Floating Brand Logo Emblem */}
        <div
          className="w-11 h-11 rounded-xl bg-white flex items-center justify-center font-display font-black text-xs shadow-md border-2 border-white tracking-wider"
          style={{ color: isActive ? brand.accentColor || '#8B1E19' : '#4B5563' }}
        >
          {initials}
        </div>
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
              {brand.outletCountLabel && (
                <span className="text-[10px] font-semibold text-[#735F52]">
                  {brand.outletCountLabel}
                </span>
              )}
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
