import { getSupabaseServerClient } from './supabase-server.ts';
import { QRIS_CONFIG } from './site-config.ts';
import {
  calculateOrderPricing,
  calculateItemPricing,
  type OrderPricingResult,
  type OrderItemInput,
} from './pricing.ts';
import { getStartOfTodayWIB } from './order-stats.ts';
import { cacheService, cacheKeys } from './cache.ts';
import { kkApiClient } from './kk-client.ts';
import { normalizeMenu, normalizeProductOptions } from './adapter.ts';
import { BUSINESS_CONFIG } from '../config/business.ts';
import type { CartItem } from './cart-reducer.ts';
import type { Product, MenuGroup, ProductOptionDetails } from '../types/domain.ts';
import type { OrderRecord, OrderStatus, OrderItemSnapshot } from '../types/order.ts';

// ── TYPED ERRORS (Sesuai panduan error-handling skill) ──

export class OrderError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super(`Pesanan tidak ditemukan: ${orderId}`, 'ORDER_NOT_FOUND', 404);
  }
}

export class OrderValidationError extends OrderError {
  constructor(message: string, details?: unknown) {
    super(message, 'ORDER_VALIDATION_ERROR', 400, details);
  }
}

export class OrderStateError extends OrderError {
  constructor(message: string, currentStatus: OrderStatus) {
    super(message, 'ORDER_INVALID_STATE', 409, { currentStatus });
  }
}

/**
 * Menghasilkan Order ID acak dengan prefix CG- dan 6 karakter alfanumerik kapital unik.
 * Contoh: "CG-A8F29K"
 *
 * Entropi diambil dari Web Crypto (`crypto.getRandomValues`) agar ID tidak dapat
 * diprediksi. Karakter ambigu (I, O, 0, 1) dihilangkan supaya mudah dibacakan
 * saat pelanggan menyebutkannya ke admin.
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  let randomPart = '';
  for (let i = 0; i < bytes.length; i++) {
    randomPart += chars[bytes[i] % chars.length];
  }
  return `CG-${randomPart}`;
}

/**
 * Menghasilkan token akses rahasia per pesanan (32 karakter hex).
 * Token ini menjadi "kunci" untuk membaca dan mengonfirmasi pesanan,
 * sehingga ID publik saja tidak cukup untuk mengakses data pelanggan.
 */
export function generateOrderAccessToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Membandingkan token akses pesanan secara constant-time untuk menghindari
 * timing attack. Pesanan lama tanpa token selalu ditolak.
 */
export function verifyOrderAccessToken(
  order: Pick<OrderRecord, 'access_token'> | null | undefined,
  providedToken: string | null | undefined
): boolean {
  const expected = order?.access_token;
  if (typeof expected !== 'string' || expected.length === 0) {
    return false;
  }
  if (typeof providedToken !== 'string' || providedToken.length === 0) {
    return false;
  }
  return timingSafeEqualHex(expected, providedToken);
}

/**
 * Perbandingan string constant-time berbasis byte (aman di Workers & Node).
 * Panjang berbeda tetap dibandingkan agar waktu eksekusi tidak membocorkan panjang.
 */
