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
  brandSlug?: string;
  bundleCode?: string;
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
  config: PricingConfig = BUSINESS_CONFIG.pricing,
  brandSlugOrOutletCode?: string
): ItemPricingResult {
  const quantity = Math.min(99, Math.max(1, Math.round(item.quantity)));

  const isFore =
    item.brandSlug === 'fore' ||
    brandSlugOrOutletCode === 'fore' ||
    (typeof brandSlugOrOutletCode === 'string' &&
      brandSlugOrOutletCode.toLowerCase().startsWith('fore-')) ||
    (typeof item.bundleCode === 'string' &&
      (item.bundleCode.startsWith('FORE_') || item.bundleCode.startsWith('fore-')));

  const discountPercent = isFore ? 0.25 : config.baseDiscountPercent;

  // Penanganan khusus paket bundling
  if (item.isBundle) {
    if (item.bundleType === 'tomoro-b1g1') {
      const promoPricePerItem = Math.max(0, Math.round(item.basePrice));
      const originalPricePerItem = Math.max(
        promoPricePerItem,
        Math.round(item.bundleNormalPrice || promoPricePerItem)
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

    const originalPricePerItem = Math.max(
      0,
      Math.round(item.bundleNormalPrice || item.basePrice)
    );
    const promoPricePerItem = Math.round(
      originalPricePerItem * (1 - discountPercent)
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
    if (!isFore) {
      console.warn(
        `[Pricing] Peringatan: skuPrice tidak ditemukan atau tidak valid untuk "${item.name}", fallback ke basePrice + variantAddition.`
      );
    }
    originalPricePerItem = basePrice + variantAddition + toppingTotal;
  }

  let promoPricePerItem: number;
  if (isFore) {
    // Khusus Fore Coffee: Diskon 25% memotong seluruh subtotal item (harga menu + upsize Large + add-on susu/sirup/topping)
    promoPricePerItem = Math.round(originalPricePerItem * (1 - discountPercent));
  } else {
    // Kopi Kenangan & Tomoro: Diskon hanya untuk basePrice, varian & add-on dibayar flat
    const discountedBasePrice = Math.round(basePrice * (1 - discountPercent));
    promoPricePerItem = discountedBasePrice + variantAddition + toppingTotal;
  }
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
  config: PricingConfig = BUSINESS_CONFIG.pricing,
  brandSlugOrOutletCode?: string
): OrderPricingResult {
  const isFore =
    brandSlugOrOutletCode === 'fore' ||
    (typeof brandSlugOrOutletCode === 'string' &&
      brandSlugOrOutletCode.toLowerCase().startsWith('fore-')) ||
    items.some(
      (it) =>
        it.brandSlug === 'fore' ||
        (typeof it.bundleCode === 'string' &&
          (it.bundleCode.startsWith('FORE_') || it.bundleCode.startsWith('fore-')))
    );

  const isTomoro =
    !isFore &&
    (brandSlugOrOutletCode === 'tomoro' ||
      (typeof brandSlugOrOutletCode === 'string' &&
        brandSlugOrOutletCode.toLowerCase().startsWith('tomoro-')) ||
      items.some((it) => it.brandSlug === 'tomoro' || it.bundleType === 'tomoro-b1g1'));

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

    const itemBrand = item.brandSlug || (isFore ? 'fore' : isTomoro ? 'tomoro' : undefined);
    const pricing = calculateItemPricing(
      { ...item, brandSlug: itemBrand },
      config,
      brandSlugOrOutletCode
    );
    subtotal += pricing.subtotalItem;
    totalSavings += pricing.totalSavingsItem;

    if (item.isBundle) {
      const itemBundleFee = isFore
        ? 0
        : typeof item.bundleFee === 'number'
          ? item.bundleFee
          : isTomoro
            ? 3000
            : 0;
      bundleFeeTotal += itemBundleFee * qty;
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
    if (isFore) {
      regularFee = 0; // FREE fee jasa untuk Fore Coffee
    } else if (isTomoro) {
      regularFee = 1500 * regularQuantity;
    } else if (bundleFeeTotal > 0 || regularQuantity > 1) {
      regularFee = config.feeMultiItem * regularQuantity;
    } else {
      regularFee = config.feeSingleItem;
    }
  }

  const fee = isFore ? 0 : bundleFeeTotal + regularFee;
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
    bundleType?: string;
    brandSlug?: string;
    bundleCode?: string;
    quantity: number;
    subtotal?: number;
    bundleFee?: number;
    name?: string;
  }>,
  fallbackFee?: number,
  config: PricingConfig = BUSINESS_CONFIG.pricing,
  brandSlugOrOutletCode?: string
): OrderBreakdownSummary {
  const isFore =
    brandSlugOrOutletCode === 'fore' ||
    (typeof brandSlugOrOutletCode === 'string' &&
      brandSlugOrOutletCode.toLowerCase().startsWith('fore-')) ||
    items.some(
      (it) =>
        it.brandSlug === 'fore' ||
        (typeof it.bundleCode === 'string' &&
          (it.bundleCode.startsWith('FORE_') || it.bundleCode.startsWith('fore-'))) ||
        it.name?.toLowerCase().includes('fore')
    );

  const isTomoro =
    !isFore &&
    (brandSlugOrOutletCode === 'tomoro' ||
      (typeof brandSlugOrOutletCode === 'string' &&
        brandSlugOrOutletCode.toLowerCase().startsWith('tomoro-')) ||
      items.some(
        (it) =>
          it.brandSlug === 'tomoro' ||
          it.bundleType === 'tomoro-b1g1' ||
          it.name?.toLowerCase().includes('tomoro')
      ));

  let bundleQuantity = 0;
  let bundleSubtotal = 0;
  let bundleFee = 0;
  let regularQuantity = 0;
  let regularSubtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.round(item.quantity || 1));
    const isBundle = Boolean(
      item.isBundle ||
        item.bundleType === 'tomoro-b1g1' ||
        item.name?.toLowerCase().includes('bundling') ||
        item.name?.toLowerCase().includes('b1g1')
    );
    const itemDiscount = isFore ? 0.25 : 0.5;
    const sub =
      typeof item.subtotal === 'number'
        ? item.subtotal
        : typeof (item as any).basePrice === 'number'
          ? (isBundle ? (item as any).basePrice * qty : Math.round((item as any).basePrice * (1 - itemDiscount)) * qty)
          : 0;

    if (isBundle) {
      bundleQuantity += qty;
      bundleSubtotal += sub;
      const feePerPkg = isFore
        ? 0
        : typeof item.bundleFee === 'number'
          ? item.bundleFee
          : isTomoro
            ? 3000
            : 0;
      bundleFee += feePerPkg * qty;
    } else {
      regularQuantity += qty;
      regularSubtotal += sub;
    }
  }

  let regularFee = 0;
  if (regularQuantity > 0) {
    if (isFore) {
      regularFee = 0; // FREE fee untuk Fore
    } else if (isTomoro) {
      regularFee = 1500 * regularQuantity;
    } else if (bundleQuantity > 0 || regularQuantity > 1) {
      regularFee = config.feeMultiItem * regularQuantity;
    } else {
      regularFee = config.feeSingleItem;
    }
  }

  if (isFore) {
    bundleFee = 0;
  }

  if (typeof fallbackFee === 'number' && fallbackFee > 0) {
    if (bundleQuantity === 0) {
      regularFee = fallbackFee;
    } else if (regularQuantity === 0) {
      bundleFee = fallbackFee;
    } else {
      if (isTomoro) {
        bundleFee = 3000 * bundleQuantity;
        regularFee = Math.max(0, fallbackFee - bundleFee);
      } else {
        bundleFee = Math.max(0, fallbackFee - regularFee);
      }
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
  addons: Array<{ name: string; categoryName?: string; price?: number }>,
  brandSlug?: string
): number {
  if (!addons || addons.length === 0) return 0;
  const isFore =
    brandSlug === 'fore' ||
    (typeof brandSlug === 'string' && brandSlug.toLowerCase().startsWith('fore-'));
  const isTomoro =
    brandSlug === 'tomoro' ||
    (typeof brandSlug === 'string' && brandSlug.toLowerCase().startsWith('tomoro-'));

  return addons.reduce((sum, addon) => {
    if ((isFore || isTomoro) && typeof addon.price === 'number') {
      return sum + addon.price;
    }
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
