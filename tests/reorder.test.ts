import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { OrderRecord } from '../src/types/order.ts';
import {
  orderItemToCartItem,
  prepareReorderState,
  getReorderItemSummary,
} from '../src/lib/reorder.ts';

describe('Reorder Feature: orderItemToCartItem & prepareReorderState', () => {
  const mockOrder: OrderRecord = {
    id: 'KK-123456',
    brand_slug: 'kopi-kenangan',
    outlet_code: 'OUT-MALL-CIMA',
    outlet_name: 'Kopi Kenangan - Mall Cima',
    customer_name: 'Budi Santoso',
    customer_wa: '08123456789',
    subtotal: 36000,
    fee: 2300,
    total: 38300,
    status: 'selesai',
    created_at: '2026-11-08T10:00:00.000Z',
    expires_at: '2026-11-08T10:30:00.000Z',
    items: [
      {
        id: 'item-1',
        bundleCode: 'KK_AREN_01',
        sku: 'SKU_AREN_ICE',
        name: 'Creamy Aren Latte',
        basePrice: 18000,
        promoPrice: 18000,
        originalPrice: 24000,
        quantity: 2,
        subtotal: 36000,
        variantOptions: ['Ice', 'Regular', 'Less Sugar'],
        addons: [{ name: 'Topping: Grass Jelly', price: 6000 }],
        notes: 'Sedikit es',
      },
    ],
  };

  it('mengonversi OrderItemSnapshot reguler menjadi CartItem yang valid', () => {
    const rawItem = mockOrder.items[0];
    const cartItem = orderItemToCartItem(rawItem, mockOrder.brand_slug);

    assert.equal(cartItem.name, 'Creamy Aren Latte');
    assert.equal(cartItem.quantity, 2);
    assert.equal(cartItem.variantDescription, 'Ice, Regular, Less Sugar');
    assert.equal(cartItem.notes, 'Sedikit es');
    assert.equal(cartItem.brandSlug, 'kopi-kenangan');
    assert.equal(cartItem.addons?.length, 1);
    assert.equal(cartItem.addons?.[0].name, 'Topping: Grass Jelly');
    assert.ok(cartItem.id, 'CartItem harus memiliki ID hash');
  });

  it('mengonversi OrderItemSnapshot bundling menjadi CartItem dengan rincian paket utuh', () => {
    const bundleItem = {
      id: 'bundle-1',
      bundleCode: 'b-reg-1',
      name: 'Bundling 3 Reguler',
      basePrice: 53000,
      promoPrice: 29500,
      originalPrice: 53000,
      quantity: 1,
      subtotal: 29500,
      isBundle: true,
      bundleType: 'kopi-kenangan-3-reguler',
      bundleNormalPrice: 53000,
      bundleFee: 4000,
      bundleDetails: [
        {
          name: 'Kopi Kenangan Mantan',
          category: 'drink' as const,
          variantDescription: 'Ice, Regular',
          normalPrice: 18000,
          promoPrice: 9000,
        },
        {
          name: 'Americano',
          category: 'drink' as const,
          variantDescription: 'Ice, Regular',
          normalPrice: 15000,
          promoPrice: 7500,
        },
        {
          name: 'Milo Dinosaurus',
          category: 'drink' as const,
          variantDescription: 'Ice, Regular',
          normalPrice: 20000,
          promoPrice: 10000,
        },
      ],
    };

    const cartItem = orderItemToCartItem(bundleItem, 'kopi-kenangan');
    assert.equal(cartItem.isBundle, true);
    assert.equal(cartItem.bundleType, 'kopi-kenangan-3-reguler');
    assert.equal(cartItem.bundleFee, 4000);
    assert.equal(cartItem.bundleDetails?.length, 3);
    assert.ok(cartItem.id.startsWith('bundle_'));
  });

  it('prepareReorderState menghasilkan state keranjang lengkap sesuai outlet asal', () => {
    const state = prepareReorderState(mockOrder);

    assert.equal(state.outletCode, 'OUT-MALL-CIMA');
    assert.equal(state.outletName, 'Kopi Kenangan - Mall Cima');
    assert.equal(state.items.length, 1);
    assert.equal(state.items[0].name, 'Creamy Aren Latte');
    assert.equal(state.items[0].quantity, 2);
  });

  it('getReorderItemSummary membuat ringkasan singkat menu yang mudah dibaca', () => {
    const summary = getReorderItemSummary(mockOrder.items);
    assert.equal(summary, '2x Creamy Aren Latte');

    const multiItems = [
      { ...mockOrder.items[0], quantity: 1, name: 'Creamy Aren Latte' },
      { ...mockOrder.items[0], quantity: 2, name: 'Americano' },
    ];
    const multiSummary = getReorderItemSummary(multiItems);
    assert.equal(multiSummary, '1x Creamy Aren Latte, 2x Americano');
  });
});

