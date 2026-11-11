import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/orders/create/route.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { orderItemToCartItem } from '../src/lib/reorder.ts';
import { calculateServerOrderPricing } from '../src/lib/order-service.ts';
import type { OrderRecord } from '../src/types/order.ts';

describe('Fore Coffee - Order Creation & Reorder Pricing', () => {
  const mockForeOutlet = {
    id: 999,
    code: 'fore-senayan',
    name: 'Fore Coffee Senayan City',
    brand: 'Fore Coffee',
    is_active: true,
    is_in_scope: true,
    open_time: '00:00',
    close_time: '23:59',
  };

  beforeEach(() => {
    setSupabaseServerClientInstance({
      from: (table: string) => {
        if (table === 'site_settings') {
          return {
            select: () => ({
              eq: (_col: string, val: string) => ({
                maybeSingle: async () => {
                  if (val === 'operational_override') {
                    return { data: { key: 'operational_override', value: 'force_open' }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        if (table === 'outlets') {
          return {
            select: () => ({
              ilike: () => ({
                maybeSingle: async () => ({
                  data: mockForeOutlet,
                  error: null,
                }),
              }),
              eq: () => ({
                maybeSingle: async () => ({
                  data: mockForeOutlet,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'orders') {
          return {
            insert: (record: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...record,
                    id: record.id || 'FR-ABC123',
                    access_token: record.access_token || 'mock_token_123',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    } as any);
  });

  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  it('berhasil membuat pesanan Fore ukuran Regular (diskon 25%, fee Rp0)', async () => {
    // Aren Latte Regular: basePrice 29.000, 25% off = 21.750
    const req = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'fore',
        outletCode: 'fore-senayan',
        outletName: 'Fore Coffee Senayan City',
        customerName: 'Budi Santoso',
        customerWa: '081234567890',
        items: [
          {
            id: 'item-reg-1',
            bundleCode: 'FORE_AREN_LATTE',
            sku: 'FORE_AREN_LATTE_ICE_REG',
            skuPrice: 29000,
            name: 'Aren Latte',
            basePrice: 29000,
            variantAddition: 0,
            toppingTotal: 0,
            quantity: 1,
            variantDescription: 'Ice, Regular',
            addons: [],
            brandSlug: 'fore',
          },
        ],
        pickupTime: 'Sekarang (~10 menit)',
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    assert.equal(res.status, 200, `Expected 200 OK but got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.ok(data.orderId.startsWith('FR-'));
    assert.equal(data.order.total, 21750);
    assert.equal(data.order.subtotal, 21750);
    assert.equal(data.order.fee, 0);
  });

  it('berhasil membuat pesanan Fore ukuran Large tanpa error "Harga menu berubah"', async () => {
    // Aren Latte Large: basePrice 29.000, variantAddition 7.000, skuPrice 36.000 -> 25% off = 27.000
    const req = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'fore',
        outletCode: 'fore-senayan',
        outletName: 'Fore Coffee Senayan City',
        customerName: 'Budi Santoso',
        customerWa: '081234567890',
        items: [
          {
            id: 'item-lrg-1',
            bundleCode: 'FORE_AREN_LATTE',
            sku: 'FORE_AREN_LATTE_ICE_LRG',
            skuPrice: 36000,
            name: 'Aren Latte',
            basePrice: 29000,
            variantAddition: 7000,
            toppingTotal: 0,
            quantity: 1,
            variantDescription: 'Ice, Large (+Rp7.000)',
            addons: [],
            brandSlug: 'fore',
          },
        ],
        pickupTime: 'Sekarang (~10 menit)',
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    assert.equal(res.status, 200, `Expected 200 OK but got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.ok(data.orderId.startsWith('FR-'));
    assert.equal(data.order.total, 27000);
    assert.equal(data.order.subtotal, 27000);
    assert.equal(data.order.fee, 0);
  });

  it('berhasil membuat pesanan Fore ukuran Large dengan Topping/Addon', async () => {
    // Aren Latte Large (36.000) + Soy Multigrain (7.000) = 43.000 normal -> 25% off = 32.250
    const req = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'fore',
        outletCode: 'fore-senayan',
        outletName: 'Fore Coffee Senayan City',
        customerName: 'Budi Santoso',
        customerWa: '081234567890',
        items: [
          {
            id: 'item-lrg-addon-1',
            bundleCode: 'FORE_AREN_LATTE',
            sku: 'FORE_AREN_LATTE_ICE_LRG',
            skuPrice: 36000,
            name: 'Aren Latte',
            basePrice: 29000,
            variantAddition: 7000,
            toppingTotal: 7000,
            quantity: 1,
            variantDescription: 'Ice, Large (+Rp7.000)',
            addons: [
              {
                sku: 'FORE_DAIRY_SOY_MULTIGRAIN',
                name: 'Soy Multigrain',
                price: 7000,
                categoryName: 'Pilihan Susu',
              },
            ],
            brandSlug: 'fore',
          },
        ],
        pickupTime: 'Sekarang (~10 menit)',
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    assert.equal(res.status, 200, `Expected 200 OK but got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.order.total, 32250);
    assert.equal(data.order.subtotal, 32250);
    assert.equal(data.order.fee, 0);
  });

  it('menolak manipulasi harga dari client untuk pesanan Fore', async () => {
    // Client mengirim total yang sengaja dikecilkan
    const req = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'fore',
        outletCode: 'fore-senayan',
        outletName: 'Fore Coffee Senayan City',
        customerName: 'Hacker',
        customerWa: '081234567890',
        total: 10000, // Harga palsu
        items: [
          {
            id: 'item-lrg-1',
            bundleCode: 'FORE_AREN_LATTE',
            sku: 'FORE_AREN_LATTE_ICE_LRG',
            skuPrice: 36000,
            name: 'Aren Latte',
            basePrice: 29000,
            variantAddition: 7000,
            toppingTotal: 0,
            quantity: 1,
            variantDescription: 'Ice, Large (+Rp7.000)',
            brandSlug: 'fore',
          },
        ],
        pickupTime: 'Sekarang (~10 menit)',
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.error, 'Harga menu berubah, silakan refresh keranjangmu.');
  });

  it('reorder Fore ukuran Large mempertahankan variantAddition dan harga promo yang tepat', () => {
    const foreOrderRecord: OrderRecord = {
      id: 'FR-XYZ789',
      brand_slug: 'fore',
      outlet_code: 'fore-senayan',
      outlet_name: 'Fore Coffee Senayan City',
      customer_name: 'Budi Santoso',
      customer_wa: '081234567890',
      subtotal: 27000,
      fee: 0,
      total: 27000,
      status: 'selesai',
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          bundleCode: 'FORE_AREN_LATTE',
          sku: 'FORE_AREN_LATTE_ICE_LRG',
          name: 'Aren Latte',
          basePrice: 29000,
          originalPrice: 36000,
          promoPrice: 27000,
          quantity: 1,
          subtotal: 27000,
          variantOptions: ['Ice, Large (+Rp7.000)'],
        },
      ],
    };

    const cartItem = orderItemToCartItem(foreOrderRecord.items[0], 'fore');
    assert.equal(cartItem.basePrice, 29000);
    assert.equal(cartItem.skuPrice, 36000);
    assert.equal(cartItem.variantAddition, 7000);

    const recomputedPricing = calculateServerOrderPricing([cartItem], 'fore');
    assert.equal(recomputedPricing.total, 27000);
    assert.equal(recomputedPricing.fee, 0);
  });
});
