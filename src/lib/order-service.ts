import { getSupabaseServerClient } from './supabase-server.ts';
import { QRIS_CONFIG } from './site-config.ts';
import {
  calculateOrderPricing,
  calculateItemPricing,
  type OrderPricingResult,
  type OrderItemInput,
} from './pricing.ts';
import type { CartItem } from './cart-reducer.ts';
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
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  // Ambil byte acak yang aman
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `CG-${randomPart}`;
}

/**
 * Menghitung rincian harga order secara murni di server menggunakan kalkulasi pricing resmi.
 * Menghindari manipulasi harga dari sisi client.
 */
export function calculateServerOrderPricing(items: CartItem[]): OrderPricingResult {
  const pricingInputs: OrderItemInput[] = items.map((it) => ({
    name: it.name,
    basePrice: it.basePrice,
    skuPrice: it.skuPrice,
    variantAddition: it.variantAddition || 0,
    toppingTotal: it.toppingTotal || 0,
    quantity: it.quantity,
  }));

  return calculateOrderPricing(pricingInputs);
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

  const pricing = calculateServerOrderPricing(items);
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
    });

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
      variantOptions: it.variantDescription ? [it.variantDescription] : [],
      addons: (it.addons || []).map((a) => ({ name: a.name, price: a.price })),
      notes: it.notes || '',
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
    pickup_time: pickupTime,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
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
  newStatus: OrderStatus
): Promise<OrderRecord> {
  const allowedStatuses: OrderStatus[] = ['diproses', 'dibatalkan'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new OrderValidationError(`Status tidak valid untuk aksi admin: ${newStatus}`);
  }

  const order = await getOrderById(orderId);
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    throw new OrderError(`Gagal memperbarui status ke ${newStatus}`, 'DB_UPDATE_ERROR', 500, error);
  }

  order.status = newStatus;
  return order;
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
