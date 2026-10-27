import { getSupabaseServerClient } from './supabase-server.ts';
import { kkApiClient } from './kk-client.ts';
import { normalizeStores, normalizeStore } from './adapter.ts';
import { isStoreInScope, getStoreBrandName, BUSINESS_CONFIG } from '../config/business.ts';
import { cacheService, cacheKeys } from './cache.ts';
import { cleanSearchQuery, escapePostgrestFilterTerm } from './sanitizer.ts';
import { resolveForeTimezone } from './fore-menu-data.ts';
import { isOutletOpenBySchedule } from './orderability.ts';
import type { Outlet } from '../types/domain.ts';
import tomoroTimezoneMap from './tomoro-timezone-data.ts';

export function resolveTomoroTimezone(code: string): string {
  const norm = (code || '').trim().toLowerCase();
  return (tomoroTimezoneMap as Record<string, string>)[norm] || 'Asia/Jakarta';
}

export function evaluateTomoroOutletStatus(
  row?: {
    is_active?: boolean | null;
    updated_at?: string | null;
    open_time?: string | null;
    close_time?: string | null;
  } | null,
  now: Date = new Date(),
  timezone: string = 'Asia/Jakarta'
): { isOpen: boolean; canOrder: boolean; orderReason?: string } {
  const openTime = row?.open_time || '08:00';
  const closeTime = row?.close_time || '23:20';
  const isOpen = isOutletOpenBySchedule(openTime, closeTime, now, timezone);
  return {
    isOpen,
    canOrder: isOpen,
    orderReason: isOpen ? undefined : 'Outlet sedang tutup',
  };
}

export interface SearchOutletsResult {
  items: Outlet[];
  total: number;
  source: 'database' | 'kk-api-fallback';
}

/**
 * Mencari outlet berdasarkan keyword (nama, mall, atau jalan).
 * Mendukung filter brand: 'fore' / 'Fore Coffee' atau 'kopi-kenangan'.
 * Jika keyword kosong, langsung mengembalikan daftar kosong.
 */
export async function searchOutlets(
  keyword = '',
  page = 1,
  pageSize = 20,
  brand?: string
): Promise<SearchOutletsResult> {
  const trimmed = cleanSearchQuery(keyword);
  if (!trimmed) {
    return {
      items: [],
      total: 0,
      source: 'database',
    };
  }

  const isFore = brand === 'fore' || brand === 'Fore Coffee';
  const isTomoro = brand === 'tomoro' || brand === 'TOMORO Coffee' || brand === 'TOMORO';

  // 1a. Jika brand TOMORO Coffee, langsung cari dari Supabase
  if (isTomoro) {
    try {
      const safeTerm = escapePostgrestFilterTerm(trimmed);
      if (!safeTerm) {
        return { items: [], total: 0, source: 'database' };
      }

      const supabase = getSupabaseServerClient();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('outlets')
        .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at', {
          count: 'exact',
        })
        .eq('is_in_scope', true)
        .eq('brand', 'TOMORO Coffee')
        .or(`name.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%,code.ilike.%${safeTerm}%`)
        .order('name', { ascending: true })
        .range(from, to);

      if (!error && data) {
        const items: Outlet[] = data.map((row) => {
          const timezone = resolveTomoroTimezone(row.code);
          const statusObj = evaluateTomoroOutletStatus(row, new Date(), timezone);
          return {
            id: Number(row.id),
            code: row.code,
            name: row.name,
            address: row.address,
            isOpen: statusObj.isOpen,
            openTime: row.open_time || '08:00',
            closeTime: row.close_time || '23:20',
            timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
            timezone,
            brand: 'TOMORO Coffee',
            canOrder: statusObj.canOrder,
            orderReason: statusObj.orderReason,
          };
        });

        return {
          items,
          total: count ?? items.length,
          source: 'database',
        };
      }
    } catch (err: any) {
      console.warn(`[OutletService] Tomoro Supabase search error: ${err.message}`);
    }

    return { items: [], total: 0, source: 'database' };
  }

  // 1b. Jika brand Fore Coffee, langsung cari dari Supabase (Fore tidak menggunakan KK API)
  if (isFore) {
    try {
      const safeTerm = escapePostgrestFilterTerm(trimmed);
      if (!safeTerm) {
        return { items: [], total: 0, source: 'database' };
      }

      const supabase = getSupabaseServerClient();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('outlets')
        .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand', {
          count: 'exact',
        })
        .eq('is_active', true)
        .eq('is_in_scope', true)
        .eq('brand', 'Fore Coffee')
        .or(`name.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%,code.ilike.%${safeTerm}%`)
        .order('name', { ascending: true })
        .range(from, to);

      if (!error && data) {
        const items: Outlet[] = data.map((row) => {
          const timezone = resolveForeTimezone(row.code);
          const isOpen = isOutletOpenBySchedule(row.open_time, row.close_time, new Date(), timezone);
          return {
            id: Number(row.id),
            code: row.code,
            name: row.name,
            address: row.address,
            isOpen,
            openTime: row.open_time || '',
            closeTime: row.close_time || '',
            timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
            timezone,
            brand: 'Fore Coffee',
            canOrder: isOpen,
            orderReason: isOpen ? undefined : 'Outlet sedang tutup',
          };
        });

        return {
          items,
          total: count ?? items.length,
          source: 'database',
        };
      }
    } catch (err: any) {
      console.warn(`[OutletService] Fore Supabase search error: ${err.message}`);
    }

    return { items: [], total: 0, source: 'database' };
  }

  // 2. Ambil dari KK API terlebih dahulu untuk Kopi Kenangan
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

  // 3. Fallback ke database Supabase untuk Kopi Kenangan
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
      .neq('brand', 'Fore Coffee')
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
        timezone: 'Asia/Jakarta',
        brand: 'Kopi Kenangan',
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
 * Mengambil daftar outlet unggulan/populer.
 * Mendukung filter brand: 'fore' / 'Fore Coffee' atau 'kopi-kenangan'.
 */
