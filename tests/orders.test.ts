import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOrderId,
  calculateServerOrderPricing,
  isOrderExpired,
  createOrderRecord,
  saveOrderToDb,
  getOrderById,
  confirmOrderPayment,
  updateOrderStatusByAdmin,
  listOrdersForAdmin,
} from '../src/lib/order-service.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { OrderRecord } from '../src/types/order.ts';

describe('Order Service - QRIS On-Site Flow', () => {
  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  describe('generateOrderId', () => {
    it('generates ID with CG- prefix and exactly 6 uppercase alphanumeric characters when no brand is provided', () => {
      const id = generateOrderId();
      assert.match(id, /^CG-[A-Z0-9]{6}$/);
    });

    it('generates ID with KK- prefix for Kopi Kenangan', () => {
      const id = generateOrderId('kopi-kenangan');
      assert.match(id, /^KK-[A-Z0-9]{6}$/);
    });

    it('generates ID with TC- prefix for Tomoro Coffee', () => {
      const id = generateOrderId('tomoro');
      assert.match(id, /^TC-[A-Z0-9]{6}$/);
    });

    it('generates ID with FR- prefix for Fore Coffee', () => {
      const id = generateOrderId('fore');
      assert.match(id, /^FR-[A-Z0-9]{6}$/);
    });

    it('falls back to CG- prefix for unknown or empty brand', () => {
      assert.match(generateOrderId(''), /^CG-[A-Z0-9]{6}$/);
      assert.match(generateOrderId('unknown-brand'), /^CG-[A-Z0-9]{6}$/);
    });

    it('excludes ambiguous characters so customers can dictate the ID safely across all brand prefixes', () => {
      const ambiguous = /[IO01]/;
      for (const brand of ['kopi-kenangan', 'tomoro', 'fore', undefined]) {
        for (let i = 0; i < 25; i++) {
          assert.equal(ambiguous.test(generateOrderId(brand)), false);
        }
      }
    });

    it('generates unique IDs across multiple calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 500; i++) {
        ids.add(generateOrderId('kopi-kenangan'));
      }
      assert.equal(ids.size, 500);
    });
  });

  describe('calculateServerOrderPricing', () => {
    it('calculates pricing on server matching official business config (50% discount on base, flat fee)', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-LATTEM',
          sku: 'SKU-REG',
          skuPrice: 20000,
          name: 'Kopi Kenangan Mantan',
          basePrice: 20000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 2,
          variantDescription: 'Regular',
          notes: '',
        },
      ];

      const pricing = calculateServerOrderPricing(items);
      // basePrice: 20000 -> 50% = 10000 per item
      // qty: 2 -> subtotal = 20000
      // qty: 2 -> multi-item fee: 2000 * 2 = 4000
      // total = 24000
      assert.equal(pricing.subtotal, 20000);
      assert.equal(pricing.fee, 4000);
      assert.equal(pricing.total, 24000);
      assert.equal(pricing.totalQuantity, 2);
    });

    it('handles single item fee (Rp4.000 flat)', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-LATTEM',
          sku: 'SKU-REG',
          skuPrice: 20000,
          name: 'Kopi Kenangan Mantan',
          basePrice: 20000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
          notes: '',
        },
      ];

      const pricing = calculateServerOrderPricing(items);
      // basePrice: 20000 -> 50% = 10000
      // fee single item = 4000
      // total = 14000
      assert.equal(pricing.subtotal, 10000);
      assert.equal(pricing.fee, 4000);
      assert.equal(pricing.total, 14000);
    });
  });

  describe('Phone Sanitization & Validation', () => {
    it('validates and normalizes Indonesian WhatsApp phone numbers', async () => {
      const { validateCustomerPhone } = await import('../src/lib/sanitizer.ts');
      
      const res08 = validateCustomerPhone('0812-3456-7890');
      assert.equal(res08.isValid, true);
      assert.equal(res08.sanitized, '6281234567890');

      const res62 = validateCustomerPhone('+62 812 3456 7890');
      assert.equal(res62.isValid, true);
      assert.equal(res62.sanitized, '6281234567890');

      const resDirect8 = validateCustomerPhone('812-3456-7890');
      assert.equal(resDirect8.isValid, true);
      assert.equal(resDirect8.sanitized, '6281234567890');

      const resInvalid = validateCustomerPhone('12345');
      assert.equal(resInvalid.isValid, false);
      assert.ok(resInvalid.errorMessage);
    });
  });

  describe('Outlet Closure Guard', () => {
    it('rejects order creation if outlet is closed via isOutletClosed', async () => {
      const { isOutletClosed } = await import('../src/lib/orderability.ts');
      assert.equal(isOutletClosed({ isOpen: false }), true);
      assert.equal(isOutletClosed({ canOrder: false }), true);
      assert.equal(isOutletClosed({ isOpen: true, canOrder: true, openTime: '08:00', closeTime: '22:00' }, new Date('2026-10-16T16:00:00Z')), true); // 16:00 UTC = 23:00 WIB (closed)
    });
  });

  describe('isOrderExpired', () => {
    it('returns false if current time is before expires_at', () => {
      const now = new Date('2026-10-16T12:00:00Z');
      const order = {
        expires_at: '2026-10-16T13:00:00Z',
        status: 'menunggu_pembayaran' as const,
      };
      assert.equal(isOrderExpired(order, now), false);
    });

    it('returns true if current time is after expires_at and status is menunggu_pembayaran', () => {
      const now = new Date('2026-10-16T13:01:00Z');
      const order = {
        expires_at: '2026-10-16T13:00:00Z',
        status: 'menunggu_pembayaran' as const,
      };
      assert.equal(isOrderExpired(order, now), true);
    });

    it('returns false if order is already paid or confirmed even if time is past expires_at', () => {
      const now = new Date('2026-10-16T13:30:00Z');
      const order = {
        expires_at: '2026-10-16T13:00:00Z',
        status: 'menunggu_konfirmasi' as const,
      };
      assert.equal(isOrderExpired(order, now), false);
    });
  });

  describe('createOrderRecord', () => {
    it('creates full order structure with initial status menunggu_pembayaran and 60-min expiry', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-1',
          sku: 'P-1',
          skuPrice: 16000,
          name: 'Americano',
          basePrice: 16000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
          variantDescription: 'Regular',
          notes: 'Less ice',
        },
      ];

      const order = createOrderRecord({
        brandSlug: 'kopi-kenangan',
        outletCode: 'KK-LIPPO',
        outletName: 'Kopi Kenangan Lippo Mall Puri',
        customerName: 'Budi Santoso',
        customerWa: '628123456789',
        items,
        pickupTime: '14:30',
        notes: 'Jangan manis',
      });

      assert.match(order.id, /^KK-[A-Z0-9]{6}$/);
      assert.match(order.access_token ?? '', /^[0-9a-f]{32}$/);
      assert.equal(order.status, 'menunggu_pembayaran');
      assert.equal(order.brand_slug, 'kopi-kenangan');
      assert.equal(order.outlet_code, 'KK-LIPPO');
      assert.equal(order.customer_name, 'Budi Santoso');
      assert.equal(order.customer_wa, '628123456789');
      assert.equal(order.subtotal, 8000); // 16000 * 0.5
      assert.equal(order.fee, 4000);
      assert.equal(order.total, 12000);
      assert.equal(order.items.length, 1);
      assert.equal(order.items[0].name, 'Americano');
      assert.equal(order.items[0].subtotal, 8000);

      const createdTime = new Date(order.created_at).getTime();
      const expiresTime = new Date(order.expires_at).getTime();
      assert.equal(expiresTime - createdTime, 60 * 60 * 1000); // 60 minutes
    });

    it('creates order with TC- prefix for tomoro and FR- prefix for fore', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'AMER-01',
          name: 'Americano',
          basePrice: 16000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
        },
      ];

      const tomoroOrder = createOrderRecord({
        brandSlug: 'tomoro',
        outletCode: 'TC-01',
        customerName: 'Siti',
        customerWa: '62811111111',
        items,
      });
      assert.match(tomoroOrder.id, /^TC-[A-Z0-9]{6}$/);

      const foreOrder = createOrderRecord({
        brandSlug: 'fore',
        outletCode: 'FR-01',
        customerName: 'Andi',
        customerWa: '62822222222',
        items,
      });
      assert.match(foreOrder.id, /^FR-[A-Z0-9]{6}$/);
    });
  });

  describe('Database Operations with Mock Supabase', () => {
    it('saveOrderToDb inserts into orders table', async () => {
      let insertedPayload: any = null;
      setSupabaseServerClientInstance({
        from: (table: string) => {
          assert.equal(table, 'orders');
          return {
            insert: (payload: any) => {
              insertedPayload = payload;
              return {
                select: () => ({
                  single: async () => ({ data: payload, error: null }),
                }),
              };
            },
          };
        },
      } as any);

      const order: OrderRecord = {
        id: 'CG-TEST01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Dewi',
        customer_wa: '628111222333',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_pembayaran',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      const result = await saveOrderToDb(order);
      assert.equal(result.id, 'CG-TEST01');
      assert.equal(insertedPayload.id, 'CG-TEST01');
    });

    it('getOrderById applies lazy expiry transition if expired', async () => {
      const pastTime = new Date(Date.now() - 10000).toISOString();
      const mockOrder: OrderRecord = {
        id: 'CG-EXPD01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Eko',
        customer_wa: '628999888777',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_pembayaran',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        expires_at: pastTime,
      };

      let updatedStatus: string | null = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              updatedStatus = fields.status;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const fetched = await getOrderById('CG-EXPD01');
      assert.ok(fetched);
      assert.equal(fetched.status, 'kedaluwarsa');
      assert.equal(updatedStatus, 'kedaluwarsa');
    });

    it('confirmOrderPayment updates status from menunggu_pembayaran to antrian', async () => {
      const mockOrder: OrderRecord = {
        id: 'CG-PAY01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Fani',
        customer_wa: '628555666777',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_pembayaran',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      let statusUpdated: string | null = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              statusUpdated = fields.status;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const updated = await confirmOrderPayment('CG-PAY01');
      assert.equal(updated.status, 'antrian');
      assert.equal(statusUpdated, 'antrian');
    });

    it('updateOrderStatusByAdmin transitions status to diproses or dibatalkan', async () => {
      const mockOrder: OrderRecord = {
        id: 'CG-ADM01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Gilang',
        customer_wa: '628111999888',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_konfirmasi',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      let newDbStatus: string | null = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              newDbStatus = fields.status;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const processed = await updateOrderStatusByAdmin('CG-ADM01', 'diproses');
      assert.equal(processed.status, 'diproses');
      assert.equal(newDbStatus, 'diproses');
    });

    it('updateOrderStatusByAdmin dapat memindahkan pesanan ke status antrian', async () => {
      const mockOrder: OrderRecord = {
        id: 'CG-ADM02',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Sari',
        customer_wa: '628111999777',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_konfirmasi',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      let newDbStatus: string | null = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              newDbStatus = fields.status;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const queued = await updateOrderStatusByAdmin('CG-ADM02', 'antrian');
      assert.equal(queued.status, 'antrian');
      assert.equal(newDbStatus, 'antrian');
    });

    it('updateOrderStatusByAdmin menandai needs_refund: true jika admin membatalkan pesanan antrian', async () => {
      const mockOrder: OrderRecord = {
        id: 'CG-ADM-QUEUE-CANCEL',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Dewi',
        customer_wa: '628111999777',
        items: [],
        subtotal: 15000,
        fee: 4000,
        total: 19000,
        status: 'antrian',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      let updatePayload: any = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              updatePayload = fields;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const cancelled = await updateOrderStatusByAdmin('CG-ADM-QUEUE-CANCEL', 'dibatalkan', 'Stok habis di gerai');
      assert.equal(cancelled.status, 'dibatalkan');
      assert.equal(updatePayload?.needs_refund, true);
      assert.equal(updatePayload?.cancellation_reason, 'Stok habis di gerai');
    });

    it('updateOrderStatusByAdmin dapat menandai pesanan diproses menjadi selesai', async () => {
      const mockOrder: OrderRecord = {
        id: 'CG-ADM03',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Bima',
        customer_wa: '628111999888',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'diproses',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      let newDbStatus: string | null = null;

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockOrder, error: null }),
            }),
          }),
          update: (fields: any) => ({
            eq: () => {
              newDbStatus = fields.status;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      } as any);

      const done = await updateOrderStatusByAdmin('CG-ADM03', 'selesai');
      assert.equal(done.status, 'selesai');
      assert.equal(newDbStatus, 'selesai');
    });

    it('listOrdersForAdmin prioritizes menunggu_konfirmasi at the top', async () => {
      const ordersInDb: OrderRecord[] = [
        {
          id: 'CG-01',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT-1',
          customer_name: 'A',
          customer_wa: '6281',
          items: [],
          subtotal: 10000,
          fee: 2000,
          total: 12000,
          status: 'diproses',
          created_at: '2026-10-16T10:00:00Z',
          expires_at: '2026-10-16T11:00:00Z',
        },
        {
          id: 'CG-02',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT-1',
          customer_name: 'B',
          customer_wa: '6282',
          items: [],
          subtotal: 10000,
          fee: 2000,
          total: 12000,
          status: 'menunggu_konfirmasi',
          created_at: '2026-10-16T09:00:00Z',
          expires_at: '2026-10-16T10:00:00Z',
        },
        {
          id: 'CG-03',
          brand_slug: 'kopi-kenangan',
          outlet_code: 'OUT-1',
          customer_name: 'C',
          customer_wa: '6283',
          items: [],
          subtotal: 10000,
          fee: 2000,
          total: 12000,
          status: 'menunggu_pembayaran',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ];

      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            order: () => ({
              limit: async () => ({ data: ordersInDb, error: null }),
            }),
          }),
        }),
      } as any);

      const list = await listOrdersForAdmin(10);
      assert.equal(list[0].id, 'CG-02'); // menunggu_konfirmasi must be #1
      assert.equal(list[0].status, 'menunggu_konfirmasi');
      assert.equal(list[1].id, 'CG-03'); // menunggu_pembayaran must be #2
      assert.equal(list[2].id, 'CG-01'); // diproses must be #3
    });
  });
});
