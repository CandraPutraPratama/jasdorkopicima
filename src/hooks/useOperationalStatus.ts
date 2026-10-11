'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OperationalStatusResult } from '@/lib/operational';

export function useOperationalStatus() {
  const [status, setStatus] = useState<OperationalStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      // Periksa apakah ada query simulate di URL browser untuk mode pengujian
      let simulateParam = '';
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sim = urlParams.get('simulate');
        if (sim === 'open' || sim === 'closed') {
          simulateParam = `?simulate=${sim}`;
        }
      }

      const res = await fetch(`/api/operational-status${simulateParam}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Gagal memeriksa status operasional');
      }
      const data: OperationalStatusResult = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error('[useOperationalStatus] Error checking operational status:', err);
      setError(err.message || 'Gagal memeriksa status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Cek ulang setiap 60 detik di sisi klien
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    isOpen: status ? status.isOpen : false,
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
