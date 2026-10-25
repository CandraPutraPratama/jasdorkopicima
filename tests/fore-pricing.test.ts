import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateItemPricing,
  calculateOrderPricing,
  getOrderBreakdown,
} from '../src/lib/pricing.ts';

test('Fore Coffee - Item pricing applies strictly 25% discount', () => {
  // 1. Aren Latte (normal Rp29.000 -> diskon 25% = Rp21.750)
  const arenLatte = calculateItemPricing(
    {
      name: 'Aren Latte',
      basePrice: 29000,
      skuPrice: 29000,
      quantity: 1,
      brandSlug: 'fore',
    },
    undefined,
    'fore'
  );

  assert.equal(arenLatte.originalPricePerItem, 29000, 'Harga normal harus 29.000');
  assert.equal(arenLatte.promoPricePerItem, 21750, 'Harga promo harus 21.750 (diskon 25%)');
  assert.equal(arenLatte.savingsPerItem, 7250, 'Hemat harus 7.250');
  assert.equal(arenLatte.subtotalItem, 21750);
  assert.equal(arenLatte.totalSavingsItem, 7250);

  // 2. Americano (normal Rp23.000 -> diskon 25% = Rp17.250)
  const americano = calculateItemPricing(
    {
      name: 'Americano',
      basePrice: 23000,
      skuPrice: 23000,
      quantity: 2,
      brandSlug: 'fore',
    },
    undefined,
    'fore'
  );

  assert.equal(americano.originalPricePerItem, 23000);
  assert.equal(americano.promoPricePerItem, 17250);
  assert.equal(americano.savingsPerItem, 5750);
  assert.equal(americano.subtotalItem, 34500); // 17.250 x 2
  assert.equal(americano.totalSavingsItem, 11500); // 5.750 x 2

  // 3. Deteksi otomatis Fore lewat prefix bundleCode FORE_
  const autoDetectFore = calculateItemPricing({
    name: 'Bumi Latte',
    basePrice: 25000,
    quantity: 1,
    bundleCode: 'FORE_BUMI_LATTE',
  });

  assert.equal(autoDetectFore.originalPricePerItem, 25000);
  assert.equal(autoDetectFore.promoPricePerItem, 18750); // 25.000 x 0.75
  assert.equal(autoDetectFore.savingsPerItem, 6250);

  // 4. Matcha Butter Salt Cream - Regular (Rp31.000 -> diskon 25% = Rp23.250)
  const matchaRegular = calculateItemPricing(
    {
      name: 'Matcha Butter Salt Cream',
      basePrice: 31000,
      skuPrice: 31000,
      quantity: 1,
      brandSlug: 'fore',
    },
    undefined,
    'fore'
  );
  assert.equal(matchaRegular.originalPricePerItem, 31000);
  assert.equal(matchaRegular.promoPricePerItem, 23250);
  assert.equal(matchaRegular.savingsPerItem, 7750);

  // 5. Matcha Butter Salt Cream - Large upsize +Rp7.000 (Rp31.000 + Rp7.000 = Rp38.000 -> diskon 25% = Rp28.500)
  const matchaLarge = calculateItemPricing(
    {
      name: 'Matcha Butter Salt Cream',
      basePrice: 31000,
      variantAddition: 7000,
      quantity: 1,
      brandSlug: 'fore',
    },
    undefined,
    'fore'
  );
  assert.equal(matchaLarge.originalPricePerItem, 38000); // 31.000 + 7.000
  assert.equal(matchaLarge.promoPricePerItem, 28500, 'Harga promo Large harus 28.500 (bukan 30.250)');
  assert.equal(matchaLarge.savingsPerItem, 9500);

  // 6. Matcha Butter Salt Cream - Large + Oat Milk +Rp15.000 (Rp38.000 + Rp15.000 = Rp53.000 -> diskon 25% = Rp39.750)
  const matchaLargeOat = calculateItemPricing(
    {
      name: 'Matcha Butter Salt Cream',
      basePrice: 31000,
      variantAddition: 7000,
      toppingTotal: 15000,
      quantity: 1,
      brandSlug: 'fore',
    },
    undefined,
    'fore'
  );
  assert.equal(matchaLargeOat.originalPricePerItem, 53000); // 31.000 + 7.000 + 15.000
  assert.equal(matchaLargeOat.promoPricePerItem, 39750, 'Harga promo Large + Oat harus 39.750 (diskon 25% dari total)');
  assert.equal(matchaLargeOat.savingsPerItem, 13250);
});

