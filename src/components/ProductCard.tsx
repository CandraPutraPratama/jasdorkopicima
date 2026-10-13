'use client';

import Image from 'next/image';
import type { Product } from '@/types/domain';
import { calculateItemPricing } from '@/lib/pricing';
import { formatRupiah } from '@/lib/currency';
import { BUSINESS_CONFIG } from '@/config/business';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export function ProductCard({ product, onSelectProduct }: ProductCardProps) {
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
      className={`p-3.5 bg-white border rounded-2xl flex gap-3 transition shadow-xs ${
        isSoldOut
          ? 'border-stone-200/60 bg-stone-50/70 opacity-65 cursor-not-allowed'
          : 'border-stone-200 hover:border-amber-400 hover:shadow-md cursor-pointer active:scale-99'
      }`}
    >
      {/* Gambar Produk */}
      <div className="relative w-20 h-20 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="80px"
            loading="lazy"
            className={`object-cover ${isSoldOut ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
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
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Konten Detail Produk */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-sm font-bold text-[#111111] leading-snug line-clamp-1">
              {product.name}
            </h4>
            {isSoldOut && (
              <span className="shrink-0 text-[10px] font-bold text-rose-600 px-1.5 py-0.2 bg-rose-50 border border-rose-200 rounded">
                Habis
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Baris 3 Harga */}
        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            {/* 1. Harga Promo */}
            <span className="text-sm font-bold text-amber-700">
              {formatRupiah(pricing.promoPricePerItem)}
            </span>
            {/* 2. Harga Asli Dicoret */}
            <span className="text-[11px] text-stone-500 line-through font-medium">
              {formatRupiah(pricing.originalPricePerItem)}
            </span>
          </div>

          {/* 3. Keterangan Fee Jasa */}
          <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/80">
            fee {feeDescription}
          </span>
        </div>
      </div>
    </div>
  );
}
