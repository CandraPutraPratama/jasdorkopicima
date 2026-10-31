import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { createAdminSession, setSessionKVBindingForTests } from '../src/lib/admin-session.ts';
import { ADMIN_CONFIG } from '../src/lib/site-config.ts';
import { GET } from '../src/app/api/orders/[id]/route.ts';
import type { OrderRecord } from '../src/types/order.ts';

const BASE = 'https://jasdor.test';

function buildMockOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'CG-RATE01',
    brand_slug: 'kopi-kenangan',
    outlet_code: 'OUT-TEST',
    outlet_name: 'Test Outlet',
    customer_name: 'Budi Santoso',
    customer_wa: '628123456789',
    items: [],
    subtotal: 10000,
    fee: 2000,
    total: 12000,
    status: 'antrian',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    access_token: 'validtoken1234567890abcdef123456',
    ...overrides,
  };
}

describe('Rate Limiting & Admin Exemption pada GET /api/orders/[id]', () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    resetRateLimitStore();
    process.env.ADMIN_SESSION_SECRET = 'super-secret-key-for-test-suite-at-least-16-bytes';
    setSessionKVBindingForTests(null);
  });

  afterEach(() => {
    setSupabaseServerClientInstance(null);
    setSessionKVBindingForTests(undefined);
    if (originalSecret) {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    } else {
      delete process.env.ADMIN_SESSION_SECRET;
    }
  });

  it('Admin dengan sesi valid tidak terkena rate-limit meski memanggil berkali-kali', async () => {
    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: buildMockOrder(), error: null }),
          }),
        }),
      }),
    } as never);

    const session = await createAdminSession();

    // Lakukan request berulang kali (melebihi batas umum)
    for (let i = 0; i < 70; i++) {
      const req = new Request(`${BASE}/api/orders/CG-RATE01`, {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          cookie: `${ADMIN_CONFIG.cookieName}=${encodeURIComponent(session.token)}`,
        },
      });

      const res = await GET(req as never, { params: Promise.resolve({ id: 'CG-RATE01' }) });
      assert.notEqual(res.status, 429, `Request ke-${i + 1} terkena 429`);
      assert.equal(res.status, 200);
    }
  });

  it('Pengunjung biasa memiliki batas wajar 180 request per menit', async () => {
    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: buildMockOrder(), error: null }),
          }),
        }),
      }),
    } as never);

    const clientIp = '10.20.30.40';
    const reqUrl = `${BASE}/api/orders/CG-RATE01?t=validtoken1234567890abcdef123456`;

    // 180 request pertama sukses
    for (let i = 0; i < 180; i++) {
      const req = new Request(reqUrl, {
        headers: {
          'cf-connecting-ip': clientIp,
        },
      });

      const res = await GET(req as never, { params: Promise.resolve({ id: 'CG-RATE01' }) });
      assert.notEqual(res.status, 429, `Request ke-${i + 1} seharusnya sukses`);
      assert.equal(res.status, 200);
    }

    // Request ke-181 harus mengembalikan 429
    const blockedReq = new Request(reqUrl, {
      headers: {
        'cf-connecting-ip': clientIp,
      },
    });

    const blockedRes = await GET(blockedReq as never, { params: Promise.resolve({ id: 'CG-RATE01' }) });
    assert.equal(blockedRes.status, 429);
    const body = await blockedRes.json();
    assert.equal(body.error, 'Terlalu banyak permintaan. Silakan tunggu sebentar.');
    assert.equal(blockedRes.headers.get('X-RateLimit-Limit'), '180');
  });
});
