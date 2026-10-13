import { getSupabaseServerClient } from './supabase-server.ts';
import { kkApiClient } from './kk-client.ts';
import { normalizeStores } from './adapter.ts';
import { isStoreInScope, getStoreBrandName, BUSINESS_CONFIG } from '../config/business.ts';
import { cacheService, cacheKeys } from './cache.ts';
import { cleanSearchQuery, escapePostgrestFilterTerm } from './sanitizer.ts';
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
  const trimmed = cleanSearchQuery(keyword);
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
    const safeTerm = escapePostgrestFilterTerm(trimmed);
    if (!safeTerm) {
      return {
        items: [],
        total: 0,
        source: 'database',
      };
    }

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
      .or(`name.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%`)
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
/**
 * Memeriksa apakah suatu kode outlet berada dalam ruang lingkup resmi Kopi Kenangan.
 * Alur pengamanan berlapis tahan gangguan (Fault-Tolerant):
 * 1. Pengecualian mutlak untuk Signature, Heritage, dan internal testing.
 * 2. Cek database Supabase untuk status is_in_scope hasil sync resmi (timeout 5s).
 * 3. Jika Supabase tidak terjangkau / timeout:
 *    - Ambil status lingkup terakhir dari cache bila ada.
 *    - Bila tidak ada di cache, TOLAK outlet (jangan pernah menampilkan outlet yang belum terverifikasi).
 * 4. Jika outlet belum ada di tabel outlets:
 *    - Cari lewat KK API queryStore.
 *    - Evaluasi dengan isStoreInScope (termasuk explicitInScopeOutletCodes).
 *    - Upsert ke Supabase agar tersimpan untuk request berikutnya.
 *    - Bila tidak ditemukan di KK API, tolak.
 */
export async function verifyStoreScope(code: string, rawStore?: any): Promise<boolean> {
  const normCode = (code || '').trim().toLowerCase();
  const upperCode = (code || '').trim().toUpperCase();
  const normName = (rawStore?.name || '').trim().toLowerCase();

  // 1. Pengecualian mutlak untuk Signature & Heritage & testing
  if (normCode.startsWith('ks.') || normName.includes('signature')) return false;
  if (normCode.startsWith('kh.') || normCode === 'jkt.kenhertg' || normName.includes('heritage')) return false;
  if (normName.includes('internal testing') || normCode.startsWith('testposstores')) return false;

  const scopeKey = cacheKeys.storeScope(upperCode);

  // 2. Cek database Supabase dengan pengaman batas waktu 5 detik
  let supabaseError: any = null;
  let dbRecord: { is_in_scope: boolean } | null = null;
  let dbFound = false;

  try {
    const supabase = getSupabaseServerClient();
    const queryPromise = supabase
      .from('outlets')
      .select('is_in_scope')
      .ilike('code', upperCode)
      .maybeSingle();

    let timer: any;
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Supabase request timeout (5000ms)')), 5000);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    });

    try {
      const result: any = await Promise.race([queryPromise, timeoutPromise]);
      if (result.error) {
        supabaseError = result.error;
      } else if (result.data) {
        dbFound = true;
        dbRecord = result.data;
      } else {
        dbFound = false;
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (err: any) {
    supabaseError = err;
  }

  // Kasus (a): Supabase tidak terjangkau atau timeout
  if (supabaseError) {
    console.warn(`[verifyStoreScope] Supabase error/timeout untuk "${upperCode}": ${supabaseError.message}. Memeriksa fallback cache.`);
    const cachedScope = await cacheService.getStale<{ isInScope: boolean }>(scopeKey);
    if (cachedScope && typeof cachedScope.isInScope === 'boolean') {
      return cachedScope.isInScope;
    }
    // Jika tidak ada di cache, TOLAK outlet demi keamanan (jangan izinkan outlet tak terverifikasi)
    console.error(`[verifyStoreScope] Supabase tidak terjangkau dan tidak ada data cache untuk "${upperCode}". Outlet ditolak.`);
    return false;
  }

  // Kasus jika record ditemukan di database Supabase
  if (dbFound && dbRecord) {
    const inScope = Boolean(dbRecord.is_in_scope);
    await cacheService.set(scopeKey, { isInScope: inScope }, BUSINESS_CONFIG.cache.storesTtlSeconds);
    return inScope;
  }

  // Kasus (b): Outlet belum ada di tabel outlets -> cari lewat query_store KK API
  try {
    console.info(`[verifyStoreScope] Outlet "${upperCode}" belum ada di database, mencari via KK query_store...`);
    const kkData = await kkApiClient.queryStore({
      keyword: upperCode,
      pageSize: 20,
    });

    const foundStore = (kkData?.store || []).find(
      (s) => (s.code || '').trim().toUpperCase() === upperCode
    );

    if (!foundStore) {
      console.warn(`[verifyStoreScope] Outlet "${upperCode}" tidak ditemukan di KK API. Ditolak.`);
      return false;
    }

    const inScope = isStoreInScope(foundStore);
    const brandName = getStoreBrandName(foundStore);

    // Upsert ke Supabase agar tersimpan permanen
    try {
      const supabase = getSupabaseServerClient();
      await supabase.from('outlets').upsert(
        {
          code: foundStore.code,
          name: (foundStore.name || '').trim(),
          address: (foundStore.address || '').trim(),
          latitude: foundStore.latitude ? parseFloat(foundStore.latitude) : null,
          longitude: foundStore.longitude ? parseFloat(foundStore.longitude) : null,
          open_time: foundStore.open || '',
          close_time: foundStore.close || '',
          is_active: true,
          brand: brandName,
          is_in_scope: inScope,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'code' }
      );
    } catch (upsertErr: any) {
      console.warn(`[verifyStoreScope] Gagal upsert outlet baru ke Supabase: ${upsertErr.message}`);
    }

    await cacheService.set(scopeKey, { isInScope: inScope }, BUSINESS_CONFIG.cache.storesTtlSeconds);
    return inScope;
  } catch (kkQueryErr: any) {
    console.warn(`[verifyStoreScope] Gagal mencari outlet di KK API: ${kkQueryErr.message}`);
    return false;
  }
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
