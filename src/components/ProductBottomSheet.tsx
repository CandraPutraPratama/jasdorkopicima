'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product, ProductOptionDetails, Addon, VariantSku } from '@/types/domain';
import type { CartItem } from '@/lib/cart-reducer';
import {
  findMatchingSku,
  isDimensionValueAvailable,
  calculateBottomSheetPricing,
} from '@/lib/option-validation';
import { formatRupiah } from '@/lib/currency';

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
  const [options, setOptions] = useState<ProductOptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User selections
  const [selectedDimensions, setSelectedDimensions] = useState<Record<number, number>>({});
  const [selectedNotes, setSelectedNotes] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
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

          // Inisialisasi default selections
          const initialDims: Record<number, number> = {};
          if (opt && opt.dimensions) {
            for (const dim of opt.dimensions) {
              // Cek defaultSelectionMap jika tersedia
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

  // Hitung SKU varian yang cocok dengan kombinasi terpilih
  const matchedSku: VariantSku | null = options?.optionMap
    ? findMatchingSku(options.optionMap, selectedDimensions)
    : null;

  // Hitung harga dinamis
  const pricing = calculateBottomSheetPricing(
    product.basePrice,
    matchedSku,
    selectedAddons,
    quantity
  );

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

  const handleToggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.sku === addon.sku);
      if (exists) {
        return prev.filter((a) => a.sku !== addon.sku);
      }
      return [...prev, addon];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop tap to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet Container (Mobile-first max-w-md) */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
        {/* Header Lembar Produk */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
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

          {/* Opsi Dimensi Varian */}
          {!isLoading && options && options.dimensions && options.dimensions.map((dim) => (
            <div key={dim.code} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                  {dim.name}
                </span>
                <span className="text-[10px] text-stone-400">Pilih 1</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {dim.values.map((val) => {
                  const isSelected = selectedDimensions[dim.code] === val.id;
                  const isAvailable = isDimensionValueAvailable(
                    options.optionMap,
                    selectedDimensions,
                    dim.code,
                    val.id
                  );

                  return (
                    <button
                      key={val.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSelectDimensionValue(dim.code, val.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                          : isAvailable
                          ? 'border-stone-200 bg-white hover:border-amber-400 text-stone-700 active:scale-98'
                          : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                      }`}
                    >
                      <span>{val.name}</span>
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-[#D4AF37]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Opsi Notes (misal: Ice Level) */}
          {!isLoading && options && options.notes && options.notes.map((note) => (
            <div key={note.name} className="space-y-2">
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wide block">
                {note.name}
              </span>

              <div className="flex flex-wrap gap-2">
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
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium border transition ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 active:scale-98'
                      }`}
                    >
                      {optText}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Opsi Topping / Addon */}
          {!isLoading && options && options.addons && options.addons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                  Topping Tambahan
                </span>
                <span className="text-[10px] text-stone-400">Opsional</span>
              </div>

              <div className="space-y-2">
                {options.addons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.sku === addon.sku);
                  return (
                    <button
                      key={addon.sku}
                      type="button"
                      onClick={() => handleToggleAddon(addon)}
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                        isChecked
                          ? 'border-amber-400 bg-amber-50/60 font-semibold text-stone-900'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-[#111111] border-[#111111] text-[#D4AF37]'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-stone-500">
                        +{formatRupiah(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jumlah Pesanan (Quantity) */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wide block">
                Jumlah Pesanan
              </span>
              <span className="text-[11px] text-stone-400">Atur kuantitas item</span>
            </div>

            <div className="flex items-center gap-3 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-h-[44px] min-w-[44px] bg-white rounded-lg flex items-center justify-center text-stone-700 font-bold disabled:opacity-40 hover:bg-stone-50 active:scale-95 shadow-2xs"
                aria-label="Kurangi jumlah"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-sm text-[#111111]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="min-h-[44px] min-w-[44px] bg-white rounded-lg flex items-center justify-center text-stone-700 font-bold hover:bg-stone-50 active:scale-95 shadow-2xs"
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>
          </div>

          {/* Kolom Catatan Pelanggan */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <label htmlFor="customer-notes" className="text-xs font-bold text-[#111111] uppercase tracking-wide block">
              Catatan Pesanan
            </label>
            <input
              id="customer-notes"
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Contoh: Jangan terlalu manis, es batu dipisah jika bisa"
              className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#1F2937] placeholder-stone-400 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden transition"
            />
          </div>
        </div>

        {/* Sticky Footer: Rincian Harga & Tombol Keranjang (Tahap 5B) */}
        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 space-y-2 shadow-lg">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-stone-400 block">Total Estimasi ({quantity} item)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-amber-700">
                  {formatRupiah(pricing.subtotal)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatRupiah(pricing.originalTotal)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Hemat {formatRupiah(pricing.originalTotal - pricing.subtotal)}
              </span>
            </div>
          </div>

          {/* Tombol Tambah ke Keranjang (Aktif di Tahap 5B) */}
          <button
            type="button"
            onClick={() => {
              // Bangun teks ringkasan varian
              const variantParts: string[] = [];
              if (options?.dimensions) {
                for (const dim of options.dimensions) {
                  const selectedValId = selectedDimensions[dim.code];
                  const val = dim.values.find((v) => v.id === selectedValId);
                  if (val) {
                    variantParts.push(val.name);
                  }
                }
              }

              if (selectedNotes) {
                for (const [, valText] of Object.entries(selectedNotes)) {
                  if (valText && !variantParts.includes(valText)) {
                    variantParts.push(valText);
                  }
                }
              }

              const variantDescription = variantParts.join(', ');
              const toppingTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

              onAddToCart({
                bundleCode: product.bundleCode,
                sku: matchedSku?.sku,
                name: product.name,
                image: product.image,
                basePrice: product.basePrice,
                variantAddition: matchedSku ? matchedSku.variantAddition : 0,
                toppingTotal,
                quantity,
                variantDescription,
                addons: selectedAddons,
                notes: customerNotes,
              });

              onClose();
            }}
            className="w-full min-h-[48px] px-4 py-3 bg-[#111111] hover:bg-stone-900 active:scale-98 text-[#D4AF37] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
            <span>Tambah ke Keranjang • {formatRupiah(pricing.subtotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