export async function getFeaturedOutlets(
  limit = 10,
  brand?: string
): Promise<SearchOutletsResult> {
  const isFore = brand === 'fore' || brand === 'Fore Coffee';
  const isTomoro = brand === 'tomoro' || brand === 'TOMORO Coffee' || brand === 'TOMORO';

  if (isTomoro) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('outlets')
        .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at')
        .eq('is_in_scope', true)
        .eq('brand', 'TOMORO Coffee')
        .limit(Math.max(limit, 20));

      if (!error && data) {
        const items: Outlet[] = data.map((row) => {
          const timezone = resolveTomoroTimezone(row.code);
          const statusObj = evaluateTomoroOutletStatus(row, new Date(), timezone);
          return {
            id: Number(row.id),
            code: row.code,
            name: row.name,
            address: row.address,
            isOpen: statusObj.isOpen,
            openTime: row.open_time || '08:00',
            closeTime: row.close_time || '23:20',
            timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
            timezone,
            brand: 'TOMORO Coffee',
            canOrder: statusObj.canOrder,
            orderReason: statusObj.orderReason,
          };
        });

        // Prioritaskan outlet yang sedang buka
        const sorted = [...items].sort((a, b) => {
          if (a.canOrder && !b.canOrder) return -1;
          if (!a.canOrder && b.canOrder) return 1;
          return 0;
        });

        const sliced = sorted.slice(0, limit);
        return {
          items: sliced,
          total: sorted.length,
          source: 'database',
        };
      }
    } catch (err: any) {
      console.warn(`[OutletService] Tomoro getFeaturedOutlets error: ${err.message}`);
    }

    return { items: [], total: 0, source: 'database' };
  }

  if (isFore) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('outlets')
        .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand')
        .eq('is_active', true)
        .eq('is_in_scope', true)
        .eq('brand', 'Fore Coffee')
        .limit(Math.max(limit, 20));

      if (!error && data) {
        const items: Outlet[] = data.map((row) => {
          const timezone = resolveForeTimezone(row.code);
          const isOpen = isOutletOpenBySchedule(row.open_time, row.close_time, new Date(), timezone);
          return {
            id: Number(row.id),
            code: row.code,
            name: row.name,
            address: row.address,
            isOpen,
            openTime: row.open_time || '',
            closeTime: row.close_time || '',
            timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
            timezone,
            brand: 'Fore Coffee',
            canOrder: isOpen,
            orderReason: isOpen ? undefined : 'Outlet sedang tutup',
          };
        });

        // Prioritaskan outlet yang sedang buka
        const sorted = [...items].sort((a, b) => {
          if (a.canOrder && !b.canOrder) return -1;
          if (!a.canOrder && b.canOrder) return 1;
          return 0;
        });

        const sliced = sorted.slice(0, limit);
        return {
          items: sliced,
          total: sorted.length,
          source: 'database',
        };
      }
    } catch (err: any) {
      console.warn(`[OutletService] Fore getFeaturedOutlets error: ${err.message}`);
    }

    return { items: [], total: 0, source: 'database' };
  }

  // 1. Ambil dari KK API queryStore dengan keyword kosong untuk status real-time Kopi Kenangan
  try {
    const rawData = await kkApiClient.queryStore({
      pageNum: 1,
      pageSize: 16,
      keyword: '',
    });

    const normalized = normalizeStores(rawData.store || []);
    // Prioritaskan outlet yang sedang buka/dapat dipesan (canOrder === true)
    const sorted = [...normalized].sort((a, b) => {
      if (a.canOrder && !b.canOrder) return -1;
      if (!a.canOrder && b.canOrder) return 1;
      return 0;
    });

    const items = sorted.slice(0, limit);
    return {
      items,
      total: items.length,
      source: 'kk-api-fallback',
    };
  } catch (err: any) {
    console.warn(`[OutletService] KK API getFeaturedOutlets error (${err.message}). Fallback ke Supabase.`);
  }

  // 2. Fallback ke database Supabase jika KK API bermasalah
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('outlets')
      .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope')
      .eq('is_active', true)
      .eq('is_in_scope', true)
      .neq('brand', 'Fore Coffee')
      .neq('brand', 'TOMORO Coffee')
      .limit(limit);

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
        timezone: 'Asia/Jakarta',
        brand: 'Kopi Kenangan',
        canOrder: false,
        orderReason: 'Status real-time tidak tersedia',
      }));

      return {
        items,
        total: items.length,
        source: 'database',
      };
    }
  } catch (dbErr: any) {
    console.warn(`[OutletService] Supabase fallback getFeaturedOutlets error: ${dbErr.message}`);
  }

  return {
    items: [],
    total: 0,
    source: 'database',
  };
}