test('Fore Coffee - Order fee is strictly FREE (Rp0)', () => {
  // 1. Pesanan 1 item Fore Coffee
  const singleOrder = calculateOrderPricing(
    [
      {
        name: 'Aren Latte',
        basePrice: 29000,
        skuPrice: 29000,
        quantity: 1,
        brandSlug: 'fore',
      },
    ],
    undefined,
    'fore'
  );

  assert.equal(singleOrder.totalQuantity, 1);
  assert.equal(singleOrder.subtotal, 21750);
  assert.equal(singleOrder.regularFee, 0, 'Fee reguler Fore harus Rp0 (FREE)');
  assert.equal(singleOrder.fee, 0, 'Total fee Fore harus Rp0 (FREE)');
  assert.equal(singleOrder.total, 21750, 'Total harus sama dengan subtotal (tanpa fee)');
  assert.equal(singleOrder.totalSavings, 7250);

  // 2. Pesanan multiple items Fore Coffee (2 item)
  const multiOrder = calculateOrderPricing(
    [
      {
        name: 'Aren Latte',
        basePrice: 29000,
        skuPrice: 29000,
        quantity: 1,
        brandSlug: 'fore',
      },
      {
        name: 'Americano',
        basePrice: 23000,
        skuPrice: 23000,
        quantity: 1,
        brandSlug: 'fore',
      },
    ],
    undefined,
    'fore'
  );

  assert.equal(multiOrder.totalQuantity, 2);
  assert.equal(multiOrder.subtotal, 39000); // 21.750 + 17.250
  assert.equal(multiOrder.regularFee, 0, 'Fee multi-item Fore harus tetap Rp0 (FREE)');
  assert.equal(multiOrder.fee, 0);
  assert.equal(multiOrder.total, 39000);
  assert.equal(multiOrder.totalSavings, 13000); // 7.250 + 5.750

  // 3. Breakdown rincian untuk checkout / WhatsApp
  const breakdown = getOrderBreakdown(
    [
      {
        name: 'Aren Latte',
        subtotal: 21750,
        quantity: 1,
        brandSlug: 'fore',
      },
    ],
    undefined,
    undefined,
    'fore'
  );

  assert.equal(breakdown.regularQuantity, 1);
  assert.equal(breakdown.regularSubtotal, 21750);
  assert.equal(breakdown.regularFee, 0, 'Breakdown regularFee Fore harus Rp0');
  assert.equal(breakdown.bundleFee, 0);
});

test('Kopi Kenangan and Tomoro fee invariants preserved', () => {
  // Kopi Kenangan 1 item: fee Rp4.000
  const kkSingle = calculateOrderPricing([
    {
      name: 'Kopi Kenangan Mantan',
      basePrice: 19000,
      quantity: 1,
    },
  ]);
  assert.equal(kkSingle.fee, 4000, 'Fee KK 1 item tetap Rp4.000');

  // Kopi Kenangan 2 items: fee Rp2.000 x 2 = Rp4.000
  const kkMulti = calculateOrderPricing([
    {
      name: 'Kopi Kenangan Mantan',
      basePrice: 19000,
      quantity: 2,
    },
  ]);
  assert.equal(kkMulti.fee, 4000, 'Fee KK 2 item tetap Rp4.000');

  // Tomoro 1 item: flat Rp1.500
  const tomoroSingle = calculateOrderPricing(
    [
      {
        name: 'TOMORO Aren Latte',
        basePrice: 28000,
        quantity: 1,
        brandSlug: 'tomoro',
      },
    ],
    undefined,
    'tomoro'
  );
  assert.equal(tomoroSingle.fee, 1500, 'Fee Tomoro tetap Rp1.500');
});

test('Fore Coffee - BottomSheet dynamic pricing discounts total (base + upsize + addons) by 25%', async () => {
  const { calculateBottomSheetPricing } = await import('../src/lib/option-validation.ts');

  // Matcha Butter Salt Cream: basePrice 31.000, Large upsize (+7.000)
  const matchaSheetLarge = calculateBottomSheetPricing(
    31000,
    ['Ice', 'Large (+Rp7.000)'],
    [],
    1,
    38000,
    'fore'
  );
  assert.equal(matchaSheetLarge.originalPricePerItem, 38000);
  assert.equal(matchaSheetLarge.promoPricePerItem, 28500, 'Harga promo di bottom sheet harus Rp28.500');
  assert.equal(matchaSheetLarge.savingsTotal, 9500);

  // Tambah Oat Milk (+15.000)
  const matchaSheetLargeOat = calculateBottomSheetPricing(
    31000,
    ['Ice', 'Large (+Rp7.000)'],
    [{ sku: 'FORE_DAIRY_OAT', name: 'Oat Milk', price: 15000, categoryName: 'Dairy', group: 'dairy' }],
    1,
    38000,
    'fore'
  );
  assert.equal(matchaSheetLargeOat.originalPricePerItem, 53000);
  assert.equal(matchaSheetLargeOat.promoPricePerItem, 39750, 'Harga promo Large + Oat harus Rp39.750');
  assert.equal(matchaSheetLargeOat.savingsTotal, 13250);
});
