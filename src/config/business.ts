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
  /** Daftar brand produk resmi yang diizinkan tampil di katalog */
  allowedProductBrands: string[];
  /** Daftar kode outlet eksplisit yang diizinkan masuk lingkup jika tidak memiliki data brand */
  explicitInScopeOutletCodes: string[];
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
  /** Sumber foto produk: 'kk' (CDN Kopi Kenangan) atau 'r2' (Cloudflare R2) */
  imageSource: 'kk' | 'r2';
  /** Base URL gambar R2 */
  r2ImageBaseUrl: string;
}

export const BUSINESS_CONFIG: BusinessConfig = {
  pricing: {
    baseDiscountPercent: Number(process.env.NEXT_PUBLIC_BASE_DISCOUNT_PERCENT) || 0.5,
    feeMultiItem: Number(process.env.NEXT_PUBLIC_FEE_MULTI_ITEM) || 2300,
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
  /** Pola nama produk yang disembunyikan di seluruh aplikasi (misal: Seliter, Chigo, FLIP) */
  hiddenProductPatterns: [
    'seliter',
    'chigo',
    'chimate',
    'krunchi',
    'flip',
  ],
  menuGroupAllowlist: [
    'Baru!',
    'Coffee',
    'Non Coffee',
    'Kenangan Frappe',
    'Kenangan Toast',
    'Food',
  ],
  allowedProductBrands: [
    'Kopi Kenangan',
    'Cerita Roti',
    'Kenangan Manis',
  ],
  explicitInScopeOutletCodes: [
    'KK.BTM.RKTNJGUNCG',
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
  imageSource: (process.env.IMAGE_SOURCE || 'r2').toLowerCase() === 'kk' ? 'kk' : 'r2',
  r2ImageBaseUrl: 'https://gambar.cimagroup.my.id/product',
};

export const addonPrices = BUSINESS_CONFIG.pricing.addonPrices;
export const flatOptionAdditions = BUSINESS_CONFIG.pricing.flatOptionAdditions;
export const menuGroupAllowlist = BUSINESS_CONFIG.menuGroupAllowlist;
export const allowedProductBrands = BUSINESS_CONFIG.allowedProductBrands;
export const explicitInScopeOutletCodes = BUSINESS_CONFIG.explicitInScopeOutletCodes;
export const hiddenOptionValues = BUSINESS_CONFIG.hiddenOptionValues;
export const hiddenProductPatterns = BUSINESS_CONFIG.hiddenProductPatterns;

/**
 * Mengecek apakah brand produk diizinkan untuk tampil di menu (allowedProductBrands).
 * - Pencocokan dilakukan TANPA peka huruf besar/kecil (case-insensitive).
 * - Brand resmi diizinkan: "Kopi Kenangan", "Cerita Roti", "Kenangan Manis".
 * - Brand non-KK (Chigo, CHIGO, FLIP, Satu Kenangan, dll): mengembalikan false.
 * - Produk tanpa field brand: diizinkan tampil HANYA jika outlet-nya in-scope.
 */
export function isAllowedProductBrand(brand?: string | null, isOutletInScope = true): boolean {
  if (!brand || typeof brand !== 'string' || brand.trim() === '') {
    return isOutletInScope;
  }
  const cleanBrand = brand.trim().toLowerCase();
  return BUSINESS_CONFIG.allowedProductBrands.some(
    (allowed) => allowed.trim().toLowerCase() === cleanBrand
  );
}

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
 * Mengecek apakah suatu produk disembunyikan berdasarkan pola nama (misal nama mengandung "Seliter", "Chigo", "FLIP").
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
 * Aturan Perbaikan Lingkup:
 * - IN SCOPE: brand_and_image memuat brand_code 1 DAN tidak memuat brand_code 10 (Signature) atau 6 (Heritage).
 * - Outlet gabungan Kopi Kenangan + Chigo (brand_code 1 dan 4/8) MASUK LINGKUP.
 * - OUT OF SCOPE: Kenangan Signature, Kenangan Heritage, Chigo saja, booth/testing.
 * - Outlet tanpa data brand (brand_and_image null/kosong): HANYA masuk lingkup jika kodenya ada dalam explicitInScopeOutletCodes (KK.BTM.RKTNJGUNCG).
 */
export function isStoreInScope(store: {
  code?: string;
  name?: string;
  brand_and_image?: Array<{ brand_code: number; brand_name?: string }> | null;
}): boolean {
  const code = (store.code || '').trim().toLowerCase();
  const name = (store.name || '').trim().toLowerCase();

  // 1. Pengecualian mutlak: Kenangan Signature dan Kenangan Heritage
  if (code.startsWith('ks.') || name.includes('signature')) {
    return false;
  }
  if (code.startsWith('kh.') || code === 'jkt.kenhertg' || name.includes('heritage')) {
    return false;
  }
  if (name.includes('internal testing') || code.startsWith('testposstores')) {
    return false;
  }

  // 2. Evaluasi data brand
  const hasBrandData = Array.isArray(store.brand_and_image) && store.brand_and_image.length > 0;
  if (!hasBrandData) {
    // Outlet tanpa data brand: HANYA diizinkan jika kodenya ada di explicitInScopeOutletCodes
    const rawCode = (store.code || '').trim().toUpperCase();
    return BUSINESS_CONFIG.explicitInScopeOutletCodes.includes(rawCode);
  }

  const brandCodes = store.brand_and_image!.map((b) => b.brand_code);

  // Menolak jika terdapat brand_code 10 (Signature) atau 6 (Heritage)
  if (brandCodes.includes(10) || brandCodes.includes(6)) {
    return false;
  }

  // WAJIB memiliki brand_code 1 (Kopi Kenangan)
  if (!brandCodes.includes(1)) {
    return false;
  }

  return true;
}

/**
 * Mengidentifikasi nama brand dari outlet
 */
export function getStoreBrandName(store: {
  code?: string;
  name?: string;
  brand_and_image?: Array<{ brand_code: number; brand_name?: string }> | null;
}): string {
  const code = (store.code || '').trim().toLowerCase();
  const name = (store.name || '').trim().toLowerCase();

  if (code.startsWith('ks.') || name.includes('signature')) {
    return 'Kenangan Signature';
  }
  if (code.startsWith('kh.') || code === 'jkt.kenhertg' || name.includes('heritage')) {
    return 'Kenangan Heritage';
  }

  if (store.brand_and_image && Array.isArray(store.brand_and_image) && store.brand_and_image.length > 0) {
    const brandCodes = store.brand_and_image.map((b) => b.brand_code);
    if (brandCodes.includes(10)) return 'Kenangan Signature';
    if (brandCodes.includes(6)) return 'Kenangan Heritage';
    if (brandCodes.includes(1)) {
      if (brandCodes.includes(4) || brandCodes.includes(8)) {
        return 'Kopi Kenangan + Chigo';
      }
      return 'Kopi Kenangan';
    }
    if (brandCodes.includes(4) || brandCodes.includes(8)) {
      return 'Chigo x Flip';
    }
  }

  const rawCode = (store.code || '').trim().toUpperCase();
  if (BUSINESS_CONFIG.explicitInScopeOutletCodes.includes(rawCode)) {
    return 'Kopi Kenangan';
  }

  if (name.includes('chigo') || code.includes('.cg') || code.startsWith('tgr.cg')) {
    return 'Chigo x Flip';
  }

  return 'Tanpa Brand';
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
