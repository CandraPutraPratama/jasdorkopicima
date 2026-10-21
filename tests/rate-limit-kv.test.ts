import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimitKV,
  setRateLimitKVBindingForTests,
  type RateLimitKVLike,
} from '../src/lib/rate-limit-kv.ts';
import { resetRateLimitStore, checkRateLimit } from '../src/lib/rate-limit.ts';

class FakeKV implements RateLimitKVLike {
  store = new Map<string, { value: string; expirationTtl?: number }>();
  failOnGet = false;
  failOnPut = false;

  async get(key: string): Promise<string | null> {
    if (this.failOnGet) throw new Error('KV get unavailable');
    return this.store.get(key)?.value ?? null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    if (this.failOnPut) throw new Error('KV put unavailable');
    this.store.set(key, { value, expirationTtl: options?.expirationTtl });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const NOW = 1_700_000_000_000;

describe('Step C - Distributed rate limit backed by Cloudflare KV', () => {
  let kv: FakeKV;

  beforeEach(() => {
    resetRateLimitStore();
    kv = new FakeKV();
    setRateLimitKVBindingForTests(kv);
  });

  describe('when a KV binding is available', () => {
    it('writes the counter to KV on the first request', async () => {
      const result = await checkRateLimitKV('admin-auth:1.2.3.4', {
        maxRequests: 5,
        windowSeconds: 60,
      }, NOW);

      assert.equal(result.success, true);
      assert.equal(result.limit, 5);
      assert.equal(result.remaining, 4);
      assert.equal(kv.store.size, 1);
    });

    it('increments the same key across requests within the window', async () => {
      const options = { maxRequests: 3, windowSeconds: 60 };
      const a = await checkRateLimitKV('k', options, NOW);
      const b = await checkRateLimitKV('k', options, NOW + 1000);
      const c = await checkRateLimitKV('k', options, NOW + 2000);

      assert.equal(a.remaining, 2);
      assert.equal(b.remaining, 1);
      assert.equal(c.remaining, 0);
      assert.equal(c.success, true);
    });

    it('blocks once the limit is exceeded', async () => {
      const options = { maxRequests: 2, windowSeconds: 60 };
      await checkRateLimitKV('k', options, NOW);
      await checkRateLimitKV('k', options, NOW);

      const blocked = await checkRateLimitKV('k', options, NOW);
      assert.equal(blocked.success, false);
      assert.equal(blocked.remaining, 0);
      assert.ok(blocked.resetInSeconds > 0);
    });

    it('starts a fresh counter in the next window', async () => {
      const options = { maxRequests: 1, windowSeconds: 60 };
      await checkRateLimitKV('k', options, NOW);
      const blocked = await checkRateLimitKV('k', options, NOW);
      assert.equal(blocked.success, false);

      const nextWindow = await checkRateLimitKV('k', options, NOW + 60_000);
      assert.equal(nextWindow.success, true);
      assert.equal(nextWindow.remaining, 0);
    });

    it('isolates different keys', async () => {
      const options = { maxRequests: 1, windowSeconds: 60 };
      await checkRateLimitKV('ip-a', options, NOW);
      const blockedA = await checkRateLimitKV('ip-a', options, NOW);
      const allowedB = await checkRateLimitKV('ip-b', options, NOW);

      assert.equal(blockedA.success, false);
      assert.equal(allowedB.success, true);
    });

    it('sets an expiration so counters do not accumulate forever', async () => {
      await checkRateLimitKV('k', { maxRequests: 5, windowSeconds: 60 }, NOW);
      const entry = [...kv.store.values()][0];
      assert.ok(entry.expirationTtl, 'expected expirationTtl to be set');
      assert.ok((entry.expirationTtl as number) >= 60);
    });

    it('treats a malformed counter value as a fresh window instead of crashing', async () => {
      const options = { maxRequests: 5, windowSeconds: 60 };
      await checkRateLimitKV('k', options, NOW);
      const key = [...kv.store.keys()][0];
      kv.store.set(key, { value: 'not-json{' });

      const result = await checkRateLimitKV('k', options, NOW + 1000);
      assert.equal(result.success, true);
      // Lapisan in-memory sudah mencatat 2 request; KV memulai window baru.
      // Nilai remaining adalah yang paling ketat dari kedua lapisan.
      assert.equal(result.remaining, 3);
      // KV harus ditulis ulang dengan counter yang valid (bukan record rusak).
      const rewritten = JSON.parse([...kv.store.values()][0].value);
      assert.equal(rewritten.count, 1);
    });
  });

  describe('resilience', () => {
    it('falls back to the in-memory limiter when KV reads fail', async () => {
      kv.failOnGet = true;
      const options = { maxRequests: 1, windowSeconds: 60 };

      const first = await checkRateLimitKV('fallback-get', options, NOW);
      const second = await checkRateLimitKV('fallback-get', options, NOW);

      assert.equal(first.success, true);
      assert.equal(second.success, false, 'in-memory fallback must still enforce the limit');
    });

    it('falls back to the in-memory limiter when KV writes fail', async () => {
      kv.failOnPut = true;
      const options = { maxRequests: 1, windowSeconds: 60 };

      const first = await checkRateLimitKV('fallback-put', options, NOW);
      const second = await checkRateLimitKV('fallback-put', options, NOW);

      assert.equal(first.success, true);
      assert.equal(second.success, false);
    });

    it('uses the in-memory limiter when no binding is configured', async () => {
      setRateLimitKVBindingForTests(null);
      const options = { maxRequests: 2, windowSeconds: 60 };

      const a = await checkRateLimitKV('no-kv', options, NOW);
      const b = await checkRateLimitKV('no-kv', options, NOW);
      const c = await checkRateLimitKV('no-kv', options, NOW);

      assert.equal(a.success, true);
      assert.equal(b.success, true);
      assert.equal(c.success, false);
    });
  });

  describe('in-memory limiter contract is preserved for local development', () => {
    it('checkRateLimit still works synchronously', () => {
      const result = checkRateLimit('legacy', { maxRequests: 1, windowSeconds: 60 });
      assert.equal(result.success, true);
      assert.equal(result.remaining, 0);
    });
  });
});
