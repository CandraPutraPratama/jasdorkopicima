import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatItemDetails,
  buildWhatsAppMessage,
  buildOrderWhatsAppConfirmationMessage,
} from '../src/lib/whatsapp.ts';
import { createOrderRecord } from '../src/lib/order-service.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { OrderWhatsAppConfirmationInput } from '../src/lib/whatsapp.ts';

test('Tomoro Coffee - formatItemDetails preserves complete variant description', () => {
  const item: CartItem = {
    id: 'item-tomoro-1',
    bundleCode: 'tomoro-aren-latte',
    name: 'TOMORO Aren Latte',
    basePrice: 21000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    variantDescription: 'Small, Iced, Master Milk, Normal Sweet',
    addons: [{ sku: 'TOMORO_DAIRY_MASTER', name: 'Master Milk', price: 0, categoryName: 'Pilihan Susu' }],
    brandSlug: 'tomoro',
  };

  const details = formatItemDetails(item);
  assert.equal(
    details,
    ' (Small, Iced, Master Milk, Normal Sweet)',
    'Tomoro variant details should include Small, Iced, Master Milk, and Normal Sweet'
  );
});

test('Tomoro Coffee - formatItemDetails with paid addons does not duplicate addon names', () => {
  const item: CartItem = {
    id: 'item-tomoro-2',
    bundleCode: 'tomoro-aren-latte',
    name: 'TOMORO Aren Latte',
    basePrice: 21000,
    variantAddition: 0,
    toppingTotal: 5000,
    quantity: 1,
    variantDescription: 'Small, Iced, Oat Milk, Sea Salt Cloud, Less Sweet',
    addons: [
      { sku: 'TOMORO_DAIRY_OAT', name: 'Oat Milk', price: 5000, categoryName: 'Pilihan Susu' },
      { sku: 'TOMORO_TOP_SEASALT', name: 'Sea Salt Cloud', price: 5000, categoryName: 'Pilihan Topping' },
    ],
    brandSlug: 'tomoro',
  };

  const details = formatItemDetails(item);
  // Pastikan tidak ada duplikasi nama addon di dalam kurung rincian
  const matchesSeaSalt = (details.match(/Sea Salt Cloud/g) || []).length;
  assert.equal(matchesSeaSalt, 1, 'Sea Salt Cloud must appear only once in details');
  assert.ok(details.includes('Small, Iced'));
  assert.ok(details.includes('Oat Milk'));
  assert.ok(details.includes('Less Sweet'));
});

test('Tomoro Coffee - buildWhatsAppMessage includes complete format for regular item', () => {
  const items: CartItem[] = [
    {
      id: 'item-tomoro-aren',
      bundleCode: 'tomoro-aren-latte',
      name: 'TOMORO Aren Latte',
      basePrice: 21000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: 'Small, Iced, Master Milk, Normal Sweet',
      addons: [],
      brandSlug: 'tomoro',
    },
  ];

  const msg = buildWhatsAppMessage({
    customerName: 'Candra',
    outletName: 'Tomoro Coffee - Ruko Rawamangun',
    pickupMode: 'now',
    estimatedTime: '15:00',
    items,
    brandName: 'TOMORO Coffee',
  });

  assert.ok(msg.includes('Brand: TOMORO Coffee'));
  assert.ok(
    msg.includes('- 1x TOMORO Aren Latte (Small, Iced, Master Milk, Normal Sweet)'),
    'WhatsApp message line must contain complete customization'
  );
});

