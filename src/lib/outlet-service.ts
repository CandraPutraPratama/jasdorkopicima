import { getSupabaseServerClient } from './supabase-server.ts';
import { kkApiClient } from './kk-client.ts';
import { normalizeStores } from './adapter.ts';
import { isStoreInScope, getStoreBrandName } from '../config/business.ts';
import type { Outlet } from '../types/domain.ts';

export interface SearchOutletsResult {
  items: Outlet[];
  total: number;
  source: 'database' | 'kk-api-fallback';
}

/**
 * Mencari outlet berdasarkan keyword (nama, mall, atau jalan).
 * Jika keyword kosong, langsung mengembalikan daftar kosong (tidak menampilkan seluruh 1.357 outlet).
 * Menggunakan KK API queryStore untuk mendapatkan status order_type, status, dan order_msg real-time.
 * Jika KK API gagal, otomatis fallback ke pencarian database Supabase.
 */
export async function searchOutlets(
  keyword = '',
  page = 1,
  pageSize = 20
): Promise<SearchOutletsResult> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      items: [],
      total: 0,
      source: 'database',
    };
  }

  // 1. Ambil dari KK API terlebih dahulu untuk mendapatkan status real-time (order_type, status, order_msg)
  try {
    const rawData = await kkApiClient.queryStore({
      pageNum: page,
      pageSize,
      keyword: trimmed,
    });

    const lowerKeyword = trimmed.toLowerCase();
    const items = normalizeStores(rawData.store || []).filter(
      (item) =>
        item.name.toLowerCase().includes(lowerKeyword) ||
        item.address.toLowerCase().includes(lowerKeyword) ||
        item.code.toLowerCase().includes(lowerKeyword)
    );
    return {
      items,
      total: items.length,
      source: 'kk-api-fallback',
    };
  } catch (kkErr: any) {
    console.warn(`[OutletService] KK API queryStore error (${kkErr.message}). Fallback ke Supabase.`);
  }

  // 2. Fallback ke database Supabase
  try {
    const supabase = getSupabaseServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const query = supabase
      .from('outlets')
      .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope', {
        count: 'exact',
      })
      .eq('is_active', true)
      .eq('is_in_scope', true)
      .or(`name.ilike.%${trimmed}%,address.ilike.%${trimmed}%`)
      .order('name', { ascending: true })
      .range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      const items: Outlet[] = data.map((row) => ({
        id: Number(row.id),
        code: row.code,
        name: row.name,
        address: row.address,
        isOpen: true,
        openTime: row.open_time || '',
        closeTime: row.close_time || '',
        timeZone: 7,
        canOrder: false,
        orderReason: 'Status real-time tidak tersedia',
      }));

      return {
        items,
        total: count ?? items.length,
        source: 'database',
      };
    }
  } catch (err: any) {
    console.warn(`[OutletService] Supabase fallback juga gagal: ${err.message}`);
  }

  return {
    items: [],
    total: 0,
    source: 'database',
  };
}

/**
 * Memeriksa apakah suatu kode outlet berada dalam ruang lingkup resmi Kopi Kenangan.
 * Menggunakan database Supabase (yang disinkronkan berkala dengan data brand_and_image lengkap)
 * serta pengaman berbasis prefix kode dan nama outlet.
 */
export async function verifyStoreScope(code: string, rawStore?: any): Promise<boolean> {
  const normCode = (code || '').trim().toLowerCase();
  const normName = (rawStore?.name || '').trim().toLowerCase();

  // 1. Pengecualian mutlak untuk Signature & Heritage
  if (normCode.startsWith('ks.') || normName.includes('signature')) return false;
  if (normCode.startsWith('kh.') || normCode === 'jkt.kenhertg' || normName.includes('heritage')) return false;
  if (normName.includes('internal testing') || normCode.startsWith('testposstores')) return false;

  // 2. Jika rawStore memiliki brand_and_image langsung (misal dari queryStore)
  if (rawStore?.brand_and_image && Array.isArray(rawStore.brand_and_image) && rawStore.brand_and_image.length > 0) {
    return isStoreInScope(rawStore);
  }

  // 3. Cek database Supabase yang memiliki status is_in_scope hasil sync resmi
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from('outlets')
      .select('is_in_scope')
      .eq('code', code)
      .maybeSingle();

    if (data) {
      return Boolean(data.is_in_scope);
    }
  } catch (err) {
    console.warn(`[verifyStoreScope] Gagal cek Supabase: ${err}`);
  }

  // 4. Fallback jika database tidak dapat diakses
  return !normName.includes('chigo') && !normCode.includes('.cg');
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
        latitude: s.latitude ? parseFloat(s.latitude) : null,
        longitude: s.longitude ? parseFloat(s.longitude) : null,
        open_time: s.open || '',
        close_time: s.close || '',
        is_active: true,
        brand: getStoreBrandName(s),
        is_in_scope: isStoreInScope(s),
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
