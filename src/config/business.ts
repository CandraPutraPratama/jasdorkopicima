/**
 * Konfigurasi bisnis terpusat untuk jasdorkopicima.
 * Semua persentase diskon, aturan fee, tambahan flat, opsi tersembunyi, dan jam operasional didefinisikan di sini.
 */

export interface PricingConfig {
  /** Persentase diskon untuk harga dasar (contoh: 0.5 = 50%) */
  baseDiscountPercent: number;
  /** Fee jasa jika total kuantitas pesanan > 1 item (per item dalam rupiah) */
  feeMultiItem: number;
  /** Fee jasa jika total kuantitas pesanan hanya 1 item (flat dalam rupiah) */
  feeSingleItem: number;
  /** Tabel tambahan harga FLAT per nama opsi (semua minuman memakai tambahan ini) */
  flatOptionAdditions: Record<string, number>;
  /** Harga flat untuk addon per grup */
  addonPrices: {
    whippedCream: number;
    syrup: number;
    topping: number;
  };
}

export interface OperationalConfig {
  /** Jam buka format HH:mm dalam WIB */
  openTime: string;
  /** Jam tutup format HH:mm dalam WIB */
  closeTime: string;
  /** Zona waktu referensi server */
  timeZone: string;
}

export interface BusinessConfig {
  pricing: PricingConfig;
  operational: OperationalConfig;
  /** Daftar nilai opsi yang disembunyikan di seluruh aplikasi (misal: Jumbo) */
  hiddenOptionValues: string[];
  /** Daftar pola nama produk yang disembunyikan di seluruh aplikasi (misal: Seliter) */
  hiddenProductPatterns: string[];
  /** Allowlist kelompok menu resmi yang ditampilkan (sesuai urutan) */
  menuGroupAllowlist: string[];
  cache: {
    /** TTL cache menu outlet dalam detik (15 menit) */
    menuTtlSeconds: number;
    /** TTL cache opsi varian produk dalam detik (1 jam) */
    optionsTtlSeconds: number;
    /** TTL cache status buka / detail dinamis outlet (90 detik = 1.5 menit) */
    storeOpenStatusTtlSeconds: number;
    /** TTL cache daftar outlet dalam detik (default 6 jam) */
    storesTtlSeconds: number;
  };
  client: {
    /** Timeout pemanggilan KK API dalam milidetik */
    timeoutMs: number;
    /** Jeda sopan antar request berturut-turut dalam milidetik */
    politeDelayMs: number;
  };
  whatsappNumber: string;
}

export const BUSINESS_CONFIG: BusinessConfig = {
  pricing: {
    baseDiscountPercent: Number(process.env.NEXT_PUBLIC_BASE_DISCOUNT_PERCENT) || 0.5,
    feeMultiItem: Number(process.env.NEXT_PUBLIC_FEE_MULTI_ITEM) || 2000,
    feeSingleItem: Number(process.env.NEXT_PUBLIC_FEE_SINGLE_ITEM) || 4000,
    flatOptionAdditions: {
      'large': 5000,
      'juwara beans': 3000,
      'oatside': 3000,
    },
    addonPrices: {
      whippedCream: 0,
      syrup: 6000,
      topping: 6000,
    },
  },
  operational: {
    openTime: '08:00',
    closeTime: '23:20',
    timeZone: 'Asia/Jakarta',
  },
  hiddenOptionValues: [
    'jumbo',
  ],
  /** Pola nama produk yang disembunyikan di seluruh aplikasi (misal: Seliter) */
  hiddenProductPatterns: [
    'seliter',
  ],
  menuGroupAllowlist: [
    'Baru!',
    'Coffee',
    'Non Coffee',
    'Kenangan Frappe',
    'Kenangan Toast',
    'Food',
  ],
  cache: {
    menuTtlSeconds: 15 * 60, // 15 menit
    optionsTtlSeconds: 60 * 60, // 1 jam
    storeOpenStatusTtlSeconds: 90, // 1.5 menit (antara 1 s/d 2 menit)
    storesTtlSeconds: 6 * 60 * 60, // 6 jam
  },
  client: {
    timeoutMs: 8000,
    politeDelayMs: 250,
  },
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '6287793420768',
};

export const addonPrices = BUSINESS_CONFIG.pricing.addonPrices;
export const flatOptionAdditions = BUSINESS_CONFIG.pricing.flatOptionAdditions;
export const menuGroupAllowlist = BUSINESS_CONFIG.menuGroupAllowlist;
export const hiddenOptionValues = BUSINESS_CONFIG.hiddenOptionValues;
export const hiddenProductPatterns = BUSINESS_CONFIG.hiddenProductPatterns;

/**
 * Mengambil tambahan harga flat dari nama nilai opsi (misal "Large" -> 5000, "Juwara Beans" -> 3000, "Oatside" -> 3000, lainnya 0).
 */
export function getOptionAddition(optionValueName: string): number {
  if (!optionValueName) return 0;
  const normalized = optionValueName.trim().toLowerCase();
  return BUSINESS_CONFIG.pricing.flatOptionAdditions[normalized] || 0;
}

/**
 * Mengecek apakah suatu nilai opsi termasuk nilai tersembunyi (misal "Jumbo").
 */
export function isHiddenOptionValue(optionValueName: string): boolean {
  if (!optionValueName) return false;
  const normalized = optionValueName.trim().toLowerCase();
  return BUSINESS_CONFIG.hiddenOptionValues.includes(normalized);
}

/**
 * Mengecek apakah suatu produk disembunyikan berdasarkan pola nama (misal nama mengandung "Seliter").
 */
