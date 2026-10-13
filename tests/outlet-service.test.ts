import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { verifyStoreScope } from '../src/lib/outlet-service.ts';
import { cacheService, cacheKeys } from '../src/lib/cache.ts';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';

describe('verifyStoreScope - Resilient Scope Verification', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  it('immediately rejects Kenangan Signature, Heritage, and internal test outlets without DB or KK calls', async () => {
    assert.equal(await verifyStoreScope('KS.ID.001'), false);
    assert.equal(await verifyStoreScope('KH.ID.001'), false);
    assert.equal(await verifyStoreScope('JKT.KENHERTG'), false);
    assert.equal(await verifyStoreScope('testposstores_1'), false);
  });

  it('Case (a): Supabase unreachable/timeout uses stale cache if available, or rejects if no cache', async () => {
    const storeCode = 'KK.FALLBACK.TEST';
    const scopeKey = cacheKeys.storeScope(storeCode);

    // Mock client yang melempar error timeout
    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => {
              throw new Error('Supabase unreachable or network timeout');
            },
          }),
        }),
      }),
    } as any);

    // 1. Tanpa cache: WAJIB menolak outlet (keamanan: jangan loloskan outlet belum terverifikasi)
    const resNoCache = await verifyStoreScope(storeCode);
    assert.equal(resNoCache, false);

    // 2. Dengan cache bernilai true (misal dari sinkronisasi sebelumnya)
    await cacheService.set(scopeKey, { isInScope: true });
    const resWithCacheTrue = await verifyStoreScope(storeCode);
    assert.equal(resWithCacheTrue, true);

    // 3. Dengan cache bernilai false
    await cacheService.set(scopeKey, { isInScope: false });
    const resWithCacheFalse = await verifyStoreScope(storeCode);
    assert.equal(resWithCacheFalse, false);
  });

  it('Case (b): Outlet missing in DB falls back to KK query_store, evaluates scope, and upserts', async () => {
    const newStoreCode = 'KK.NEW.STORE1';
    let upsertCalledWith: any = null;

    // Mock Supabase returning no row for maybeSingle
    setSupabaseServerClientInstance({
      from: (table: string) => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        upsert: async (payload: any) => {
          if (table === 'outlets') {
            upsertCalledWith = payload;
          }
          return { error: null };
        },
      }),
    } as any);

    // Mock kkApiClient.queryStore
    const originalQueryStore = kkApiClient.queryStore;

    try {
      // Skenario b.1: Ditemukan di KK API dan in-scope (Kopi Kenangan)
      (kkApiClient as any).queryStore = async () => ({
        store: [
          {
            code: newStoreCode,
            name: 'Kopi Kenangan Baru Mall',
            address: 'Jl. Baru No. 1',
            brand_and_image: [{ brand_code: 1, brand_name: 'Kopi Kenangan' }],
          },
        ],
      });

      const resInScope = await verifyStoreScope(newStoreCode);
      assert.equal(resInScope, true);
      assert.ok(upsertCalledWith);
      assert.equal(upsertCalledWith.code, newStoreCode);
      assert.equal(upsertCalledWith.is_in_scope, true);

      // Skenario b.2: Ditemukan di KK API Tanjung Uncang (tanpa brand_and_image tapi ada di explicit list)
      const tjUncangCode = 'KK.BTM.RKTNJGUNCG';
      (kkApiClient as any).queryStore = async () => ({
        store: [
          {
            code: tjUncangCode,
            name: 'Ruko Tanjung Uncang',
            address: 'Batam',
            brand_and_image: null,
          },
        ],
      });

      const resTjUncang = await verifyStoreScope(tjUncangCode);
      assert.equal(resTjUncang, true);
      assert.equal(upsertCalledWith.code, tjUncangCode);
      assert.equal(upsertCalledWith.is_in_scope, true);

      // Skenario b.3: Ditemukan di KK API tapi out-of-scope (Chigo saja)
      const chigoCode = 'CHIGO.ONLY.01';
      (kkApiClient as any).queryStore = async () => ({
        store: [
          {
            code: chigoCode,
            name: 'Chigo Express',
            address: 'Jakarta',
            brand_and_image: [{ brand_code: 4, brand_name: 'Chigo' }],
          },
        ],
      });

      const resChigo = await verifyStoreScope(chigoCode);
      assert.equal(resChigo, false);
      assert.equal(upsertCalledWith.code, chigoCode);
      assert.equal(upsertCalledWith.is_in_scope, false);

      // Skenario b.4: Tidak ditemukan sama sekali di KK API
      (kkApiClient as any).queryStore = async () => ({
        store: [],
      });

      const resNotFound = await verifyStoreScope('NONEXISTENT.STORE');
      assert.equal(resNotFound, false);
    } finally {
      (kkApiClient as any).queryStore = originalQueryStore;
    }
  });
});