function timingSafeEqualHex(expected: string, provided: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const providedBytes = new TextEncoder().encode(provided);
  const maxLength = Math.max(expectedBytes.length, providedBytes.length);
  let diff = expectedBytes.length ^ providedBytes.length;

  for (let i = 0; i < maxLength; i++) {
    diff |= (expectedBytes[i] ?? 0) ^ (providedBytes[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Menghitung rincian harga order secara murni di server menggunakan kalkulasi pricing resmi.
 * Menghindari manipulasi harga dari sisi client.
 */
export function calculateServerOrderPricing(items: CartItem[], brandSlug?: string): OrderPricingResult {
  const isTomoro =
    brandSlug === 'tomoro' ||
    items.some((it) => it.brandSlug === 'tomoro' || it.bundleType === 'tomoro-b1g1');

  const pricingInputs: OrderItemInput[] = items.map((it) => ({
    name: it.name,
    basePrice: it.basePrice,
    skuPrice: it.skuPrice,
    variantAddition: it.variantAddition || 0,
    toppingTotal: it.toppingTotal || 0,
    quantity: it.quantity,
    isBundle: it.isBundle,
    bundleType: it.bundleType,
    bundleFee: it.bundleFee,
    bundleNormalPrice: it.bundleNormalPrice,
    brandSlug: it.brandSlug || (isTomoro ? 'tomoro' : undefined),
  }));

  return calculateOrderPricing(pricingInputs, undefined, brandSlug);
}

/**
 * Validasi batasan minimal dan maksimal pembelian menu reguler (50k - 60k harga normal)
 * saat Mode Minimal Pembelian 50k aktif.
 */
export function validateRegularOrderSubtotal(params: {
  regularQuantity: number;
  regularNormalSubtotal: number;
  isMinOrderMode: boolean;
}): { isValid: boolean; error?: string } {
  if (!params.isMinOrderMode || params.regularQuantity === 0) {
    return { isValid: true };
  }
  if (params.regularNormalSubtotal < 50000) {
    return {
      isValid: false,
      error: 'Minimal pembelian Rp50.000 (harga normal)',
    };
  }
  if (params.regularNormalSubtotal > 60000) {
    return {
      isValid: false,
      error: 'Maksimal pembelian Rp60.000 (harga normal)',
    };
  }
  return { isValid: true };
}

/**
 * Mengambil menu outlet resmi dari cache atau KK API.
 * Mendukung pola stale-if-error untuk ketahanan jaringan.
 */
export async function getServerOutletMenu(outletCode: string): Promise<MenuGroup[]> {
  const cacheKey = cacheKeys.menu(outletCode);

  // 1. Cek cache segar
  const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
  if (cached && Array.isArray(cached.menuGroups) && cached.menuGroups.length > 0) {
    return cached.menuGroups;
  }

  // 2. Ambil dari KK API
  try {
    const rawMenu = await kkApiClient.queryProductMenu(outletCode);
    const menuGroups = normalizeMenu(rawMenu);
    if (!menuGroups || menuGroups.length === 0) {
      throw new Error('Menu outlet kosong atau tidak tersedia');
    }
    await cacheService.set(cacheKey, { menuGroups }, BUSINESS_CONFIG.cache.menuTtlSeconds);
    return menuGroups;
  } catch (error: any) {
    console.error(`[OrderService] Gagal memuat menu fresh outlet [${outletCode}]:`, error.message);

    // Stale-if-error: kembalikan cache stale jika ada
    const staleData = await cacheService.getStale<{ menuGroups: MenuGroup[] }>(cacheKey);
    if (staleData && Array.isArray(staleData.menuGroups) && staleData.menuGroups.length > 0) {
      console.warn(`[OrderService] Menggunakan STALE data menu untuk outlet [${outletCode}].`);
      return staleData.menuGroups;
    }

    throw new OrderError(
      'Gagal memuat data menu outlet. Silakan coba beberapa saat lagi.',
      'MENU_LOAD_ERROR',
      503
    );
  }
}

/**
 * Mengambil opsi varian, SKU, dan addon produk resmi dari cache atau KK API.
 * Mendukung pola stale-if-error untuk ketahanan jaringan.
 */
export async function getServerProductOptions(
  storeId: number,
  outletCode: string,
  bundleCode: string
): Promise<ProductOptionDetails> {
  const cacheKey = cacheKeys.productOptions(outletCode, bundleCode);

  // 1. Cek cache segar
  const cached = await cacheService.get<{ options: ProductOptionDetails }>(cacheKey);
  if (cached && cached.options) {
    return cached.options;
  }

  // 2. Ambil dari KK API
  try {
    const rawOptions = await kkApiClient.getProductOptions(storeId, outletCode, bundleCode);
    const options = normalizeProductOptions(rawOptions);
    await cacheService.set(cacheKey, { options }, BUSINESS_CONFIG.cache.optionsTtlSeconds);
    return options;
  } catch (error: any) {
    console.error(
      `[OrderService] Gagal memuat options [${outletCode}/${bundleCode}]:`,
      error.message
    );

    // Stale-if-error
    const staleData = await cacheService.getStale<{ options: ProductOptionDetails }>(cacheKey);
    if (staleData && staleData.options) {
      console.warn(`[OrderService] Menggunakan STALE options untuk [${outletCode}/${bundleCode}].`);
      return staleData.options;
    }

    throw new OrderError(
      'Gagal memuat data menu outlet. Silakan coba beberapa saat lagi.',
      'OPTIONS_LOAD_ERROR',
      503
    );
  }
}

export interface ServerRecalculationResult {
  items: CartItem[];
  pricing: OrderPricingResult;
  unavailableItems: Array<{ name: string; reason: string }>;
}

/**
 * Merekalkulasi seluruh harga item pesanan (reguler & bundling) secara otoritatif di server.
 * Mengabaikan basePrice, skuPrice, variantAddition, dan toppingTotal dari client.
 */
export async function recalculateOrderItemsWithServerPrices(params: {
  outletCode: string;
  storeId: number;
  items: CartItem[];
  allProducts: Product[];
  tierDiff: number;
}): Promise<ServerRecalculationResult> {
  const { outletCode, storeId, items, allProducts, tierDiff } = params;
  const unavailableItems: Array<{ name: string; reason: string }> = [];

  const {
    validateBundleSelection,
    calculateBundlePricing,
    normalizeProductName,
    BUNDLE_PACKAGES,
    isBundleAvailableAtOutlet,
  } = await import('./bundling.ts');

  // Clone items secara mendalam agar mutasi harga aman dan terisolasi
  const recomputedItems: CartItem[] = items.map((it) => ({
    ...it,
    addons: it.addons ? it.addons.map((a) => ({ ...a })) : [],
    bundleDetails: it.bundleDetails ? it.bundleDetails.map((d) => ({ ...d })) : undefined,
  }));

  for (const item of recomputedItems) {
    if (item.isBundle) {
      const bundleType = item.bundleType as any;
      if (!bundleType || !BUNDLE_PACKAGES[bundleType as keyof typeof BUNDLE_PACKAGES]) {
        throw new OrderValidationError(`Tipe paket bundling tidak valid: ${item.bundleType}`);
      }

      if (!isBundleAvailableAtOutlet(bundleType, allProducts)) {
        throw new OrderValidationError(
          `Paket ${BUNDLE_PACKAGES[bundleType as keyof typeof BUNDLE_PACKAGES].name} tidak tersedia di outlet ini karena pilihan menu tidak mencukupi`
        );
      }

      const details = item.bundleDetails || [];

      // Cek stok & sinkronkan live base price untuk tiap item di bundle
      for (const detail of details) {
        // Hapus/abaikan seluruh harga kiriman client di detail
        detail.liveBasePrice = undefined;
        detail.normalPrice = undefined;
        detail.promoPrice = undefined;

        const normDetail = normalizeProductName(detail.name);
        const freshProd = allProducts.find(
          (p) => normalizeProductName(p.name) === normDetail
        );

        if (!freshProd) {
          unavailableItems.push({
            name: `${detail.name} (isi ${item.name})`,
            reason: 'Menu tidak tersedia di outlet ini',
          });
        } else if (freshProd.isSoldOut) {
          unavailableItems.push({
            name: `${freshProd.name} (isi ${item.name})`,
            reason: 'Stok sedang habis di outlet ini',
          });
        } else if (freshProd.basePrice && freshProd.basePrice > 0) {
          detail.liveBasePrice = freshProd.basePrice;
        }
      }

      // Validasi pemilihan slot paket bundling dengan tierDiff outlet
      const validation = validateBundleSelection(bundleType, details as any, tierDiff);
      if (!validation.isValid) {
        throw new OrderValidationError(validation.error || 'Konfigurasi paket bundling tidak valid');
      }

      // Hitung ulang harga murni server dengan tierDiff outlet
      const bundlePricing = calculateBundlePricing(bundleType, details as any, tierDiff);
      item.bundleNormalPrice = bundlePricing.normalPrice;
      item.basePrice = bundlePricing.normalPrice;
      item.bundleFee = bundlePricing.bundleFee;

      // Sinkronkan breakdown harga tier per item detail
      for (let i = 0; i < details.length; i++) {
        const breakdown = bundlePricing.itemBreakdown[i];
        if (breakdown) {
          details[i].normalPrice = breakdown.normalPrice;
          details[i].promoPrice = breakdown.promoPrice;
        }
      }
      continue;
    }

    // Item Reguler:
    // 1. Cari produk di menu outlet server
    const freshProd = allProducts.find((p) => p.bundleCode === item.bundleCode);
    if (!freshProd) {
      unavailableItems.push({
        name: item.name || 'Produk',
        reason: 'Menu sudah tidak tersedia di outlet ini',
      });
      continue;
    }
    if (freshProd.isSoldOut) {
      unavailableItems.push({
        name: freshProd.name || item.name,
        reason: 'Stok sedang habis di outlet ini',
      });
      continue;
    }

    // 2. Ambil basePrice dari menu outlet server
    const basePrice = freshProd.basePrice;

    // 3. Ambil options produk dari server (cache/KK API)
    const options = await getServerProductOptions(storeId, outletCode, item.bundleCode);

    // 4. Resolusi SKU
    let skuPrice = basePrice;
    let variantAddition = 0;

    if (options.skus && options.skus.length > 0) {
      if (!item.sku) {
        throw new OrderValidationError('Varian atau ukuran menu tidak valid atau tidak tersedia di outlet ini');
      }
      const matchedSku = options.skus.find((s) => s.sku === item.sku);
      if (!matchedSku) {
        throw new OrderValidationError('Varian atau ukuran menu tidak valid atau tidak tersedia di outlet ini');
      }
      skuPrice = matchedSku.price;
      variantAddition = Math.max(0, matchedSku.price - basePrice);
    }

    // 5. Resolusi Toppings / Addons
    let toppingTotal = 0;
    if (item.addons && item.addons.length > 0) {
      const verifiedAddons: any[] = [];
      for (const clientAddon of item.addons) {
        const matchedAddon = options.addons.find(
          (a) =>
            (clientAddon.sku ? a.sku === clientAddon.sku : false) ||
            a.name.trim().toLowerCase() === (clientAddon.name || '').trim().toLowerCase()
        );

        if (!matchedAddon) {
          throw new OrderValidationError(`Topping "${clientAddon.name || clientAddon.sku}" tidak tersedia di outlet ini`);
        }
        if (matchedAddon.isSoldOut) {
          throw new OrderValidationError(`Topping "${matchedAddon.name}" sedang habis di outlet ini`);
        }

        verifiedAddons.push({
          sku: matchedAddon.sku,
          name: matchedAddon.name,
          price: matchedAddon.price,
          categoryName: matchedAddon.categoryName,
        });
        toppingTotal += matchedAddon.price;
      }
      item.addons = verifiedAddons;
    } else {
      item.addons = [];
      toppingTotal = 0;
    }

    // 6. Timpa seluruh nilai harga item dengan data otoritatif server
    item.basePrice = basePrice;
    item.skuPrice = skuPrice;
    item.variantAddition = variantAddition;
    item.toppingTotal = toppingTotal;
  }

  const pricing = calculateServerOrderPricing(recomputedItems);

  return {
    items: recomputedItems,
    pricing,
    unavailableItems,
  };
}


/**
 * Memeriksa apakah pesanan telah kedaluwarsa.
 * Pesanan dianggap kedaluwarsa jika waktu saat ini melebihi expires_at
 * dan status masih 'menunggu_pembayaran'.
 */
export function isOrderExpired(
  order: { expires_at: string; status: OrderStatus },
  now: Date = new Date()
): boolean {
  if (order.status !== 'menunggu_pembayaran') {
    return false;
  }
  const expiryTime = new Date(order.expires_at).getTime();
  return now.getTime() > expiryTime;
}

export interface CreateOrderParams {
  brandSlug?: string;
  outletCode: string;
  outletName?: string;
  customerName: string;
  customerWa: string;
  items: CartItem[];
  pickupTime?: string;
  notes?: string;
}

/**
 * Membentuk objek OrderRecord snapshot lengkap siap disimpan ke Supabase.
 */
export function createOrderRecord(params: CreateOrderParams): OrderRecord {
  const {
    brandSlug = 'kopi-kenangan',
    outletCode,
    outletName = '',
    customerName,
    customerWa,
    items,
    pickupTime = '',
    notes = '',
  } = params;

  if (!items || items.length === 0) {
    throw new OrderValidationError('Keranjang belanja tidak boleh kosong');
  }

  const pricing = calculateServerOrderPricing(items, brandSlug);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + QRIS_CONFIG.expiryDurationMinutes * 60 * 1000
  );

  const itemSnapshots: OrderItemSnapshot[] = items.map((it, idx) => {
    const itemPricing = calculateItemPricing({
      name: it.name,
      basePrice: it.basePrice,
      skuPrice: it.skuPrice,
      variantAddition: it.variantAddition || 0,
      toppingTotal: it.toppingTotal || 0,
      quantity: it.quantity,
      isBundle: it.isBundle,
      bundleType: it.bundleType,
      bundleFee: it.bundleFee,
      bundleNormalPrice: it.bundleNormalPrice,
    });

    // Rincian opsi varian: untuk bundling, tampilkan rincian isi paket
    let variantOptions: string[] = [];
    if (it.isBundle && it.bundleDetails && it.bundleDetails.length > 0) {
      variantOptions = it.bundleDetails.map(
        (d) => `${d.name}${d.variantDescription ? ` (${d.variantDescription})` : ''}`
      );
    } else if (it.variantDescription) {
      variantOptions = [it.variantDescription];
    }

    return {
      id: it.id || `item-${idx + 1}`,
      bundleCode: it.bundleCode,
      sku: it.sku,
      name: it.name,
      basePrice: it.basePrice,
      promoPrice: itemPricing.promoPricePerItem,
      originalPrice: itemPricing.originalPricePerItem,
      quantity: it.quantity,
      subtotal: itemPricing.subtotalItem,
      variantOptions,
      addons: (it.addons || []).map((a) => ({ name: a.name, price: a.price })),
      notes: it.notes || '',
      isBundle: it.isBundle,
      bundleType: it.bundleType,
      bundleNormalPrice: it.bundleNormalPrice,
      bundleFee: it.bundleFee,
      bundleDetails: it.bundleDetails,
    };
  });

  return {
    id: generateOrderId(),
    brand_slug: brandSlug,
    outlet_code: outletCode,
    outlet_name: outletName,
    customer_name: customerName,
    customer_wa: customerWa,
    items: itemSnapshots,
    subtotal: pricing.subtotal,
    fee: pricing.fee,
    total: pricing.total,
    status: 'menunggu_pembayaran',
    notes,
    pickup_time: (pickupTime || '').replace(/[\r\n]/g, '').trim() || undefined,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    access_token: generateOrderAccessToken(),
  };
}

/**
 * Menyimpan order baru ke Supabase database.
 */
export async function saveOrderToDb(order: OrderRecord): Promise<OrderRecord> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) {
    // Deteksi migrasi yang belum dijalankan (kolom access_token belum ada).
    // Fail loudly dengan pesan yang bisa ditindaklanjuti, bukan 500 misterius.
    if (error.code === '42703' || error.message?.includes('access_token')) {
      console.error(
        '[OrderService] Kolom orders.access_token belum ada. Jalankan supabase/migrations/007_add_order_access_token.sql'
      );
      throw new OrderError(
        'Konfigurasi database belum lengkap: migrasi token akses pesanan belum diterapkan.',
        'DB_SCHEMA_OUTDATED',
        500,
        error
      );
    }

    console.error('[OrderService] Gagal menyimpan pesanan ke Supabase:', error.message);
    throw new OrderError(
      `Gagal membuat pesanan di database: ${error.message}`,
      'DB_INSERT_ERROR',
      500,
      error
    );
  }

  return (data as OrderRecord) || order;
}

/**
 * Mengambil order berdasarkan ID.
 * Mengaplikasikan lazy expiry check: jika waktu sudah lewat expires_at dan status
 * masih 'menunggu_pembayaran', status langsung diubah ke 'kedaluwarsa'.
 */
export async function getOrderById(orderId: string): Promise<OrderRecord> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error(`[OrderService] Gagal mengambil pesanan [${orderId}]:`, error.message);
    throw new OrderError(`Gagal mengambil data pesanan`, 'DB_FETCH_ERROR', 500, error);
  }

  if (!data) {
    throw new OrderNotFoundError(orderId);
  }

  const order = data as OrderRecord;

  // Lazy check kedaluwarsa
  if (isOrderExpired(order)) {
    order.status = 'kedaluwarsa';
    try {
      await supabase
        .from('orders')
        .update({ status: 'kedaluwarsa' })
        .eq('id', orderId);
    } catch (updateErr) {
      console.warn(`[OrderService] Gagal memperbarui status kedaluwarsa [${orderId}]:`, updateErr);
    }
  }

  return order;
}