export function isHiddenProduct(productName: string): boolean {
  if (!productName) return false;
  const clean = productName.trim().toLowerCase();
  return BUSINESS_CONFIG.hiddenProductPatterns.some((pattern) =>
    clean.includes(pattern.toLowerCase())
  );
}

/**
 * Mengecek apakah outlet berada dalam ruang lingkup resmi Kopi Kenangan.
 * Menolak outlet Kenangan Signature, Kenangan Heritage, Chigo / Chigo x Flip, dan booth non-resmi.
 */
export function isStoreInScope(store: {
  code?: string;
  name?: string;
  brand_and_image?: Array<{ brand_code: number; brand_name?: string }>;
}): boolean {
  const code = (store.code || '').trim().toLowerCase();
  const name = (store.name || '').trim().toLowerCase();

  // 1. Pengecualian eksplisit berdasarkan kode outlet
  if (code.startsWith('ks.') || code.startsWith('bcr.jab.') || code === 'jkt.kenhertg') {
    return false;
  }

  // 2. Pengecualian eksplisit berdasarkan nama outlet
  if (name.includes('signature') || name.includes('heritage') || name.includes('chigo')) {
    return false;
  }

  // 3. Pengecekan array brand_and_image dari API KK jika tersedia
  if (store.brand_and_image && Array.isArray(store.brand_and_image)) {
    const brandCodes = store.brand_and_image.map((b) => b.brand_code);
    // 10 = Kenangan Signature, 6 = Kenangan Heritage, 8 = Chigo x Flip, 4 = Chigo
    if (
      brandCodes.includes(10) ||
      brandCodes.includes(6) ||
      brandCodes.includes(8) ||
      brandCodes.includes(4)
    ) {
      return false;
    }

    // Jika memiliki penanda brand tapi bukan brand_code 1 (Kopi Kenangan)
    if (brandCodes.length > 0 && !brandCodes.includes(1)) {
      return false;
    }
  }

  return true;
}

/**
 * Mengidentifikasi nama brand dari outlet
 */
export function getStoreBrandName(store: {
  code?: string;
  name?: string;
  brand_and_image?: Array<{ brand_code: number; brand_name?: string }>;
}): string {
  const code = (store.code || '').trim().toLowerCase();
  const name = (store.name || '').trim().toLowerCase();

  if (code.startsWith('ks.') || name.includes('signature')) {
    return 'Kenangan Signature';
  }
  if (code === 'jkt.kenhertg' || name.includes('heritage')) {
    return 'Kenangan Heritage';
  }
  if (name.includes('chigo') || code.includes('.cg') || code.startsWith('tgr.cg')) {
    return 'Chigo x Flip';
  }

  if (store.brand_and_image && Array.isArray(store.brand_and_image)) {
    const brandCodes = store.brand_and_image.map((b) => b.brand_code);
    if (brandCodes.includes(10)) return 'Kenangan Signature';
    if (brandCodes.includes(6)) return 'Kenangan Heritage';
    if (brandCodes.includes(8) || brandCodes.includes(4)) return 'Chigo x Flip';
    if (brandCodes.includes(1)) return 'Kopi Kenangan';
  }

  if (code.startsWith('bcr.jab.')) {
    return 'Other';
  }

  return 'Kopi Kenangan';
}

export type AddonGroupType = 'whipped_cream' | 'syrup' | 'topping';

/**
 * Mengklasifikasikan addon ke salah satu dari 3 grup:
 * 1. whipped_cream: khusus produk yang memiliki kategori Whipped Cream di API (atau nama memuat Whipped Cream dengan harga 0 / No Whipped Cream)
 * 2. syrup: kategori Syrup atau nama memuat Syrup / Sauce
 * 3. topping: kategori Topping atau Topping lainnya
 * Mengembalikan null jika tidak dapat dipetakan.
 */
export function classifyAddonGroup(addonName: string, categoryName?: string): AddonGroupType | null {
  const normName = (addonName || '').trim().toLowerCase();
  const normCat = (categoryName || '').trim().toLowerCase();

  // 1. Cek Whipped Cream (kategori dari API atau No Whipped Cream)
  if (
    normCat === 'whipped cream' ||
    normName === 'no whipped cream' ||
    (normName.includes('whipped cream') && normCat !== 'topping')
  ) {
    return 'whipped_cream';
  }

  // 2. Cek Syrup (kategori Syrup atau nama mengandung Syrup / Sauce)
  if (
    normCat === 'syrup' ||
    normName.includes('syrup') ||
    normName.includes('sauce')
  ) {
    return 'syrup';
  }

  // 3. Cek Topping (kategori Topping atau item topping umum)
  if (
    normCat === 'topping' ||
    normName.includes('shot') ||
    normName.includes('boba') ||
    normName.includes('jelly') ||
    normName.includes('oreo') ||
    normName.includes('crumble') ||
    normName.includes('aren') ||
    normName.includes('whipped cream') // jika di bawah topping produk non-frappe
  ) {
    return 'topping';
  }

  return null;
}

/**
 * Mengecek apakah kelompok menu ada di allowlist (case-insensitive & trim spasi berlebih).
 */
export function isAllowedMenuGroup(groupName: string): boolean {
  if (!groupName) return false;
  const clean = groupName.trim().toLowerCase();
  return BUSINESS_CONFIG.menuGroupAllowlist.some(
    (item) => item.trim().toLowerCase() === clean
  );
}

/**
 * Mengambil indeks urutan kelompok menu dari allowlist (-1 jika tidak di allowlist).
 */
export function getAllowedMenuGroupIndex(groupName: string): number {
  if (!groupName) return -1;
  const clean = groupName.trim().toLowerCase();
  return BUSINESS_CONFIG.menuGroupAllowlist.findIndex(
    (item) => item.trim().toLowerCase() === clean
  );
}
