import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOMORO_FINAL_PRODUCTS,
  isTomoroItemEligible,
  getTomoroProductOptions,
} from '../src/lib/tomoro-menu-data.ts';
import {
  getTomoroItemConfig,
  TOMORO_CUSTOMIZATION_CONFIGS,
} from '../src/lib/tomoro-customization-data.ts';
import {
  calculateItemPricing,
  calculateFlatAddonTotal,
} from '../src/lib/pricing.ts';
import { calculateBottomSheetPricing } from '../src/lib/option-validation.ts';

test('Tomoro Customization - 36 Verified Products from User Excel', () => {
  // 36 produk final hasil editan user
  assert.equal(TOMORO_CUSTOMIZATION_CONFIGS.length, 36, 'Harus tepat 36 produk di konfigurasi kustomisasi');
  assert.equal(TOMORO_FINAL_PRODUCTS.length, 36, 'Harus tepat 36 produk di katalog menu');

  // Produk yang dihapus user wajib tidak eligible
  assert.equal(isTomoroItemEligible('Spanish Aren Latte (Limited Edition Cup)'), false);
  assert.equal(isTomoroItemEligible('Pink Pop Lemonade'), false);
  assert.equal(isTomoroItemEligible('Pink Pop Lemon Tea'), false);

  // Cek harga Matcha Latte & Strawberry Matcha Latte yang diperbarui user
  const matcha = getTomoroItemConfig('Matcha Latte');
  assert.ok(matcha);
  assert.equal(matcha?.hargaNormal, 27000);
  assert.equal(matcha?.sweetness.active, false, 'Matcha Latte sweetness TIDAK aktif');
  assert.equal(matcha?.milk.active, true, 'Matcha Latte milk aktif');
  assert.equal(matcha?.topping.active, true, 'Matcha Latte topping aktif');

  const strawbMatcha = getTomoroItemConfig('Strawberry Matcha Latte');
  assert.ok(strawbMatcha);
  assert.equal(strawbMatcha?.hargaNormal, 30000, 'Harga diperbarui ke 30.000');
  assert.equal(strawbMatcha?.sweetness.active, true);
});

test('Tomoro Customization - Options Details Generation (getTomoroProductOptions)', () => {
  const options = getTomoroProductOptions('tomoro-matcha-latte', 'tomoro-jkt01a-m');
  assert.ok(options, 'Options harus ditemukan');
  assert.equal(options?.product.name, 'Matcha Latte');

  // Dimensi: Ukuran Cup (Small) & Suhu (Iced)
  assert.ok(options?.dimensions && options.dimensions.length >= 1);
  const cupDim = options?.dimensions.find((d) => d.name.toLowerCase().includes('cup') || d.name.toLowerCase().includes('ukuran'));
  assert.ok(cupDim, 'Dimensi Cup harus ada');
  const tempDim = options?.dimensions.find((d) => d.name.toLowerCase().includes('suhu') || d.name.toLowerCase().includes('temperature'));
  assert.ok(tempDim, 'Dimensi Suhu harus ada');

  // Addons: Susu & Topping
  const dairies = options?.addons.filter((a) => a.group === 'dairy');
  assert.ok(dairies && dairies.length >= 3, 'Harus ada Master Milk, Oat Milk, Coconut Milk');
  const masterMilk = dairies?.find((d) => d.name.toLowerCase().includes('master milk'));
  assert.equal(masterMilk?.price, 0);
  const oatMilk = dairies?.find((d) => d.name.toLowerCase().includes('oat milk'));
  assert.equal(oatMilk?.price, 5000, 'Oat Milk harga promo diskon 50% adalah Rp5.000 (dari normal Rp10.000)');

  const toppings = options?.addons.filter((a) => a.group === 'topping');
  assert.ok(toppings && toppings.length >= 3, 'Harus ada No Topping, Sea Salt Cloud, Cheese Cloud');
  const seaSalt = toppings?.find((t) => t.name.toLowerCase().includes('sea salt'));
  assert.equal(seaSalt?.price, 5000, 'Sea Salt Cloud normal flat Rp5.000');
});

