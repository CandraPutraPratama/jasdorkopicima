import { getSupabaseServerClient } from '../supabase-server.ts';

export interface TomoroSyncResult {
  syncedCount: number;
  openCount: number;
  closedCount: number;
  durationMs: number;
}

type TomoroFetchFn = (pageIndex: number, pageSize: number) => Promise<any>;

// Endpoint penyedia eksternal disimpan di server-only module, tidak pernah diekspos ke client
const EXTERNAL_PROVIDER_URL = 'https://cingops.com/api/search-outlets?brand=tomoro';

let customFetcher: TomoroFetchFn | null = null;

/**
 * Menyediakan mock fetcher untuk pengujian unit tanpa memanggil jaringan eksternal.
 */
export function setTomoroSyncFetcher(fn: TomoroFetchFn | null) {
  customFetcher = fn;
}

async function defaultFetcher(pageIndex: number, pageSize: number): Promise<any> {
  const url = `${EXTERNAL_PROVIDER_URL}&pageIndex=${pageIndex}&pageSize=${pageSize}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Jasdor-Sync/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`External provider returned HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sinkronisasi status buka/tutup (isOpen) untuk seluruh outlet TOMORO Coffee ke Supabase.
 * Menuliskan status ke kolom `is_active` dan timestamp ke `updated_at`.
 * Website publik dan API HANYA membaca database lokal.
 */
export async function syncTomoroOutletsStatusToDb(): Promise<TomoroSyncResult> {
  const startTime = Date.now();
  const fetcher = customFetcher || defaultFetcher;

  const pageSize = 50;
  let pageIndex = 1;
  let hasMore = true;
  const storeStatusMap = new Map<string, boolean>();

  // Tarik data dengan penanganan retry & jeda sopan
  while (hasMore) {
    let success = false;
    let attempts = 0;
    let lastError: any = null;

    while (!attempts || (!success && attempts < 3)) {
      attempts++;
      try {
        const data = await fetcher(pageIndex, pageSize);
        const stores = data?.stores || [];

        for (const store of stores) {
          if (store && store.code) {
            const outletCode = `tomoro-${store.code.trim().toLowerCase()}`;
            storeStatusMap.set(outletCode, Boolean(store.isOpen));
          }
        }

        const total = data?.total || 0;
        if (stores.length === 0 || pageIndex * pageSize >= total) {
          hasMore = false;
        } else {
          pageIndex++;
        }

        success = true;
      } catch (err: any) {
        lastError = err;
        // Jeda backoff sebelum retry
        await new Promise((r) => setTimeout(r, 500 * attempts));
      }
    }

    if (!success) {
      console.warn(`[TomoroSync] Gagal memuat page ${pageIndex} setelah 3 percobaan: ${lastError?.message}`);
      break;
    }

    // Jeda kecil antar-halaman agar tidak agresif
    if (hasMore) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (storeStatusMap.size === 0) {
    throw new Error('Tidak ada data status outlet yang berhasil ditarik dari penyedia.');
  }

  const supabase = getSupabaseServerClient();
  const nowIso = new Date().toISOString();

  // Ambil daftar outlet TOMORO yang terdaftar di database untuk menghindari auto-tambah/hapus
  const { data: dbOutlets, error: fetchErr } = await supabase
    .from('outlets')
    .select('code')
    .eq('brand', 'TOMORO Coffee');

  if (fetchErr || !dbOutlets) {
    throw new Error(`Gagal membaca outlet dari DB: ${fetchErr?.message}`);
  }

  let openCount = 0;
  let closedCount = 0;
  const updates: Array<{ code: string; is_active: boolean; updated_at: string }> = [];

  for (const row of dbOutlets) {
    const code = row.code.trim().toLowerCase();
    if (storeStatusMap.has(code)) {
      const isOpen = storeStatusMap.get(code)!;
      if (isOpen) openCount++;
      else closedCount++;

      updates.push({
        code,
        is_active: isOpen,
        updated_at: nowIso,
      });
    }
  }

  // Tuliskan snapshot ke Supabase dalam batch
  const batchSize = 50;
  let syncedCount = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    for (const item of chunk) {
      const { error: updateErr } = await supabase
        .from('outlets')
        .update({
          is_active: item.is_active,
          updated_at: item.updated_at,
        })
        .eq('code', item.code);

      if (!updateErr) {
        syncedCount++;
      }
    }
  }

  return {
    syncedCount,
    openCount,
    closedCount,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Mengevaluasi status buka/tutup outlet TOMORO berdasarkan snapshot database.
 * Jika data lebih tua dari 30 menit (stale), status ditandai belum terverifikasi.
 */
export function evaluateTomoroOutletStatus(
  dbRecord: { is_active?: boolean | null; updated_at?: string | null },
  now: Date = new Date()
): { isOpen: boolean; canOrder: boolean; orderReason: string | null } {
  const isActive = Boolean(dbRecord.is_active);
  const updatedAtStr = dbRecord.updated_at;

  let isStale = true;
  if (updatedAtStr) {
    const updatedAt = new Date(updatedAtStr).getTime();
    if (!isNaN(updatedAt) && now.getTime() - updatedAt <= 30 * 60 * 1000) {
      isStale = false;
    }
  }

  if (isStale) {
    return {
      isOpen: false,
      canOrder: false,
      orderReason: 'Status outlet belum terverifikasi \u2014 cek langsung ke outlet',
    };
  }

  if (!isActive) {
    return {
      isOpen: false,
      canOrder: false,
      orderReason: 'Outlet tidak aktif',
    };
  }

  return {
    isOpen: true,
    canOrder: true,
    orderReason: null,
  };
}
