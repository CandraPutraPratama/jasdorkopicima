import type { OrderRecord, OrderStatus } from '@/types/order';

export const MY_ORDERS_STORAGE_KEY = 'jasdor_my_orders';
export const MAX_MY_ORDERS = 50;

export interface MyOrderEntry {
  orderId: string;
  createdAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

function getSafeStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function dispatchStorageUpdate(entries: MyOrderEntry[]) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('jasdor_my_orders_updated', { detail: entries })
      );
    } catch {
      // safe fallback if CustomEvent not supported
    }
  }
}

/**
 * Mengambil daftar ID pesanan yang tersimpan di localStorage perangkat ini.
 */
export function getMyOrderEntries(customStorage?: StorageLike): MyOrderEntry[] {
  const storage = getSafeStorage(customStorage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(MY_ORDERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is MyOrderEntry =>
        Boolean(item && typeof item.orderId === 'string' && item.orderId.trim().length > 0)
    );
  } catch {
    return [];
  }
}

/**
 * Menyimpan orderId baru ke localStorage perangkat ini.
 * Menjamin deduplikasi: pesanan diletakkan di paling atas (terbaru).
 */
export function saveMyOrder(
  orderId: string,
  createdAt?: string,
  customStorage?: StorageLike
): MyOrderEntry[] {
  if (!orderId || typeof orderId !== 'string') return [];

  const trimmedId = orderId.trim();
  if (!trimmedId) return [];

  const storage = getSafeStorage(customStorage);
  const current = getMyOrderEntries(customStorage);

  const existingWithoutCurrent = current.filter((it) => it.orderId !== trimmedId);
  const newEntry: MyOrderEntry = {
    orderId: trimmedId,
    createdAt: createdAt || new Date().toISOString(),
  };

  const updated = [newEntry, ...existingWithoutCurrent].slice(0, MAX_MY_ORDERS);

  if (storage) {
    try {
      storage.setItem(MY_ORDERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[MyOrders] Gagal menyimpan ke localStorage:', err);
    }
  }

  dispatchStorageUpdate(updated);
  return updated;
}

/**
 * Menghapus pesanan tertentu dari localStorage perangkat ini.
 */
export function removeMyOrder(
  orderId: string,
  customStorage?: StorageLike
): MyOrderEntry[] {
  const trimmedId = orderId?.trim();
  if (!trimmedId) return [];

  const storage = getSafeStorage(customStorage);
  const current = getMyOrderEntries(customStorage);
  const updated = current.filter((it) => it.orderId !== trimmedId);

  if (storage) {
    try {
      storage.setItem(MY_ORDERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[MyOrders] Gagal menghapus dari localStorage:', err);
    }
  }

  dispatchStorageUpdate(updated);
  return updated;
}

/**
 * Mengosongkan riwayat pesanan di perangkat ini.
 */
export function clearMyOrders(customStorage?: StorageLike): void {
  const storage = getSafeStorage(customStorage);
  if (storage) {
    try {
      storage.removeItem(MY_ORDERS_STORAGE_KEY);
    } catch (err) {
      console.warn('[MyOrders] Gagal mengosongkan localStorage:', err);
    }
  }
  dispatchStorageUpdate([]);
}

/**
 * Memeriksa apakah status pesanan tergolong pesanan aktif (belum selesai & belum kedaluwarsa).
 */
export function isActiveOrderStatus(status: OrderStatus, expiresAt?: string): boolean {
  if (status === 'menunggu_konfirmasi') {
    return true;
  }

  if (status === 'menunggu_pembayaran') {
    if (!expiresAt) return true;
    const expiryTime = new Date(expiresAt).getTime();
    if (isNaN(expiryTime)) return true;
    return expiryTime > Date.now();
  }

  return false;
}

/**
 * Mengelompokkan daftar OrderRecord ke dalam:
 * 1. active: Menunggu Pembayaran (aktif) & Menunggu Konfirmasi Admin.
 * 2. history: Diproses, Dibatalkan, atau Kedaluwarsa.
 */
export function classifyOrders(orders: OrderRecord[]): {
  active: OrderRecord[];
  history: OrderRecord[];
} {
  const active: OrderRecord[] = [];
  const history: OrderRecord[] = [];

  for (const rawOrder of orders) {
    const isExpired =
      rawOrder.status === 'menunggu_pembayaran' &&
      rawOrder.expires_at &&
      new Date(rawOrder.expires_at).getTime() <= Date.now();

    const order: OrderRecord = isExpired
      ? { ...rawOrder, status: 'kedaluwarsa' }
      : rawOrder;

    if (isActiveOrderStatus(order.status, order.expires_at)) {
      active.push(order);
    } else {
      history.push(order);
    }
  }

  return { active, history };
}

/**
 * Format detik sisa ke format MM:SS (misal: "14:59").
 */
export function formatCountdownTimer(totalSeconds: number): string {
  const validSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(validSeconds / 60);
  const seconds = validSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
