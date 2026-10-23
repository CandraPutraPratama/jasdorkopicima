import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOMORO_FINAL_PRODUCTS,
  isTomoroItemEligible,
  getTomoroProductNormalPrice,
  getTomoroAirportTier,
  getTomoroMenuForOutlet,
} from '../src/lib/tomoro-menu-data.ts';
import {
  calculateItemPricing,
  calculateOrderPricing,
  getOrderBreakdown,
} from '../src/lib/pricing.ts';
import { getBrandConfig, resolveBrandSlugFromOutletCode } from '../src/lib/site-config.ts';
import { getBrandOutletProvider } from '../src/lib/brand-provider.ts';
import {
  evaluateTomoroOutletStatus,
  buildTomoroStatusUpsertRows,
} from '../src/lib/server/tomoro-sync.ts';
import { buildWhatsAppMessage, buildOrderWhatsAppConfirmationMessage } from '../src/lib/whatsapp.ts';

test('Tomoro Coffee - Brand Config and Provider', async () => {
  const brand = getBrandConfig('tomoro');
  assert.ok(brand !== null, 'Brand tomoro harus terdaftar');
  assert.equal(brand?.slug, 'tomoro');
  assert.equal(brand?.name, 'TOMORO Coffee');
  assert.equal(brand?.status, 'active');
  assert.equal(brand?.promoBadge, 'DISKON 50% + B1G1');
  assert.equal(brand?.logo, '/brand-logos/tomoro.png');

  assert.equal(resolveBrandSlugFromOutletCode('tomoro-plb03b-m'), 'tomoro');
  assert.equal(resolveBrandSlugFromOutletCode('TOMORO-JKT01'), 'tomoro');

  const provider = getBrandOutletProvider('tomoro');
  assert.ok(provider !== null);
  const count = await provider.getOutletCount();
  assert.equal(count, 678, 'Total outlet tomoro harus 678');
});

test('Tomoro Coffee - Catalog strictly 39 final items & forbidden items rejected', () => {
  assert.equal(TOMORO_FINAL_PRODUCTS.length, 39, 'Katalog harus tepat 39 menu');

  // Validasi beberapa item legal
  assert.ok(isTomoroItemEligible('TOMORO Aren Latte'));
  assert.ok(isTomoroItemEligible('Caffe Americano'));
  assert.ok(isTomoroItemEligible('Matcha Latte'));
  assert.ok(isTomoroItemEligible('Breve Latte'));

  // Validasi item terlarang / di luar katalog (Egg Tart, Butter Croissant, 1L Matcha Latte, dsb)
  assert.equal(isTomoroItemEligible('Egg Tart'), false, 'Egg Tart terlarang');
  assert.equal(isTomoroItemEligible('Pristine'), false, 'Pristine sudah dihapus dari katalog');
  assert.equal(
    isTomoroItemEligible('Spanish Latte (Limited Edition Cup)'),
    false,
    'Spanish Latte Limited Edition Cup sudah dihapus dari katalog'
  );
  assert.equal(isTomoroItemEligible('Butter Croissant'), false, 'Butter Croissant terlarang (semua FOOD ditolak)');
  assert.equal(isTomoroItemEligible('1L Matcha Latte'), false, '1L Matcha Latte terlarang');
  assert.equal(isTomoroItemEligible('1L TOMORO Aren Latte'), false, '1L Aren Latte terlarang');
  assert.equal(isTomoroItemEligible('Random Drink'), false);
});

test('Tomoro Coffee - National vs Airport pricing tier', () => {
  // Outlet Palembang Bandara SMB II (plb03b-m) & Dhoho Kediri (ked01a-m)
  assert.equal(getTomoroAirportTier('tomoro-plb03b-m'), 'palembang');
  assert.equal(getTomoroAirportTier('tomoro-ked01a-m'), 'dhoho');
  assert.equal(getTomoroAirportTier('tomoro-jkt01a-m'), 'national');

  // Harga normal Tomoro Aren Latte: Nasional Rp21.000 vs Bandara Palembang Rp40.000
  const nationalPrice = getTomoroProductNormalPrice('TOMORO Aren Latte', 'tomoro-jkt01a-m');
  assert.equal(nationalPrice, 21000);

  const airportPrice = getTomoroProductNormalPrice('TOMORO Aren Latte', 'tomoro-plb03b-m');
  assert.equal(airportPrice, 40000);

  const dhohoPrice = getTomoroProductNormalPrice('TOMORO Aren Latte', 'tomoro-ked01a-m');
  assert.equal(dhohoPrice, 26000);

  // Menu untuk outlet bandara
  const airportMenu = getTomoroMenuForOutlet('tomoro-plb03b-m');
  const arenItem = airportMenu.flatMap((g) => g.products).find((p) => p.name === 'TOMORO Aren Latte');
  assert.ok(arenItem);
  assert.equal(arenItem?.basePrice, 40000);
});

