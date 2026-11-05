/**
 * Konfigurasi dan Logika Paket Bundling Kopi Kenangan
 *
 * Rumus umum:
 * bayar = (total harga NORMAL isi paket) x 50% + fee paket
 * Fee paket MENGGANTIKAN fee per-item (bukan tambahan).
 */

import { isBundlingOnlyMode } from './feature-flags.ts';

export type BundleType =
  | 'bundle-3-reguler'
  | 'bundle-2-large'
  | 'bundle-2-drink-2-food';

export interface BundleEligibleItem {
  name: string;
  baselinePrice: number;
  category: 'drink' | 'food';
  defaultSize?: 'Regular' | 'Large';
}

export interface BundleSelectedItem {
  name: string;
  category?: 'drink' | 'food';
  bundleCode?: string;
  liveBasePrice?: number;
  variantDescription?: string;
  options?: Record<string, string>;
  notes?: string;
}

export interface BundlePackageConfig {
  id: BundleType;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  fee: number;
  normalFee: number;
  slotCount: number;
  drinkSlots?: number;
  foodSlots?: number;
  fixedSize: 'Regular' | 'Large';
  largeAddition: number;
}

export const REGULAR_ELIGIBLE_DRINKS: BundleEligibleItem[] = [
  { name: 'Americano', baselinePrice: 17000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Lemon Black Tea', baselinePrice: 17000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Banana Americano', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Blueberry Americano', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Pistachio Aren Latte', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Kopi Kenangan Mantan', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Spanish Latte', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'OG Thai Tea', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Babyccino', baselinePrice: 19000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Butterscotch Aren Latte', baselinePrice: 20000, category: 'drink', defaultSize: 'Regular' },
  { name: 'Raspberry Hibiscus', baselinePrice: 20000, category: 'drink', defaultSize: 'Regular' },
];

