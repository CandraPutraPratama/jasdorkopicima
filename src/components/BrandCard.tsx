'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BrandConfig } from '@/lib/site-config';

interface BrandCardProps {
  brand: BrandConfig;
  outletCount?: number;
}

export function BrandCard({ brand, outletCount }: BrandCardProps) {
  // Hanya Kopi Kenangan yang aktif untuk pemesanan langsung di portal saat ini.
  // Fore Coffee dan Tomoro Coffee berstatus Segera Hadir dan tidak bisa diklik di portal.
  const isClickable = brand.slug === 'kopi-kenangan';
  const [imgError, setImgError] = useState(false);

  // Inisial emblem/logo ringkas jika tidak ada gambar logo
  const initials = brand.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderLogo = () => {
    // 1. Jika brand memiliki logo dan file berhasil dimuat (mis. logo Fore atau Tomoro bila sudah ada)
    if (brand.logo && !imgError) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          loading="eager"
          onError={() => setImgError(true)}
        />
      );
    }

    // 2. Placeholder logo Tomoro yang rapi dengan warna brand normal (merah cerah, bukan abu-abu dimmed)
    if (brand.slug === 'tomoro') {
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E11D48] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex flex-col items-center justify-center text-white p-1 select-none">
          <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase leading-none text-white">
            TOMORO
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase mt-0.5 text-white/90">
            COFFEE
          </span>
        </div>
      );
    }

    // 3. Placeholder generik untuk brand lain dengan warna normal neobrutalisme
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FFFDF9] shadow-xs border-2 border-[#2B1D12] flex items-center justify-center font-display font-black text-sm text-[#2B1D12] select-none">
        <span>{initials}</span>
      </div>
    );
  };

  const cardContent = (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col transition relative bg-[#FFFDF9] border-2 border-[#2B1D12] ${
        isClickable
          ? 'shadow-[4px_4px_0px_#2B1D12] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
          : 'shadow-[3px_3px_0px_#2B1D12] cursor-default select-none'
      }`}
    >
      {/* Visual Logo Brand (Kotak Atas) - Semua brand tampil cerah/nyala dengan border solid */}
      <div className="h-24 sm:h-28 relative flex items-center justify-center overflow-hidden border-b-2 border-[#2B1D12] bg-[#FFFDF9]">
        {renderLogo()}
      </div>

      {/* Konten Kartu Bawah */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-black text-xs sm:text-sm text-[#2B1D12] leading-tight line-clamp-1">
            {brand.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t-2 border-[#2B1D12]/10">
          {isClickable ? (
            <>
              {/* Badge Promo Merah Punch untuk brand aktif (Kopi Kenangan) */}
              {brand.promoBadge ? (
                <span className="text-[10px] font-black text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626] px-1.5 py-0.5 rounded-lg uppercase tracking-wide">
                  {brand.promoBadge}
                </span>
              ) : null}
              {typeof outletCount === 'number' && outletCount > 0 ? (
                <span className="text-[10px] font-bold text-[#2B1D12]">
                  {outletCount.toLocaleString('id-ID')} outlet
                </span>
              ) : brand.outletCountLabel ? (
                <span className="text-[10px] font-bold text-[#2B1D12]">
                  {brand.outletCountLabel}
                </span>
              ) : null}
            </>
          ) : (
            /* Badge Segera Hadir untuk Fore Coffee & Tomoro Coffee (tanpa jumlah outlet) */
            <span className="text-[9px] font-extrabold text-[#2B1D12] bg-[#FFE7D6] border border-[#2B1D12] px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#2B1D12]">
              Segera Hadir
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/${brand.slug}`} className="block focus-visible:outline-hidden">
        {cardContent}
      </Link>
    );
  }

  return <div className="block cursor-default select-none">{cardContent}</div>;
}
