import {
  BUSINESS_CONFIG,
  getOptionAddition,
  classifyAddonGroup,
} from '../config/business.ts';
import type { PricingConfig } from '../config/business.ts';

export interface OrderItemInput {
  name: string;
  /** Harga dasar menu dari respons KK */
  basePrice: number;
  /** Harga SKU KK asli dari option_product_map untuk kombinasi yang dipilih */
  skuPrice?: number;
  /** Tambahan harga dari varian SKU yang dipilih (aturan flat: Large +5k, Juwara +3k, Oatside +3k) */
  variantAddition?: number;
  /** Total harga dari addon / topping tambahan (dibayar penuh) */
  toppingTotal?: number;
  /** Jumlah pesanan item ini */
  quantity: number;
}

export interface ItemPricingResult {
  /** Harga normal/asli per item (harga coret): actual SKU price (atau base + variant jika fallback) + topping */
  originalPricePerItem: number;
  /** Harga promo per item: (basePrice * (1 - discount)) + variantAddition + toppingTotal */
  promoPricePerItem: number;
  /** Penghematan per item: originalPricePerItem - promoPricePerItem */
  savingsPerItem: number;
  /** Subtotal harga promo untuk seluruh kuantitas item ini: promoPricePerItem * quantity */
  subtotalItem: number;
  /** Total penghematan untuk seluruh kuantitas item ini: savingsPerItem * quantity */
  totalSavingsItem: number;
}

export interface OrderPricingResult {
  /** Total kuantitas gabungan seluruh item */
  totalQuantity: number;
  /** Subtotal pesanan (akumulasi harga promo x kuantitas) */
  subtotal: number;
  /** Biaya jasa jastip */
  fee: number;
  /** Total akhir tagihan ke customer: subtotal + fee */
  total: number;
  /** Total penghematan customer dari harga coret (tanpa memperhitungkan fee) */
  totalSavings: number;
  /** Rincian harga per item pesanan */
  items: Array<OrderItemInput & ItemPricingResult>;
}

/**
 * Menghitung harga per item secara murni.
 * - Harga asli yang dicoret = harga KK sebenarnya untuk kombinasi SKU terpilih + addon flat (Syrup/Topping: +Rp6.000, Whipped Cream: Rp0).
 *   Jika SKU tidak ditemukan atau harganya tidak bisa dipastikan, fallback ke basePrice + variantAddition + toppingTotal dan catat log peringatan.
 * - Harga promo tetap = (harga dasar / 2) + tambahan flat (Large +5k, Juwara +3k, Oatside +3k) + addon flat.
 * - Penghematan (hemat) = originalPricePerItem - promoPricePerItem.
 */
export function calculateItemPricing(
  item: OrderItemInput,
  config: PricingConfig = BUSINESS_CONFIG.pricing
): ItemPricingResult {
  const basePrice = Math.max(0, Math.round(item.basePrice));
  const variantAddition = Math.max(0, Math.round(item.variantAddition || 0));
  const toppingTotal = Math.max(0, Math.round(item.toppingTotal || 0));
  const quantity = Math.max(1, Math.round(item.quantity));

  let originalPricePerItem: number;
  if (typeof item.skuPrice === 'number' && !isNaN(item.skuPrice) && item.skuPrice > 0) {
    originalPricePerItem = Math.round(item.skuPrice) + toppingTotal;
  } else {
    console.warn(
      `[Pricing] Peringatan: skuPrice tidak ditemukan atau tidak valid untuk "${item.name}", fallback ke basePrice + variantAddition.`
    );
    originalPricePerItem = basePrice + variantAddition + toppingTotal;
  }

  const discountedBasePrice = Math.round(basePrice * (1 - config.baseDiscountPercent));
  const promoPricePerItem = discountedBasePrice + variantAddition + toppingTotal;
  const savingsPerItem = originalPricePerItem - promoPricePerItem;

  return {
    originalPricePerItem,
    promoPricePerItem,
    savingsPerItem,
    subtotalItem: promoPricePerItem * quantity,
    totalSavingsItem: savingsPerItem * quantity,
  };
}

/**
 * Menghitung total harga seluruh pesanan secara murni.
 *
 * Aturan fee:
 * - Kuantitas 1 item: flat Rp4.000
 * - Kuantitas > 1 item: Rp2.000 x total kuantitas
 */
export function calculateOrderPricing(
  items: OrderItemInput[],
  config: PricingConfig = BUSINESS_CONFIG.pricing
): OrderPricingResult {
  let totalQuantity = 0;
  let subtotal = 0;
  let totalSavings = 0;

  const itemResults = items.map((item) => {
    const qty = Math.max(1, Math.round(item.quantity));
    totalQuantity += qty;

    const pricing = calculateItemPricing(item, config);
    subtotal += pricing.subtotalItem;
    totalSavings += pricing.totalSavingsItem;

    return {
      ...item,
      ...pricing,
    };
  });

  let fee = 0;
  if (totalQuantity === 1) {
    fee = config.feeSingleItem;
  } else if (totalQuantity > 1) {
    fee = config.feeMultiItem * totalQuantity;
  }

  const total = subtotal + fee;

  return {
    totalQuantity,
    subtotal,
    fee,
    total,
    totalSavings,
    items: itemResults,
  };
}

/**
 * Menghitung total tambahan harga varian dari daftar nama nilai opsi yang dipilih
 * berdasarkan tabel flat di config (Large: 5000, Juwara Beans: 3000, Oatside: 3000, lainnya 0).
 */
export function calculateFlatVariantAddition(selectedOptionValueNames: string[]): number {
  if (!selectedOptionValueNames || selectedOptionValueNames.length === 0) return 0;
  return selectedOptionValueNames.reduce((sum, name) => sum + getOptionAddition(name), 0);
}

/**
 * Menghitung total harga addon tambahan secara flat per grup:
 * - Whipped Cream: Rp0 (gratis)
 * - Syrup: +Rp6.000 per pilihan
 * - Topping: +Rp6.000 per pilihan
 */
export function calculateFlatAddonTotal(
  addons: Array<{ name: string; categoryName?: string; price?: number }>
): number {
  if (!addons || addons.length === 0) return 0;
  return addons.reduce((sum, addon) => {
    const group = classifyAddonGroup(addon.name, addon.categoryName);
    if (group === 'whipped_cream') {
      return sum + BUSINESS_CONFIG.pricing.addonPrices.whippedCream;
    }
    if (group === 'syrup') {
      return sum + BUSINESS_CONFIG.pricing.addonPrices.syrup;
    }
    if (group === 'topping') {
      return sum + BUSINESS_CONFIG.pricing.addonPrices.topping;
    }
    return sum;
  }, 0);
}
