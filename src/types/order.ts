export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_konfirmasi'
  | 'antrian'
  | 'diproses'
  | 'selesai'
  | 'dibatalkan'
  | 'kedaluwarsa';

export interface OrderItemSnapshot {
  id: string;
  bundleCode: string;
  sku?: string;
  name: string;
  basePrice: number;
  promoPrice: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
  variantOptions?: string[];
  addons?: Array<{ name: string; price: number }>;
  notes?: string;
  isBundle?: boolean;
  bundleType?: string;
  bundleNormalPrice?: number;
  bundleFee?: number;
  bundleDetails?: Array<{
    name: string;
    category?: 'drink' | 'food';
    variantDescription?: string;
    normalPrice?: number;
    promoPrice?: number;
    notes?: string;
  }>;
}

export interface OrderRecord {
  id: string; // 'KK-XXXXXX' | 'TC-XXXXXX' | 'FR-XXXXXX' | 'CG-XXXXXX'
  brand_slug: string;
  outlet_code: string;
  outlet_name?: string;
  customer_name: string;
  customer_wa: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  fee: number;
  total: number;
  status: OrderStatus;
  notes?: string | null;
  pickup_time?: string | null;
  cancellation_reason?: string | null;
  needs_refund?: boolean;
  created_at: string;
  expires_at: string;
  /**
   * Token akses rahasia per pesanan (32 hex). Dipakai untuk mengotorisasi
   * pembacaan pesanan dan konfirmasi pembayaran tanpa menebak ID publik.
   */
  access_token?: string;
}
