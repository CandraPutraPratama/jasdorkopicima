import type { OperationalStatusResult } from './operational.ts';
import { getClientSessionCache, setClientSessionCache } from './client-cache.ts';

export interface BootstrapResponse {
  operational: OperationalStatusResult;
  siteSettings: {
    min_order_50k_mode: boolean;
    bundling_only_mode: boolean;
    operational_override: string;
    brand_status: Record<string, boolean>;
  };
  orderCounts: {
    today: number;
    total: number;
  };
}

let inflightBootstrapPromise: Promise<BootstrapResponse | null> | null = null;
let memoryCachedBootstrap: BootstrapResponse | null = null;
let lastFetchTimestamp = 0;
const BOOTSTRAP_MEMORY_TTL_MS = 30_000; // 30 detik TTL di memori browser

/**
 * Mengambil data inisialisasi awal (status operasional, site settings, statistik order)
 * dalam 1 request tunggal, dengan proteksi deduplikasi in-flight dan client storage cache.
 */
export async function fetchBootstrap(force = false): Promise<BootstrapResponse | null> {
  if (typeof window === 'undefined') return null;

  // 1. Kembalikan cache memori jika masih segar dan tidak dipaksa refresh
  const now = Date.now();
  if (!force && memoryCachedBootstrap && now - lastFetchTimestamp < BOOTSTRAP_MEMORY_TTL_MS) {
    return memoryCachedBootstrap;
  }

  // 2. Tab Inactive Guard: jika tab sedang tidak aktif (minimize), hindari request network baru
  if (!force && document.visibilityState !== 'visible' && memoryCachedBootstrap) {
    return memoryCachedBootstrap;
  }

  // 3. Cek sessionStorage cache jika memori dingin
  if (!force && !memoryCachedBootstrap) {
    const sessionData = getClientSessionCache<BootstrapResponse>('bootstrap_data', 60_000);
    if (sessionData) {
      memoryCachedBootstrap = sessionData;
      lastFetchTimestamp = now;
      return sessionData;
    }
  }

  // 4. In-flight Promise deduplication (jika dipanggil bersamaan oleh beberapa hook/komponen)
  if (!force && inflightBootstrapPromise) {
    return inflightBootstrapPromise;
  }

  inflightBootstrapPromise = (async () => {
    try {
      let simulateQuery = '';
      const urlParams = new URLSearchParams(window.location.search);
      const sim = urlParams.get('simulate');
      if (sim === 'open' || sim === 'closed' || sim === 'tentative') {
        simulateQuery = `?simulate=${sim}`;
      }

      const res = await fetch(`/api/bootstrap${simulateQuery}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Bootstrap API returned ${res.status}`);
      }

      const data: BootstrapResponse = await res.json();
      memoryCachedBootstrap = data;
      lastFetchTimestamp = Date.now();
      setClientSessionCache('bootstrap_data', data);
      return data;
    } catch (err) {
      console.warn('[Bootstrap] Gagal memuat bootstrap data:', err);
      return memoryCachedBootstrap;
    } finally {
      inflightBootstrapPromise = null;
    }
  })();

  return inflightBootstrapPromise;
}

export function getCachedBootstrap(): BootstrapResponse | null {
  if (memoryCachedBootstrap) return memoryCachedBootstrap;
  return getClientSessionCache<BootstrapResponse>('bootstrap_data', 60_000);
}
