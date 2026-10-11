import { BUSINESS_CONFIG } from '../config/business.ts';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory cache implementation dengan dukungan TTL per-item.
 * Disiapkan dengan interface yang dapat diganti dengan Supabase/Redis di tahap berikutnya.
 */
export class InMemoryCacheService implements CacheService {
  private store = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

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

  /** Jumlah item aktif dalam cache (termasuk yang belum terhapus lazy) */
  size(): number {
    return this.store.size;
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
};

export const cacheService: CacheService = new InMemoryCacheService();
