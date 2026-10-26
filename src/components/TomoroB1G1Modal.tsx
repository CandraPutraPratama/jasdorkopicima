'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/domain';
import type { CartItem } from '@/lib/cart-reducer';
import { formatRupiah } from '@/lib/currency';
import { useScrollLock } from '@/hooks/useScrollLock';
import { getTomoroItemConfig } from '@/lib/tomoro-customization-data';

interface TomoroB1G1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
  isOutletClosed?: boolean;
}

interface B1G1SlotState {
  product: Product | null;
  sweetness: string;
}

function getItemSweetnessOptions(productName?: string): string[] {
  if (!productName) return [];
  const cfg = getTomoroItemConfig(productName);
  if (!cfg?.sweetness?.active) return [];
  const opts: string[] = [];
  if (cfg.sweetness.normal) opts.push('Normal Sweet');
  if (cfg.sweetness.less) opts.push('Less Sweet');
  return opts;
}

export function TomoroB1G1Modal({
  isOpen,
  onClose,
  products,
  onAddToCart,
  isOutletClosed = false,
}: TomoroB1G1ModalProps) {
  // 2 Slot Minuman B1G1 (Resep resmi TOMORO: Ukuran Small, Suhu Iced, Kemanisan sesuai menu, tanpa catatan)
  const [slots, setSlots] = useState<[B1G1SlotState, B1G1SlotState]>([
    { product: null, sweetness: '' },
    { product: null, sweetness: '' },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<0 | 1>(0);
  const [search, setSearch] = useState('');

  // Kunci scroll halaman belakang saat sheet aktif
  useScrollLock(isOpen);

  // Refs untuk scroll container dan auto-scroll ke kustomisasi
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const customizationRef = useRef<HTMLDivElement>(null);
  const [isCustomizationHighlighted, setIsCustomizationHighlighted] = useState(false);

  // Pastikan daftar produk unik dan bersih
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    const list: Product[] = [];
    for (const p of products) {
      const key = (p.bundleCode || p.productCode || p.name || String(p.id)).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(p);
      }
    }
    return list;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return uniqueProducts;
    const q = search.toLowerCase();
    return uniqueProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [uniqueProducts, search]);

  if (!isOpen) return null;

  const slot1 = slots[0];
  const slot2 = slots[1];
  const isComplete = slot1.product !== null && slot2.product !== null;

  // Status penguncian slot 2 jika slot 1 belum dipilih
  const isSlotLocked = (idx: number) => {
    if (idx === 0) return false;
    return slot1.product === null;
  };

  const p1Price = slot1.product?.basePrice || 0;
  const p2Price = slot2.product?.basePrice || 0;
  const highestPrice = Math.max(p1Price, p2Price);
  const cheapestPrice = Math.min(p1Price, p2Price);
  const normalTotal = p1Price + p2Price;
  const fee = 3000;

  // Pilih menu dan otomatis scroll ke kustomisasi (sweetness jika tersedia)
  const handleSelectProductForSlot = (index: 0 | 1, product: Product) => {
    const sweetOpts = getItemSweetnessOptions(product.name);
    const defaultSweetness = sweetOpts.length > 0 ? sweetOpts[0] : '';

    setSlots((prev) => {
      const next: [B1G1SlotState, B1G1SlotState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = {
        product,
        sweetness: defaultSweetness,
      };
      return next;
    });

    // Auto-scroll ke kustomisasi dengan efek highlight pulse (sama seperti Bundling Kopi Kenangan)
    setIsCustomizationHighlighted(true);
    setTimeout(() => {
      customizationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
    setTimeout(() => {
      setIsCustomizationHighlighted(false);
    }, 1200);
  };

  const handleUpdateSweetness = (index: 0 | 1, sweetness: string) => {
    setSlots((prev) => {
      const next: [B1G1SlotState, B1G1SlotState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = {
        ...next[index],
        sweetness,
      };
      return next;
    });
  };

  // Pindah ke slot berikutnya (Minuman ke-2) dan scroll kembali ke daftar menu
  const handleGoToNextSlot = () => {
    setActiveSlotIndex(1);
    setSearch('');
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatVariantDescription = (s: B1G1SlotState) => {
    const parts = ['Small', 'Iced'];
    if (s.sweetness) {
      parts.push(s.sweetness);
    }
    return parts.join(', ');
  };

  const handleConfirmAddToCart = () => {
    if (!isComplete || !slot1.product || !slot2.product) return;

    onAddToCart({
      bundleCode: 'tomoro-b1g1',
      name: 'Paket B1G1 TOMORO (Small)',
      basePrice: highestPrice,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: `2 Item: ${slot1.product.name}, ${slot2.product.name}`,
      isBundle: true,
      bundleType: 'tomoro-b1g1',
      bundleFee: 3000,
      bundleNormalPrice: normalTotal,
      bundleDetails: [
        {
          name: slot1.product.name,
          category: 'drink',
          variantDescription: formatVariantDescription(slot1),
          normalPrice: p1Price,
          promoPrice: p1Price >= p2Price ? p1Price : 0,
        },
        {
          name: slot2.product.name,
          category: 'drink',
          variantDescription: formatVariantDescription(slot2),
          normalPrice: p2Price,
          promoPrice: p1Price >= p2Price ? 0 : p2Price,
        },
      ],
      brandSlug: 'tomoro',
    });

    onClose();
  };

  const currentSlot = slots[activeSlotIndex];
  const currentSweetnessOptions = currentSlot.product
    ? getItemSweetnessOptions(currentSlot.product.name)
    : [];

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

        {/* SATU Container Scroll Saja (Scroll Lancar & Mulus) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
          {/* Banner Peringatan jika Outlet Tutup */}
          {isOutletClosed && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-950 shadow-[2px_2px_0px_#2B1D12]">
              <span className="text-base shrink-0 mt-0.5">ℹ️</span>
              <div className="leading-snug">
                <strong className="font-bold block">Outlet Sedang Tutup</strong>
                Kamu tetap dapat memilih menu untuk melihat simulasi total harga & rincian hemat B1G1. Pemesanan akan dibuka kembali saat outlet beroperasi.
              </div>
            </div>
          )}

          {/* Instruksi Alur Pemilihan */}
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[2px_2px_0px_#2B1D12]">
            <p className="text-xs font-bold text-[#4A3628] leading-relaxed">
              Pilih 2 minuman satu per satu, urut mulai dari Minuman 1. Kustomisasi kemanisan tersedia sesuai menu resmi TOMORO (otomatis ukuran Small, Iced).
            </p>
          </div>

          {/* Slot Tabs (Minuman 1 & Minuman 2) */}
          <div className="grid grid-cols-2 gap-2.5">
            {slots.map((slot, idx) => {
              const isActive = idx === activeSlotIndex;
              const locked = isSlotLocked(idx);
              const slotLabel = `Minuman (Pilihan ${idx + 1})`;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setActiveSlotIndex(idx as 0 | 1);
                    setSearch('');
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    locked
                      ? 'bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 shadow-none cursor-not-allowed'
                      : isActive
                        ? 'bg-[#2B1D12] text-[#FAF4E8] border-[#2B1D12] shadow-[2px_2px_0px_#E11D48] cursor-pointer'
                        : 'bg-[#FFFDF9] text-[#2B1D12] border-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12] cursor-pointer'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-90 truncate">
                    {slotLabel}
                  </div>
                  <div className="text-xs font-black truncate mt-1">
                    {slot.product ? slot.product.name : 'Pilih menu...'}
                  </div>
                  {slot.product && (
                    <div className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-[#FDA4AF]' : 'text-[#7A6658]'}`}>
                      Normal: {formatRupiah(slot.product.basePrice)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor Slot Aktif */}
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#2B1D12] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]/10">
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#BE123C]">
                {`PILIH MINUMAN (PILIHAN ${activeSlotIndex + 1})`}
              </span>
              <span className="text-[10px] font-bold text-[#7A6658]">
                {filteredProducts.length} Pilihan Menu
              </span>
            </div>

            {/* Pencarian */}
            <input
              type="text"
              placeholder="Cari menu untuk pilihan ini..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-[#2B1D12]/30 focus:border-[#2B1D12] rounded-xl text-xs font-semibold text-[#2B1D12] placeholder-[#A39282] outline-none transition shadow-[1px_1px_0px_#2B1D12]"
            />

            {/* Daftar Menu */}
            <div className="space-y-2">
              {filteredProducts.map((p) => {
                const isSelected = currentSlot.product?.name === p.name;
                const isSoldOut = Boolean(p.isSoldOut);

                return (
                  <button
                    key={p.bundleCode || p.productCode || p.id || p.name}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => handleSelectProductForSlot(activeSlotIndex, p)}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 52px' }}
                    className={`w-full min-h-[50px] p-2.5 sm:p-3 rounded-xl border-2 text-left flex items-center justify-between text-xs transition-all ${
                      isSoldOut
                        ? 'bg-stone-100 border-stone-300 text-stone-400 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#FFF1F2] border-[#2B1D12] font-black shadow-[2px_2px_0px_#2B1D12] cursor-pointer'
                          : 'bg-white border-[#2B1D12]/30 hover:border-[#2B1D12] font-bold text-[#2B1D12] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <span
                        className={`w-4 h-4 rounded-full border-2 border-[#2B1D12] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#E11D48]' : 'bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>

                      {/* Thumbnail Gambar Produk */}
                      {p.image ? (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-[#2B1D12]/30 bg-[#FAF4E8]">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-black text-xs text-[#2B1D12]">{p.name}</div>
                        {p.description && (
                          <div className="text-[10px] text-[#7A6658] font-normal truncate mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isSoldOut ? (
                        <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          Habis
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#7A6658]">
                          {formatRupiah(p.basePrice)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <p className="text-xs font-bold text-[#7A6658] text-center py-3">
                  Menu tidak ditemukan. Coba kata kunci lain.
                </p>
              )}
            </div>

            {/* Kustomisasi Per Minuman (Dengan Auto-scroll & Highlight Ref) */}
            {currentSlot.product && (
              <div
                ref={customizationRef}
                className={`pt-3 border-t-2 border-[#2B1D12]/15 space-y-3 rounded-2xl p-3 sm:p-4 transition-colors duration-300 ${
                  isCustomizationHighlighted ? 'bg-[#FFE4E6]/80 ring-2 ring-[#E11D48]' : 'bg-[#FAF4E8]/60'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-[#2B1D12]">
                    {`Kustomisasi Minuman ${activeSlotIndex + 1}`}
                  </span>
                  <span className="text-[10px] font-bold text-[#BE123C] bg-[#FFF1F2] px-1.5 py-0.5 rounded border border-[#BE123C]/30">
                    {currentSlot.product.name}
                  </span>
                </div>

                {/* Tingkat Kemanisan (Hanya jika menu mendukung kustomisasi kemanisan) */}
                {currentSweetnessOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#7A6658] block">Tingkat Kemanisan</span>
                    <div className="grid grid-cols-2 gap-2">
                      {currentSweetnessOptions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleUpdateSweetness(activeSlotIndex, s)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                            currentSlot.sweetness === s
                              ? 'bg-[#2B1D12] text-white border-[#2B1D12] shadow-[2px_2px_0px_#E11D48]'
                              : 'bg-white text-[#2B1D12] border-[#2B1D12]/30 hover:bg-[#FAF4E8]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white border border-[#2B1D12]/20 text-[11px] text-[#7A6658] flex items-center gap-2">
                    <span className="text-xs">ℹ️</span>
                    <span className="font-semibold">
                      Kustomisasi normal resmi TOMORO. Tidak ada pilihan tingkat kemanisan.
                    </span>
                  </div>
                )}

                {/* Tombol Cepat Lanjut ke Minuman ke-2 (jika di slot 1 dan slot 2 belum diisi) */}
                {activeSlotIndex === 0 && !slot2.product && (
                  <button
                    type="button"
                    onClick={handleGoToNextSlot}
                    className="w-full mt-2 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Lanjut Pilih Minuman ke-2</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Footer: Rincian + Aksi (Lanjut ke Minuman ke-2 atau Tambah ke Keranjang) */}
        <div className="p-4 sm:p-5 border-t-2 border-[#2B1D12] bg-[#FFFDF9] space-y-3 shrink-0">
          {!isComplete ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#7A6658]">
                <span>Status Pemilihan:</span>
                <span className="text-[#BE123C] font-black">
                  {slot1.product ? '1/2 Minuman Dipilih' : '0/2 Minuman Dipilih'}
                </span>
              </div>
              {slot1.product && (
                <div className="text-[11px] font-bold text-[#4A3628] bg-[#FAF4E8] p-2 rounded-xl border border-[#2B1D12]/20 flex items-center justify-between">
                  <span>
                    Minuman 1: {slot1.product.name}
                    {slot1.sweetness ? ` (${slot1.sweetness})` : ''}
                  </span>
                  <span>{formatRupiah(p1Price)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#7A6658] font-bold">
                <span>Subtotal</span>
                <span className="line-through">{formatRupiah(normalTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#DC2626] font-bold">
                <span>1 Menu GRATIS (yang lebih murah)</span>
                <span>-{formatRupiah(cheapestPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-[#2B1D12] font-black">
                <span>Total</span>
                <span>{formatRupiah(highestPrice)}</span>
              </div>
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
                <span className="text-[10px] font-black text-white bg-[#15803D] px-2.5 py-1 rounded-full border border-[#2B1D12]">
                  Kamu Hemat {formatRupiah(cheapestPrice)}!
                </span>
              </div>
            </div>
          )}

          {/* Tombol Aksi Utama */}
          {!isComplete ? (
            activeSlotIndex === 0 && slot1.product ? (
              <button
                type="button"
                onClick={handleGoToNextSlot}
                className="w-full py-3.5 font-display font-black text-sm rounded-xl border-2 border-[#2B1D12] transition flex items-center justify-center gap-2 bg-[#2B1D12] hover:bg-[#4A3628] text-[#FAF4E8] shadow-[3px_3px_0px_#E11D48] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              >
                <span>Lanjut ke Minuman ke-2 →</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3.5 font-display font-black text-sm rounded-xl border-2 bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 cursor-not-allowed shadow-none"
              >
                <span>{`Pilih Minuman ke-${activeSlotIndex + 1} Terlebih Dahulu`}</span>
              </button>
            )
          ) : isOutletClosed ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 font-display font-black text-xs sm:text-sm rounded-xl border-2 bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 cursor-not-allowed shadow-none"
            >
              Outlet Sedang Tutup (Mode Window Shopping)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAddToCart}
              className="w-full py-3.5 font-display font-black text-sm rounded-xl border-2 transition flex items-center justify-center gap-2 bg-[#15803D] hover:bg-[#166534] text-white border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <span>Tambah Paket ke Keranjang</span>
              <span>•</span>
              <span>{formatRupiah(highestPrice + fee)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
