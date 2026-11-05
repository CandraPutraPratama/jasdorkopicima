import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderPricing,
  getOrderBreakdown,
  type OrderItemInput,
} from '../src/lib/pricing.ts';
import { buildWhatsAppMessage } from '../src/lib/whatsapp.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

test('Pricing Breakdown: Order campuran bundling + normal menghasilkan 2 baris fee dengan nominal benar dan total tetap sama', () => {
  // 1 item Bundling 3 Reguler (normal 57.000, promo 28.500, fee 4.000)
  // 2 item Kopi Kenangan Mantan (basePrice 20.000 -> promo 10.000 each = 20.000, fee 2.000 x 2 = 4.000)
  const items: OrderItemInput[] = [
    {
      name: 'Bundling 3 Reguler',
      basePrice: 57000,
      bundleNormalPrice: 57000,
      bundleFee: 4000,
      isBundle: true,
      bundleType: 'bundle-3-reguler',
      quantity: 1,
    },
    {
      name: 'Kopi Kenangan Mantan',
      basePrice: 20000,
      skuPrice: 20000,
      quantity: 2,
    },
  ];

  const result = calculateOrderPricing(items);

  // Verifikasi rincian bundling
  assert.equal(result.bundleQuantity, 1);
  assert.equal(result.bundleSubtotal, 28500);
  assert.equal(result.bundleFee, 4000);

  // Verifikasi rincian normal (2 item normal @ Rp2.300 = Rp4.600)
  assert.equal(result.regularQuantity, 2);
  assert.equal(result.regularSubtotal, 20000);
  assert.equal(result.regularFee, 4600);

  // Verifikasi total gabungan konsisten
  assert.equal(result.subtotal, result.bundleSubtotal + result.regularSubtotal);
  assert.equal(result.subtotal, 48500);
  assert.equal(result.fee, result.bundleFee + result.regularFee);
  assert.equal(result.fee, 8600);
  assert.equal(result.total, result.subtotal + result.fee);
  assert.equal(result.total, 57100);

  // Verifikasi getOrderBreakdown helper
  const breakdown = getOrderBreakdown([
    {
      name: 'Bundling 3 Reguler',
      isBundle: true,
      quantity: 1,
      subtotal: 28500,
      bundleFee: 4000,
    },
    {
      name: 'Kopi Kenangan Mantan',
      quantity: 2,
      subtotal: 20000,
    },
  ], result.fee);

  assert.equal(breakdown.bundleQuantity, 1);
  assert.equal(breakdown.bundleSubtotal, 28500);
  assert.equal(breakdown.bundleFee, 4000);
  assert.equal(breakdown.regularQuantity, 2);
  assert.equal(breakdown.regularSubtotal, 20000);
  assert.equal(breakdown.regularFee, 4600);
});

test('Pricing Breakdown: Order hanya bundling hanya menghasilkan baris bundling', () => {
  const items: OrderItemInput[] = [
    {
      name: 'Bundling 2 Large',
      basePrice: 50000,
      bundleNormalPrice: 50000,
      bundleFee: 3500,
      isBundle: true,
      bundleType: 'bundle-2-large',
      quantity: 1,
    },
  ];

  const result = calculateOrderPricing(items);

  assert.equal(result.bundleQuantity, 1);
  assert.equal(result.bundleSubtotal, 25000);
  assert.equal(result.bundleFee, 3500);

  assert.equal(result.regularQuantity, 0);
  assert.equal(result.regularSubtotal, 0);
  assert.equal(result.regularFee, 0);

  assert.equal(result.subtotal, 25000);
  assert.equal(result.fee, 3500);
  assert.equal(result.total, 28500);

  const breakdown = getOrderBreakdown([
    {
      name: 'Bundling 2 Large',
      isBundle: true,
      quantity: 1,
      subtotal: 25000,
      bundleFee: 3500,
    },
  ], 3500);

  assert.equal(breakdown.bundleQuantity, 1);
  assert.equal(breakdown.bundleSubtotal, 25000);
  assert.equal(breakdown.bundleFee, 3500);
  assert.equal(breakdown.regularQuantity, 0);
  assert.equal(breakdown.regularSubtotal, 0);
  assert.equal(breakdown.regularFee, 0);
});

