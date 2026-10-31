/**
 * Logika antrean pemrosesan order (fitur info antrean & estimasi tunggu).
 *
 * Admin memproses order manual satu per satu via WhatsApp sesuai urutan
 * masuk (FIFO). Konstanta dari ritme kerja admin: 1 order (1-3 item) = maks 3 menit
 * (termasuk kirim screenshot ke WhatsApp).
 * Contoh patokan: 4 order aktif di antrean -> order baru estimasi 12 menit.
 */

/** Menit pemrosesan per order (sesuai SLA admin: 1 order 1-3 item maks 3 menit termasuk kirim screenshot WA). */
export const QUEUE_MINUTES_PER_ORDER = 3;

/** Estimasi di atas ambang ini wajib pop-up konfirmasi sebelum checkout. */
export const QUEUE_POPUP_THRESHOLD_MINUTES = 10;

/**
 * Status order yang dihitung sebagai antrean di info pelanggan.
 * Menghitung pesanan yang sudah berstatus 'antrian' (sudah konfirmasi bayar)
 * dan 'diproses' (sedang dikerjakan admin/barista).
 */
export const QUEUE_ACTIVE_STATUSES = ['antrian', 'diproses'] as const;

export type QueueLoadLevel = 'lancar' | 'ramai' | 'padat';

export interface QueueLoadInfo {
  level: QueueLoadLevel;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
  adminProcessMinutes: number;
}

/**
 * Mengklasifikasikan beban antrean toko menjadi 3 level:
 * - 0 - 3 order: Lancar (🟢)
 * - 4 - 7 order: Sedang Ramai (🟡)
 * - 8+ order: Antrean Padat (🔴)
 */
export function getQueueLoadInfo(activeOrders: number): QueueLoadInfo {
  const count = Number.isFinite(activeOrders) ? Math.max(0, Math.floor(activeOrders)) : 0;
  if (count <= 3) {
    return {
      level: 'lancar',
      label: 'Antrean Lancar',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-950',
      badgeBorder: 'border-emerald-600',
      dotColor: 'bg-emerald-500',
      description:
        count === 0
          ? 'Admin siap proses langsung (±1-3 menit)'
          : `${count} order di depan • Estimasi proses admin ±${count * QUEUE_MINUTES_PER_ORDER} menit`,
      adminProcessMinutes: Math.max(count, 1) * QUEUE_MINUTES_PER_ORDER,
    };
  }
  if (count <= 7) {
    return {
      level: 'ramai',
      label: 'Sedang Ramai',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-950',
      badgeBorder: 'border-amber-600',
      dotColor: 'bg-amber-500',
      description: `${count} order di depan • Estimasi proses admin ±${count * QUEUE_MINUTES_PER_ORDER} menit`,
      adminProcessMinutes: count * QUEUE_MINUTES_PER_ORDER,
    };
  }
  return {
    level: 'padat',
    label: 'Antrean Padat',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-950',
    badgeBorder: 'border-rose-600',
    dotColor: 'bg-rose-500',
    description: `${count} order di depan • Mohon maklum antrean panjang di gerai (±${count * QUEUE_MINUTES_PER_ORDER} menit)`,
    adminProcessMinutes: count * QUEUE_MINUTES_PER_ORDER,
  };
}

export interface QueueStatus {
  /** Jumlah order aktif di antrean saat ini. */
  activeOrders: number;
  /** Total item fisik dari seluruh order aktif (paket dihitung isinya). */
  totalItems: number;
  /** Estimasi menit untuk order BARU yang masuk sekarang. */
  estimateMinutes: number;
}

interface QueueOrderItemLike {
  quantity?: number;
  bundleDetails?: unknown[];
}

interface QueueOrderLike {
  items?: QueueOrderItemLike[] | null;
}

/**
 * Estimasi menit berdasarkan jumlah order di depan.
 * Antrean kosong tetap menghasilkan 4 menit: ordernya sendiri butuh
 * waktu proses minimal. Untuk N >= 1 hasilnya persis N x 4 menit.
 */
export function estimateQueueMinutes(ordersAhead: number): number {
  const ahead = Number.isFinite(ordersAhead) ? Math.max(0, Math.floor(ordersAhead)) : 0;
  return Math.max(ahead, 1) * QUEUE_MINUTES_PER_ORDER;
}

/** Hitung item fisik satu order: paket/bundling dihitung dari jumlah isinya. */
export function countOrderPhysicalItems(items: QueueOrderItemLike[] | null | undefined): number {
  if (!Array.isArray(items)) return 0;
  let total = 0;
  for (const item of items) {
    const qty = typeof item?.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    const perUnit =
      Array.isArray(item?.bundleDetails) && item.bundleDetails.length > 0
        ? item.bundleDetails.length
        : 1;
    total += qty * perUnit;
  }
  return total;
}

/** Agregasi statistik antrean dari baris order aktif. */
export function computeQueueStats(orders: QueueOrderLike[]): QueueStatus {
  const activeOrders = orders.length;
  const totalItems = orders.reduce(
    (sum, order) => sum + countOrderPhysicalItems(order?.items),
    0
  );
  return {
    activeOrders,
    totalItems,
    estimateMinutes: estimateQueueMinutes(activeOrders),
  };
}
