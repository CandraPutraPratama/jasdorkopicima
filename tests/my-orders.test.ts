import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MY_ORDERS_STORAGE_KEY,
  getMyOrderEntries,
  saveMyOrder,
  removeMyOrder,
  clearMyOrders,
  isActiveOrderStatus,
  classifyOrders,
  formatCountdownTimer,
  getMyOrderAccessToken,
  buildOrderPaymentUrl,
  type MyOrderEntry,
} from '../src/lib/my-orders.ts';
import type { OrderRecord } from '../src/types/order.ts';

// In-memory mock storage for testing
class MockStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

describe('My Orders Helper & Classification (TDD)', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('Storage Helpers', () => {
    it('returns empty array when storage is empty', () => {
      const entries = getMyOrderEntries(mockStorage);
      assert.deepEqual(entries, []);
    });

    it('returns empty array when storage contains corrupted JSON', () => {
      mockStorage.setItem(MY_ORDERS_STORAGE_KEY, 'corrupted{json');
      const entries = getMyOrderEntries(mockStorage);
      assert.deepEqual(entries, []);
    });

    it('saves a new order to the list', () => {
      const saved = saveMyOrder('CG-TEST01', '2026-10-16T12:00:00Z', mockStorage);
      assert.equal(saved.length, 1);
      assert.equal(saved[0].orderId, 'CG-TEST01');
      assert.equal(saved[0].createdAt, '2026-10-16T12:00:00Z');

      const retrieved = getMyOrderEntries(mockStorage);
      assert.deepEqual(retrieved, saved);
    });

    it('deduplicates: puts existing orderId to the top and updates timestamp', () => {
      saveMyOrder('CG-ORDER1', '2026-10-16T10:00:00Z', mockStorage);
      saveMyOrder('CG-ORDER2', '2026-10-16T11:00:00Z', mockStorage);
      // Re-save ORDER1 with newer timestamp
      const updated = saveMyOrder('CG-ORDER1', '2026-10-16T12:00:00Z', mockStorage);

      assert.equal(updated.length, 2);
      assert.equal(updated[0].orderId, 'CG-ORDER1');
      assert.equal(updated[0].createdAt, '2026-10-16T12:00:00Z');
      assert.equal(updated[1].orderId, 'CG-ORDER2');
    });

    it('limits order history to maximum 50 entries', () => {
      for (let i = 1; i <= 60; i++) {
        saveMyOrder(`CG-ORD${String(i).padStart(3, '0')}`, new Date(i * 1000).toISOString(), mockStorage);
      }
      const entries = getMyOrderEntries(mockStorage);
      assert.equal(entries.length, 50);
      assert.equal(entries[0].orderId, 'CG-ORD060');
    });

    it('removes an order by orderId', () => {
      saveMyOrder('CG-ORD1', '2026-10-16T10:00:00Z', mockStorage);
      saveMyOrder('CG-ORD2', '2026-10-16T11:00:00Z', mockStorage);

      const remaining = removeMyOrder('CG-ORD1', mockStorage);
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0].orderId, 'CG-ORD2');
    });

    it('clears all orders', () => {
      saveMyOrder('CG-ORD1', '2026-10-16T10:00:00Z', mockStorage);
      clearMyOrders(mockStorage);
      assert.deepEqual(getMyOrderEntries(mockStorage), []);
    });

    it('stores the access token alongside the order id', () => {
      const token = 'a'.repeat(32);
      saveMyOrder('CG-TOK001', '2026-10-16T10:00:00Z', mockStorage, token);

      const entries = getMyOrderEntries(mockStorage);
      assert.equal(entries[0].orderId, 'CG-TOK001');
      assert.equal(entries[0].accessToken, token);
      assert.equal(getMyOrderAccessToken('CG-TOK001', mockStorage), token);
    });

    it('preserves the previously stored token when re-saving without one', () => {
      const token = 'b'.repeat(32);
      saveMyOrder('CG-TOK002', '2026-10-16T10:00:00Z', mockStorage, token);
      saveMyOrder('CG-TOK002', '2026-10-16T11:00:00Z', mockStorage);

      const entries = getMyOrderEntries(mockStorage);
      assert.equal(entries.length, 1);
      assert.equal(entries[0].createdAt, '2026-10-16T11:00:00Z');
      assert.equal(entries[0].accessToken, token);
    });

    it('returns null when no token is stored for an order', () => {
      saveMyOrder('CG-NOTOK', '2026-10-16T10:00:00Z', mockStorage);
      assert.equal(getMyOrderAccessToken('CG-NOTOK', mockStorage), null);
      assert.equal(getMyOrderAccessToken('CG-MISSING', mockStorage), null);
    });
  });

  describe('buildOrderPaymentUrl', () => {
    it('appends the access token as query param t', () => {
      assert.equal(
        buildOrderPaymentUrl('CG-ABC234', 'f'.repeat(32)),
        `/bayar/CG-ABC234?t=${'f'.repeat(32)}`
      );
    });

    it('returns the bare payment path when no token is available', () => {
      assert.equal(buildOrderPaymentUrl('CG-ABC234'), '/bayar/CG-ABC234');
      assert.equal(buildOrderPaymentUrl('CG-ABC234', null), '/bayar/CG-ABC234');
      assert.equal(buildOrderPaymentUrl('CG-ABC234', '   '), '/bayar/CG-ABC234');
    });
  });

  describe('isActiveOrderStatus', () => {
    it('returns true for menunggu_konfirmasi regardless of expiry', () => {
      const pastTime = new Date(Date.now() - 10000).toISOString();
      assert.equal(isActiveOrderStatus('menunggu_konfirmasi', pastTime), true);
    });

    it('returns true for menunggu_pembayaran when not expired', () => {
      const futureTime = new Date(Date.now() + 600000).toISOString();
      assert.equal(isActiveOrderStatus('menunggu_pembayaran', futureTime), true);
    });

    it('returns false for menunggu_pembayaran when already expired', () => {
      const pastTime = new Date(Date.now() - 5000).toISOString();
      assert.equal(isActiveOrderStatus('menunggu_pembayaran', pastTime), false);
    });

    it('returns false for diproses, dibatalkan, and kedaluwarsa', () => {
      const futureTime = new Date(Date.now() + 600000).toISOString();
      assert.equal(isActiveOrderStatus('diproses', futureTime), false);
      assert.equal(isActiveOrderStatus('dibatalkan', futureTime), false);
      assert.equal(isActiveOrderStatus('kedaluwarsa', futureTime), false);
    });
  });

  describe('classifyOrders', () => {
    it('partitions orders into active and history correctly', () => {
      const now = Date.now();
      const mockOrders: OrderRecord[] = [
        {
          id: 'CG-ACT1',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT1',
          customer_name: 'Budi',
          customer_wa: '08123456789',
          items: [],
          subtotal: 20000,
          fee: 2000,
          total: 22000,
          status: 'menunggu_pembayaran',
          created_at: new Date(now - 10000).toISOString(),
          expires_at: new Date(now + 1800000).toISOString(), // active
        },
        {
          id: 'CG-ACT2',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT1',
          customer_name: 'Budi',
          customer_wa: '08123456789',
          items: [],
          subtotal: 15000,
          fee: 2000,
          total: 17000,
          status: 'menunggu_konfirmasi',
          created_at: new Date(now - 20000).toISOString(),
          expires_at: new Date(now + 1800000).toISOString(), // active
        },
        {
          id: 'CG-EXP1',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT1',
          customer_name: 'Budi',
          customer_wa: '08123456789',
          items: [],
          subtotal: 30000,
          fee: 2000,
          total: 32000,
          status: 'menunggu_pembayaran',
          created_at: new Date(now - 7200000).toISOString(),
          expires_at: new Date(now - 3600000).toISOString(), // expired -> history
        },
        {
          id: 'CG-DONE1',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT1',
          customer_name: 'Budi',
          customer_wa: '08123456789',
          items: [],
          subtotal: 40000,
          fee: 4000,
          total: 44000,
          status: 'diproses',
          created_at: new Date(now - 86400000).toISOString(),
          expires_at: new Date(now - 80000000).toISOString(), // diproses -> history
        },
      ];

      const { active, history } = classifyOrders(mockOrders);

      assert.equal(active.length, 2);
      assert.deepEqual(active.map((o) => o.id), ['CG-ACT1', 'CG-ACT2']);

      assert.equal(history.length, 2);
      assert.deepEqual(history.map((o) => o.id), ['CG-EXP1', 'CG-DONE1']);
      // Notice: expired order should have status mapped to 'kedaluwarsa' in classification
      const expiredItem = history.find((o) => o.id === 'CG-EXP1');
      assert.equal(expiredItem?.status, 'kedaluwarsa');
    });
  });

  describe('formatCountdownTimer', () => {
    it('formats remaining seconds to MM:SS', () => {
      assert.equal(formatCountdownTimer(125), '02:05');
      assert.equal(formatCountdownTimer(0), '00:00');
      assert.equal(formatCountdownTimer(-5), '00:00');
      assert.equal(formatCountdownTimer(3599), '59:59');
    });
  });
});
