import { BUSINESS_CONFIG } from '../config/business.ts';
import { getSupabaseServerClient } from './supabase-server.ts';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  getStale<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  cleanExpiredEntries(olderThanDays?: number): Promise<number>;
}

/**
 * In-memory cache implementation dengan dukungan TTL dan stale value.
 * Digunakan untuk unit testing dan fallback cepat jika database belum terhubung.
 */
export class InMemoryCacheService implements CacheService {
  private store = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      return null;
    }

    return entry.value as T;
  }

  async getStale<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? BUSINESS_CONFIG.cache.menuTtlSeconds;
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async cleanExpiredEntries(olderThanDays = 7): Promise<number> {
    const threshold = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    let purged = 0;
    for (const [k, v] of this.store.entries()) {
      if (v.expiresAt < threshold) {
        this.store.delete(k);
        purged++;
      }
    }
    return purged;
  }

  size(): number {
    return this.store.size;
  }
}

/**
 * Supabase-backed CacheService (Tabel: generic_cache)
 * Mendukung pola stale-if-error (RFC 5861):
 * - Jika data kedaluwarsa tapi backend KK gagal/error, getStale() mengembalikan data lama.
 */
export class SupabaseCacheService implements CacheService {
  private inMemoryFallback = new InMemoryCacheService();

  private getClient() {
    try {
      return getSupabaseServerClient();
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) {
      return this.inMemoryFallback.get<T>(key);
    }

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await client
        .from('generic_cache')
        .select('payload, expires_at')
        .eq('key', key)
        .gt('expires_at', nowIso)
        .maybeSingle();

      if (error) {
        console.warn(`[CacheService] Gagal membaca cache Supabase untuk key "${key}": ${error.message}`);
        return this.inMemoryFallback.get<T>(key);
      }

      if (!data) return null;
      return data.payload as T;
    } catch (err: any) {
      console.warn(`[CacheService] Exception saat membaca cache Supabase: ${err.message}`);
      return this.inMemoryFallback.get<T>(key);
    }
  }

  /**
   * Mengambil data cache tanpa mempedulikan status expires_at (stale-if-error fallback).
   */
  async getStale<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) {
      return this.inMemoryFallback.getStale<T>(key);
    }

    try {
      const { data, error } = await client
        .from('generic_cache')
        .select('payload, expires_at')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) {
        return this.inMemoryFallback.getStale<T>(key);
      }

      return data.payload as T;
    } catch (err: any) {
      console.warn(`[CacheService] Exception saat mengambil stale cache: ${err.message}`);
      return this.inMemoryFallback.getStale<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? BUSINESS_CONFIG.cache.menuTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const updatedAt = new Date().toISOString();

    // Simpan juga ke in-memory fallback
    await this.inMemoryFallback.set(key, value, ttl);

    const client = this.getClient();
    if (!client) return;

    try {
      const { error } = await client.from('generic_cache').upsert(
        {
          key,
          payload: value,
          expires_at: expiresAt,
          updated_at: updatedAt,
        },
        { onConflict: 'key' }
      );

      if (error) {
        console.warn(`[CacheService] Gagal menulis cache Supabase key "${key}": ${error.message}`);
      }
    } catch (err: any) {
      console.warn(`[CacheService] Exception saat menulis cache Supabase: ${err.message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async delete(key: string): Promise<void> {
    await this.inMemoryFallback.delete(key);
    const client = this.getClient();
    if (!client) return;

    try {
      await client.from('generic_cache').delete().eq('key', key);
    } catch (err: any) {
      console.warn(`[CacheService] Gagal menghapus cache Supabase: ${err.message}`);
    }
  }

  async clear(): Promise<void> {
    await this.inMemoryFallback.clear();
    const client = this.getClient();
    if (!client) return;

    try {
      await client.from('generic_cache').delete().neq('key', '');
    } catch (err: any) {
      console.warn(`[CacheService] Gagal membersihkan cache Supabase: ${err.message}`);
    }
  }

  /**
   * Menghapus baris generic_cache yang kedaluwarsa lebih dari olderThanDays (default 7 hari).
   */
  async cleanExpiredEntries(olderThanDays = 7): Promise<number> {
    await this.inMemoryFallback.cleanExpiredEntries(olderThanDays);
    const client = this.getClient();
    if (!client) return 0;

    try {
      const thresholdDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await client
        .from('generic_cache')
        .delete()
        .lt('expires_at', thresholdDate)
        .select('key');

      if (error) {
        console.warn(`[CacheService] Gagal membersihkan generic_cache usang (> ${olderThanDays} hari): ${error.message}`);
        return 0;
      }

      return data?.length ?? 0;
    } catch (err: any) {
      console.warn(`[CacheService] Exception saat purge generic_cache usang: ${err.message}`);
      return 0;
    }
  }
}

/** Helper generator key cache yang konsisten */
export const cacheKeys = {
  menu: (storeCode: string) => `menu:${storeCode.toUpperCase()}`,
  productOptions: (storeCode: string, bundleCode: string) =>
    `options:${storeCode.toUpperCase()}:${bundleCode}`,
  storeList: (keyword: string, page: number, pageSize: number) =>
    `stores:${keyword.toLowerCase()}:${page}:${pageSize}`,
  storeDetail: (storeCode: string) => `store:${storeCode.toUpperCase()}`,
  storeScope: (storeCode: string) => `scope:${storeCode.toUpperCase()}`,
};

/** Default CacheService aktif menggunakan Supabase dengan fallback in-memory */
export const cacheService: CacheService = new SupabaseCacheService();
