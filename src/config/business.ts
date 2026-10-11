/**
 * Konfigurasi bisnis terpusat untuk jasdorkopicima.
 * Semua persentase diskon, aturan fee, dan jam operasional didefinisikan di sini.
 */

export interface PricingConfig {
  /** Persentase diskon untuk harga dasar (contoh: 0.5 = 50%) */
  baseDiscountPercent: number;
  /** Fee jasa jika total kuantitas pesanan > 1 item (per item dalam rupiah) */
  feeMultiItem: number;
  /** Fee jasa jika total kuantitas pesanan hanya 1 item (flat dalam rupiah) */
  feeSingleItem: number;
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
}

export const BUSINESS_CONFIG: BusinessConfig = {
  pricing: {
    baseDiscountPercent: Number(process.env.NEXT_PUBLIC_BASE_DISCOUNT_PERCENT) || 0.5,
    feeMultiItem: Number(process.env.NEXT_PUBLIC_FEE_MULTI_ITEM) || 2000,
    feeSingleItem: Number(process.env.NEXT_PUBLIC_FEE_SINGLE_ITEM) || 4000,
  },
  operational: {
    openTime: '08:00',
    closeTime: '23:20',
    timeZone: 'Asia/Jakarta',
  },
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
};