test('Tomoro Coffee - B1G1 preserves each drink customization format', () => {
  const b1g1Item: CartItem = {
    id: 'b1g1-order-1',
    bundleCode: 'tomoro-b1g1',
    name: 'Paket B1G1 TOMORO (Small)',
    basePrice: 21000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    isBundle: true,
    bundleType: 'tomoro-b1g1',
    bundleFee: 3000,
    bundleNormalPrice: 39000,
    bundleDetails: [
      {
        name: 'TOMORO Aren Latte',
        category: 'drink',
        variantDescription: 'Small, Iced, Normal Sweet',
        normalPrice: 21000,
        promoPrice: 21000,
      },
      {
        name: 'Caffe Americano',
        category: 'drink',
        variantDescription: 'Small, Iced, Less Sweet',
        normalPrice: 18000,
        promoPrice: 0,
      },
    ],
    brandSlug: 'tomoro',
  };

  const orderRecord = createOrderRecord({
    brandSlug: 'tomoro',
    outletCode: 'tomoro-jkt-rawamangun',
    outletName: 'Tomoro Coffee - Rawamangun',
    customerName: 'Candra',
    customerWa: '081234567890',
    items: [b1g1Item],
  });

  assert.equal(orderRecord.items.length, 1);
  const snap = orderRecord.items[0];
  assert.ok(snap.variantOptions, 'variantOptions should exist');
  assert.equal(snap.variantOptions?.length, 2);
  assert.equal(snap.variantOptions?.[0], 'TOMORO Aren Latte (Small, Iced, Normal Sweet)');
  assert.equal(snap.variantOptions?.[1], 'Caffe Americano (Small, Iced, Less Sweet)');

  const confInput: OrderWhatsAppConfirmationInput = {
    id: orderRecord.id,
    brand_slug: 'tomoro',
    outlet_code: 'tomoro-jkt-rawamangun',
    outlet_name: 'Tomoro Coffee - Rawamangun',
    customer_name: 'Candra',
    total: orderRecord.total,
    fee: orderRecord.fee,
    created_at: orderRecord.created_at,
    items: orderRecord.items,
  };

  const confMsg = buildOrderWhatsAppConfirmationMessage(confInput);
  assert.ok(confMsg.includes('Brand: TOMORO Coffee'));
  assert.ok(
    confMsg.includes('• TOMORO Aren Latte (Small, Iced, Normal Sweet)'),
    'B1G1 Drink 1 must include full variantDescription'
  );
  assert.ok(
    confMsg.includes('• Caffe Americano (Small, Iced, Less Sweet)'),
    'B1G1 Drink 2 must include full variantDescription'
  );
});

test('Fore Coffee - brand display detection in buildOrderWhatsAppConfirmationMessage', () => {
  const confInput: OrderWhatsAppConfirmationInput = {
    id: 'KK-FORE01',
    outlet_code: 'fore-senayan-city',
    outlet_name: 'Fore Coffee - Senayan City',
    customer_name: 'Budi',
    total: 21750,
    fee: 0,
    items: [
      {
        name: 'Aren Latte',
        quantity: 1,
        subtotal: 21750,
        variantOptions: ['Ice, Regular, Normal Ice, Normal Sweet'],
      },
    ],
  };

  const msg = buildOrderWhatsAppConfirmationMessage(confInput);
  assert.ok(
    msg.includes('Brand: Fore Coffee'),
    'Should identify Fore Coffee even if brand_slug is not explicitly set'
  );
  assert.ok(
    msg.includes('- 1x Aren Latte (Ice, Regular, Normal Ice, Normal Sweet)'),
    'Should display full Fore variant options'
  );
});

test('Fore Coffee - formatItemDetails preserves Large (+Rp7.000) without overriding to KK (+Rp5.000)', () => {
  const foreItem: CartItem = {
    id: 'fore-americano-large',
    bundleCode: 'FORE_AMERICANO',
    name: 'Americano',
    basePrice: 23000,
    variantAddition: 7000,
    toppingTotal: 0,
    quantity: 1,
    variantDescription: 'Ice, Large (+Rp7.000), Normal Ice',
    addons: [],
    brandSlug: 'fore',
  };

  const details = formatItemDetails(foreItem);
  assert.ok(
    details.includes('Large (+Rp7.000)') || details.includes('Large'),
    'Fore Large should not be corrupted into +Rp5.000'
  );
  assert.equal(
    details.includes('+Rp5.000'),
    false,
    'Fore item must NEVER show Kopi Kenangan price +Rp5.000'
  );
});
