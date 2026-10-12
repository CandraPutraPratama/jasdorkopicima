import type { VariantSku, Addon } from '../types/domain.ts';
import {
  calculateItemPricing,
  calculateFlatVariantAddition,
  calculateFlatAddonTotal,
} from './pricing.ts';

/**
 * Mencocokkan SKU varian dari optionMap berdasarkan seluruh dimensi yang dipilih user.
 */
export function findMatchingSku(
  optionMap: Record<string, VariantSku>,
  selectedDimensions: Record<number, number>
): VariantSku | null {
  if (!optionMap) return null;

  const entries = Object.entries(optionMap);
  for (const [key, sku] of entries) {
    let match = true;
    for (const [dimCode, valId] of Object.entries(selectedDimensions)) {
      const token = `${dimCode}-${valId}:`;
      if (!key.includes(token)) {
        match = false;
        break;
      }
    }
    if (match) {
      return sku;
    }
  }

  return null;
}

/**
 * Memeriksa apakah suatu nilai dimensi (misal: Large pada ukuran) masih dapat dipilih
 * tanpa memicu kombinasi yang tidak ada di option_product_map.
 */
export function isDimensionValueAvailable(
  optionMap: Record<string, VariantSku>,
  currentSelections: Record<number, number>,
  targetDimCode: number,
  targetValueId: number
): boolean {
  if (!optionMap) return false;

  const targetToken = `${targetDimCode}-${targetValueId}:`;
  const entries = Object.entries(optionMap);

  for (const [key] of entries) {
    if (!key.includes(targetToken)) {
      continue;
    }

    // Periksa apakah key ini cocok dengan pilihan dimensi lainnya
    let compatible = true;
    for (const [dimCodeStr, valId] of Object.entries(currentSelections)) {
      const dimCode = Number(dimCodeStr);
      if (dimCode === targetDimCode) continue;

      const otherToken = `${dimCode}-${valId}:`;
      if (!key.includes(otherToken)) {
        compatible = false;
        break;
      }
    }

    if (compatible) {
      return true;
    }
  }

  return false;
}

/**
 * Menghitung rincian harga untuk lembar detail produk (bottom sheet).
 * - Harga asli coret = actual KK sku price (+ flat addons) atau fallback ke basePrice + variantAddition (+ flat addons)
 * - Harga promo = (basePrice / 2) + flatVariantAddition + flatAddonTotal
 * - Hemat = original - promo
 */
export function calculateBottomSheetPricing(
  basePrice: number,
  optionsOrSku: string[] | VariantSku | null,
  selectedAddons: Addon[],
  quantity = 1,
  skuPrice?: number
): {
  originalPricePerItem: number;
  promoPricePerItem: number;
  subtotal: number;
  originalTotal: number;
  variantAddition: number;
  toppingTotal: number;
  savingsTotal: number;
} {
  let variantAddition = 0;
  let resolvedSkuPrice = skuPrice;

  if (Array.isArray(optionsOrSku)) {
    variantAddition = calculateFlatVariantAddition(optionsOrSku);
  } else if (optionsOrSku && typeof optionsOrSku === 'object') {
    variantAddition = optionsOrSku.variantAddition || 0;
    if (resolvedSkuPrice == null && typeof optionsOrSku.price === 'number') {
      resolvedSkuPrice = optionsOrSku.price;
    }
  }

  const toppingTotal = calculateFlatAddonTotal(selectedAddons);

  const pricing = calculateItemPricing({
    name: 'Produk',
    basePrice,
    skuPrice: resolvedSkuPrice,
    variantAddition,
    toppingTotal,
    quantity,
  });

  return {
    originalPricePerItem: pricing.originalPricePerItem,
    promoPricePerItem: pricing.promoPricePerItem,
    subtotal: pricing.subtotalItem,
    originalTotal: pricing.originalPricePerItem * quantity,
    variantAddition,
    toppingTotal,
    savingsTotal: pricing.totalSavingsItem,
  };
}