test('Tomoro Coffee - Regular menu pricing (50% diskon + flat Rp1.500 fee)', () => {
  // 1 regular item: Aren Latte (normal 28.000 -> diskon 50% = 14.000)
  // Fee = Rp1.500 (bukan singleItem 4.000)
  const order1 = calculateOrderPricing(
    [
      {
        name: 'TOMORO Aren Latte',
        basePrice: 28000,
        skuPrice: 28000,
        quantity: 1,
        brandSlug: 'tomoro',
      },
    ],
    undefined,
    'tomoro'
  );

  assert.equal(order1.regularQuantity, 1);
  assert.equal(order1.regularSubtotal, 14000);
  assert.equal(order1.regularFee, 1500, 'Fee 1 item Tomoro harus flat Rp1.500');
  assert.equal(order1.fee, 1500);
  assert.equal(order1.total, 15500);
  assert.equal(order1.totalSavings, 14000);

  // 2 regular items: Aren Latte (28k) + Americano (18k -> 9k)
  // Subtotal = 14.000 + 9.000 = 23.000
  // Fee = 2 x 1.500 = 3.000
  // Total = 26.000
  const order2 = calculateOrderPricing(
    [
      {
        name: 'TOMORO Aren Latte',
        basePrice: 28000,
        skuPrice: 28000,
        quantity: 1,
        brandSlug: 'tomoro',
      },
      {
        name: 'Caffe Americano',
        basePrice: 18000,
        skuPrice: 18000,
        quantity: 1,
        brandSlug: 'tomoro',
      },
    ],
    undefined,
    'tomoro'
  );

  assert.equal(order2.regularQuantity, 2);
  assert.equal(order2.regularSubtotal, 23000);
  assert.equal(order2.regularFee, 3000);
  assert.equal(order2.total, 26000);
});

test('Tomoro Coffee - B1G1 package pricing (pay highest, 1 free, fee Rp3.000)', () => {
  // B1G1 slot 1: Aren Latte (28.000), slot 2: Americano (18.000)
  // Bayar yang tertinggi = 28.000, Americano GRATIS
  // Fee paket B1G1 = 3.000
  // Total = 31.000
  const b1g1Item = {
    name: 'Paket B1G1 TOMORO (Small)',
    basePrice: 28000,
    quantity: 1,
    isBundle: true,
    bundleType: 'tomoro-b1g1',
    bundleFee: 3000,
    bundleNormalPrice: 46000, // 28.000 + 18.000
    brandSlug: 'tomoro',
  };

  const itemPricing = calculateItemPricing(b1g1Item);
  assert.equal(itemPricing.promoPricePerItem, 28000);
  assert.equal(itemPricing.originalPricePerItem, 46000);
  assert.equal(itemPricing.savingsPerItem, 18000);
  assert.equal(itemPricing.subtotalItem, 28000);

  const orderB1G1 = calculateOrderPricing([b1g1Item], undefined, 'tomoro');
  assert.equal(orderB1G1.bundleQuantity, 1);
  assert.equal(orderB1G1.bundleSubtotal, 28000);
  assert.equal(orderB1G1.bundleFee, 3000);
  assert.equal(orderB1G1.regularQuantity, 0);
  assert.equal(orderB1G1.total, 31000);
  assert.equal(orderB1G1.totalSavings, 18000);

  // B1G1 dengan 2 item harga sama (28.000 & 28.000)
  const b1g1SamePrice = {
    name: 'Paket B1G1 TOMORO (Small)',
    basePrice: 28000,
    quantity: 1,
    isBundle: true,
    bundleType: 'tomoro-b1g1',
    bundleFee: 3000,
    bundleNormalPrice: 56000,
    brandSlug: 'tomoro',
  };
  const orderSame = calculateOrderPricing([b1g1SamePrice], undefined, 'tomoro');
  assert.equal(orderSame.bundleSubtotal, 28000);
  assert.equal(orderSame.bundleFee, 3000);
  assert.equal(orderSame.total, 31000);
  assert.equal(orderSame.totalSavings, 28000);
});

