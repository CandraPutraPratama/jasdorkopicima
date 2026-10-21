'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderRecord } from '@/types/order';
import {
  getMyOrderEntries,
  classifyOrders,
  type MyOrderEntry,
} from './my-orders';

export interface UseMyOrdersResult {
  entries: MyOrderEntry[];
  orders: OrderRecord[];
  activeOrders: OrderRecord[];
  historyOrders: OrderRecord[];
  activeCount: number;
  activePendingPaymentOrder: OrderRecord | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useMyOrders(): UseMyOrdersResult {
  const [entries, setEntries] = useState<MyOrderEntry[]>(() => {
    if (typeof window !== 'undefined') {
      return getMyOrderEntries();
    }
    return [];
  });
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Sinkronisasi daftar orderId dari localStorage
  const syncEntries = useCallback(() => {
    const stored = getMyOrderEntries();
    setEntries(stored);
    return stored;
  }, []);

  // 2. Fetch data terkini dari server untuk setiap orderId
  const fetchOrdersFromServer = useCallback(async (currentEntries: MyOrderEntry[]) => {
    if (!currentEntries.length) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Batasi 20 order terbaru agar ringan dan hemat kuota
      const targetEntries = currentEntries.slice(0, 20);

      const results = await Promise.allSettled(
        targetEntries.map(async (entry) => {
          // Kirim token akses agar server bisa memverifikasi kepemilikan pesanan
          const tokenQuery = entry.accessToken
            ? `?t=${encodeURIComponent(entry.accessToken)}`
            : '';
          const res = await fetch(
            `/api/orders/${encodeURIComponent(entry.orderId)}${tokenQuery}`,
            {
              cache: 'no-store',
            }
          );
          if (!res.ok) return null;
          const data = await res.json();
          return data?.success && data?.order ? (data.order as OrderRecord) : null;
        })
      );

      const fetchedOrders: OrderRecord[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          fetchedOrders.push(res.value);
        }
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.warn('[useMyOrders] Gagal memuat status pesanan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const current = syncEntries();
    await fetchOrdersFromServer(current);
  }, [syncEntries, fetchOrdersFromServer]);

  // Initial load & event listener
  useEffect(() => {
    const current = getMyOrderEntries();
    queueMicrotask(() => {
      fetchOrdersFromServer(current);
    });

    const handleUpdate = () => {
      const updated = syncEntries();
      fetchOrdersFromServer(updated);
    };

    window.addEventListener('jasdor_my_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('jasdor_my_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [syncEntries, fetchOrdersFromServer]);

  // Periodik refresh ringan (setiap 30 detik jika ada pesanan aktif)
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (o) => o.status === 'menunggu_pembayaran' || o.status === 'menunggu_konfirmasi'
    );
    if (!hasActiveOrders) return;

    const interval = setInterval(() => {
      const current = syncEntries();
      fetchOrdersFromServer(current);
    }, 30000);

    return () => clearInterval(interval);
  }, [orders, syncEntries, fetchOrdersFromServer]);

  // Klasifikasi pesanan aktif vs riwayat
  const { active: activeOrders, history: historyOrders } = useMemo(() => {
    return classifyOrders(orders);
  }, [orders]);

  // Pesanan menunggu pembayaran yang belum kedaluwarsa (untuk banner)
  const activePendingPaymentOrder = useMemo(() => {
    return (
      activeOrders.find((o) => o.status === 'menunggu_pembayaran') || null
    );
  }, [activeOrders]);

  return {
    entries,
    orders,
    activeOrders,
    historyOrders,
    activeCount: activeOrders.length,
    activePendingPaymentOrder,
    isLoading,
    refresh,
  };
}
