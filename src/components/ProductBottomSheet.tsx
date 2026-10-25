'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Product, ProductOptionDetails, Addon, VariantSku } from '@/types/domain';
import type { CartItem } from '@/lib/cart-reducer';
import {
  findMatchingSku,
  isDimensionValueAvailable,
  calculateBottomSheetPricing,
} from '@/lib/option-validation';
import { formatRupiah } from '@/lib/currency';
import { getOptionAddition, BUSINESS_CONFIG } from '@/config/business';
import { cleanNotes, filterOrderNotesInput } from '@/lib/sanitizer';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ProductBottomSheetProps {
  outletCode: string;
  product: Product;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
  isOutletClosed?: boolean;
  brandSlug?: string;
}

export function ProductBottomSheet({
  outletCode,
  product,
  onClose,
  onAddToCart,
  isOutletClosed = false,
  brandSlug,
}: ProductBottomSheetProps) {
  // Kunci scroll halaman belakang selama sheet detail produk terbuka
  useScrollLock(true);

  const isFore =
    brandSlug === 'fore' ||
    outletCode.toLowerCase().startsWith('fore-') ||
    product.bundleCode?.startsWith('FORE_');

  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [options, setOptions] = useState<ProductOptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User selections
  const [selectedDimensions, setSelectedDimensions] = useState<Record<number, number>>({});
  const [selectedNotes, setSelectedNotes] = useState<Record<string, string>>({});
  const [selectedWhippedCream, setSelectedWhippedCream] = useState<Addon | null>(null);
  const [selectedDairy, setSelectedDairy] = useState<Addon | null>(null);
  const [selectedEspresso, setSelectedEspresso] = useState<Addon | null>(null);
  const [selectedSyrups, setSelectedSyrups] = useState<Addon[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Fetch product options
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`/api/outlets/${encodeURIComponent(outletCode)}/products/${encodeURIComponent(product.bundleCode)}/options`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal memuat opsi varian');
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          const opt: ProductOptionDetails = data.options;
          setOptions(opt);

          // Inisialisasi default selections dimensi
          const initialDims: Record<number, number> = {};
          if (opt && opt.dimensions) {
            for (const dim of opt.dimensions) {
              const defaultVal = opt.defaultSelectionMap?.[String(dim.code)];
              if (defaultVal) {
                initialDims[dim.code] = Number(defaultVal);
              } else if (dim.values && dim.values.length > 0) {
                initialDims[dim.code] = dim.values[0].id;
              }
            }
          }
          setSelectedDimensions(initialDims);

          // Inisialisasi default notes (Ice level)
          const initialNotes: Record<string, string> = {};
          if (opt && opt.notes) {
            for (const noteGroup of opt.notes) {
              if (noteGroup.options && noteGroup.options.length > 0) {
                initialNotes[noteGroup.name] = noteGroup.options[0];
              }
            }
          }
          setSelectedNotes(initialNotes);

          // Inisialisasi default dairy (Fore Coffee)
          const allAddons = opt?.addons || [];
          const dairies = allAddons.filter((a) => a.group === 'dairy');
          if (dairies.length > 0) {
            const defaultDairy =
              dairies.find((d) => d.name.toLowerCase() === 'milk') ||
              dairies.find((d) => d.name.toLowerCase() === 'no milk') ||
              dairies[0];
            setSelectedDairy(defaultDairy);
          } else {
            setSelectedDairy(null);
          }

          // Inisialisasi default espresso (Fore Coffee)
          const espressos = allAddons.filter((a) => a.group === 'espresso');
          if (espressos.length > 0) {
            const defaultEsp =
              espressos.find((e) => e.name.toLowerCase() === 'normal shot') ||
              espressos.find((e) => e.name.toLowerCase() === 'no coffee') ||
              espressos[0];
            setSelectedEspresso(defaultEsp);
          } else {
            setSelectedEspresso(null);
          }

          // Whipped cream & sirup/topping
          setSelectedWhippedCream(null);
          setSelectedSyrups([]);
          setSelectedToppings([]);

          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Terjadi kesalahan saat memuat varian');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [outletCode, product.bundleCode]);

  // Pisahkan addons ke dalam grup per spesifikasi
  const { whippedCreamAddons, syrupAddons, toppingAddons, dairyAddons, espressoAddons } = useMemo(() => {
    const all = options?.addons || [];
    const whipped = all.filter((a) => a.group === 'whipped_cream');
    const syrup = all.filter((a) => a.group === 'syrup');
    const topping = all.filter((a) => a.group === 'topping');
    const dairy = all.filter((a) => a.group === 'dairy');
    const espresso = all.filter((a) => a.group === 'espresso');
    return {
      whippedCreamAddons: whipped,
      syrupAddons: syrup,
      toppingAddons: topping,
      dairyAddons: dairy,
      espressoAddons: espresso,
    };
  }, [options?.addons]);

  // Gabungan seluruh addons yang terpilih
  const selectedAddons = useMemo(() => {
    const list: Addon[] = [];
    if (selectedWhippedCream) {
      list.push(selectedWhippedCream);
    }
    if (selectedDairy) {
      list.push(selectedDairy);
    }
    if (selectedEspresso) {
      list.push(selectedEspresso);
    }
    list.push(...selectedSyrups);
    list.push(...selectedToppings);
    return list;
  }, [selectedWhippedCream, selectedDairy, selectedEspresso, selectedSyrups, selectedToppings]);

  // Daftar nama opsi yang dipilih user
  const selectedOptionNames = useMemo(() => {
    if (!options?.dimensions) return [];
    const names: string[] = [];
    for (const dim of options.dimensions) {
      const selectedId = selectedDimensions[dim.code];
      const found = dim.values.find((v) => v.id === selectedId);
      if (found) {
        names.push(found.name);
      }
    }
    return names;
  }, [options, selectedDimensions]);

  // Aturan Hot vs Es: minuman panas tidak punya urusan es, jadi grup notes
  // Ice Level disembunyikan total saat Temperature = Hot (dan nilainya tidak
  // ikut ke deskripsi varian). Dimensi Temperature dikenali dari namanya atau
  // dari adanya nilai "Hot" di opsinya.
  // Sengaja dihitung langsung tanpa useMemo: memo manual di sini membuat
  // React Compiler gagal mempertahankan memoization (lint error).
  // Datanya kecil (beberapa dimensi saja) sehingga hitung ulang per render
  // tidak ada biayanya.
  const temperatureDim = options?.dimensions?.find(
    (d) => /temperature/i.test(d.name) || d.values.some((v) => v.name === 'Hot')
  );
  const selectedTempValue = temperatureDim?.values.find(
    (v) => v.id === selectedDimensions[temperatureDim.code]
  );
  const isHotSelected = selectedTempValue?.name === 'Hot';

  const isIceNoteGroup = (name: string) => /ice/i.test(name);

  // SKU varian yang cocok dengan kombinasi terpilih (hanya untuk validasi stok)
  const matchedSku: VariantSku | null = options?.optionMap
    ? findMatchingSku(options.optionMap, selectedDimensions)
    : null;

  // Hitung rincian harga dinamis (harga coret dari SKU KK asli, promo tetap flat)
  const pricing = useMemo(() => {
    return calculateBottomSheetPricing(
      product.basePrice,
      selectedOptionNames,
      selectedAddons,
      quantity,
      matchedSku?.price,
      brandSlug || outletCode
    );
  }, [product.basePrice, selectedOptionNames, selectedAddons, quantity, matchedSku?.price, brandSlug, outletCode]);

  // Cek apakah Whipped Cream / Susu / Espresso wajib tapi belum dipilih
  const hasWhippedCreamOptions = whippedCreamAddons.length > 0;
  const isWhippedCreamMissing = hasWhippedCreamOptions && !selectedWhippedCream;
  const isDairyMissing = dairyAddons.length > 0 && !selectedDairy;
  const isEspressoMissing = espressoAddons.length > 0 && !selectedEspresso;
  const isAddToCartDisabled =
    isLoading ||
    Boolean(errorMessage) ||
    isWhippedCreamMissing ||
    isDairyMissing ||
    isEspressoMissing ||
    Boolean(isOutletClosed);

  const handleSelectDimensionValue = (dimCode: number, valId: number) => {
    if (!options?.optionMap) return;
    const isAvailable = isDimensionValueAvailable(
      options.optionMap,
      selectedDimensions,
      dimCode,
      valId
    );
    if (!isAvailable) return;

    setSelectedDimensions((prev) => ({
      ...prev,
      [dimCode]: valId,
    }));

    // Ganti Temperature: Hot = bersihkan pilihan Ice Level (tidak relevan);
    // kembali ke Ice = kembalikan default Ice Level bila kosong.
    if (temperatureDim && dimCode === temperatureDim.code) {
      const newValName = temperatureDim.values.find((v) => v.id === valId)?.name;
      if (newValName === 'Hot') {
        setSelectedNotes((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (isIceNoteGroup(key)) delete next[key];
          }
          return next;
        });
      } else {
        setSelectedNotes((prev) => {
          const next = { ...prev };
          for (const noteGroup of options.notes || []) {
            if (isIceNoteGroup(noteGroup.name) && !next[noteGroup.name] && noteGroup.options.length > 0) {
              next[noteGroup.name] = noteGroup.options[0];
            }
          }
          return next;
        });
      }
    }
  };

  const handleToggleSyrup = (addon: Addon) => {
    if (addon.isSoldOut) return;
    setSelectedSyrups((prev) => {
      const exists = prev.some((a) => a.sku === addon.sku);
      if (exists) {
        return prev.filter((a) => a.sku !== addon.sku);
      }
      if (isFore) {
        // Fore maksimal 1 pilihan sirup
        return [addon];
      }
      return [...prev, addon];
    });
  };

  const handleToggleTopping = (addon: Addon) => {
    if (addon.isSoldOut) return;
    setSelectedToppings((prev) => {
      const exists = prev.some((a) => a.sku === addon.sku);
      if (exists) {
        return prev.filter((a) => a.sku !== addon.sku);
      }
      if (isFore && prev.length >= 2) {
        // Fore maksimal 2 pilihan topping
        return prev;
      }
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    if (isAddToCartDisabled) return;

    // Kumpulkan ringkasan varian
    const variantParts: string[] = [...selectedOptionNames];

    // Tambahkan pilihan susu dan espresso jika ada
    if (selectedDairy && !variantParts.includes(selectedDairy.name)) {
      variantParts.push(selectedDairy.name);
    }
    if (selectedEspresso && !variantParts.includes(selectedEspresso.name)) {
      variantParts.push(selectedEspresso.name);
    }

    // Tambahkan notes (misal: Ice Level, Tingkat Kepanasan, Kemanisan)
    if (selectedNotes) {
      const isHot = isHotSelected || selectedOptionNames.includes('Hot');
      for (const [groupName, valText] of Object.entries(selectedNotes)) {
        if (isHotSelected && isIceNoteGroup(groupName)) continue;
        if (isHot && (groupName === 'Jumlah Es Batu' || groupName === 'Jumlah Es')) {
          continue;
        }
        if (!isHot && groupName === 'Tingkat Kepanasan') {
          continue;
        }
        if (valText && !variantParts.includes(valText)) {
          variantParts.push(valText);
        }
      }
    }

    const variantDescription = variantParts.join(', ');

    onAddToCart({
      bundleCode: product.bundleCode,
      sku: matchedSku?.sku,
      skuPrice: matchedSku?.price,
      name: product.name,
      image: product.image,
      basePrice: product.basePrice,
      variantAddition: pricing.variantAddition,
      toppingTotal: pricing.toppingTotal,
      quantity,
      variantDescription,
      addons: selectedAddons,
      notes: cleanNotes(customerNotes),
      brandSlug: brandSlug || (isFore ? 'fore' : undefined),
    });

    onClose();
  };

  // Helper untuk menentukan grid kolom: 3 opsi -> grid-cols-3, 2 atau >=4 opsi -> grid-cols-2
  const getGridColsClass = (count: number) => {
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#26150B]/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200 overscroll-contain">
      {/* Backdrop tap to dismiss */}
      <div className="fixed inset-0 touch-none" onClick={onClose} aria-hidden="true" />

      {/* Sheet Container (Mobile-first max-w-md) */}
      <div className="relative w-full max-w-md max-h-[92vh] bg-[#FAF4E8] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 overscroll-contain border-t-2 border-x-2 border-[#2B1D12]">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#2B1D12] rounded-full mx-auto mt-2.5 mb-1" />

        {/* Header Lembar Produk */}
        <div className="sticky top-0 z-10 bg-[#FAF4E8] px-5 py-3 border-b-2 border-[#2B1D12] flex items-center justify-between touch-none">
          <div className="pr-4">
            <h3 className="font-display font-black text-base text-[#2B1D12] line-clamp-1">
              {product.name}
            </h3>
            <span className="text-[11px] text-[#C67D0A] font-extrabold uppercase tracking-wide">
              Kustomisasi Menu
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#2B1D12] bg-white border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            aria-label="Tutup lembar detail produk"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain">
          {/* Ringkasan Produk */}
          <div className="flex gap-3 pb-3 border-b-2 border-[#2B1D12]">
            <div className="relative w-18 h-18 bg-[#FAF4E8] rounded-2xl overflow-hidden shrink-0 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
              {product.image && !imageFailed ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="72px"
                  onError={() => setImageFailed(true)}
                  className="object-cover"
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
                    className="w-6 h-6 text-[#2B1D12]"
                    aria-hidden="true"
                  >
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                  <span className="text-[7px] font-black uppercase tracking-wider text-[#8C7667] mt-0.5">
                    Jasdor
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-[#2B1D12] font-medium line-clamp-2">
                {product.description || 'Pilih varian suhu, ukuran, dan topping favoritmu.'}
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="font-display text-base font-black text-[#DC2626]">
                  {formatRupiah(pricing.promoPricePerItem)}
                </span>
                <span className="text-xs text-[#8C7667] line-through">
                  {formatRupiah(pricing.originalPricePerItem)}
                </span>
                <span className="text-[10px] font-black text-[#DC2626] bg-[#FFEBEB] border-2 border-[#DC2626] px-1.5 py-0.2 rounded-md">
                  {isFore ? '-25%' : '-50%'}
                </span>
              </div>
            </div>
          </div>

          {/* Loading Varian */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <div className="h-4 bg-[#EFE5D8] rounded w-1/3 animate-pulse border-2 border-[#D4C3B2]" />
              <div className="flex gap-2">
                <div className="h-10 bg-[#FFFDF9] rounded-xl w-24 animate-pulse border-2 border-[#D4C3B2]" />
                <div className="h-10 bg-[#FFFDF9] rounded-xl w-24 animate-pulse border-2 border-[#D4C3B2]" />
              </div>
              <div className="h-4 bg-[#EFE5D8] rounded w-1/4 animate-pulse border-2 border-[#D4C3B2]" />
              <div className="flex gap-2">
                <div className="h-10 bg-[#FFFDF9] rounded-xl w-28 animate-pulse border-2 border-[#D4C3B2]" />
                <div className="h-10 bg-[#FFFDF9] rounded-xl w-28 animate-pulse border-2 border-[#D4C3B2]" />
              </div>
            </div>
          )}

          {/* Error Varian */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-[#DC2626] rounded-2xl text-rose-900 text-xs font-bold shadow-[2px_2px_0px_#2B1D12]">
              {errorMessage}
            </div>
          )}

          {/* 1. Opsi Dimensi Varian (Temperature, Size, Beans, Milk, Sugar Level) */}
          {!isLoading && options?.dimensions && options.dimensions.map((dim) => {
            const gridClass = getGridColsClass(dim.values.length);
            return (
              <div key={dim.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide">
                    {dim.name}
                  </span>
                  <span className="text-[10px] text-[#2B1D12] font-bold bg-[#FFF0C2] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                    Pilih 1
                  </span>
                </div>

                <div className={`grid ${gridClass} gap-2`}>
                  {dim.values.map((val) => {
                    const isSelected = selectedDimensions[dim.code] === val.id;
                    const isAvailable = isDimensionValueAvailable(
                      options.optionMap,
                      selectedDimensions,
                      dim.code,
                      val.id
                    );
                    const addition = getOptionAddition(val.name);

                    return (
                      <button
                        key={val.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSelectDimensionValue(dim.code, val.id)}
                        className={`min-h-[46px] p-2 rounded-xl text-xs font-bold border-2 text-center flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                            : isAvailable
                            ? 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                            : 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed line-through'
                        }`}
                      >
                        <span className="line-clamp-2 leading-tight">{val.name}</span>
                        {addition > 0 && (
                          <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#C67D0A]'}`}>
                            +{formatRupiah(addition)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 2. Opsi Notes (Ice Level, Kepanasan, Kemanisan, Cup) */}
          {!isLoading && options?.notes && options.notes.map((note) => {
            if (isHotSelected && isIceNoteGroup(note.name)) return null;
            const isHot = isHotSelected || selectedOptionNames.includes('Hot');
            if (isHot && (note.name === 'Jumlah Es Batu' || note.name === 'Jumlah Es')) {
              return null;
            }
            if (!isHot && note.name === 'Tingkat Kepanasan') {
              return null;
            }
            const gridClass = getGridColsClass(note.options.length);
            return (
              <div key={note.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide">
                    {note.name}
                  </span>
                  <span className="text-[10px] text-[#2B1D12] font-bold bg-[#DDF0FF] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                    Pilih 1
                  </span>
                </div>

                <div className={`grid ${gridClass} gap-2`}>
                  {note.options.map((optText) => {
                    const isSelected = selectedNotes[note.name] === optText;
                    return (
                      <button
                        key={optText}
                        type="button"
                        onClick={() =>
                          setSelectedNotes((prev) => ({
                            ...prev,
                            [note.name]: optText,
                          }))
                        }
                        className={`min-h-[46px] p-2 rounded-xl text-xs font-bold border-2 text-center flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                            : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                        }`}
                      >
                        <span className="line-clamp-2 leading-tight">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Opsi Whipped Cream (Tepat di bawah Ice Level, khusus Frappe, Pilih 1 Radio, Gratis) */}
          {!isLoading && whippedCreamAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t-2 border-[#2B1D12]">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide flex items-center gap-1">
                  <span>Whipped Cream</span>
                  <span className="text-[#DC2626] text-sm">*</span>
                </span>
                <span className="text-[10px] text-[#2B1D12] font-black bg-[#FFF0C2] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                  Wajib Pilih 1 • Gratis
                </span>
              </div>

              <div className={`grid ${getGridColsClass(whippedCreamAddons.length)} gap-2`}>
                {whippedCreamAddons.map((addon) => {
                  const isSelected = selectedWhippedCream?.sku === addon.sku;
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => setSelectedWhippedCream(addon)}
                      className={`min-h-[46px] p-2 rounded-xl text-xs font-bold border-2 text-center flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                          : addon.isSoldOut
                          ? 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed line-through'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      <span className="line-clamp-2 leading-tight">{addon.name}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#15803D]'}`}>
                        Gratis
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Opsi Pilihan Susu (Dairy, Radio, Wajib Pilih 1) */}
          {!isLoading && dairyAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t-2 border-[#2B1D12]">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide flex items-center gap-1">
                  <span>Pilihan Susu</span>
                  <span className="text-[#DC2626] text-sm">*</span>
                </span>
                <span className="text-[10px] text-[#2B1D12] font-black bg-[#FFF0C2] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                  Wajib Pilih 1
                </span>
              </div>

              <div className={`grid ${getGridColsClass(dairyAddons.length)} gap-2`}>
                {dairyAddons.map((addon) => {
                  const isSelected = selectedDairy?.sku === addon.sku;
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => setSelectedDairy(addon)}
                      className={`min-h-[46px] p-2 rounded-xl text-xs font-bold border-2 text-center flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                          : addon.isSoldOut
                          ? 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed line-through'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      <span className="line-clamp-2 leading-tight">{addon.name}</span>
                      {addon.price > 0 ? (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#C67D0A]'}`}>
                          +{formatRupiah(addon.price)}
                        </span>
                      ) : (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#15803D]'}`}>
                          Gratis
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Opsi Espresso (Radio, Wajib Pilih 1) */}
          {!isLoading && espressoAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t-2 border-[#2B1D12]">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide flex items-center gap-1">
                  <span>Espresso</span>
                  <span className="text-[#DC2626] text-sm">*</span>
                </span>
                <span className="text-[10px] text-[#2B1D12] font-black bg-[#FFF0C2] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                  Wajib Pilih 1
                </span>
              </div>

              <div className={`grid ${getGridColsClass(espressoAddons.length)} gap-2`}>
                {espressoAddons.map((addon) => {
                  const isSelected = selectedEspresso?.sku === addon.sku;
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => setSelectedEspresso(addon)}
                      className={`min-h-[46px] p-2 rounded-xl text-xs font-bold border-2 text-center flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                          : addon.isSoldOut
                          ? 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed line-through'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      <span className="line-clamp-2 leading-tight">{addon.name}</span>
                      {addon.price > 0 ? (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#C67D0A]'}`}>
                          +{formatRupiah(addon.price)}
                        </span>
                      ) : (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF4E8]' : 'text-[#15803D]'}`}>
                          Gratis
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Opsi Syrup (Checkbox, Opsional) */}
          {!isLoading && syrupAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t-2 border-[#2B1D12]">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide">
                  Syrup
                </span>
                <span className="text-[10px] text-[#2B1D12] font-bold bg-[#FFE7D6] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                  {isFore
                    ? 'Opsional (Maks. 1) • +Rp7.000'
                    : `Opsional • +${formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.syrup)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {syrupAddons.map((addon) => {
                  const isChecked = selectedSyrups.some((a) => a.sku === addon.sku);
                  const priceToAdd = isFore ? (addon.price || 7000) : BUSINESS_CONFIG.pricing.addonPrices.syrup;
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => handleToggleSyrup(addon)}
                      className={`min-h-[46px] p-2.5 rounded-xl border-2 flex items-center justify-between text-xs transition text-left ${
                        isChecked
                          ? 'border-[#2B1D12] bg-[#FFF0C2] font-black text-[#2B1D12] shadow-[2px_2px_0px_#C67D0A]'
                          : addon.isSoldOut
                          ? 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                            isChecked
                              ? 'bg-[#2B1D12] border-[#2B1D12] text-[#FAF4E8]'
                              : 'border-[#2B1D12] bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="line-clamp-2 leading-tight text-[11px] font-bold">{addon.name}</span>
                      </div>
                      <span className="text-[10px] text-[#2B1D12] shrink-0 font-extrabold">
                        +{formatRupiah(priceToAdd)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Opsi Topping (Checkbox, Opsional) */}
          {!isLoading && toppingAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t-2 border-[#2B1D12]">
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide">
                  Topping
                </span>
                <span className="text-[10px] text-[#2B1D12] font-bold bg-[#D9F3EA] px-2 py-0.5 rounded-full border-2 border-[#2B1D12]">
                  {isFore
                    ? 'Opsional (Maks. 2) • +Rp7.000'
                    : `Opsional • +${formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.topping)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {toppingAddons.map((addon) => {
                  const isChecked = selectedToppings.some((a) => a.sku === addon.sku);
                  const priceToAdd = isFore ? (addon.price || 7000) : BUSINESS_CONFIG.pricing.addonPrices.topping;
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => handleToggleTopping(addon)}
                      className={`min-h-[46px] p-2.5 rounded-xl border-2 flex items-center justify-between text-xs transition text-left ${
                        isChecked
                          ? 'border-[#2B1D12] bg-[#D9F3EA] font-black text-[#2B1D12] shadow-[2px_2px_0px_#C67D0A]'
                          : addon.isSoldOut
                          ? 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                            isChecked
                              ? 'bg-[#2B1D12] border-[#2B1D12] text-[#FAF4E8]'
                              : 'border-[#2B1D12] bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="line-clamp-2 leading-tight text-[11px] font-bold">{addon.name}</span>
                      </div>
                      <span className="text-[10px] text-[#2B1D12] shrink-0 font-extrabold">
                        +{formatRupiah(priceToAdd)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Kolom Catatan Pelanggan */}
          <div className="space-y-1.5 pt-2 border-t-2 border-[#2B1D12]">
            <label htmlFor="customer-notes" className="font-display text-xs font-black text-[#2B1D12] uppercase tracking-wide block">
              Catatan Pesanan
            </label>
            <input
              id="customer-notes"
              type="text"
              maxLength={100}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(filterOrderNotesInput(e.target.value))}
              placeholder="Contoh: Jangan terlalu manis, es batu dipisah jika bisa"
              className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#2B1D12] rounded-xl text-xs text-[#2B1D12] font-semibold placeholder-[#8C7667] focus:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12] outline-hidden transition"
            />
          </div>
        </div>

        {/* Sticky Footer: Total Estimasi, Stepper di KIRI, dan Tombol Tambah ke Keranjang */}
        <div className="sticky bottom-0 bg-[#FAF4E8] border-t-2 border-[#2B1D12] p-3.5 space-y-2.5 shadow-lg overscroll-contain touch-none">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-[#6A584D] block font-bold">
                Total Estimasi ({quantity} item)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-base font-black text-[#DC2626]">
                  {formatRupiah(pricing.subtotal)}
                </span>
                <span className="text-xs text-[#8C7667] line-through">
                  {formatRupiah(pricing.originalTotal)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-[#15803D] bg-[#D9F3EA] px-2 py-0.5 rounded-md border-2 border-[#15803D]">
                Hemat {formatRupiah(pricing.savingsTotal)}
              </span>
            </div>
          </div>

          {/* Peringatan jika Whipped Cream belum dipilih */}
          {isWhippedCreamMissing && !isOutletClosed && (
            <div className="p-2 bg-rose-50 border-2 border-[#DC2626] rounded-xl text-rose-900 text-[11px] text-center font-bold">
              Silakan pilih 1 opsi Whipped Cream sebelum menambahkan ke keranjang
            </div>
          )}

          {/* Peringatan jika outlet sedang tutup */}
          {isOutletClosed && (
            <div className="p-2 bg-[#FFF0C2] border-2 border-[#2B1D12] rounded-xl text-[#2B1D12] text-[11px] text-center font-bold">
              Outlet ini sedang tutup - menu ini hanya untuk dilihat (tidak dapat dipesan)
            </div>
          )}

          {/* Baris Tombol & Stepper di sebelah KIRI */}
          <div className="flex items-center gap-2">
            {/* Stepper Jumlah di Sebelah KIRI Tombol */}
            <div className="flex items-center shrink-0 bg-white p-0.5 rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] h-[46px]">
              <button
                type="button"
                disabled={quantity <= 1 || isOutletClosed}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-full bg-[#FAF4E8] rounded-lg flex items-center justify-center text-[#2B1D12] font-black disabled:opacity-30 hover:bg-[#FFF8E7] active:scale-95 text-sm"
                aria-label="Kurangi jumlah"
              >
                -
              </button>
              <span className="w-6 text-center font-display font-black text-xs text-[#2B1D12]">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutletClosed}
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-full bg-[#FAF4E8] rounded-lg flex items-center justify-center text-[#2B1D12] font-black disabled:opacity-30 hover:bg-[#FFF8E7] active:scale-95 text-sm"
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>

            {/* Tombol Tambah ke Keranjang */}
            <button
              type="button"
              disabled={isAddToCartDisabled}
              onClick={handleAddToCart}
              className={`flex-1 min-h-[46px] px-3 py-2 font-display font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition border-2 border-[#2B1D12] ${
                isOutletClosed
                  ? 'bg-[#E5DACB] text-[#8C7667] cursor-not-allowed opacity-80'
                  : 'bg-[#2B1D12] text-[#FAF4E8] shadow-[3px_3px_0px_#C67D0A] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isOutletClosed ? (
                <span>Outlet Sedang Tutup</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="line-clamp-1">Tambah ke Keranjang • {formatRupiah(pricing.subtotal)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