test('Pricing Breakdown: Order hanya normal hanya menghasilkan baris normal', () => {
  const items: OrderItemInput[] = [
    {
      name: 'Americano',
      basePrice: 15000,
      skuPrice: 15000,
      quantity: 1,
    },
  ];

  const result = calculateOrderPricing(items);

  assert.equal(result.bundleQuantity, 0);
  assert.equal(result.bundleSubtotal, 0);
  assert.equal(result.bundleFee, 0);

  assert.equal(result.regularQuantity, 1);
  assert.equal(result.regularSubtotal, 7500);
  assert.equal(result.regularFee, 4000); // 1 item normal flat 4.000

  assert.equal(result.subtotal, 7500);
  assert.equal(result.fee, 4000);
  assert.equal(result.total, 11500);

  const breakdown = getOrderBreakdown([
    {
      name: 'Americano',
      quantity: 1,
      subtotal: 7500,
    },
  ], 4000);

  assert.equal(breakdown.bundleQuantity, 0);
  assert.equal(breakdown.bundleSubtotal, 0);
  assert.equal(breakdown.bundleFee, 0);
  assert.equal(breakdown.regularQuantity, 1);
  assert.equal(breakdown.regularSubtotal, 7500);
  assert.equal(breakdown.regularFee, 4000);
});

test('WhatsApp Message: Order campuran menampilkan 4 baris ringkasan (2 subtotal + 2 fee)', () => {
  const items: CartItem[] = [
    {
      id: 'bundle-item',
      bundleCode: 'bnd-1',
      name: 'Bundling 3 Reguler',
      basePrice: 57000,
      bundleNormalPrice: 57000,
      bundleFee: 4000,
      isBundle: true,
      quantity: 1,
      variantAddition: 0,
      toppingTotal: 0,
      bundleDetails: [
        { name: 'Kopi Kenangan Mantan', promoPrice: 9500 },
        { name: 'Americano', promoPrice: 7500 },
        { name: 'Milo Dinosaurus', promoPrice: 11500 },
      ],
    },
    {
      id: 'reg-item',
      bundleCode: 'reg-1',
      name: 'Avocado Coffee',
      basePrice: 28000,
      skuPrice: 28000,
      quantity: 1,
      variantAddition: 0,
      toppingTotal: 0,
    },
  ];

  const msg = buildWhatsAppMessage({
    customerName: 'Budi',
    outletName: 'Grand Indonesia',
    pickupMode: 'now',
    estimatedTime: '12:00',
    items,
  });

  // Memastikan ke-4 baris terpisah ada
  assert.match(msg, /Sub Total Bundling \(1 item\): Rp28\.500/);
  assert.match(msg, /Sub Total Normal \(1 item\): Rp14\.000/);
  assert.match(msg, /Biaya Jasa Bundling: Rp4\.000/);
  assert.match(msg, /Biaya Jasa Normal: Rp2\.300/);
  assert.match(msg, /Total: Rp48\.800/);
});

test('WhatsApp Message: Order hanya bundling hanya menampilkan baris bundling', () => {
  const items: CartItem[] = [
    {
      id: 'bundle-item',
      bundleCode: 'bnd-1',
      name: 'Bundling 3 Reguler',
      basePrice: 57000,
      bundleNormalPrice: 57000,
      bundleFee: 4000,
      isBundle: true,
      quantity: 1,
      variantAddition: 0,
      toppingTotal: 0,
      bundleDetails: [
        { name: 'Kopi Kenangan Mantan', promoPrice: 9500 },
        { name: 'Americano', promoPrice: 7500 },
        { name: 'Milo Dinosaurus', promoPrice: 11500 },
      ],
    },
  ];

  const msg = buildWhatsAppMessage({
    customerName: 'Budi',
    outletName: 'Grand Indonesia',
    pickupMode: 'now',
    estimatedTime: '12:00',
    items,
  });

  assert.match(msg, /Sub Total Bundling \(1 item\): Rp28\.500/);
  assert.match(msg, /Biaya Jasa Bundling: Rp4\.000/);
  assert.doesNotMatch(msg, /Sub Total Normal/);
  assert.doesNotMatch(msg, /Biaya Jasa Normal/);
  assert.match(msg, /Total: Rp32\.500/);
});

test('WhatsApp Message: Order hanya normal hanya menampilkan baris normal', () => {
  const items: CartItem[] = [
    {
      id: 'reg-item',
      bundleCode: 'reg-1',
      name: 'Americano',
      basePrice: 15000,
      skuPrice: 15000,
      quantity: 2,
      variantAddition: 0,
      toppingTotal: 0,
    },
  ];

  const msg = buildWhatsAppMessage({
    customerName: 'Budi',
    outletName: 'Grand Indonesia',
    pickupMode: 'now',
    estimatedTime: '12:00',
    items,
  });

  assert.match(msg, /Sub Total Normal \(2 item\): Rp15\.000/);
  assert.match(msg, /Biaya Jasa Normal: Rp4\.600/);
  assert.doesNotMatch(msg, /Sub Total Bundling/);
  assert.doesNotMatch(msg, /Biaya Jasa Bundling/);
  assert.match(msg, /Total: Rp19\.600/);
});
