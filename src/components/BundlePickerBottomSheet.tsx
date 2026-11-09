'use client';

import { useState, useMemo, useRef } from 'react';
import { formatRupiah } from '@/lib/currency';
import {
  type BundlePackageConfig,
  type BundleSelectedItem,
  REGULAR_ELIGIBLE_DRINKS,
  LARGE_ELIGIBLE_DRINKS,
  ELIGIBLE_FOODS,
  calculateBundlePricing,
  normalizeProductName,
  getOutletTierDiff,
} from '@/lib/bundling';
import type { CartItem } from '@/lib/cart-reducer';
import type { Product } from '@/types/domain';
import { useScrollLock } from '@/hooks/useScrollLock';

interface BundlePickerBottomSheetProps {
  config: BundlePackageConfig;
  liveProducts: Product[];
  tierDiff?: number;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

interface SlotState {
  category: 'drink' | 'food';
  productName: string;
  bundleCode?: string;
  livePrice?: number;
  sugar: string;
  ice: string;
  notes?: string;
}

export function BundlePickerBottomSheet({
  config,
  liveProducts,
  tierDiff,
  onClose,
  onAddToCart,
}: BundlePickerBottomSheetProps) {
  // Hitung tier diff jika tidak dioper secara eksplisit
  const effectiveTierDiff = useMemo(() => {
    return tierDiff !== undefined ? tierDiff : getOutletTierDiff(liveProducts);
  }, [tierDiff, liveProducts]);

  // Kunci scroll halaman belakang secara menyeluruh saat sheet aktif
  useScrollLock(true);

  // Refs untuk scroll halus dan auto-scroll ke kustomisasi
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const customizationRef = useRef<HTMLDivElement>(null);
  const [isCustomizationHighlighted, setIsCustomizationHighlighted] = useState(false);

  // Buat map harga live outlet berdasarkan nama produk
  const livePriceMap = useMemo(() => {
    const map = new Map<string, { basePrice: number; bundleCode: string; isSoldOut: boolean }>();
    for (const p of liveProducts) {
      map.set(normalizeProductName(p.name), {
        basePrice: p.basePrice,
        bundleCode: p.bundleCode,
        isSoldOut: p.isSoldOut || false,
      });
    }
    return map;
  }, [liveProducts]);

  // Alur isi 1 per 1 (urut): slot mulai KOSONG, bukan terisi default.
  // Slot yang sudah terisi bisa diklik lagi untuk diubah; slot kosong hanya
  // bisa dibuka kalau semua slot sebelumnya sudah terisi (slot kosong pertama
  // yang belum terisi). Slot selebihnya terkunci (abu-abu, tidak bisa diklik).
  const initialSlots: SlotState[] = useMemo(() => {
    if (config.id === 'bundle-3-reguler') {
      return [
        { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
        { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
        { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
      ];
    }
    if (config.id === 'bundle-2-large') {
      return [
        { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
        { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
      ];
    }
    // bundle-2-drink-2-food
    return [
      { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
      { category: 'drink', productName: '', sugar: 'Normal Sugar', ice: 'Normal Ice', notes: '' },
      { category: 'food', productName: '', sugar: '', ice: '', notes: '' },
      { category: 'food', productName: '', sugar: '', ice: '', notes: '' },
    ];
  }, [config.id]);

  const [slots, setSlots] = useState<SlotState[]>(initialSlots);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Status alur urut: indeks slot kosong pertama (-1 kalau semua sudah terisi)
  const firstUnfilledIndex = slots.findIndex((s) => !s.productName);
  const isComplete = firstUnfilledIndex === -1;
  const isSlotLocked = (idx: number) => {
    if (slots[idx]?.productName) return false;
    return firstUnfilledIndex !== -1 && idx !== firstUnfilledIndex;
  };
  // Nomor urut dalam kategorinya (Minuman ke-1/2, Makanan ke-1/2) supaya
  // label tombol, tab, dan editor konsisten satu sama lain.
  const slotOrdinal = (idx: number) =>
    slots.slice(0, idx + 1).filter((s) => s.category === slots[idx].category).length;
  const slotKindLabel = (idx: number) => (slots[idx].category === 'food' ? 'Makanan' : 'Minuman');

  // Tombol langkah berikutnya: pindah ke slot kosong pertama (daftar menunya)
  const handleGoToNextSlot = () => {
    if (firstUnfilledIndex === -1) return;
    setActiveSlotIndex(firstUnfilledIndex);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Daftar item eligible untuk slot aktif
  const eligibleItems = useMemo(() => {
    const currentCategory = slots[activeSlotIndex]?.category || 'drink';
    if (config.id === 'bundle-3-reguler') {
      return REGULAR_ELIGIBLE_DRINKS;
    }
    if (config.id === 'bundle-2-large') {
      return LARGE_ELIGIBLE_DRINKS;
    }
    // bundle-2-drink-2-food
    return currentCategory === 'food' ? ELIGIBLE_FOODS : REGULAR_ELIGIBLE_DRINKS;
  }, [config.id, slots, activeSlotIndex]);

  // Precompute data display untuk render list yang efisien:
  // HANYA menampilkan item yang ADA di menu outlet saat ini dan TIDAK sold out
  const preparedItems = useMemo(() => {
    return eligibleItems
      .filter((item) => {
        const liveInfo = livePriceMap.get(normalizeProductName(item.name));
        return Boolean(liveInfo && !liveInfo.isSoldOut);
      })
      .map((item) => {
        const liveInfo = livePriceMap.get(normalizeProductName(item.name))!;
        const displayBase = liveInfo.basePrice || (item.baselinePrice + effectiveTierDiff);
        const displayPrice = config.id === 'bundle-2-large' ? item.baselinePrice + effectiveTierDiff : displayBase;
        return {
          name: item.name,
          displayPrice,
        };
      });
  }, [eligibleItems, livePriceMap, config.id, effectiveTierDiff]);

  const hasUnavailableItems = preparedItems.length < eligibleItems.length;

  // Update pilihan produk pada slot tertentu dan auto-scroll ke kustomisasi
  const handleSelectProductForSlot = (index: number, productName: string) => {
    setSlots((prev) => {
      const next = [...prev];
      const liveInfo = livePriceMap.get(normalizeProductName(productName));
      next[index] = {
        ...next[index],
        productName,
        bundleCode: liveInfo?.bundleCode,
        livePrice: liveInfo?.basePrice,
      };
      return next;
    });

    // Auto-scroll ke kustomisasi dengan animasi pulse highlight
    setIsCustomizationHighlighted(true);
    setTimeout(() => {
      customizationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
    setTimeout(() => {
      setIsCustomizationHighlighted(false);
    }, 1200);
  };

  const handleUpdateOption = (index: number, key: 'sugar' | 'ice' | 'notes', value: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  // Hitung running total
  const bundleCalculation = useMemo(() => {
    const selectedInputs: BundleSelectedItem[] = slots.map((s) => {
      const liveInfo = livePriceMap.get(normalizeProductName(s.productName));
      const optParts: string[] = [];
      if (s.category === 'drink') {
        optParts.push(s.sugar);
        optParts.push(s.ice);
      }
      if (s.notes?.trim()) {
        optParts.push(`Catatan: "${s.notes.trim()}"`);
      }
      return {
        name: s.productName,
        category: s.category,
        liveBasePrice: liveInfo?.basePrice,
        variantDescription: optParts.length > 0 ? optParts.join(', ') : undefined,
      };
    });

    return calculateBundlePricing(config.id, selectedInputs, effectiveTierDiff);
  }, [slots, livePriceMap, config.id, effectiveTierDiff]);

  // Validasi rentang harga normal 50.000 - 60.000 FIX untuk SEMUA tipe bundling
  const isOutOfRange =
    bundleCalculation.normalPrice < 50000 || bundleCalculation.normalPrice > 60000;

  const handleConfirmAddToCart = () => {
    if (!isComplete || isOutOfRange) return;
    const bundleDetails = slots.map((s, idx) => {
      const breakdown = bundleCalculation.itemBreakdown[idx];
      const optParts: string[] = [];
      if (s.category === 'drink') {
        optParts.push(s.sugar);
        optParts.push(s.ice);
      }
      return {
        name: s.productName,
        category: s.category,
        variantDescription: optParts.length > 0 ? optParts.join(', ') : undefined,
        normalPrice: breakdown?.normalPrice || 0,
        promoPrice: breakdown?.promoPrice || 0,
        notes: s.notes?.trim() || undefined,
      };
    });

    const cartItem: Omit<CartItem, 'id'> = {
      bundleCode: `bundle-${config.id}`,
      name: config.name,
      basePrice: bundleCalculation.normalPrice,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: `${slots.length} Item: ${slots.map((s) => s.productName).join(', ')}`,
      isBundle: true,
      bundleType: config.id,
      bundleFee: config.fee,
      bundleNormalPrice: bundleCalculation.normalPrice,
      bundleDetails,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in duration-200">
      {/* Backdrop Overlay - WAJIB memblokir klik tembus ke konten bawahnya */}
      <div
        className="fixed inset-0 bg-[#26150B]/60 touch-none cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content: Full-screen (100dvh) di mobile dengan SINGLE scroll container */}
      <div
        className="relative w-full sm:max-w-lg h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-[#FAF4E8] border-t-2 sm:border-2 border-[#2B1D12] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Dialog */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2B1D12] bg-[#FFFDF9] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#DC2626] text-white px-2 py-0.5 rounded-md border border-[#2B1D12]">
                Diskon 50%
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFE7D6] text-[#2B1D12] px-2 py-0.5 rounded-md border border-[#2B1D12]">
                {config.badge}
              </span>
            </div>
            <h2 className="font-display font-black text-lg sm:text-xl text-[#2B1D12] mt-1">
              {config.name}
            </h2>
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
          {/* Instruksi Slot */}
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[2px_2px_0px_#2B1D12]">
            <p className="text-xs font-bold text-[#4A3628] leading-relaxed">
              {`Pilih ${slots.length} item satu per satu, urut mulai dari Pilihan 1. Tiap item bebas kamu tentukan tingkat kemanisan & esnya. Ukuran otomatis ${config.fixedSize}.`}
            </p>
          </div>

          {/* Deretan Slot Navigation Tabs: Label Sederhana "Minuman (Pilihan 1)", dst */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {slots.map((slot, idx) => {
              const isActive = idx === activeSlotIndex;
              const locked = isSlotLocked(idx);
              const slotLabel = `${slotKindLabel(idx)} (Pilihan ${slotOrdinal(idx)})`;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={locked}
                  onClick={() => setActiveSlotIndex(idx)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    locked
                      ? 'bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 shadow-none cursor-not-allowed'
                      : isActive
                        ? 'bg-[#2B1D12] text-[#FAF4E8] border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] cursor-pointer'
                        : 'bg-[#FFFDF9] text-[#2B1D12] border-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12] cursor-pointer'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-90 break-words leading-tight">
                    {slotLabel}
                  </div>
                  <div className="text-xs font-black leading-tight break-words mt-1 line-clamp-2">
                    {slot.productName || 'Pilih item...'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Slot Active Editor: Render natural tanpa scrollbox bersarang */}
          {slots[activeSlotIndex] && (
            <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#2B1D12] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]/10">
                <span className="font-display font-black text-xs uppercase tracking-wider text-[#C67D0A]">
                  {`PILIH ${slotKindLabel(activeSlotIndex).toUpperCase()} (PILIHAN ${slotOrdinal(activeSlotIndex)})`}
                </span>
                <span className="text-[10px] font-bold text-[#7A6658]">
                  {preparedItems.length} Pilihan Menu
                </span>
              </div>

              {/* Catatan ramah jika ada item tidak tersedia di outlet */}
              {hasUnavailableItems && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF4E8] border border-[#2B1D12]/15 text-[11px] text-[#7A6658]">
                  <span className="text-xs shrink-0">ℹ️</span>
                  <span className="font-bold">Beberapa menu tidak tersedia di outlet ini</span>
                </div>
              )}

              {/* Pilihan Menu Eligible */}
              <div className="space-y-2">
                {preparedItems.map((item) => {
                  const isSelected = slots[activeSlotIndex].productName === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectProductForSlot(activeSlotIndex, item.name)}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 46px' }}
                      className={`w-full min-h-[46px] p-3 rounded-xl border-2 text-left flex items-center justify-between text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFE7D6] border-[#2B1D12] font-black shadow-[2px_2px_0px_#2B1D12]'
                          : 'bg-white border-[#2B1D12]/30 hover:border-[#2B1D12] font-bold text-[#2B1D12]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-4 h-4 rounded-full border-2 border-[#2B1D12] flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#2B1D12]' : 'bg-white'}`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="font-bold leading-tight break-words pr-1">{item.name}</span>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#7A6658]">
                        {formatRupiah(item.displayPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Kustomisasi Per Item (Dengan Auto-scroll & Highlight) */}
              <div
                ref={customizationRef}
                className={`pt-3 border-t-2 border-[#2B1D12]/15 space-y-3 rounded-xl p-3 transition-colors duration-300 ${
                  isCustomizationHighlighted ? 'bg-[#FFE7D6]/70 ring-2 ring-[#C67D0A]' : 'bg-[#FAF4E8]/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#2B1D12]">
                    {`Kustomisasi ${slotKindLabel(activeSlotIndex)} ${slotOrdinal(activeSlotIndex)}`}
                  </span>
                  <span className="text-[11px] font-bold text-[#7A6658]">(Opsional)</span>
                </div>

                {/* Opsi Kemanisan & Es (Hanya untuk minuman) */}
                {slots[activeSlotIndex].category === 'drink' && (
                  <div className="space-y-3">
                    {/* Sugar Level */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#7A6658] block">Tingkat Kemanisan</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['Normal Sugar', 'Less Sugar', 'No Sugar'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleUpdateOption(activeSlotIndex, 'sugar', s)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                              slots[activeSlotIndex].sugar === s
                                ? 'bg-[#2B1D12] text-white border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A]'
                                : 'bg-white text-[#2B1D12] border-[#2B1D12]/30 hover:bg-[#FAF4E8]'
                            }`}
                          >
                            {s.replace(' Sugar', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ice Level */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#7A6658] block">Tingkat Es</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['Normal Ice', 'Less Ice', 'No Ice'].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleUpdateOption(activeSlotIndex, 'ice', i)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                              slots[activeSlotIndex].ice === i
                                ? 'bg-[#2B1D12] text-white border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A]'
                                : 'bg-white text-[#2B1D12] border-[#2B1D12]/30 hover:bg-[#FAF4E8]'
                            }`}
                          >
                            {i.replace(' Ice', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Field Catatan Tambahan (Opsional) */}
                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor={`slot-notes-${activeSlotIndex}`}
                    className="text-[11px] font-bold text-[#7A6658] flex items-center justify-between"
                  >
                    <span>Catatan Item</span>
                    <span className="text-[10px] text-[#A39282]">(Maks 50 karakter)</span>
                  </label>
                  <input
                    id={`slot-notes-${activeSlotIndex}`}
                    type="text"
                    maxLength={50}
                    enterKeyHint="done"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    value={slots[activeSlotIndex].notes || ''}
                    onChange={(e) => handleUpdateOption(activeSlotIndex, 'notes', e.target.value)}
                    placeholder="Contoh: Pisah es, sedotan, dll"
                    className="w-full px-3 py-2 bg-white border-2 border-[#2B1D12]/30 focus:border-[#2B1D12] rounded-xl text-xs font-semibold text-[#2B1D12] placeholder-[#A39282] outline-none transition shadow-[1px_1px_0px_#2B1D12]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Running Total & Footer Action (Box rincian isi paket ganda telah dihapus) */}
        <div className="p-4 sm:p-5 border-t-2 border-[#2B1D12] bg-[#FFFDF9] space-y-3 shrink-0">
          {!isComplete ? (
            <div className="py-3 text-center">
              <span className="text-sm font-black text-[#7A6658]">Menghitung harga...</span>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#7A6658] font-bold">
                <span>Total Harga Normal</span>
                <span className="line-through">{formatRupiah(bundleCalculation.normalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-[#DC2626] font-bold">
                <span>Diskon 50%</span>
                <span>-{formatRupiah(bundleCalculation.promoSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#4A3628] font-bold">
                <span>Biaya Jasa Paket</span>
                <span>+{formatRupiah(bundleCalculation.bundleFee)}</span>
              </div>
              <div className="pt-2 border-t-2 border-[#2B1D12]/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7A6658] block">Total Bayar</span>
                  <span className="font-display font-black text-lg text-[#2B1D12]">
                    {formatRupiah(bundleCalculation.total)}
                  </span>
                </div>
                <span className="text-[10px] font-black text-white bg-[#15803D] px-2.5 py-1 rounded-full border border-[#2B1D12]">
                  {`Kamu Hemat ${formatRupiah(bundleCalculation.totalSavings)}!`}
                </span>
              </div>
            </div>
          )}

          {/* Pesan Validasi Rentang 50rb-60rb FIX untuk Semua Paket Bundling */}
          {isComplete && isOutOfRange && (
            <div className="p-2.5 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl text-center shadow-[1px_1px_0px_#DC2626]">
              <p className="text-xs font-black text-[#DC2626]">
                {`Total ${formatRupiah(bundleCalculation.normalPrice)} - pilih kombinasi 50rb-60rb`}
              </p>
            </div>
          )}

          {!isComplete ? (
            <button
              type="button"
              onClick={handleGoToNextSlot}
              className="w-full py-3.5 font-display font-black text-sm rounded-xl border-2 border-[#2B1D12] transition flex items-center justify-center gap-2 bg-[#2B1D12] hover:bg-[#4A3628] text-[#FAF4E8] shadow-[3px_3px_0px_#C67D0A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <span>{`Pilih ${slotKindLabel(firstUnfilledIndex)} ke ${slotOrdinal(firstUnfilledIndex)}`}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAddToCart}
              disabled={isOutOfRange}
              className={`w-full py-3.5 font-display font-black text-sm rounded-xl border-2 border-[#2B1D12] transition flex items-center justify-center gap-2 ${
                isOutOfRange
                  ? 'bg-[#E5DCD0] text-[#8C7667] border-[#2B1D12]/40 cursor-not-allowed shadow-none'
                  : 'bg-[#15803D] hover:bg-[#166534] text-white shadow-[3px_3px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
              }`}
            >
              <span>Tambah Paket ke Keranjang</span>
              <span>•</span>
              <span>{formatRupiah(bundleCalculation.total)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
