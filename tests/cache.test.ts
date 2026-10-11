import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCacheService, cacheKeys } from '../src/lib/cache.ts';

describe('InMemoryCacheService', () => {
  it('stores and retrieves items correctly', async () => {
    const cache = new InMemoryCacheService();
    await cache.set('test-key', { name: 'Kopi Kenangan Mantan' }, 60);

    const val = await cache.get<{ name: string }>('test-key');
    assert.deepStrictEqual(val, { name: 'Kopi Kenangan Mantan' });
    assert.strictEqual(await cache.has('test-key'), true);
  });

  it('returns null and cleans up expired items', async () => {
    const cache = new InMemoryCacheService();
    // TTL 0.05 seconds (50ms)
    await cache.set('expiring-key', 'temporary', 0.05);

    // Immediate read works
    assert.strictEqual(await cache.get('expiring-key'), 'temporary');

    // Wait 70ms
    await new Promise((resolve) => setTimeout(resolve, 70));

    // Now expired
    assert.strictEqual(await cache.get('expiring-key'), null);
    assert.strictEqual(await cache.has('expiring-key'), false);
  });

  it('generates consistent cache keys', () => {
    assert.strictEqual(cacheKeys.menu('cimb'), 'menu:CIMB');
    assert.strictEqual(cacheKeys.productOptions('cimb', '123'), 'options:CIMB:123');
    assert.strictEqual(cacheKeys.storeList('depok', 1, 10), 'stores:depok:1:10');
    assert.strictEqual(cacheKeys.storeDetail('cimb'), 'store:CIMB');
  });
});
