'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderRecord } from '@/types/order';
import {
  getMyOrderEntries,
  classifyOrders,
  type MyOrderEntry,
} from './my-orders';

// In-memory cache module-level untuk mencegah duplikasi fetch serentak antar komponen (misal: Header & ActiveOrderBanner)
let inflightOrdersPromise: Promise<OrderRecord[]> | null = null;
let lastOrdersFetchTime = 0;
let cachedOrderRecords: OrderRecord[] = [];
const terminalOrdersCache = new Map<string, OrderRecord>();
const CACHE_TTL_MS = 5000; // 5 detik throttle antar fetch otomatis

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
  const [orders, setOrders] = useState<OrderRecord[]>(cachedOrderRecords);
  const [isLoading, setIsLoading] = useState<boolean>(cachedOrderRecords.length === 0);

  // 1. Sinkronisasi daftar orderId dari localStorage
  const syncEntries = useCallback(() => {
    const stored = getMyOrderEntries();
    setEntries(stored);
    return stored;
  }, []);

  // 2. Fetch data terkini dari server untuk setiap orderId (dengan deduplikasi in-flight & cache order terminal)
  const fetchOrdersFromServer = useCallback(async (currentEntries: MyOrderEntry[], forceRefresh = false) => {
    if (!currentEntries.length) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    // Jika tidak force refresh dan cache masih hangat, gunakan cache
    if (!forceRefresh && Date.now() - lastOrdersFetchTime < CACHE_TTL_MS && cachedOrderRecords.length > 0) {
      setOrders(cachedOrderRecords);
      setIsLoading(false);
      return;
    }

    // Jika sedang ada fetch yang berjalan bersamaan dari komponen lain (misal Header vs ActiveOrderBanner), gabungkan promise
    if (!forceRefresh && inflightOrdersPromise) {
      try {
        const sharedOrders = await inflightOrdersPromise;
        setOrders(sharedOrders);
      } catch {
        // Fallback jika error
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    inflightOrdersPromise = (async () => {
      try {
        // Batasi 20 order terbaru agar ringan dan hemat kuota
        const targetEntries = currentEntries.slice(0, 20);
        const fetchedOrders: OrderRecord[] = [];
        const needFetchEntries: MyOrderEntry[] = [];

        for (const entry of targetEntries) {
          if (!forceRefresh && terminalOrdersCache.has(entry.orderId)) {
            fetchedOrders.push(terminalOrdersCache.get(entry.orderId)!);
          } else {
            needFetchEntries.push(entry);
          }
        }

        if (needFetchEntries.length > 0) {
          const results = await Promise.allSettled(
            needFetchEntries.map(async (entry) => {
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

          for (const res of results) {
            if (res.status === 'fulfilled' && res.value) {
              const ord = res.value;
              fetchedOrders.push(ord);
              if (ord.status === 'selesai' || ord.status === 'dibatalkan' || ord.status === 'kedaluwarsa') {
                terminalOrdersCache.set(ord.id, ord);
              }
            }
          }
        }

        const orderMap = new Map(fetchedOrders.map((o) => [o.id, o]));
        const sortedOrders = targetEntries
          .map((e) => orderMap.get(e.orderId))
          .filter((o): o is OrderRecord => Boolean(o));

        cachedOrderRecords = sortedOrders;
        lastOrdersFetchTime = Date.now();
        return sortedOrders;
      } catch (err) {
        console.warn('[useMyOrders] Gagal memuat status pesanan:', err);
        return cachedOrderRecords;
      } finally {
        inflightOrdersPromise = null;
      }
    })();

    try {
      const finalOrders = await inflightOrdersPromise;
      setOrders(finalOrders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const current = syncEntries();
    await fetchOrdersFromServer(current, true);
  }, [syncEntries, fetchOrdersFromServer]);

  // Initial load & event listener
  useEffect(() => {
    const current = getMyOrderEntries();
    queueMicrotask(() => {
      fetchOrdersFromServer(current, false);
    });

    const handleUpdate = () => {
      const updated = syncEntries();
      fetchOrdersFromServer(updated, false);
    };

    window.addEventListener('jasdor_my_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('jasdor_my_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [syncEntries, fetchOrdersFromServer]);

  // Periodik refresh ringan (setiap 30 detik HANYA jika ada pesanan aktif)
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (o) => o.status === 'menunggu_pembayaran' || o.status === 'menunggu_konfirmasi' || o.status === 'antrian' || o.status === 'diproses'
    );
    if (!hasActiveOrders) return;

    // Nomor 4: Tab Inactive Guard - re-fetch otomatis saat tab kembali aktif
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const current = syncEntries();
        fetchOrdersFromServer(current, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const current = syncEntries();
      fetchOrdersFromServer(current, false);
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
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