test('Tomoro Coffee - Mixed Cart (1 B1G1 + 1 regular)', () => {
  // 1 B1G1 (28.000 bayar tertinggi + 3.000 fee)
  // 1 Regular Matcha Latte (normal 30.000 -> 50% = 15.000 + 1.500 fee)
  // Subtotal = 28.000 + 15.000 = 43.000
  // Fee = 3.000 (bundle) + 1.500 (regular) = 4.500
  // Total = 47.500
  const items = [
    {
      name: 'Paket B1G1 TOMORO (Small)',
      basePrice: 28000,
      quantity: 1,
      isBundle: true,
      bundleType: 'tomoro-b1g1',
      bundleFee: 3000,
      bundleNormalPrice: 46000,
      brandSlug: 'tomoro',
    },
    {
      name: 'Matcha Latte',
      basePrice: 30000,
      skuPrice: 30000,
      quantity: 1,
      brandSlug: 'tomoro',
    },
  ];

  const mixedOrder = calculateOrderPricing(items, undefined, 'tomoro');
  assert.equal(mixedOrder.bundleQuantity, 1);
  assert.equal(mixedOrder.bundleSubtotal, 28000);
  assert.equal(mixedOrder.bundleFee, 3000);
  assert.equal(mixedOrder.regularQuantity, 1);
  assert.equal(mixedOrder.regularSubtotal, 15000);
  assert.equal(mixedOrder.regularFee, 1500);
  assert.equal(mixedOrder.subtotal, 43000);
  assert.equal(mixedOrder.fee, 4500);
  assert.equal(mixedOrder.total, 47500);

  const breakdown = getOrderBreakdown(items, undefined, undefined, 'tomoro');
  assert.equal(breakdown.bundleQuantity, 1);
  assert.equal(breakdown.bundleSubtotal, 28000);
  assert.equal(breakdown.bundleFee, 3000);
  assert.equal(breakdown.regularQuantity, 1);
  assert.equal(breakdown.regularSubtotal, 15000);
  assert.equal(breakdown.regularFee, 1500);
});

test('Tomoro Coffee - Status outlet snapshot & stale > 30m detection', () => {
  const now = new Date();

  // Fresh active snapshot (10 menit lalu) -> BUKA
  const freshTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const freshStatus = evaluateTomoroOutletStatus({
    is_active: true,
    updated_at: freshTime,
  }, now);
  assert.equal(freshStatus.isOpen, true);
  assert.equal(freshStatus.canOrder, true);
  assert.equal(freshStatus.orderReason, null);

  // Inactive snapshot -> TUTUP
  const inactiveStatus = evaluateTomoroOutletStatus({
    is_active: false,
    updated_at: freshTime,
  }, now);
  assert.equal(inactiveStatus.isOpen, false);
  assert.equal(inactiveStatus.canOrder, false);
  assert.equal(inactiveStatus.orderReason, 'Outlet tidak aktif');

  // Stale snapshot (> 30 menit lalu, misal 35 menit) -> TUTUP dengan peringatan belum terverifikasi
  const staleTime = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
  const staleStatus = evaluateTomoroOutletStatus({
    is_active: true,
    updated_at: staleTime,
  }, now);
  assert.equal(staleStatus.isOpen, false);
  assert.equal(staleStatus.canOrder, false);
  assert.ok(staleStatus.orderReason?.includes('Status outlet belum terverifikasi'));
});

