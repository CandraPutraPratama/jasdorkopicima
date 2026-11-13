import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isRealMenu,
  loadLiveMenuOrStale,
  readFreshRealMenu,
  readStaleRealMenu,
  type MenuCacheLike,
} from '../src/lib/menu-source.ts';
import { getKopiKenanganFallbackMenu } from '../src/lib/kk-menu-fallback.ts';
import type { MenuGroup } from '../src/types/domain.ts';

const KEY = 'menu:AEON.BSD';

const realMenu = (price: number): MenuGroup[] => [
  {
    code: 'g1',
    name: 'Kopi',
    products: [{ id: 1, bundleCode: 'b1', name: 'Mantan', basePrice: price }],
  } as unknown as MenuGroup,
];

function fakeCache(initial: { fresh?: unknown; stale?: unknown } = {}) {
  const writes: Array<{ key: string; value: unknown; ttl?: number }> = [];
  const cache: MenuCacheLike = {
    async get<T>() {
      return (initial.fresh ?? null) as T | null;
    },
    async getStale<T>() {
      return (initial.stale ?? initial.fresh ?? null) as T | null;
    },
    async set(key, value, ttl) {
      writes.push({ key, value, ttl });
    },
  };
  return { cache, writes };
}

describe('menu-source: menu kanonikal tidak pernah disajikan sebagai menu asli', () => {
  it('token/KK gagal dan tidak ada stale -> null (route membalas 500 ramah), bukan menu kanonikal', async () => {
    const { cache, writes } = fakeCache();
    const result = await loadLiveMenuOrStale({
      cache,
      cacheKey: KEY,
      ttlSeconds: 900,
      fetchLive: async () => {
        throw new Error('HTTP Error 404: Not Found');
      },
    });
    assert.equal(result, null);
    assert.equal(writes.length, 0, 'tidak boleh menulis apa pun ke cache saat gagal');
  });

  it('KK gagal tapi ada stale ASLI -> source stale dan stale tidak ditulis ulang', async () => {
    const stale = { menuGroups: realMenu(32000) };
    const { cache, writes } = fakeCache({ stale });
    const result = await loadLiveMenuOrStale({
      cache,
      cacheKey: KEY,
      ttlSeconds: 900,
      fetchLive: async () => {
        throw new Error('boom');
      },
    });
    assert.equal(result?.source, 'stale');
    assert.equal(result?.menuGroups, stale.menuGroups);
    assert.equal(writes.length, 0, 'stale tidak boleh ditulis ulang dengan TTL segar');
  });

  it('baris cache bertanda isFallback (kanonikal lama) diabaikan sebagai fresh maupun stale', async () => {
    const legacy = { menuGroups: getKopiKenanganFallbackMenu(), isFallback: true };
    const { cache } = fakeCache({ fresh: legacy, stale: legacy });
    assert.equal(await readFreshRealMenu(cache, KEY), null);
    assert.equal(await readStaleRealMenu(cache, KEY), null);

    const result = await loadLiveMenuOrStale({
      cache,
      cacheKey: KEY,
      ttlSeconds: 900,
      fetchLive: async () => {
        throw new Error('boom');
      },
    });
    assert.equal(result, null, 'kanonikal lama tidak boleh jadi stale');
  });

  it('live sukses -> source live, ditulis ke cache tanpa penanda fallback, TTL penuh', async () => {
    const { cache, writes } = fakeCache();
    const live = realMenu(32000);
    const result = await loadLiveMenuOrStale({
      cache,
      cacheKey: KEY,
      ttlSeconds: 900,
      fetchLive: async () => live,
    });
    assert.equal(result?.source, 'live');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].ttl, 900);
    assert.deepEqual(writes[0].value, { menuGroups: live });
  });

  it('menu live kosong diperlakukan sebagai gagal, bukan disajikan', async () => {
    const { cache, writes } = fakeCache();
    const result = await loadLiveMenuOrStale({
      cache,
      cacheKey: KEY,
      ttlSeconds: 900,
      fetchLive: async () => [],
    });
    assert.equal(result, null);
    assert.equal(writes.length, 0);
  });

  it('isRealMenu menolak payload kosong, null, dan isFallback', () => {
    assert.equal(isRealMenu(null), false);
    assert.equal(isRealMenu({ menuGroups: [] }), false);
    assert.equal(isRealMenu({ menuGroups: realMenu(1000), isFallback: true }), false);
    assert.equal(isRealMenu({ menuGroups: realMenu(1000) }), true);
  });
});
