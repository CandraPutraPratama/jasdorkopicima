import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/admin/auth/route.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { resetAdminSessionStore } from '../src/lib/admin-session.ts';
import { setRateLimitKVBindingForTests, type RateLimitKVLike } from '../src/lib/rate-limit-kv.ts';

const BASE = 'https://jasdor.test';
const PASSWORD = 'CorrectHorseBatteryStaple';

/** KV palsu yang mensimulasikan satu namespace bersama lintas isolate. */
class FakeKV implements RateLimitKVLike {
  store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

function loginRequest(password: string, ip = '203.0.113.7'): Request {
  return new Request(`${BASE}/api/admin/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': ip,
    },
    body: JSON.stringify({ password }),
  });
}

describe('Step C - Admin login brute force is throttled across isolates', () => {
  let kv: FakeKV;
  let originalPassword: string | undefined;

  beforeEach(() => {
    resetRateLimitStore();
    resetAdminSessionStore();
    kv = new FakeKV();
    setRateLimitKVBindingForTests(kv);
    originalPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = PASSWORD;
  });

  afterEach(() => {
    resetAdminSessionStore();
    setRateLimitKVBindingForTests(undefined);
    if (originalPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
  });

  it('allows the first 5 attempts then returns 429 on the 6th', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await POST(loginRequest('wrong-password') as never);
      statuses.push(res.status);
    }

    assert.deepEqual(statuses.slice(0, 5), [401, 401, 401, 401, 401]);
    assert.equal(statuses[5], 429, 'sixth attempt must be rate limited');
  });

  it('includes Retry-After and rate limit headers on 429', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(loginRequest('wrong-password') as never);
    }
    const blocked = await POST(loginRequest('wrong-password') as never);

    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.get('Retry-After'));
    assert.equal(blocked.headers.get('X-RateLimit-Remaining'), '0');
  });

  it('blocks the correct password too once the limit is hit', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(loginRequest('wrong-password') as never);
    }
    const res = await POST(loginRequest(PASSWORD) as never);
    assert.equal(res.status, 429);
  });

  it('keeps the counter in KV, not only in process memory', async () => {
    await POST(loginRequest('wrong-password') as never);

    assert.equal(kv.store.size, 1, 'expected a KV entry for the client IP');
    const raw = [...kv.store.values()][0];
    const parsed = JSON.parse(raw);
    assert.equal(parsed.count, 1);
    assert.ok(parsed.resetAt > Date.now());
  });

  it('shares the counter between separate limiter invocations (simulating isolates)', async () => {
    // Simulasi isolate berbeda: buang state in-memory, KV tetap.
    await POST(loginRequest('wrong-password') as never);
    await POST(loginRequest('wrong-password') as never);
    resetRateLimitStore();

    for (let i = 0; i < 3; i++) {
      await POST(loginRequest('wrong-password') as never);
    }

    // Total 5 percobaan lintas "isolate" -> percobaan ke-6 harus diblokir.
    const blocked = await POST(loginRequest('wrong-password') as never);
    assert.equal(blocked.status, 429);
  });

  it('does not throttle a different IP', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(loginRequest('wrong-password', '198.51.100.9') as never);
    }
    const blocked = await POST(loginRequest('wrong-password', '198.51.100.9') as never);
    const otherIp = await POST(loginRequest('wrong-password', '192.0.2.55') as never);

    assert.equal(blocked.status, 429);
    assert.equal(otherIp.status, 401);
  });

  it('blocks a parallel burst that KV alone would let through', async () => {
    // Regresi untuk race condition KV: N request paralel bisa membaca counter
    // yang sama lalu saling menimpa (last write wins), sehingga batas 5 bisa
    // dilewati. Lapisan in-memory harus menahan burst ini.
    const statuses = await Promise.all(
      Array.from({ length: 8 }).map(() =>
        POST(loginRequest('wrong-password', '203.0.113.210') as never).then((r) => r.status)
      )
    );

    const blocked = statuses.filter((s) => s === 429).length;
    assert.ok(
      blocked >= 3,
      `expected at least 3 of 8 parallel attempts blocked, got ${blocked} (statuses: ${statuses.join(',')})`
    );
  });
});