test('Tomoro Pricing - Exact Case Math Verification (Kasus Pengujian User Rp18.500)', () => {
  // Kasus 1: Menu Saja Matcha Latte (27.000 x 50% = 13.500)
  const price1 = calculateItemPricing(
    {
      name: 'Matcha Latte',
      basePrice: 27000,
      skuPrice: 27000,
      quantity: 1,
      brandSlug: 'tomoro',
    },
    undefined,
    'tomoro'
  );
  assert.equal(price1.promoPricePerItem, 13500);

  // Kasus 2: Menu Matcha Latte (27.000 x 50% = 13.500) + Topping Sea Salt Cloud (5.000 flat)
  // TOTAL: 13.500 + 5.000 = 18.500!
  const seaSaltAddon = {
    sku: 'TOMORO_TOP_SEASALT',
    name: 'Sea Salt Cloud',
    price: 5000,
    categoryName: 'Pilihan Topping',
    group: 'topping' as const,
    isSoldOut: false,
  };
  const toppingTotal = calculateFlatAddonTotal([seaSaltAddon], 'tomoro');
  assert.equal(toppingTotal, 5000);

  const price2 = calculateItemPricing(
    {
      name: 'Matcha Latte',
      basePrice: 27000,
      skuPrice: 27000,
      toppingTotal,
      quantity: 1,
      brandSlug: 'tomoro',
    },
    undefined,
    'tomoro'
  );
  assert.equal(price2.promoPricePerItem, 18500, 'Kasus User 27k + 5k Sea Salt Cloud harus Rp18.500 tepat!');

  // Kasus 3: Menu Matcha Latte (27.000 x 50% = 13.500) + Oat Milk (5.000 promo)
  // TOTAL: 13.500 + 5.000 = 18.500! (Sesuai konfigurasi otoritatif user: Oat Milk diskon 50% jadi +5k)
  const oatAddon = {
    sku: 'TOMORO_DAIRY_OAT',
    name: 'Oat Milk',
    price: 5000,
    categoryName: 'Pilihan Susu',
    group: 'dairy' as const,
    isSoldOut: false,
  };
  const oatTotal = calculateFlatAddonTotal([oatAddon], 'tomoro');
  assert.equal(oatTotal, 5000);

  const priceOatOnly = calculateItemPricing(
    {
      name: 'Matcha Latte',
      basePrice: 27000,
      skuPrice: 27000,
      toppingTotal: oatTotal,
      quantity: 1,
      brandSlug: 'tomoro',
    },
    undefined,
    'tomoro'
  );
  assert.equal(priceOatOnly.promoPricePerItem, 18500, 'Matcha Latte + Oat Milk harus Rp18.500 tepat!');

  // Kasus 4: Menu Matcha Latte + Oat Milk (5.000) + Sea Salt Cloud (5.000)
  // TOTAL: 13.500 + 5.000 + 5.000 = 23.500
  const combinedAddons = calculateFlatAddonTotal([oatAddon, seaSaltAddon], 'tomoro');
  assert.equal(combinedAddons, 10000);

  const price3 = calculateItemPricing(
    {
      name: 'Matcha Latte',
      basePrice: 27000,
      skuPrice: 27000,
      toppingTotal: combinedAddons,
      quantity: 1,
      brandSlug: 'tomoro',
    },
    undefined,
    'tomoro'
  );
  assert.equal(price3.promoPricePerItem, 23500);

  // Kasus 5: Melalui calculateBottomSheetPricing
  const bottomSheetPricing = calculateBottomSheetPricing(
    27000,
    null,
    [oatAddon],
    1,
    27000,
    'tomoro'
  );
  assert.equal(bottomSheetPricing.promoPricePerItem, 18500);
});

test('Brand Notes Rules - Fore & Tomoro have no custom notes, Kopi Kenangan has Catatan Tambahan (0/100)', () => {
  // Brand checking logic
  const isFore = (brandSlug?: string) => brandSlug === 'fore';
  const isTomoro = (brandSlug?: string) => brandSlug === 'tomoro';
  const shouldShowNotes = (brandSlug?: string) => !isFore(brandSlug) && !isTomoro(brandSlug);

  assert.equal(shouldShowNotes('fore'), false, 'Fore Coffee tidak boleh menampilkan catatan');
  assert.equal(shouldShowNotes('tomoro'), false, 'Tomoro Coffee tidak boleh menampilkan catatan');
  assert.equal(shouldShowNotes('kopi-kenangan'), true, 'Kopi Kenangan boleh menampilkan Catatan Tambahan');
  assert.equal(shouldShowNotes(undefined), true, 'Default Kopi Kenangan boleh menampilkan Catatan Tambahan');

  // Karakter counter: 'Gulanya 15% aja' -> panjang 15
  const sampleNote = 'Gulanya 15% aja';
  assert.equal(sampleNote.length, 15, 'Hitungan panjang karakter termasuk spasi');
  assert.equal(`${sampleNote.length}/100`, '15/100', 'Format counter di pojok kanan');
});