/**
 * Mengambil total jumlah outlet aktif dan in-scope di database Supabase berdasarkan brand.
 */
export async function getTotalOutletsCount(brand?: string): Promise<number> {
  const isFore = brand === 'fore' || brand === 'Fore Coffee';
  const isTomoro = brand === 'tomoro' || brand === 'TOMORO Coffee' || brand === 'TOMORO';
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from('outlets')
      .select('*', { count: 'exact', head: true })
      .eq('is_in_scope', true);

    if (isFore) {
      query = query.eq('is_active', true).eq('brand', 'Fore Coffee');
    } else if (isTomoro) {
      query = query.eq('brand', 'TOMORO Coffee');
    } else {
      query = query.eq('is_active', true).neq('brand', 'Fore Coffee').neq('brand', 'TOMORO Coffee');
    }

    const { count, error } = await query;

    if (!error && typeof count === 'number' && count > 0) {
      return count;
    }
  } catch (err: any) {
    console.warn(`[OutletService] Supabase getTotalOutletsCount error: ${err?.message}`);
  }

  if (isTomoro) return 678;
  return isFore ? 394 : 1340;
}

/**
 * Meng-escape karakter wildcard SQL (% dan _) serta backslash (\)
 * agar input pengguna tidak dapat digunakan untuk query wildcard.
 */