export const LARGE_ELIGIBLE_DRINKS: BundleEligibleItem[] = [
  { name: 'Kopi Kenangan Mantan', baselinePrice: 25000, category: 'drink', defaultSize: 'Large' },
  { name: 'Taro Cloud Latte', baselinePrice: 29000, category: 'drink', defaultSize: 'Large' },
  { name: 'Taro Milk', baselinePrice: 26000, category: 'drink', defaultSize: 'Large' },
  { name: 'Taro Cloud Milk Tea', baselinePrice: 26000, category: 'drink', defaultSize: 'Large' },
  { name: 'Taro Cloud Matcha', baselinePrice: 29000, category: 'drink', defaultSize: 'Large' },
  { name: 'Banana Americano', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
  { name: 'OG Aren Speculoos Latte', baselinePrice: 28000, category: 'drink', defaultSize: 'Large' },
  { name: 'Pistachio Aren Latte', baselinePrice: 26000, category: 'drink', defaultSize: 'Large' },
  { name: 'Cafe Malt Latte', baselinePrice: 30000, category: 'drink', defaultSize: 'Large' },
  { name: 'Kopi Susu Black Aren', baselinePrice: 30000, category: 'drink', defaultSize: 'Large' },
  { name: 'Spanish Latte', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
  { name: 'Butterscotch Aren Latte', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
  { name: 'Americano', baselinePrice: 22000, category: 'drink', defaultSize: 'Large' },
  { name: 'Cappuccino', baselinePrice: 29000, category: 'drink', defaultSize: 'Large' },
  { name: 'Latte', baselinePrice: 29000, category: 'drink', defaultSize: 'Large' },
  { name: 'Oatside Kopi Kenangan Mantan', baselinePrice: 28000, category: 'drink', defaultSize: 'Large' },
  { name: 'OG Thai Tea', baselinePrice: 23000, category: 'drink', defaultSize: 'Large' },
  { name: 'Thai Tea Loaded', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
  { name: 'OG Aren Milky Speculoos', baselinePrice: 30000, category: 'drink', defaultSize: 'Large' },
  { name: 'Fresh Lemonade', baselinePrice: 17000, category: 'drink', defaultSize: 'Large' },
  { name: 'Hazelnut Choco Milk Tea', baselinePrice: 29000, category: 'drink', defaultSize: 'Large' },
  { name: 'Lemon Black Tea', baselinePrice: 24000, category: 'drink', defaultSize: 'Large' },
  { name: 'Kenangan Milk Tea', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
  { name: 'Milo Dinosaurus', baselinePrice: 30000, category: 'drink', defaultSize: 'Large' },
  { name: 'Raspberry Hibiscus', baselinePrice: 27000, category: 'drink', defaultSize: 'Large' },
];

export const ELIGIBLE_FOODS: BundleEligibleItem[] = [
  { name: 'Roti Coklat Klasik', baselinePrice: 9000, category: 'food' },
  { name: 'Roti Susu Manis', baselinePrice: 10000, category: 'food' },
  { name: 'Sugar Donut', baselinePrice: 10000, category: 'food' },
];

/** Patokan harga normal baseline Kopi Kenangan Mantan reguler */
export const BASE_MANTAN_REGULAR_PRICE = 19000;

/** Periode promo bundling terbatas Sabtu-Minggu (WIB) */
export const BUNDLING_PROMO_START = '2026-10-31T00:00:00+07:00';
export const BUNDLING_PROMO_END = '2026-11-01T23:59:59+07:00';

/**
 * Cek apakah promo bundling saat ini sedang aktif.
 * Saat mode khusus bundling aktif (BUNDLING_ONLY_MODE), paket bundling SELALU aktif meski di luar periode promo.
 */
export function isBundlingPromoActive(
  referenceDate: Date = new Date(),
  bundlingOnlyOverride?: boolean
): boolean {
  const isOnly = bundlingOnlyOverride !== undefined ? bundlingOnlyOverride : isBundlingOnlyMode();
  if (isOnly) {
    return true;
  }
  return isWithinBundlingPromoPeriod(referenceDate);
}

/**
 * Cek apakah tanggal referensi berada di dalam rentang tanggal promo BUNDLING_PROMO_START/END.
 */
export function isWithinBundlingPromoPeriod(referenceDate: Date = new Date()): boolean {
  const start = new Date(BUNDLING_PROMO_START).getTime();
  const end = new Date(BUNDLING_PROMO_END).getTime();
  const current = referenceDate.getTime();
  return current >= start && current <= end;
}

/**
 * Cek apakah countdown promo bundling perlu ditampilkan.
 * Countdown hanya tampil jika berada di dalam periode promo.
 * Saat mode khusus bundling aktif di luar periode promo, countdown disembunyikan.
 */
export function shouldShowBundlingCountdown(referenceDate: Date = new Date()): boolean {
  return isWithinBundlingPromoPeriod(referenceDate);
}

export interface BundlingRemainingTime {
  hours: number;
  minutes: number;
  isExpired: boolean;
  formatted: string;
}

/**
 * Hitung sisa waktu promo bundling aktif.
 */
export function getBundlingRemainingTime(referenceDate: Date = new Date()): BundlingRemainingTime {
  const end = new Date(BUNDLING_PROMO_END).getTime();
  const diff = end - referenceDate.getTime();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, isExpired: true, formatted: 'Promo berakhir' };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return {
    hours,
    minutes,
    isExpired: false,
    formatted: `Berakhir dalam ${hours} jam ${minutes} mnt`,
  };
}

export const BUNDLE_PACKAGES: Record<BundleType, BundlePackageConfig> = {
  'bundle-3-reguler': {
    id: 'bundle-3-reguler',
    name: 'Bundling 3 Reguler',
    tagline: 'Pilih 3 Minuman Reguler',
    description: 'Bebas pilih 3 minuman ukuran reguler favoritmu. Total normal 50.000-60.000.',
    badge: 'Hemat Jasa Rp2.000',
    fee: 4000,
    normalFee: 6000,
    slotCount: 3,
    fixedSize: 'Regular',
    largeAddition: 0,
  },
  'bundle-2-large': {
    id: 'bundle-2-large',
    name: 'Bundling 2 Large',
    tagline: 'Pilih 2 Minuman Large',
    description: 'Bebas pilih 2 minuman ukuran large puas. Total normal 50.000-60.000.',
    badge: 'HEMAT JASA',
    fee: 4500,
    normalFee: 4600,
    slotCount: 2,
    fixedSize: 'Large',
    largeAddition: 0,
  },
  'bundle-2-drink-2-food': {
    id: 'bundle-2-drink-2-food',
    name: 'Bundling 2 Minuman + 2 Makanan',
    tagline: 'Pilih 2 Minuman + 2 Roti/Donut',
    description: 'Kombinasi lengkap 2 minuman reguler dan 2 makanan. Total normal 50.000-60.000.',
    badge: 'HEMAT JASA',
    fee: 6000,
    normalFee: 8000,
    slotCount: 4,
    drinkSlots: 2,
    foodSlots: 2,
    fixedSize: 'Regular',
    largeAddition: 0,
  },
};

/**
 * Normalisasi nama produk untuk pencocokan toleran spasi dan huruf besar-kecil.
 */
export function normalizeProductName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Memeriksa apakah nama produk eligible untuk paket tertentu.
 */
export function isEligibleForBundle(
  bundleType: BundleType,
  name: string,
  category?: 'drink' | 'food'
): BundleEligibleItem | null {
  const norm = normalizeProductName(name);

  if (bundleType === 'bundle-3-reguler') {
    return (
      REGULAR_ELIGIBLE_DRINKS.find(
        (it) => normalizeProductName(it.name) === norm
      ) || null
    );
  }

  if (bundleType === 'bundle-2-large') {
    return (
      LARGE_ELIGIBLE_DRINKS.find(
        (it) => normalizeProductName(it.name) === norm
      ) || null
    );
  }

  if (bundleType === 'bundle-2-drink-2-food') {
    if (category === 'food') {
      return (
        ELIGIBLE_FOODS.find((it) => normalizeProductName(it.name) === norm) || null
      );
    }
    if (category === 'drink') {
      return (
        REGULAR_ELIGIBLE_DRINKS.find(
          (it) => normalizeProductName(it.name) === norm
        ) || null
      );
    }
    // Jika kategori tidak di-pass, cek keduanya
    return (
      REGULAR_ELIGIBLE_DRINKS.find(
        (it) => normalizeProductName(it.name) === norm
      ) ||
      ELIGIBLE_FOODS.find((it) => normalizeProductName(it.name) === norm) ||
      null
    );
  }

  return null;
}

export interface OutletProductLike {
  name: string;
  basePrice?: number;
  bundleCode?: string;
  isSoldOut?: boolean;
}

/**
 * Mengambil daftar item eligible yang benar-benar ada di menu outlet dan tidak sold out.
 */
export function getAvailableBundleEligibleItems(
  bundleType: BundleType,
  outletProducts: OutletProductLike[],
  category?: 'drink' | 'food'
): BundleEligibleItem[] {
  const liveMap = new Map<string, OutletProductLike>();
  for (const p of outletProducts) {
    if (!p.isSoldOut) {
      liveMap.set(normalizeProductName(p.name), p);
    }
  }

  let sourceList: BundleEligibleItem[] = [];
  if (bundleType === 'bundle-3-reguler') {
    sourceList = REGULAR_ELIGIBLE_DRINKS;
  } else if (bundleType === 'bundle-2-large') {
    sourceList = LARGE_ELIGIBLE_DRINKS;
  } else if (bundleType === 'bundle-2-drink-2-food') {
    if (category === 'food') {
      sourceList = ELIGIBLE_FOODS;
    } else if (category === 'drink') {
      sourceList = REGULAR_ELIGIBLE_DRINKS;
    } else {
      sourceList = [...REGULAR_ELIGIBLE_DRINKS, ...ELIGIBLE_FOODS];
    }
  }

  return sourceList.filter((item) => liveMap.has(normalizeProductName(item.name)));
}

/**
 * Cek apakah paket bundling memiliki item yang cukup di outlet:
 * - 2 Large butuh >= 2 item
 * - 3 Reguler butuh >= 3 item
 * - 2+2 butuh >= 2 minuman dan >= 2 makanan
 */
export function isBundleAvailableAtOutlet(
  bundleType: BundleType,
  outletProducts: OutletProductLike[]
): boolean {
  if (bundleType === 'bundle-2-large') {
    const items = getAvailableBundleEligibleItems('bundle-2-large', outletProducts);
    return items.length >= 2;
  }
  if (bundleType === 'bundle-3-reguler') {
    const items = getAvailableBundleEligibleItems('bundle-3-reguler', outletProducts);
    return items.length >= 3;
  }
  if (bundleType === 'bundle-2-drink-2-food') {
    const drinks = getAvailableBundleEligibleItems('bundle-2-drink-2-food', outletProducts, 'drink');
    const foods = getAvailableBundleEligibleItems('bundle-2-drink-2-food', outletProducts, 'food');
    return drinks.length >= 2 && foods.length >= 2;
  }
  return false;
}

/**
 * Mengembalikan daftar paket bundling yang memenuhi kuota minimal item di outlet.
 */
export function getAvailableBundlePackages(
  outletProducts: OutletProductLike[]
): BundlePackageConfig[] {
  return Object.values(BUNDLE_PACKAGES).filter((pkg) =>
    isBundleAvailableAtOutlet(pkg.id, outletProducts)
  );
}

/**
 * Mendeteksi selisih tier harga outlet runtime:
 * tier_diff = (harga Mantan reguler di outlet tsb) - 19.000.
 * Jika Mantan tidak ada, gunakan median selisih dari item yang cocok vs harga baseline normal; fallback 0.
 */
export function getOutletTierDiff(outletProducts: OutletProductLike[]): number {
  if (!Array.isArray(outletProducts) || outletProducts.length === 0) {
    return 0;
  }

  // 1. Coba cari Kopi Kenangan Mantan reguler
  const mantanProd = outletProducts.find(
    (p) => normalizeProductName(p.name) === 'kopi kenangan mantan'
  );
  if (mantanProd && typeof mantanProd.basePrice === 'number' && mantanProd.basePrice > 0) {
    return Math.max(0, mantanProd.basePrice - BASE_MANTAN_REGULAR_PRICE);
  }

  // 2. Fallback: median selisih item yang ter-match vs baseline normal REGULAR_ELIGIBLE_DRINKS
  const diffs: number[] = [];
  for (const regItem of REGULAR_ELIGIBLE_DRINKS) {
    const matched = outletProducts.find(
      (p) => normalizeProductName(p.name) === normalizeProductName(regItem.name)
    );
    if (matched && typeof matched.basePrice === 'number' && matched.basePrice > 0) {
      diffs.push(matched.basePrice - regItem.baselinePrice);
    }
  }

  if (diffs.length === 0) {
    return 0;
  }

  diffs.sort((a, b) => a - b);
  const mid = Math.floor(diffs.length / 2);
  const median =
    diffs.length % 2 !== 0
      ? diffs[mid]
      : Math.round((diffs[mid - 1] + diffs[mid]) / 2);

  return Math.max(0, median);
}

/** Batas rentang total harga normal bundling FIX di semua outlet (50.000 - 60.000) */
export const BUNDLE_MIN_NORMAL_PRICE = 50000;
export const BUNDLE_MAX_NORMAL_PRICE = 60000;

/**
 * Menghitung threshold rentang harga normal bundling (FIX 50.000 - 60.000 di semua outlet).
 */
export function getBundleThresholds(
  bundleType?: BundleType,
  tierDiff?: number
): { min: number; max: number } {
  void bundleType;
  void tierDiff;
  return {
    min: BUNDLE_MIN_NORMAL_PRICE,
    max: BUNDLE_MAX_NORMAL_PRICE,
  };
}

/**
 * Menghasilkan teks deskripsi paket bundling dengan rentang harga FIX 50.000 - 60.000.
 */
export function getBundleDescription(
  bundleType: BundleType,
  tierDiff: number = 0
): string {
  void tierDiff;
  const minFormatted = BUNDLE_MIN_NORMAL_PRICE.toLocaleString('id-ID');
  const maxFormatted = BUNDLE_MAX_NORMAL_PRICE.toLocaleString('id-ID');

  if (bundleType === 'bundle-3-reguler') {
    return `Bebas pilih 3 minuman ukuran reguler favoritmu. Total normal ${minFormatted}-${maxFormatted}.`;
  }
  if (bundleType === 'bundle-2-large') {
    return `Bebas pilih 2 minuman ukuran large puas. Total normal ${minFormatted}-${maxFormatted}.`;
  }
  return `Kombinasi lengkap 2 minuman reguler dan 2 makanan. Total normal ${minFormatted}-${maxFormatted}.`;
}

export interface BundlePricingResult {
  bundleType: BundleType;
  bundleName: string;
  normalPrice: number;
  promoSubtotal: number;
  bundleFee: number;
  total: number;
  totalSavings: number;
  itemBreakdown: Array<{
    name: string;
    normalPrice: number;
    promoPrice: number;
    category?: 'drink' | 'food';
    variantDescription?: string;
  }>;
}

/**
 * Menghitung harga paket bundling murni.
 * Rumus:
 * - normalPrice: total harga normal dari setiap item di dalam paket.
 *   - Untuk bundle-2-large: fixed baseline + tierDiff
 *   - Untuk lainnya: liveBasePrice jika ada, atau baseline + tierDiff
 * - promoSubtotal: Math.round(normalPrice * 0.5)
 * - bundleFee: fee paket
 * - total: promoSubtotal + bundleFee
 * - totalSavings: normalPrice - promoSubtotal
 */
export function calculateBundlePricing(
  bundleType: BundleType,
  selectedItems: BundleSelectedItem[],
  tierDiff: number = 0
): BundlePricingResult {
  const config = BUNDLE_PACKAGES[bundleType];
  if (!config) {
    throw new Error(`Paket bundling tidak dikenal: ${bundleType}`);
  }

  const safeTier = Math.max(0, tierDiff);
  let normalPrice = 0;
  const itemBreakdown = selectedItems.map((item) => {
    const eligible = isEligibleForBundle(bundleType, item.name, item.category);
    let itemNormal = 0;
    if (bundleType === 'bundle-2-large') {
      itemNormal = (eligible?.baselinePrice || 0) + safeTier;
    } else {
      if (typeof item.liveBasePrice === 'number' && item.liveBasePrice > 0) {
        itemNormal = item.liveBasePrice;
      } else {
        itemNormal = (eligible?.baselinePrice || 0) + safeTier;
      }
    }

    normalPrice += itemNormal;
    const itemPromo = Math.round(itemNormal * 0.5);

    return {
      name: eligible?.name || item.name,
      normalPrice: itemNormal,
      promoPrice: itemPromo,
      category: item.category || eligible?.category,
      variantDescription: item.variantDescription,
    };
  });

  const promoSubtotal = Math.round(normalPrice * 0.5);
  const bundleFee = config.fee;
  const total = promoSubtotal + bundleFee;
  const totalSavings = normalPrice - promoSubtotal;

  return {
    bundleType,
    bundleName: config.name,
    normalPrice,
    promoSubtotal,
    bundleFee,
    total,
    totalSavings,
    itemBreakdown,
  };
}

/**
 * Validasi pemilihan slot paket bundling.
 */
export function validateBundleSelection(
  bundleType: BundleType,
  selectedItems: BundleSelectedItem[],
  tierDiff: number = 0
): { isValid: boolean; error?: string } {
  const config = BUNDLE_PACKAGES[bundleType];
  if (!config) {
    return { isValid: false, error: `Tipe paket bundling tidak valid: ${bundleType}` };
  }

  if (!Array.isArray(selectedItems)) {
    return { isValid: false, error: 'Daftar item paket tidak valid' };
  }

  if (selectedItems.length !== config.slotCount) {
    return {
      isValid: false,
      error: `Paket ${config.name} memerlukan tepat ${config.slotCount} item (terpilih: ${selectedItems.length})`,
    };
  }

  if (bundleType === 'bundle-2-drink-2-food') {
    const drinks = selectedItems.filter((it) => it.category === 'drink');
    const foods = selectedItems.filter((it) => it.category === 'food');

    if (drinks.length !== 2 || foods.length !== 2) {
      return {
        isValid: false,
        error: `Paket ${config.name} memerlukan 2 minuman dan 2 makanan (terpilih: ${drinks.length} minuman, ${foods.length} makanan)`,
      };
    }

    for (const d of drinks) {
      const eligible = isEligibleForBundle(bundleType, d.name, 'drink');
      if (!eligible) {
        return {
          isValid: false,
          error: `Minuman "${d.name}" tidak termasuk dalam daftar eligible paket ini`,
        };
      }
    }

    for (const f of foods) {
      const eligible = isEligibleForBundle(bundleType, f.name, 'food');
      if (!eligible) {
        return {
          isValid: false,
          error: `Makanan "${f.name}" tidak termasuk dalam daftar eligible paket ini`,
        };
      }
    }
  } else {
    // Paket 1 & 2
    for (const item of selectedItems) {
      const eligible = isEligibleForBundle(bundleType, item.name, 'drink');
      if (!eligible) {
        return {
          isValid: false,
          error: `Item "${item.name}" tidak termasuk dalam daftar eligible paket ${config.name}`,
        };
      }
    }
  }

  // Validasi rentang total normal [50.000 - 60.000] FIX untuk SEMUA tipe bundling
  const pricing = calculateBundlePricing(bundleType, selectedItems, tierDiff);
  const { min, max } = getBundleThresholds(bundleType, tierDiff);
  if (pricing.normalPrice < min || pricing.normalPrice > max) {
    return {
      isValid: false,
      error: `Total normal paket ${config.name} harus antara Rp${min.toLocaleString('id-ID')} - Rp${max.toLocaleString('id-ID')} (total saat ini: Rp${pricing.normalPrice.toLocaleString('id-ID')})`,
    };
  }

  return { isValid: true };
}
