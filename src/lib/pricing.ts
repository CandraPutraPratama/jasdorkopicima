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
  /** Flag khusus paket bundling */
  isBundle?: boolean;
  bundleType?: string;
  bundleFee?: number;
  bundleNormalPrice?: number;
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
  /** Biaya jasa order */
  fee: number;
  /** Total akhir tagihan ke customer: subtotal + fee */
  total: number;
  /** Total penghematan customer dari harga coret (tanpa memperhitungkan fee) */
  totalSavings: number;
  /** Rincian harga per item pesanan */
  items: Array<OrderItemInput & ItemPricingResult>;
  /** Kuantitas item bundling */
  bundleQuantity: number;
  /** Subtotal harga bundling */
  bundleSubtotal: number;
  /** Total fee bundling */
  bundleFee: number;
  /** Kuantitas item reguler */
  regularQuantity: number;
  /** Subtotal harga reguler */
  regularSubtotal: number;
  /** Total fee reguler */
  regularFee: number;
  /** Subtotal harga normal (pre-diskon) item reguler untuk validasi batas min-max */
  regularNormalSubtotal: number;
}

/**
 * Menghitung harga per item secara murni.
 * - Untuk paket bundling: harga promo = normalPrice x 50%
 * - Untuk item reguler: harga promo = (basePrice * 50%) + variantAddition + toppingTotal
 */
export function calculateItemPricing(
  item: OrderItemInput,
  config: PricingConfig = BUSINESS_CONFIG.pricing
): ItemPricingResult {
  const quantity = Math.min(99, Math.max(1, Math.round(item.quantity)));

  // Penanganan khusus paket bundling
  if (item.isBundle) {
    const originalPricePerItem = Math.max(
      0,
      Math.round(item.bundleNormalPrice || item.basePrice)
    );
    const promoPricePerItem = Math.round(
      originalPricePerItem * (1 - config.baseDiscountPercent)
    );
    const savingsPerItem = originalPricePerItem - promoPricePerItem;

    return {
      originalPricePerItem,
      promoPricePerItem,
      savingsPerItem,
      subtotalItem: promoPricePerItem * quantity,
      totalSavingsItem: savingsPerItem * quantity,
    };
  }

  const basePrice = Math.max(0, Math.round(item.basePrice));
  const variantAddition = Math.max(0, Math.round(item.variantAddition || 0));
  const toppingTotal = Math.max(0, Math.round(item.toppingTotal || 0));

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
 * - Paket bundling: fee paket khusus menggantikan fee per-item (bundleFee x kuantitas bundle).
 * - Item reguler: jika ada bundle di pesanan atau >1 item reguler: Rp2.000 x qty reguler; jika hanya 1 reguler: flat Rp4.000.
 */
export function calculateOrderPricing(
  items: OrderItemInput[],
  config: PricingConfig = BUSINESS_CONFIG.pricing
): OrderPricingResult {
  let totalQuantity = 0;
  let subtotal = 0;
  let totalSavings = 0;
  let bundleFeeTotal = 0;
  let bundleSubtotal = 0;
  let bundleQuantity = 0;
  let regularQuantity = 0;
  let regularSubtotal = 0;
  let regularNormalSubtotal = 0;

  const itemResults = items.map((item) => {
    const qty = Math.min(99, Math.max(1, Math.round(item.quantity)));
    totalQuantity += qty;

    const pricing = calculateItemPricing(item, config);
    subtotal += pricing.subtotalItem;
    totalSavings += pricing.totalSavingsItem;

    if (item.isBundle) {
      bundleFeeTotal += (item.bundleFee || 0) * qty;
      bundleQuantity += qty;
      bundleSubtotal += pricing.subtotalItem;
    } else {
      regularQuantity += qty;
      regularSubtotal += pricing.subtotalItem;
      regularNormalSubtotal += pricing.originalPricePerItem * qty;
    }

    return {
      ...item,
      ...pricing,
    };
  });

  let regularFee = 0;
  if (regularQuantity > 0) {
    if (bundleFeeTotal > 0 || regularQuantity > 1) {
      regularFee = config.feeMultiItem * regularQuantity;
    } else {
      regularFee = config.feeSingleItem;
    }
  }

  const fee = bundleFeeTotal + regularFee;
  const total = subtotal + fee;

  return {
    totalQuantity,
    subtotal,
    fee,
    total,
    totalSavings,
    items: itemResults,
    bundleQuantity,
    bundleSubtotal,
    bundleFee: bundleFeeTotal,
    regularQuantity,
    regularSubtotal,
    regularFee,
    regularNormalSubtotal,
  };
}

export interface OrderBreakdownSummary {
  bundleQuantity: number;
  bundleSubtotal: number;
  bundleFee: number;
  regularQuantity: number;
  regularSubtotal: number;
  regularFee: number;
}

/**
 * Menghasilkan rincian subtotal dan fee yang terpisah antara item bundling dan item normal.
 * Berguna untuk cart drawer, halaman /bayar, template pesan WA, dan dashboard admin.
 */
export function getOrderBreakdown(
  items: Array<{
    isBundle?: boolean;
    quantity: number;
    subtotal?: number;
    bundleFee?: number;
    name?: string;
  }>,
  fallbackFee?: number,
  config: PricingConfig = BUSINESS_CONFIG.pricing
): OrderBreakdownSummary {
  let bundleQuantity = 0;
  let bundleSubtotal = 0;
  let bundleFee = 0;
  let regularQuantity = 0;
  let regularSubtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.round(item.quantity || 1));
    const sub = typeof item.subtotal === 'number' ? item.subtotal : 0;
    const isBundle = Boolean(item.isBundle || item.name?.toLowerCase().includes('bundling'));

    if (isBundle) {
      bundleQuantity += qty;
      bundleSubtotal += sub;
      bundleFee += (item.bundleFee || 0) * qty;
    } else {
      regularQuantity += qty;
      regularSubtotal += sub;
    }
  }

  let regularFee = 0;
  if (regularQuantity > 0) {
    if (bundleQuantity > 0 || regularQuantity > 1) {
      regularFee = config.feeMultiItem * regularQuantity;
    } else {
      regularFee = config.feeSingleItem;
    }
  }

  if (typeof fallbackFee === 'number' && fallbackFee > 0) {
    if (bundleQuantity === 0) {
      regularFee = fallbackFee;
    } else if (regularQuantity === 0) {
      bundleFee = fallbackFee;
    } else {
      bundleFee = Math.max(0, fallbackFee - regularFee);
    }
  }

  return {
    bundleQuantity,
    bundleSubtotal,
    bundleFee,
    regularQuantity,
    regularSubtotal,
    regularFee,
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
