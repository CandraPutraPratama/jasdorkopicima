'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/domain';
import type { CartItem } from '@/lib/cart-reducer';
import { formatRupiah } from '@/lib/currency';

interface TomoroB1G1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export function TomoroB1G1Modal({
  isOpen,
  onClose,
  products,
  onAddToCart,
}: TomoroB1G1ModalProps) {
  const [slot1, setSlot1] = useState<Product | null>(null);
  const [slot2, setSlot2] = useState<Product | null>(null);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!isOpen) return null;

  const p1Price = slot1?.basePrice || 0;
  const p2Price = slot2?.basePrice || 0;
  const highestPrice = Math.max(p1Price, p2Price);
  const normalTotal = p1Price + p2Price;
  const fee = 3000;
  const isComplete = slot1 !== null && slot2 !== null;

  const handleSelectProduct = (product: Product) => {
    if (activeSlot === 1) {
      setSlot1(product);
      if (!slot2) {
        setActiveSlot(2);
      }
    } else {
      setSlot2(product);
    }
  };

  const handleConfirm = () => {
    if (!slot1 || !slot2) return;

    onAddToCart({
      bundleCode: 'tomoro-b1g1',
      name: 'Paket B1G1 TOMORO (Small)',
      basePrice: highestPrice,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      isBundle: true,
      bundleType: 'tomoro-b1g1',
      bundleFee: 3000,
      bundleNormalPrice: normalTotal,
      bundleDetails: [
        {
          name: slot1.name,
          category: 'drink',
          variantDescription: 'Small',
          normalPrice: p1Price,
          promoPrice: p1Price >= p2Price ? p1Price : 0,
        },
        {
          name: slot2.name,
          category: 'drink',
          variantDescription: 'Small',
          normalPrice: p2Price,
          promoPrice: p1Price >= p2Price ? 0 : p2Price,
        },
      ],
      brandSlug: 'tomoro',
    });

    setSlot1(null);
    setSlot2(null);
    setActiveSlot(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-[#FAF4E8] rounded-t-3xl sm:rounded-3xl border-2 border-[#2B1D12] shadow-[6px_6px_0px_#2B1D12] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#FFFDF9] border-b-2 border-[#2B1D12] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <h2 className="font-display font-black text-sm sm:text-base text-[#2B1D12]">
                B1G1 \u2014 Pilih 2 Menu (Small)
              </h2>
            </div>
            <p className="text-[11px] text-[#7A6658] font-bold mt-0.5">
              Bayar 1 yang tertinggi, 1 GRATIS + fee Rp3.000
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#FAF4E8] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center font-bold text-sm text-[#2B1D12] hover:bg-[#FFE7D6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            ✕
          </button>
        </div>

        {/* 2 Slot Selection Tabs */}
        <div className="p-3 bg-[#FAF4E8] border-b-2 border-[#2B1D12] grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSlot(1)}
            className={`p-2.5 rounded-2xl border-2 text-left transition ${
              activeSlot === 1
                ? 'bg-[#FFFDF9] border-[#E11D48] shadow-[3px_3px_0px_#E11D48]'
                : 'bg-[#FFFDF9]/60 border-[#2B1D12]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
              <span className={activeSlot === 1 ? 'text-[#E11D48]' : 'text-[#7A6658]'}>
                Menu 1 {activeSlot === 1 ? '(Dipilih)' : ''}
              </span>
              {slot1 && (
                <span className="text-[#15803D] font-black">
                  {formatRupiah(slot1.basePrice)}
                </span>
              )}
            </div>
            <p className="font-display font-black text-xs text-[#2B1D12] line-clamp-1">
              {slot1 ? slot1.name : 'Ketuk menu di bawah'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSlot(2)}
            className={`p-2.5 rounded-2xl border-2 text-left transition ${
              activeSlot === 2
                ? 'bg-[#FFFDF9] border-[#E11D48] shadow-[3px_3px_0px_#E11D48]'
                : 'bg-[#FFFDF9]/60 border-[#2B1D12]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
              <span className={activeSlot === 2 ? 'text-[#E11D48]' : 'text-[#7A6658]'}>
                Menu 2 {activeSlot === 2 ? '(Dipilih)' : ''}
              </span>
              {slot2 && (
                <span className="text-[#15803D] font-black">
                  {formatRupiah(slot2.basePrice)}
                </span>
              )}
            </div>
            <p className="font-display font-black text-xs text-[#2B1D12] line-clamp-1">
              {slot2 ? slot2.name : 'Ketuk menu di bawah'}
            </p>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#FFFDF9] border-b-2 border-[#2B1D12] shrink-0">
          <input
            type="text"
            placeholder="Cari menu untuk slot ini..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#FAF4E8] border-2 border-[#2B1D12] rounded-xl font-medium placeholder:text-[#7A6658] focus:outline-hidden focus:border-[#E11D48]"
          />
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredProducts.map((p) => {
            const isChosenInCurrentSlot =
              (activeSlot === 1 && slot1?.name === p.name) ||
              (activeSlot === 2 && slot2?.name === p.name);

            return (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className={`p-2.5 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition ${
                  isChosenInCurrentSlot
                    ? 'bg-[#FFF1F2] border-[#E11D48] shadow-[2px_2px_0px_#E11D48]'
                    : 'bg-[#FFFDF9] border-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF4E8] border border-[#2B1D12] overflow-hidden shrink-0 relative">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[#2B1D12]">
                        TOMORO
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-black text-xs text-[#2B1D12] line-clamp-1">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-[#7A6658] font-bold">
                      Normal: {formatRupiah(p.basePrice)} (Small)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-3 py-1 text-[11px] font-black rounded-lg border-2 shrink-0 transition ${
                    isChosenInCurrentSlot
                      ? 'bg-[#E11D48] text-white border-[#2B1D12]'
                      : 'bg-[#FFFDF9] text-[#2B1D12] border-[#2B1D12]'
                  }`}
                >
                  {isChosenInCurrentSlot ? 'Terpilih' : 'Pilih'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer with Price Summary and Add to Cart */}
        <div className="p-3.5 bg-[#FFFDF9] border-t-2 border-[#2B1D12] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#7A6658] font-bold">Harga Paket (Bayar 1 Tertinggi):</span>
            <span className="font-display font-black text-[#2B1D12]">
              {formatRupiah(highestPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#7A6658] font-bold">Biaya Jasa B1G1:</span>
            <span className="font-display font-black text-[#2B1D12]">{formatRupiah(fee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1 border-t border-[#2B1D12]/20">
            <span className="font-display font-black text-[#2B1D12]">Total Tagihan Paket:</span>
            <span className="font-display font-black text-base text-[#E11D48]">
              {formatRupiah(highestPrice + fee)}
            </span>
          </div>

          <button
            type="button"
            disabled={!isComplete}
            onClick={handleConfirm}
            className="w-full py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-[#FDA4AF] disabled:cursor-not-allowed text-white font-display font-black text-xs sm:text-sm rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition mt-2"
          >
            {isComplete ? 'Tambahkan Paket B1G1 ke Keranjang' : 'Pilih 2 Menu Terlebih Dahulu'}
          </button>
        </div>
      </div>
    </div>
  );
}
