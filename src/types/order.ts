export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_konfirmasi'
  | 'diproses'
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
}

export interface OrderRecord {
  id: string; // 'CG-XXXXXX'
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
  created_at: string;
  expires_at: string;
}