/**
 * Pelanggan menekan tombol "Saya Sudah Bayar":
 * Transisi status dari 'menunggu_pembayaran' menjadi 'menunggu_konfirmasi'.
 */
export async function confirmOrderPayment(orderId: string): Promise<OrderRecord> {
  const order = await getOrderById(orderId);

  if (order.status === 'kedaluwarsa') {
    throw new OrderStateError('Pesanan ini sudah kedaluwarsa dan tidak dapat dikonfirmasi.', order.status);
  }
  if (order.status === 'dibatalkan') {
    throw new OrderStateError('Pesanan ini telah dibatalkan.', order.status);
  }
  if (order.status === 'diproses') {
    return order; // Idempotent: sudah selesai dikonfirmasi admin
  }
  if (order.status === 'menunggu_konfirmasi') {
    return order; // Idempotent: sudah menunggu konfirmasi
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'menunggu_konfirmasi' })
    .eq('id', orderId);

  if (error) {
    throw new OrderError('Gagal memperbarui status konfirmasi pesanan', 'DB_UPDATE_ERROR', 500, error);
  }

  order.status = 'menunggu_konfirmasi';
  return order;
}

/**
 * Admin memperbarui status pesanan (misal: 'diproses' atau 'dibatalkan').
 */
export async function updateOrderStatusByAdmin(
  orderId: string,
  newStatus: OrderStatus,
  cancellationReason?: string
): Promise<OrderRecord> {
  const allowedStatuses: OrderStatus[] = ['diproses', 'dibatalkan'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new OrderValidationError(`Status tidak valid untuk aksi admin: ${newStatus}`);
  }

  const order = await getOrderById(orderId);
  const supabase = getSupabaseServerClient();

  const updatePayload: Record<string, any> = { status: newStatus };
  if (newStatus === 'dibatalkan') {
    if (cancellationReason) {
      updatePayload.cancellation_reason = cancellationReason;
    } else {
      updatePayload.cancellation_reason = 'Dibatalkan oleh admin';
    }
    if (order.status === 'menunggu_konfirmasi') {
      updatePayload.needs_refund = true;
    }
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId);

  if (error) {
    throw new OrderError(`Gagal memperbarui status ke ${newStatus}`, 'DB_UPDATE_ERROR', 500, error);
  }

  order.status = newStatus;
  if (updatePayload.cancellation_reason) {
    order.cancellation_reason = updatePayload.cancellation_reason;
  }
  return order;
}

