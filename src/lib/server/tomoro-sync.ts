import { getSupabaseServerClient } from '../supabase-server.ts';
import { isOutletOpenBySchedule } from '../orderability.ts';

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
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

export interface TomoroStatusUpsertBuild {
  rows: Array<Record<string, any>>;
  openCount: number;
  closedCount: number;
}

/**
 * Membangun baris upsert status outlet dari baris DB yang sudah ada + peta status penyedia.
 * Hanya outlet yang terdaftar di DB DAN ditemukan di peta status yang disertakan,
 * sehingga sync tidak pernah menambah/menghapus outlet. Seluruh kolom baris DB
 * dipertahankan apa adanya; hanya is_active dan updated_at yang diganti.
 */
export function buildTomoroStatusUpsertRows(
  dbRows: Array<Record<string, any>>,
  statusMap: Map<string, boolean>,
  nowIso: string
): TomoroStatusUpsertBuild {
  const rows: Array<Record<string, any>> = [];
  let openCount = 0;
  let closedCount = 0;

  for (const row of dbRows) {
    const code = (row.code || '').trim().toLowerCase();
    if (!statusMap.has(code)) continue;

    const isOpen = statusMap.get(code)!;
    if (isOpen) openCount++;
    else closedCount++;

    rows.push({ ...row, is_active: isOpen, updated_at: nowIso });
  }

  return { rows, openCount, closedCount };
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

  // Ambil baris lengkap outlet TOMORO yang terdaftar di database untuk menghindari auto-tambah/hapus.
  // Baris lengkap diperlukan agar bulk upsert (onConflict code) tidak mengosongkan kolom lain.
  const { data: dbOutlets, error: fetchErr } = await supabase
    .from('outlets')
    .select('code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at')
    .eq('brand', 'TOMORO Coffee');

  if (fetchErr || !dbOutlets) {
    throw new Error(`Gagal membaca outlet dari DB: ${fetchErr?.message}`);
  }

  const { rows, openCount, closedCount } = buildTomoroStatusUpsertRows(
    dbOutlets,
    storeStatusMap,
    nowIso
  );

  // Tulis snapshot secara bulk upsert (maks 200 baris per panggilan, pola yang sama
  // dengan sync Kopi Kenangan) agar jumlah subrequest Worker tetap kecil.
  // Kegagalan upsert dilempar sebagai error agar kegagalan sync terlihat, bukan diam.
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('outlets')
      .upsert(chunk, { onConflict: 'code' });

    if (upsertErr) {
      throw new Error(`Gagal upsert status outlet TOMORO: ${upsertErr.message}`);
    }
  }

  return {
    syncedCount: rows.length,
    openCount,
    closedCount,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Mengevaluasi status buka/tutup outlet TOMORO mandiri berdasarkan jam operasional Jasdor (08:00 - 23:20).
 */
export function evaluateTomoroOutletStatus(
  dbRecord?: { is_active?: boolean | null; updated_at?: string | null; open_time?: string | null; close_time?: string | null } | null,
  now: Date = new Date(),
  timezone: string = 'Asia/Jakarta'
): { isOpen: boolean; canOrder: boolean; orderReason: string | null } {
  const openTime = dbRecord?.open_time || '08:00';
  const closeTime = dbRecord?.close_time || '23:20';
  const isOpen = isOutletOpenBySchedule(openTime, closeTime, now, timezone);

  if (!isOpen) {
    return {
      isOpen: false,
      canOrder: false,
      orderReason: 'Outlet sedang tutup',
    };
  }

  return {
    isOpen: true,
    canOrder: true,
    orderReason: null,
  };
}
