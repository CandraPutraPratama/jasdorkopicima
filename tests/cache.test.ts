import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCacheService, SupabaseCacheService, cacheKeys } from '../src/lib/cache.ts';

describe('CacheService - InMemory Implementation', () => {
  it('handles cache HIT: stores and retrieves active items', async () => {
    const cache = new InMemoryCacheService();
    await cache.set('test-hit', { name: 'Kopi Kenangan Mantan', price: 19000 }, 60);

    const val = await cache.get<{ name: string; price: number }>('test-hit');
    assert.deepStrictEqual(val, { name: 'Kopi Kenangan Mantan', price: 19000 });
    assert.strictEqual(await cache.has('test-hit'), true);
  });

  it('handles cache MISS: returns null when key does not exist', async () => {
    const cache = new InMemoryCacheService();
    const val = await cache.get('non-existent-key');
    assert.strictEqual(val, null);
    assert.strictEqual(await cache.has('non-existent-key'), false);
  });

  it('handles EXPIRED cache: get() returns null after TTL passes', async () => {
    const cache = new InMemoryCacheService();
    // TTL 50ms
    await cache.set('expiring-key', { item: 'Toast' }, 0.05);

    // Langsung dibaca masih aktif
    const immediate = await cache.get<{ item: string }>('expiring-key');
    assert.deepStrictEqual(immediate, { item: 'Toast' });

    // Tunggu 70ms hingga kedaluwarsa
    await new Promise((resolve) => setTimeout(resolve, 70));

    // get() mengembalikan null
    const expiredVal = await cache.get('expiring-key');
    assert.strictEqual(expiredVal, null);
    assert.strictEqual(await cache.has('expiring-key'), false);
  });

  it('handles STALE-IF-ERROR: getStale() returns last known data even when expired', async () => {
    const cache = new InMemoryCacheService();
    // Set item dengan TTL 50ms
    await cache.set('stale-key', { menu: 'Americano', price: 15000 }, 0.05);

    // Tunggu 70ms agar kedaluwarsa
    await new Promise((resolve) => setTimeout(resolve, 70));

    // 1. get() biasa mengembalikan null karena expired
    assert.strictEqual(await cache.get('stale-key'), null);

    // 2. Simulasi stale-if-error: Ketika backend KK gagal, panggil getStale()
    const staleData = await cache.getStale<{ menu: string; price: number }>('stale-key');
    assert.ok(staleData, 'Stale data harus tetap tersedia untuk fallback saat error');
    assert.strictEqual(staleData?.menu, 'Americano');
    assert.strictEqual(staleData?.price, 15000);
  });

  it('generates consistent, deterministic cache keys', () => {
    assert.strictEqual(cacheKeys.menu('cimb'), 'menu:CIMB');
    assert.strictEqual(cacheKeys.productOptions('cimb', '123'), 'options:CIMB:123');
    assert.strictEqual(cacheKeys.storeList('depok', 1, 10), 'stores:depok:1:10');
    assert.strictEqual(cacheKeys.storeDetail('cimb'), 'store:CIMB');
  });
});

describe('CacheService - SupabaseCacheService Interface Compliance', () => {
  it('instantiates and implements full CacheService interface', () => {
    const supabaseCache = new SupabaseCacheService();
    assert.strictEqual(typeof supabaseCache.get, 'function');
    assert.strictEqual(typeof supabaseCache.getStale, 'function');
    assert.strictEqual(typeof supabaseCache.set, 'function');
    assert.strictEqual(typeof supabaseCache.has, 'function');
    assert.strictEqual(typeof supabaseCache.delete, 'function');
    assert.strictEqual(typeof supabaseCache.clear, 'function');
  });

  it('provides seamless in-memory fallback if Supabase client is offline or test mock', async () => {
    const cache = new SupabaseCacheService();
    await cache.set('fallback-key', 'value-123', 0.05);

    // Hit
    assert.strictEqual(await cache.get('fallback-key'), 'value-123');

    // Tunggu expired
    await new Promise((resolve) => setTimeout(resolve, 70));
    assert.strictEqual(await cache.get('fallback-key'), null);

    // Stale fallback
    assert.strictEqual(await cache.getStale('fallback-key'), 'value-123');
  });
});