/**
 * Membatalkan otomatis pesanan yang belum selesai saat pergantian hari (00:00 WIB).
 * - Hanya membatalkan status non-final: 'menunggu_pembayaran' dan 'menunggu_konfirmasi'.
 * - Status 'diproses', 'dibatalkan', dan 'kedaluwarsa' TIDAK disentuh.
 * - Mencatat cancellation_reason: "Otomatis dibatalkan - melewati batas hari operasional"
 * - Menandai needs_refund: true jika status awal adalah 'menunggu_konfirmasi' (karena pelanggan sudah bayar via QRIS).
 */
export async function autoCancelEodOrders(
  referenceDate?: Date
): Promise<{ updatedCount: number; orderIds: string[] }> {
  const supabase = getSupabaseServerClient();
  const startOfTodayWIB = getStartOfTodayWIB(referenceDate);
  const cancellationReason = 'Otomatis dibatalkan - melewati batas hari operasional';

  // 1. Batch update pesanan menunggu_pembayaran (needs_refund = false)
  const { data: unpaidData, error: unpaidError } = await supabase
    .from('orders')
    .update({
      status: 'dibatalkan',
      cancellation_reason: cancellationReason,
      needs_refund: false,
    })
    .eq('status', 'menunggu_pembayaran')
    .lt('created_at', startOfTodayWIB)
    .select('id');

  if (unpaidError) {
    console.error('[OrderService] Gagal auto-cancel pesanan menunggu_pembayaran:', unpaidError.message);
    throw new OrderError('Gagal membatalkan pesanan belum bayar', 'DB_UPDATE_ERROR', 500, unpaidError);
  }

  // 2. Batch update pesanan menunggu_konfirmasi (needs_refund = true)
  const { data: paidData, error: paidError } = await supabase
    .from('orders')
    .update({
      status: 'dibatalkan',
      cancellation_reason: cancellationReason,
      needs_refund: true,
    })
    .eq('status', 'menunggu_konfirmasi')
    .lt('created_at', startOfTodayWIB)
    .select('id');

  if (paidError) {
    console.error('[OrderService] Gagal auto-cancel pesanan menunggu_konfirmasi:', paidError.message);
    throw new OrderError('Gagal membatalkan pesanan sudah bayar', 'DB_UPDATE_ERROR', 500, paidError);
  }

  const unpaidIds = (unpaidData || []).map((row: any) => row.id);
  const paidIds = (paidData || []).map((row: any) => row.id);
  const orderIds = [...unpaidIds, ...paidIds];

  return { updatedCount: orderIds.length, orderIds };
}

