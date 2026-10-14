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
}

export function ProductBottomSheet({
  outletCode,
  product,
  onClose,
  onAddToCart,
}: ProductBottomSheetProps) {
  // Kunci scroll halaman belakang selama sheet detail produk terbuka
  useScrollLock(true);

  const [options, setOptions] = useState<ProductOptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User selections
  const [selectedDimensions, setSelectedDimensions] = useState<Record<number, number>>({});
  const [selectedNotes, setSelectedNotes] = useState<Record<string, string>>({});
  const [selectedWhippedCream, setSelectedWhippedCream] = useState<Addon | null>(null);
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

          // Whipped cream: jika ada opsi yang tersedia, biarkan user memilih (atau default null)
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

  // Pisahkan addons ke dalam 3 grup per spesifikasi
  const { whippedCreamAddons, syrupAddons, toppingAddons } = useMemo(() => {
    const all = options?.addons || [];
    const whipped = all.filter((a) => a.group === 'whipped_cream');
    const syrup = all.filter((a) => a.group === 'syrup');
    const topping = all.filter((a) => a.group === 'topping');
    return {
      whippedCreamAddons: whipped,
      syrupAddons: syrup,
      toppingAddons: topping,
    };
  }, [options?.addons]);

  // Gabungan seluruh addons yang terpilih
  const selectedAddons = useMemo(() => {
    const list: Addon[] = [];
    if (selectedWhippedCream) {
      list.push(selectedWhippedCream);
    }
    list.push(...selectedSyrups);
    list.push(...selectedToppings);
    return list;
  }, [selectedWhippedCream, selectedSyrups, selectedToppings]);

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
      matchedSku?.price
    );
  }, [product.basePrice, selectedOptionNames, selectedAddons, quantity, matchedSku?.price]);

  // Cek apakah Whipped Cream wajib tapi belum dipilih
  const hasWhippedCreamOptions = whippedCreamAddons.length > 0;
  const isWhippedCreamMissing = hasWhippedCreamOptions && !selectedWhippedCream;
  const isAddToCartDisabled = isLoading || Boolean(errorMessage) || isWhippedCreamMissing;

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
  };

  const handleToggleSyrup = (addon: Addon) => {
    if (addon.isSoldOut) return;
    setSelectedSyrups((prev) => {
      const exists = prev.some((a) => a.sku === addon.sku);
      if (exists) {
        return prev.filter((a) => a.sku !== addon.sku);
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
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    if (isAddToCartDisabled) return;

    // Kumpulkan ringkasan varian
    const variantParts: string[] = [...selectedOptionNames];

    // Tambahkan notes (misal: Ice Level)
    if (selectedNotes) {
      for (const [, valText] of Object.entries(selectedNotes)) {
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
    });

    onClose();
  };

  // Helper untuk menentukan grid kolom: 3 opsi -> grid-cols-3, 2 atau >=4 opsi -> grid-cols-2
  const getGridColsClass = (count: number) => {
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200 overscroll-contain">
      {/* Backdrop tap to dismiss */}
      <div className="fixed inset-0 touch-none" onClick={onClose} aria-hidden="true" />

      {/* Sheet Container (Mobile-first max-w-md) */}
      <div className="relative w-full max-w-md max-h-[92vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 overscroll-contain">
        {/* Header Lembar Produk */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-3.5 border-b border-stone-200 flex items-center justify-between touch-none">
          <div className="pr-4">
            <h3 className="font-bold text-base text-[#111111] line-clamp-1">
              {product.name}
            </h3>
            <span className="text-[11px] text-amber-600 font-semibold">
              Kustomisasi Pesanan
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition active:scale-95"
            aria-label="Tutup lembar detail produk"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain">
          {/* Ringkasan Produk */}
          <div className="flex gap-3 pb-3 border-b border-stone-100">
            <div className="relative w-16 h-16 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-100">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-xs text-stone-500 line-clamp-2">
                {product.description || 'Pilih varian suhu, ukuran, dan topping favoritmu.'}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-amber-700">
                  {formatRupiah(pricing.promoPricePerItem)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatRupiah(pricing.originalPricePerItem)}
                </span>
              </div>
            </div>
          </div>

          {/* Loading Varian */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <div className="h-4 bg-stone-200 rounded w-1/3 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 bg-stone-100 rounded-xl w-24 animate-pulse" />
                <div className="h-10 bg-stone-100 rounded-xl w-24 animate-pulse" />
              </div>
              <div className="h-4 bg-stone-200 rounded w-1/4 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 bg-stone-100 rounded-xl w-28 animate-pulse" />
                <div className="h-10 bg-stone-100 rounded-xl w-28 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error Varian */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* 1. Opsi Dimensi Varian (Temperature, Size, Beans, Milk, Sugar Level) */}
          {!isLoading && options?.dimensions && options.dimensions.map((dim) => {
            const gridClass = getGridColsClass(dim.values.length);
            return (
              <div key={dim.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                    {dim.name}
                  </span>
                  <span className="text-[10px] text-stone-400">Pilih 1</span>
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
                        className={`min-h-[46px] p-2 rounded-xl text-xs font-medium border text-center flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                            : isAvailable
                            ? 'border-stone-200 bg-white hover:border-amber-400 text-stone-700 active:scale-98'
                            : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                        }`}
                      >
                        <span className="line-clamp-2 leading-tight">{val.name}</span>
                        {addition > 0 && (
                          <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#D4AF37]' : 'text-stone-500'}`}>
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

          {/* 2. Opsi Notes (Ice Level) */}
          {!isLoading && options?.notes && options.notes.map((note) => {
            const gridClass = getGridColsClass(note.options.length);
            return (
              <div key={note.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                    {note.name}
                  </span>
                  <span className="text-[10px] text-stone-400">Pilih 1</span>
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
                        className={`min-h-[46px] p-2 rounded-xl text-xs font-medium border text-center flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 active:scale-98'
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
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wide flex items-center gap-1">
                  <span>Whipped Cream</span>
                  <span className="text-rose-500 text-sm">*</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
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
                      className={`min-h-[46px] p-2 rounded-xl text-xs font-medium border text-center flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                          : addon.isSoldOut
                          ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                          : 'border-stone-200 bg-white hover:border-amber-400 text-stone-700 active:scale-98'
                      }`}
                    >
                      <span className="line-clamp-2 leading-tight">{addon.name}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#D4AF37]' : 'text-stone-400'}`}>
                        Gratis
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Opsi Syrup (Checkbox, Opsional, +Rp6.000 per pilihan) */}
          {!isLoading && syrupAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                  Syrup
                </span>
                <span className="text-[10px] text-stone-400">
                  Opsional • +{formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.syrup)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {syrupAddons.map((addon) => {
                  const isChecked = selectedSyrups.some((a) => a.sku === addon.sku);
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => handleToggleSyrup(addon)}
                      className={`min-h-[46px] p-2.5 rounded-xl border flex items-center justify-between text-xs transition text-left ${
                        isChecked
                          ? 'border-amber-400 bg-amber-50/70 font-semibold text-stone-900 shadow-2xs'
                          : addon.isSoldOut
                          ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                            isChecked
                              ? 'bg-[#111111] border-[#111111] text-[#D4AF37]'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="line-clamp-2 leading-tight text-[11px]">{addon.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0 font-medium">
                        +{formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.syrup)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Opsi Topping (Checkbox, Opsional, +Rp6.000 per pilihan) */}
          {!isLoading && toppingAddons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                  Topping
                </span>
                <span className="text-[10px] text-stone-400">
                  Opsional • +{formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.topping)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {toppingAddons.map((addon) => {
                  const isChecked = selectedToppings.some((a) => a.sku === addon.sku);
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      disabled={addon.isSoldOut}
                      onClick={() => handleToggleTopping(addon)}
                      className={`min-h-[46px] p-2.5 rounded-xl border flex items-center justify-between text-xs transition text-left ${
                        isChecked
                          ? 'border-amber-400 bg-amber-50/70 font-semibold text-stone-900 shadow-2xs'
                          : addon.isSoldOut
                          ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                            isChecked
                              ? 'bg-[#111111] border-[#111111] text-[#D4AF37]'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="line-clamp-2 leading-tight text-[11px]">{addon.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0 font-medium">
                        +{formatRupiah(BUSINESS_CONFIG.pricing.addonPrices.topping)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Kolom Catatan Pelanggan (Pindah ke bawah semua opsi, tepat di atas bar bawah) */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <label htmlFor="customer-notes" className="text-xs font-bold text-[#111111] uppercase tracking-wide block">
              Catatan Pesanan
            </label>
            <input
              id="customer-notes"
              type="text"
              maxLength={100}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(filterOrderNotesInput(e.target.value))}
              placeholder="Contoh: Jangan terlalu manis, es batu dipisah jika bisa"
              className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#1F2937] placeholder-stone-400 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden transition"
            />
          </div>
        </div>

        {/* Sticky Footer: Total Estimasi, Stepper di KIRI, dan Tombol Tambah ke Keranjang */}
        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-3.5 space-y-2.5 shadow-lg overscroll-contain touch-none">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">
                Total Estimasi ({quantity} item)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-amber-700">
                  {formatRupiah(pricing.subtotal)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatRupiah(pricing.originalTotal)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Hemat {formatRupiah(pricing.savingsTotal)}
              </span>
            </div>
          </div>

          {/* Peringatan jika Whipped Cream belum dipilih */}
          {isWhippedCreamMissing && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] text-center font-medium">
              ⚠️ Silakan pilih 1 opsi Whipped Cream sebelum menambahkan ke keranjang
            </div>
          )}

          {/* Baris Tombol & Stepper di sebelah KIRI */}
          <div className="flex items-center gap-2">
            {/* Stepper Jumlah di Sebelah KIRI Tombol */}
            <div className="flex items-center shrink-0 bg-stone-100 p-0.5 rounded-xl border border-stone-200 h-[46px]">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-full bg-white rounded-lg flex items-center justify-center text-stone-700 font-bold disabled:opacity-30 hover:bg-stone-50 active:scale-95 shadow-2xs text-sm"
                aria-label="Kurangi jumlah"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-xs text-[#111111]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-full bg-white rounded-lg flex items-center justify-center text-stone-700 font-bold hover:bg-stone-50 active:scale-95 shadow-2xs text-sm"
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
              className="flex-1 min-h-[46px] px-3 py-2 bg-[#111111] hover:bg-stone-900 active:scale-98 text-[#D4AF37] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="line-clamp-1">Tambah ke Keranjang • {formatRupiah(pricing.subtotal)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