export function escapeSqlWildcards(str: string): string {
  return (str || '').replace(/[%_\\]/g, (match) => `\\${match}`);
}

import { safeNormalizeOutletCode } from './sanitizer.ts';
export { safeNormalizeOutletCode };

/**
 * Mengambil satu outlet berdasarkan kodenya (mendukung Fore Coffee, TOMORO Coffee & Kopi Kenangan).
 */
export async function getOutletByCode(code: string): Promise<Outlet | null> {
  const trimmedCode = safeNormalizeOutletCode(code);
  if (!trimmedCode) return null;

  const isFore = trimmedCode.toLowerCase().startsWith('fore-');
  const isTomoro = trimmedCode.toLowerCase().startsWith('tomoro-');

  try {
    const supabase = getSupabaseServerClient();
    const sanitizedCode = escapeSqlWildcards(trimmedCode);
    let { data, error } = await supabase
      .from('outlets')
      .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at')
      .ilike('code', sanitizedCode)
      .maybeSingle();

    // Fallback pencarian fleksibel untuk outlet Fore Coffee: toleransi spasi vs tanda hubung (-)
    if (!data && isFore) {
      const sub = trimmedCode.slice(5);
      const withSpaces = `fore-${sub.replace(/-/g, ' ')}`;
      const withHyphens = `fore-${sub.replace(/\s+/g, '-')}`;

      if (withSpaces !== trimmedCode) {
        const res = await supabase
          .from('outlets')
          .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at')
          .ilike('code', escapeSqlWildcards(withSpaces))
          .maybeSingle();
        if (res.data) {
          data = res.data;
          error = null;
        }
      }

      if (!data && withHyphens !== trimmedCode) {
        const res = await supabase
          .from('outlets')
          .select('id, code, name, address, latitude, longitude, open_time, close_time, is_active, is_in_scope, brand, updated_at')
          .ilike('code', escapeSqlWildcards(withHyphens))
          .maybeSingle();
        if (res.data) {
          data = res.data;
          error = null;
        }
      }
    }

    if (!error && data) {
      const isTomoroRow = isTomoro || data.brand === 'TOMORO Coffee';
      if (isTomoroRow) {
        const timezone = resolveTomoroTimezone(data.code);
        const statusObj = evaluateTomoroOutletStatus(data, new Date(), timezone);
        return {
          id: Number(data.id),
          code: data.code,
          name: data.name,
          address: data.address,
          isOpen: statusObj.isOpen,
          openTime: data.open_time || '08:00',
          closeTime: data.close_time || '23:20',
          timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
          timezone,
          brand: 'TOMORO Coffee',
          canOrder: statusObj.canOrder,
          orderReason: statusObj.orderReason,
        };
      }

      const rowBrand = data.brand || (isFore ? 'Fore Coffee' : 'Kopi Kenangan');
      const timezone = resolveForeTimezone(data.code);
      const isOpen = isOutletOpenBySchedule(data.open_time, data.close_time, new Date(), timezone);
      return {
        id: Number(data.id),
        code: data.code,
        name: data.name,
        address: data.address,
        isOpen,
        openTime: data.open_time || '',
        closeTime: data.close_time || '',
        timeZone: timezone === 'Asia/Jayapura' ? 9 : timezone === 'Asia/Makassar' ? 8 : 7,
        timezone,
        brand: rowBrand,
        canOrder: isOpen,
        orderReason: isOpen ? undefined : 'Outlet sedang tutup',
      };
    }
  } catch (err: any) {
    console.warn(`[OutletService] getOutletByCode DB error for [${trimmedCode}]:`, err.message);
  }

  if (isFore || isTomoro) {
    return null;
  }

  try {
    const rawStore = await kkApiClient.getStore(trimmedCode);
    if (!rawStore) return null;
    return normalizeStore(rawStore);
  } catch {
    return null;
  }
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
    const sanitizedCode = escapeSqlWildcards(upperCode);
    const queryPromise = supabase
      .from('outlets')
      .select('is_in_scope')
      .ilike('code', sanitizedCode)
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