/**
 * Mengambil daftar order untuk panel admin.
 * Urutan prioritas:
 * 1. 'menunggu_konfirmasi'
 * 2. 'menunggu_pembayaran'
 * 3. Sisanya terurut waktu terbaru.
 */
export async function listOrdersForAdmin(limit: number = 50): Promise<OrderRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new OrderError('Gagal mengambil daftar pesanan', 'DB_LIST_ERROR', 500, error);
  }

  const orders = (data || []) as OrderRecord[];

  // Evaluasi lazy expiry untuk semua order yang ditarik
  const evaluatedOrders = orders.map((o) => {
    if (isOrderExpired(o)) {
      o.status = 'kedaluwarsa';
    }
    return o;
  });

  // Urutkan dengan bobot prioritas:
  // menunggu_konfirmasi: 1
  // menunggu_pembayaran: 2
  // diproses: 3
  // kedaluwarsa / dibatalkan: 4
  const priorityWeight: Record<OrderStatus, number> = {
    menunggu_konfirmasi: 1,
    menunggu_pembayaran: 2,
    diproses: 3,
    kedaluwarsa: 4,
    dibatalkan: 5,
  };

  evaluatedOrders.sort((a, b) => {
    const weightDiff = (priorityWeight[a.status] || 99) - (priorityWeight[b.status] || 99);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return evaluatedOrders;
}
