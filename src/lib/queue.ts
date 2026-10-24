/**
 * Logika antrean pemrosesan order (fitur info antrean & estimasi tunggu).
 *
 * Admin memproses order manual satu per satu via WhatsApp sesuai urutan
 * masuk (FIFO). Konstanta dari ritme kerja admin: 1 order = 4 menit.
 * Contoh patokan: 4 order aktif di antrean -> order baru estimasi 16 menit.
 */

/** Menit pemrosesan per order (termasuk buffer dari ritme asli ~3 menit). */
export const QUEUE_MINUTES_PER_ORDER = 4;

/** Estimasi di atas ambang ini wajib pop-up konfirmasi sebelum checkout. */
export const QUEUE_POPUP_THRESHOLD_MINUTES = 10;

/**
 * Status order yang dihitung sebagai antrean di info pelanggan.
 * Aturan pemilik (2026-10-24): HANYA order yang sudah diklik "Proses" oleh
 * admin (status 'diproses') yang dihitung. Order 'menunggu_konfirmasi' dan
 * 'antrian' belum dikerjakan admin, jadi tidak masuk info antrean.
 */
export const QUEUE_ACTIVE_STATUSES = ['diproses'] as const;

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
