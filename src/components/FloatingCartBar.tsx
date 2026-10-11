'use client';

import { formatRupiah } from '@/lib/currency';

interface FloatingCartBarProps {
  totalQuantity: number;
  subtotal: number;
  onOpenCart: () => void;
}

export function FloatingCartBar({
  totalQuantity,
  subtotal,
  onOpenCart,
}: FloatingCartBarProps) {
  if (totalQuantity <= 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-200">
      <button
        type="button"
        onClick={onOpenCart}
        className="w-full min-h-[52px] bg-[#111111] text-white rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between border border-amber-500/30 hover:bg-stone-900 active:scale-98 transition"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-stone-800 rounded-xl flex items-center justify-center text-[#D4AF37]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#111111] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalQuantity}
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs text-stone-300 block leading-tight">
              {totalQuantity} Pesanan
            </span>
            <span className="text-sm font-bold text-[#D4AF37] block leading-tight">
              {formatRupiah(subtotal)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-800 px-3 py-1.5 rounded-xl">
          <span>Lihat Keranjang</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-[#D4AF37]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  );
}
