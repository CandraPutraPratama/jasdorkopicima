'use client';

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
}

export function ProductCard({
  product,
  onSelectProduct,
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const pricing = calculateItemPricing({
    name: product.name,
    basePrice: product.basePrice,
    skuPrice: product.basePrice,
    quantity: 1,
  });

  const feeDescription = `+${formatRupiah(BUSINESS_CONFIG.pricing.feeMultiItem)}/item`;
  const isSoldOut = Boolean(product.isSoldOut);

  return (
    <div
      onClick={() => {
        if (!isSoldOut) {
          onSelectProduct(product);
        }
      }}
      className={`p-3.5 bg-white border rounded-2xl flex gap-3 transition shadow-xs relative ${
        isSoldOut
          ? 'border-[#EFE5D8]/60 bg-[#FAF7F2]/60 opacity-65 cursor-not-allowed'
          : 'border-[#EFE5D8] hover:border-[#D9A74A]/60 hover:shadow-md cursor-pointer active:scale-[0.99]'
      }`}
    >
      {/* Gambar Produk */}
      <div className="relative w-22 h-22 bg-[#F4EDE3] rounded-2xl overflow-hidden shrink-0 border border-[#EAE0D3]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="88px"
            loading="lazy"
            className={`object-cover ${isSoldOut ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#BFAFA0]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-[#26150B]/60 flex items-center justify-center">
            <span className="px-2 py-0.5 bg-[#4A3225] text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Konten Detail Produk */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-display text-sm font-bold text-[#26150B] leading-snug line-clamp-1 pr-1">
              {product.name}
            </h4>

            <div className="flex items-center gap-1 shrink-0">
              {isSoldOut && (
                <span className="text-[10px] font-bold text-[#735F52] px-1.5 py-0.2 bg-[#F2EAE0] border border-[#E3D6C5] rounded">
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
                className="p-1 -mr-1 -mt-0.5 text-[#8C7667] hover:text-[#E11D48] active:scale-90 transition rounded-full z-10"
              >
                <svg
                  className={`w-4 h-4 transition-colors ${
                    isFavorite
                      ? 'fill-[#E11D48] text-[#E11D48]'
                      : 'fill-none stroke-current hover:stroke-[#E11D48]'
                  }`}
                  strokeWidth={2}
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
            <p className="text-[11px] text-[#6A584D] line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Baris Harga Promo Punch & Tombol Plus */}
        <div className="mt-2 pt-2 border-t border-[#F2EAE0] flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {/* 1. Harga Promo (Punch Merah) */}
              <span className="font-display text-sm font-black text-[#DC2626]">
                {formatRupiah(pricing.promoPricePerItem)}
              </span>
              {/* 2. Harga Asli Dicoret */}
              <span className="text-[11px] text-[#9C897B] line-through font-medium">
                {formatRupiah(pricing.originalPricePerItem)}
              </span>
              {/* 3. Badge Diskon 50% (Punch Merah) */}
              <span className="text-[9px] font-extrabold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-1 py-0.2 rounded">
                -50%
              </span>
            </div>

            {/* 4. Keterangan Fee Jasa */}
            <span className="text-[10px] font-medium text-[#735F52] mt-0.5">
              fee {feeDescription}
            </span>
          </div>

          {/* 5. Tombol Lingkaran Hijau Plus (Kanan Bawah) */}
          {!isSoldOut && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              aria-label={`Tambah dan kustomisasi ${product.name}`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-xs transition active:scale-90 shrink-0"
            >
              <svg
                className="w-4 h-4 stroke-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.8}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
