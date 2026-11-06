'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/domain';
import { calculateItemPricing } from '@/lib/pricing';
import { formatRupiah } from '@/lib/currency';
import { BUSINESS_CONFIG } from '@/config/business';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  isOutletClosed?: boolean;
  brandSlug?: string;
}

export function ProductCard({
  product,
  onSelectProduct,
  isFavorite = false,
  onToggleFavorite,
  isOutletClosed = false,
  brandSlug,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const isFore =
    brandSlug === 'fore' ||
    (typeof product.bundleCode === 'string' &&
      (product.bundleCode.startsWith('FORE_') || product.bundleCode.startsWith('fore-'))) ||
    (typeof product.productCode === 'string' && product.productCode.startsWith('FORE_'));

  const isTomoro =
    !isFore &&
    (brandSlug === 'tomoro' ||
      (typeof product.bundleCode === 'string' && product.bundleCode.startsWith('tomoro-')) ||
      (typeof product.productCode === 'string' && product.productCode.startsWith('TOMORO_')));

  const pricing = calculateItemPricing(
    {
      name: product.name,
      basePrice: product.basePrice,
      skuPrice: product.basePrice,
      quantity: 1,
      brandSlug: isFore ? 'fore' : isTomoro ? 'tomoro' : undefined,
      bundleCode: product.bundleCode,
    },
    BUSINESS_CONFIG.pricing,
    brandSlug
  );

  const feeDescription = isFore
    ? 'Gratis'
    : isTomoro
      ? `+${formatRupiah(1500)}/item`
      : `+${formatRupiah(BUSINESS_CONFIG.pricing.feeMultiItem)}/item`;
  const isSoldOut = Boolean(product.isSoldOut);

  return (
    <div
      onClick={() => {
        if (!isSoldOut) {
          onSelectProduct(product);
        }
      }}
      className={`p-3.5 rounded-2xl flex gap-3 transition relative ${
        isSoldOut
          ? 'border-2 border-dashed border-[#2B1D12]/30 bg-[#FAF4E8]/60 opacity-65 cursor-not-allowed'
          : 'bg-[#FFFDF9] border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2B1D12] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
      }`}
    >
      {/* Gambar Produk */}
      <div className="relative w-22 h-22 bg-[#FAF4E8] rounded-xl overflow-hidden shrink-0 border-2 border-[#2B1D12]">
        {product.image && !imageFailed ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="88px"
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`object-cover ${isSoldOut ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5EBD7] text-[#2B1D12]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2B1D12"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-[#2B1D12]"
              aria-hidden="true"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider text-[#8C7667] mt-1">
              Jasdor
            </span>
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-[#2B1D12]/70 flex items-center justify-center">
            <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black rounded-md uppercase tracking-wider border border-white">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Konten Detail Produk */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-display text-sm font-bold text-[#2B1D12] leading-snug line-clamp-1 pr-1">
              {product.name}
            </h4>

            <div className="flex items-center gap-1 shrink-0">
              {isSoldOut && (
                <span className="text-[10px] font-bold text-[#7A6658] px-1.5 py-0.5 bg-[#FAF4E8] border border-[#2B1D12]/20 rounded-md">
                  Habis
                </span>
              )}

              {/* Ikon Hati / Favorit di Kanan Atas */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(product);
                }}
                aria-label={
                  isFavorite
                    ? `Hapus ${product.name} dari favorit`
                    : `Simpan ${product.name} ke favorit`
                }
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white hover:bg-[#FFF8E7] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none z-10 shrink-0"
              >
                <svg
                  className={`w-4.5 h-4.5 transition-colors ${
                    isFavorite
                      ? 'fill-[#DC2626] text-[#DC2626] stroke-[#DC2626]'
                      : 'fill-none stroke-[#2B1D12] hover:stroke-[#DC2626]'
                  }`}
                  strokeWidth={2.4}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {product.description && (
            <p className="text-[11px] text-[#6A584D] font-normal line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Baris Harga Promo Punch & Tombol Plus */}
        <div className="mt-2 pt-2 border-t border-[#2B1D12]/10 flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {/* 1. Harga Promo (Punch Merah) */}
              <span className="font-display text-sm font-black text-[#DC2626]">
                {formatRupiah(pricing.promoPricePerItem)}
              </span>
              {/* 2. Harga Asli Dicoret */}
              <span className="text-[11px] text-[#7A6658] line-through font-medium">
                {formatRupiah(pricing.originalPricePerItem)}
              </span>
              {/* 3. Badge Diskon */}
              <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 px-1.5 py-0.5 rounded-md">
                {isFore ? '-25%' : '-50%'}
              </span>
            </div>

            {/* 4. Keterangan Fee Jasa */}
            <span className="text-[10px] font-medium text-[#7A6658] mt-0.5">
              fee {feeDescription}
            </span>
          </div>

          {/* 5. Tombol Plus (Kanan Bawah) - dinonaktifkan jika outlet tutup, proporsional dengan tombol love (min 40px) */}
          {!isSoldOut && (
            isOutletClosed ? (
              <button
                type="button"
                disabled
                aria-label={`Outlet tutup - ${product.name} tidak dapat dipesan`}
                title="Outlet sedang tutup - tidak dapat dipesan"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[#FAF4E8] text-[#7A6658] border-2 border-[#2B1D12]/20 flex items-center justify-center cursor-not-allowed opacity-75 shrink-0"
              >
                <svg
                  className="w-4.5 h-4.5 stroke-[#7A6658]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct(product);
                }}
                aria-label={`Tambah dan kustomisasi ${product.name}`}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0"
              >
                <svg
                  className="w-4.5 h-4.5 stroke-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