test('Tomoro Coffee - buildTomoroStatusUpsertRows hanya memuat outlet DB yang dikenal penyedia', () => {
  const nowIso = '2026-10-24T01:00:00.000Z';
  const dbRows = [
    { code: 'tomoro-jsd-025', name: 'Kota Kasablanka', is_active: false, brand: 'TOMORO Coffee', updated_at: '2026-01-01T00:00:00.000Z' },
    { code: 'tomoro-plb03b-m', name: 'Palembang Indah Mall', is_active: true, brand: 'TOMORO Coffee', updated_at: '2026-01-01T00:00:00.000Z' },
    { code: 'tomoro-xxx-999', name: 'Outlet Hanya Di DB', is_active: true, brand: 'TOMORO Coffee', updated_at: '2026-01-01T00:00:00.000Z' },
  ];
  const statusMap = new Map<string, boolean>([
    ['tomoro-jsd-025', true],
    ['tomoro-plb03b-m', false],
    ['tomoro-bru-001', true],
  ]);

  const { rows, openCount, closedCount } = buildTomoroStatusUpsertRows(
    dbRows,
    statusMap,
    nowIso
  );

  // Outlet hanya-di-DB dilewati; outlet hanya-di-penyedia tidak ditambahkan
  assert.equal(rows.length, 2);
  assert.equal(openCount, 1);
  assert.equal(closedCount, 1);

  const jsd = rows.find((r) => r.code === 'tomoro-jsd-025');
  assert.equal(jsd?.is_active, true);
  assert.equal(jsd?.updated_at, nowIso);
  // Kolom lain dari baris DB dipertahankan
  assert.equal(jsd?.name, 'Kota Kasablanka');
  assert.equal(jsd?.brand, 'TOMORO Coffee');

  const plb = rows.find((r) => r.code === 'tomoro-plb03b-m');
  assert.equal(plb?.is_active, false);
  assert.equal(plb?.updated_at, nowIso);
});

test('Tomoro Coffee - WhatsApp message formatting', () => {
  const orderInput = {
    customerName: 'Budi Santoso',
    outletName: 'Tomoro Coffee - Grand Indonesia',
    pickupMode: 'now' as const,
    estimatedTime: '14:30',
    items: [
      {
        id: 'b1g1-1',
        bundleCode: 'tomoro-b1g1',
        name: 'Paket B1G1 TOMORO (Small)',
        basePrice: 28000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 1,
        isBundle: true,
        bundleType: 'tomoro-b1g1',
        bundleFee: 3000,
        bundleNormalPrice: 46000,
        brandSlug: 'tomoro',
        bundleDetails: [
          {
            name: 'TOMORO Aren Latte',
            variantDescription: 'Small',
            normalPrice: 28000,
            promoPrice: 28000,
          },
          {
            name: 'Caffe Americano',
            variantDescription: 'Small',
            normalPrice: 18000,
            promoPrice: 0,
          },
        ],
      },
    ],
  };

  const message = buildWhatsAppMessage(orderInput);
  assert.ok(message.includes('Brand: TOMORO Coffee'));
  assert.ok(message.includes('GRATIS (B1G1)'));
  assert.ok(message.includes('Sub Total Bundling (1 item): Rp28.000'));
  assert.ok(message.includes('Biaya Jasa Bundling: Rp3.000'));
  assert.ok(message.includes('Total: Rp31.000'));

  // Konfirmasi pembayaran
  const confMsg = buildOrderWhatsAppConfirmationMessage({
    id: 'TMR12345',
    brand_slug: 'tomoro',
    outlet_code: 'tomoro-jkt01a-m',
    outlet_name: 'Tomoro Coffee - Grand Indonesia',
    customer_name: 'Budi Santoso',
    total: 31000,
    fee: 3000,
    items: [
      {
        name: 'Paket B1G1 TOMORO (Small)',
        quantity: 1,
        subtotal: 28000,
        isBundle: true,
        bundleType: 'tomoro-b1g1',
        bundleFee: 3000,
        bundleNormalPrice: 46000,
        bundleDetails: [
          {
            name: 'TOMORO Aren Latte',
            variantDescription: 'Small',
            normalPrice: 28000,
            promoPrice: 28000,
          },
          {
            name: 'Caffe Americano',
            variantDescription: 'Small',
            normalPrice: 18000,
            promoPrice: 0,
          },
        ],
      },
    ],
  });

  assert.ok(confMsg.includes('Brand: TOMORO Coffee'));
  assert.ok(confMsg.includes('GRATIS (B1G1)'));
  assert.ok(confMsg.includes('Biaya Jasa Bundling: Rp3.000'));
});
