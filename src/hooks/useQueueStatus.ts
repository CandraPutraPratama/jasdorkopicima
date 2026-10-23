'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QueueStatus } from '@/lib/queue';

/** Ambil status antrean terbaru dari API. Mengembalikan null bila gagal. */
export async function fetchQueueStatus(): Promise<QueueStatus | null> {
  try {
    const res = await fetch('/api/queue-status', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      typeof data?.activeOrders !== 'number' ||
      typeof data?.totalItems !== 'number' ||
      typeof data?.estimateMinutes !== 'number'
    ) {
      return null;
    }
    return data as QueueStatus;
  } catch {
    return null;
  }
}

/** Hook status antrean: memuat sekali saat aktif, bisa dimuat ulang manual. */
export function useQueueStatus(enabled: boolean = true) {
  const [queue, setQueue] = useState<QueueStatus | null>(null);

  const refresh = useCallback(async () => {
    const data = await fetchQueueStatus();
    if (data) {
      setQueue(data);
    }
    return data;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchQueueStatus().then((data) => {
      if (!cancelled && data) {
        setQueue(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { queue, refreshQueue: refresh };
}
