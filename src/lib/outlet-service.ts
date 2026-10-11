import { getSupabaseServerClient } from './supabase-server.ts';
import { kkApiClient } from './kk-client.ts';
import { normalizeStores } from './adapter.ts';
import type { Outlet } from '../types/domain.ts';

export interface SearchOutletsResult {
  items: Outlet[];
  total: number;
  source: 'database' | 'kk-api-fallback';
}

/**
 * Mencari outlet dari database Supabase dengan indeks pencarian cepat.
 * Jika database masih kosong, otomatis fallback ke pemanggilan KK API langsung.
 */
export async function searchOutlets(
  keyword = '',
  page = 1,
  pageSize = 20
): Promise<SearchOutletsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from('outlets')
      .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active', {
        count: 'exact',
      })
      .eq('is_active', true);

    const trimmed = keyword.trim();
    if (trimmed) {
      // Menggunakan pencarian cepat yang didukung indeks pg_trgm (name & address)
      query = query.or(`name.ilike.%${trimmed}%,address.ilike.%${trimmed}%`);
    }

    query = query.order('name', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (!error && data && (count ?? 0) > 0) {
      const items: Outlet[] = data.map((row) => ({
        id: Number(row.id),
        code: row.code,
        name: row.name,
        address: row.address,
        isOpen: true, // is_open dinamis diambil segar dari get_store saat outlet dipilih
        openTime: row.open_time || '',
        closeTime: row.close_time || '',
        timeZone: 7,
      }));

      return {
        items,
        total: count ?? items.length,
        source: 'database',
      };
    }
  } catch (err: any) {
    console.warn(`[OutletService] Gagal membaca dari database Supabase (${err.message}). Menggunakan fallback KK API.`);
  }

  // Fallback ke KK API langsung
  const rawData = await kkApiClient.queryStore({
    pageNum: page,
    pageSize,
    keyword,
  });

  return {
    items: normalizeStores(rawData.store || []),
    total: rawData.total || 0,
    source: 'kk-api-fallback',
  };
}

/**
 * Sinkronisasi seluruh outlet dari Kopi Kenangan ke database Supabase.
 * Mengambil seluruh outlet secara batch (page_size: 100) dan melakukan bulk upsert.
 */
export async function syncOutletsToDb(): Promise<{
  syncedCount: number;
  durationMs: number;
}> {
  const startTime = Date.now();
  const supabase = getSupabaseServerClient();

  let currentPage = 1;
  const pageSize = 100;
  let totalFetched = 0;
  let hasMore = true;
  const allStoresToUpsert: any[] = [];

  while (hasMore) {
    const data = await kkApiClient.queryStore({
      pageNum: currentPage,
      pageSize,
      keyword: '',
    });

    const stores = data.store || [];
    if (stores.length === 0) {
      break;
    }

    for (const s of stores) {
      allStoresToUpsert.push({
        code: s.code,
        name: (s.name || '').trim(),
        address: (s.address || '').trim(),
        open_time: s.open || '',
        close_time: s.close || '',
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    }

    totalFetched += stores.length;
    if (totalFetched >= (data.total || 0) || stores.length < pageSize) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  // Lakukan bulk upsert bertahap (chunk per 200 baris)
  const chunkSize = 200;
  for (let i = 0; i < allStoresToUpsert.length; i += chunkSize) {
    const chunk = allStoresToUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('outlets').upsert(chunk, {
      onConflict: 'code',
    });

    if (error) {
      throw new Error(`Gagal upsert outlet ke Supabase: ${error.message}`);
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    syncedCount: allStoresToUpsert.length,
    durationMs,
  };
}
