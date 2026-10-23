'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/types/domain';
import type { CartItem } from '@/lib/cart-reducer';
import { formatRupiah } from '@/lib/currency';
import { useScrollLock } from '@/hooks/useScrollLock';

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

  // Kunci scroll halaman belakang saat sheet aktif
  useScrollLock(isOpen);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!isOpen) return null;

  const p1Price = slot1?.basePrice || 0;
  const p2Price = slot2?.basePrice || 0;
  const highestPrice = Math.max(p1Price, p2Price);
  const cheapestPrice = Math.min(p1Price, p2Price);
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

  const slotTab = (slotNumber: 1 | 2, product: Product | null) => {
    const isActive = activeSlot === slotNumber;
    return (
      <button
        key={slotNumber}
        type="button"
        onClick={() => setActiveSlot(slotNumber)}
        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
          isActive
            ? 'bg-[#2B1D12] text-[#FAF4E8] border-[#2B1D12] shadow-[2px_2px_0px_#E11D48]'
            : 'bg-[#FFFDF9] text-[#2B1D12] border-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12]'
        }`}
      >
        <div className="text-[10px] font-black uppercase tracking-wider opacity-90 truncate">
          Menu (Pilihan {slotNumber})
        </div>
        <div className="text-xs font-black truncate mt-1">
          {product ? product.name : 'Pilih menu...'}
        </div>
        {product && (
          <div className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-[#FDA4AF]' : 'text-[#7A6658]'}`}>
            Normal: {formatRupiah(product.basePrice)}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in duration-200">
      {/* Backdrop: memblokir klik tembus ke konten bawahnya */}
      <div
        className="fixed inset-0 bg-[#26150B]/60 touch-none cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet: full-screen (100dvh) di mobile dengan SATU container scroll */}
      <div
        className="relative w-full sm:max-w-lg h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-[#FAF4E8] border-t-2 sm:border-2 border-[#2B1D12] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2B1D12] bg-[#FFFDF9] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#E11D48] text-white px-2 py-0.5 rounded-md border border-[#2B1D12]">
                B1G1
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFE7D6] text-[#2B1D12] px-2 py-0.5 rounded-md border border-[#2B1D12]">
                Spesial
              </span>
            </div>
            <h2 className="font-display font-black text-lg sm:text-xl text-[#2B1D12] mt-1">
              Pilih 2 Menu (Small)
            </h2>
            <p className="text-[11px] text-[#7A6658] font-bold mt-0.5">
              Bayar 1 yang tertinggi, 1 GRATIS + fee Rp3.000
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#2B1D12] flex items-center justify-center text-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
            aria-label="Tutup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SATU Container Scroll */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
          {/* Instruksi */}
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[2px_2px_0px_#2B1D12]">
            <p className="text-xs font-bold text-[#4A3628] leading-relaxed">
              Pilih 2 menu ukuran Small di bawah. Kamu cuma bayar menu yang
              termahal, satu menu lagi GRATIS. Fee paket Rp3.000.
            </p>
          </div>

          {/* Slot Tabs */}
          <div className="grid grid-cols-2 gap-2.5">
            {slotTab(1, slot1)}
            {slotTab(2, slot2)}
          </div>

          {/* Editor Slot Aktif */}
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#2B1D12] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]/10">
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#BE123C]">
                Pilih Menu (Pilihan {activeSlot})
              </span>
              <span className="text-[10px] font-bold text-[#7A6658]">
                {filteredProducts.length} Pilihan Menu
              </span>
            </div>

            {/* Pencarian */}
            <input
              type="text"
              placeholder="Cari menu untuk slot ini..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-[#2B1D12]/30 focus:border-[#2B1D12] rounded-xl text-xs font-semibold text-[#2B1D12] placeholder-[#A39282] outline-none transition shadow-[1px_1px_0px_#2B1D12]"
            />

            {/* Daftar Menu */}
            <div className="space-y-2">
              {filteredProducts.map((p) => {
                const isSelected =
                  (activeSlot === 1 && slot1?.name === p.name) ||
                  (activeSlot === 2 && slot2?.name === p.name);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 46px' }}
                    className={`w-full min-h-[46px] p-3 rounded-xl border-2 text-left flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF1F2] border-[#2B1D12] font-black shadow-[2px_2px_0px_#2B1D12]'
                        : 'bg-white border-[#2B1D12]/30 hover:border-[#2B1D12] font-bold text-[#2B1D12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-4 h-4 rounded-full border-2 border-[#2B1D12] flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#E11D48]' : 'bg-white'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-[#7A6658]">
                      {formatRupiah(p.basePrice)}
                    </span>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <p className="text-xs font-bold text-[#7A6658] text-center py-3">
                  Menu tidak ditemukan. Coba kata kunci lain.
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Footer: Rincian + Aksi */}
        <div className="p-4 sm:p-5 border-t-2 border-[#2B1D12] bg-[#FFFDF9] space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#7A6658] font-bold">
              <span>Total Harga Normal</span>
              <span className={isComplete ? 'line-through' : ''}>
                {formatRupiah(normalTotal)}
              </span>
            </div>
            {isComplete && (
              <div className="flex items-center justify-between text-[#DC2626] font-bold">
                <span>1 Menu GRATIS (yang lebih murah)</span>
                <span>-{formatRupiah(cheapestPrice)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#4A3628] font-bold">
              <span>Biaya Jasa B1G1</span>
              <span>+{formatRupiah(fee)}</span>
            </div>
            <div className="pt-2 border-t-2 border-[#2B1D12]/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#7A6658] block">Total Bayar</span>
                <span className="font-display font-black text-lg text-[#2B1D12]">
                  {formatRupiah(highestPrice + fee)}
                </span>
              </div>
              {isComplete && (
                <span className="text-[10px] font-black text-white bg-[#15803D] px-2.5 py-1 rounded-full border border-[#2B1D12]">
                  Kamu Hemat {formatRupiah(cheapestPrice)}!
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isComplete}
            className={`w-full py-3.5 font-display font-black text-sm rounded-xl border-2 transition flex items-center justify-center gap-2 ${
              isComplete
                ? 'bg-[#15803D] hover:bg-[#166534] text-white border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
                : 'bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 cursor-not-allowed shadow-none'
            }`}
          >
            {isComplete ? (
              <>
                <span>Tambah Paket ke Keranjang</span>
                <span>•</span>
                <span>{formatRupiah(highestPrice + fee)}</span>
              </>
            ) : (
              <span>Pilih 2 Menu Terlebih Dahulu</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
