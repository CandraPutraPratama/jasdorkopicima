import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOrderId,
  generateOrderAccessToken,
  verifyOrderAccessToken,
  createOrderRecord,
  getOrderById,
} from '../src/lib/order-service.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { GET } from '../src/app/api/orders/[id]/route.ts';
import { POST as CONFIRM_PAYMENT } from '../src/app/api/orders/[id]/confirm-payment/route.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { OrderRecord } from '../src/types/order.ts';

const BASE = 'https://jasdor.test';

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'CG-ABC234',
    brand_slug: 'kopi-kenangan',
    outlet_code: 'OUT-1',
    outlet_name: 'Outlet Satu',
    customer_name: 'Siti',
    customer_wa: '628123456789',
    items: [],
    subtotal: 10000,
    fee: 4000,
    total: 14000,
    status: 'menunggu_pembayaran',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    access_token: 'a'.repeat(32),
    ...overrides,
  };
}

function mockSupabaseWithOrder(order: OrderRecord | null) {
  let updatedStatus: string | null = null;
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: order, error: null }),
        }),
      }),
      update: (fields: { status?: string }) => ({
        eq: () => {
          if (fields.status) updatedStatus = fields.status;
          return Promise.resolve({ error: null });
        },
      }),
    }),
  } as never);
  return () => updatedStatus;
}

function callGet(id: string, query = '') {
  const request = new Request(`${BASE}/api/orders/${encodeURIComponent(id)}${query}`);
  return GET(request as never, { params: Promise.resolve({ id }) });
}

function callConfirm(id: string, query = '') {
  const request = new Request(`${BASE}/api/orders/${encodeURIComponent(id)}/confirm-payment${query}`, {
    method: 'POST',
  });
  return CONFIRM_PAYMENT(request as never, { params: Promise.resolve({ id }) });
}

describe('Step A - Order ID crypto randomness and access token', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  describe('generateOrderId', () => {
    it('still produces the CG-XXXXXX public format', () => {
      for (let i = 0; i < 25; i++) {
        assert.match(generateOrderId(), /^CG-[A-HJ-NP-Z2-9]{6}$/);
      }
    });

    it('does not rely on Math.random', () => {
      const source = generateOrderId.toString();
      assert.equal(source.includes('Math.random'), false);
    });

    it('draws entropy from a cryptographic source', () => {
      const source = generateOrderId.toString();
      assert.equal(source.includes('getRandomValues'), true);
    });

    it('produces distinct IDs across many calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 500; i++) ids.add(generateOrderId());
      assert.equal(ids.size, 500);
    });
  });

  describe('generateOrderAccessToken', () => {
    it('returns 32 lowercase hex characters', () => {
      const token = generateOrderAccessToken();
      assert.match(token, /^[0-9a-f]{32}$/);
    });

    it('returns a different token every call', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 200; i++) tokens.add(generateOrderAccessToken());
      assert.equal(tokens.size, 200);
    });
  });

  describe('verifyOrderAccessToken', () => {
    const order = buildOrder();

    it('accepts the matching token', () => {
      assert.equal(verifyOrderAccessToken(order, 'a'.repeat(32)), true);
    });

    it('rejects a wrong token of the same length', () => {
      assert.equal(verifyOrderAccessToken(order, 'b'.repeat(32)), false);
    });

    it('rejects empty, null and undefined tokens', () => {
      assert.equal(verifyOrderAccessToken(order, ''), false);
      assert.equal(verifyOrderAccessToken(order, null), false);
      assert.equal(verifyOrderAccessToken(order, undefined), false);
    });

    it('rejects every token when the order has no stored token', () => {
      const legacy = buildOrder({ access_token: undefined });
      assert.equal(verifyOrderAccessToken(legacy, 'a'.repeat(32)), false);
    });
  });

  describe('createOrderRecord', () => {
    it('embeds a fresh access token on every new order', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-1',
          name: 'Kopi',
          basePrice: 20000,
          quantity: 1,
        } as CartItem,
      ];

      const first = createOrderRecord({
        outletCode: 'OUT-1',
        customerName: 'Budi',
        customerWa: '628111222333',
        items,
      });
      const second = createOrderRecord({
        outletCode: 'OUT-1',
        customerName: 'Budi',
        customerWa: '628111222333',
        items,
      });

      assert.match(first.access_token ?? '', /^[0-9a-f]{32}$/);
      assert.match(second.access_token ?? '', /^[0-9a-f]{32}$/);
      assert.notEqual(first.access_token, second.access_token);
    });
  });

  describe('GET /api/orders/[id]', () => {
    it('returns 404 when no access token is supplied', async () => {
      mockSupabaseWithOrder(buildOrder());
      const res = await callGet('CG-ABC234');
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.order, undefined);
    });

    it('returns 404 for a wrong access token', async () => {
      mockSupabaseWithOrder(buildOrder());
      const res = await callGet('CG-ABC234', '?t=' + 'b'.repeat(32));
      assert.equal(res.status, 404);
    });

    it('returns the order for the correct access token', async () => {
      mockSupabaseWithOrder(buildOrder());
      const res = await callGet('CG-ABC234', '?t=' + 'a'.repeat(32));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.order.id, 'CG-ABC234');
    });

    it('returns 404 for a legacy order that has no stored token', async () => {
      mockSupabaseWithOrder(buildOrder({ access_token: undefined }));
      const res = await callGet('CG-ABC234', '?t=' + 'a'.repeat(32));
      assert.equal(res.status, 404);
    });

    it('still returns 404 for a missing order even with a token', async () => {
      mockSupabaseWithOrder(null);
      const res = await callGet('CG-NOPE99', '?t=' + 'a'.repeat(32));
      assert.equal(res.status, 404);
    });
  });

  describe('POST /api/orders/[id]/confirm-payment', () => {
    it('returns 404 without an access token and does not mutate state', async () => {
      const readStatus = mockSupabaseWithOrder(buildOrder());
      const res = await callConfirm('CG-ABC234');
      assert.equal(res.status, 404);
      assert.equal(readStatus(), null);
    });

    it('returns 404 for a wrong access token', async () => {
      mockSupabaseWithOrder(buildOrder());
      const res = await callConfirm('CG-ABC234', '?t=' + 'c'.repeat(32));
      assert.equal(res.status, 404);
    });

    it('confirms payment for the correct access token', async () => {
      const readStatus = mockSupabaseWithOrder(buildOrder());
      const res = await callConfirm('CG-ABC234', '?t=' + 'a'.repeat(32));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.order.status, 'antrian');
      assert.equal(readStatus(), 'antrian');
    });
  });

  describe('service layer keeps working for trusted callers', () => {
    it('getOrderById still reads by ID without a token', async () => {
      mockSupabaseWithOrder(buildOrder());
      const order = await getOrderById('CG-ABC234');
      assert.equal(order.id, 'CG-ABC234');
    });
  });
});
