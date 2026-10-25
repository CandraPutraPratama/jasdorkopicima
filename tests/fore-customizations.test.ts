import test from 'node:test';
import assert from 'node:assert/strict';
import { getForeProductOptions } from '../src/lib/fore-menu-data.ts';
import { calculateBottomSheetPricing } from '../src/lib/option-validation.ts';
import type { Addon } from '../src/types/domain.ts';

test('getForeProductOptions returns complete custom options for Americano (Ice & Hot)', () => {
  const options = getForeProductOptions('FORE_AMERICANO');
  assert.ok(options, 'Options for Americano must exist');

  // Americano has both Ice and Hot
  assert.equal(options.dimensions.length, 2, 'Americano should have 2 dimensions: Suhu and Ukuran Cup');
  assert.equal(options.dimensions[0].name, 'Suhu');
  assert.equal(options.dimensions[0].values.length, 2);
  assert.equal(options.dimensions[0].values[0].name, 'Ice');
  assert.equal(options.dimensions[0].values[1].name, 'Hot');

  assert.equal(options.dimensions[1].name, 'Ukuran Cup');
  assert.equal(options.dimensions[1].values.length, 2);
  assert.equal(options.dimensions[1].values[0].name, 'Regular');
  assert.equal(options.dimensions[1].values[1].name, 'Large (+Rp7.000)');

  // Americano has 4 SKUs in optionMap
  assert.ok(options.optionMap['1-1:2-1:'], 'Ice Regular SKU must exist');
  assert.ok(options.optionMap['1-1:2-2:'], 'Ice Large SKU must exist');
  assert.ok(options.optionMap['1-2:2-1:'], 'Hot Regular SKU must exist');
  assert.ok(options.optionMap['1-2:2-2:'], 'Hot Large SKU must exist');

  assert.equal(options.optionMap['1-1:2-2:'].price, 23000 + 7000);
  assert.equal(options.optionMap['1-1:2-2:'].variantAddition, 7000);

  // Notes check
  const iceNotes = options.notes.find((n) => n.name === 'Jumlah Es Batu');
  assert.ok(iceNotes, 'Americano must have Jumlah Es Batu notes');
  assert.ok(iceNotes.options.includes('Normal Ice'));
  assert.ok(iceNotes.options.includes('Ice Separately (Konfirmasi Admin)'));

  const heatNotes = options.notes.find((n) => n.name === 'Tingkat Kepanasan');
  assert.ok(heatNotes, 'Americano must have Tingkat Kepanasan notes');

  // Americano has no sweetness customization in config
  const sweetNotes = options.notes.find((n) => n.name === 'Tingkat Kemanisan');
  assert.equal(sweetNotes, undefined, 'Americano should not have sweetness options');

  // Addons check: Dairy, Espresso, Syrup, Topping
  const dairies = options.addons.filter((a) => a.group === 'dairy');
  assert.ok(dairies.length > 0, 'Americano should have dairy options');
  const oatMilk = dairies.find((d) => d.name === 'Oat Milk');
  assert.ok(oatMilk, 'Oat Milk should be in dairy options');
  assert.equal(oatMilk.price, 15000);

  const espressos = options.addons.filter((a) => a.group === 'espresso');
  assert.ok(espressos.length > 0, 'Americano should have espresso options');
  const extra3Shot = espressos.find((e) => e.name === '+3 Shot');
  assert.ok(extra3Shot, '+3 Shot should be in espresso options');
  assert.equal(extra3Shot.price, 21000);

  const syrups = options.addons.filter((a) => a.group === 'syrup');
  assert.ok(syrups.length > 0, 'Americano should have syrup options');
  assert.equal(syrups[0].price, 7000);

  const toppings = options.addons.filter((a) => a.group === 'topping');
  assert.ok(toppings.length > 0, 'Americano should have topping options');
  assert.equal(toppings[0].price, 7000);
});

test('getForeProductOptions returns Ice-only options for Buttercream Latte', () => {
  const options = getForeProductOptions('FORE_BUTTERCREAM_LATTE');
  assert.ok(options, 'Options for Buttercream Latte must exist');

  // Buttercream Latte is Ice only
  assert.equal(options.dimensions.length, 1, 'Ice-only drink should only have 1 dimension: Ukuran Cup');
  assert.equal(options.dimensions[0].name, 'Ukuran Cup');
  assert.equal(options.dimensions[0].values.length, 2);

  // SKUs in optionMap
  assert.ok(options.optionMap['1-1:'], 'Regular SKU must exist');
  assert.ok(options.optionMap['1-2:'], 'Large SKU must exist');

  // Notes check: has Ice, has Sweetness, NO Heat notes
  assert.ok(options.notes.some((n) => n.name === 'Jumlah Es Batu'));
  assert.ok(options.notes.some((n) => n.name === 'Tingkat Kemanisan'));
  assert.equal(options.notes.some((n) => n.name === 'Tingkat Kepanasan'), false);
});

test('getForeProductOptions returns empty dimensions for Fore Deli (no customization)', () => {
  const options = getForeProductOptions('FORE_BEEF_MENTAI_SANDWICH');
  assert.ok(options, 'Options for Beef Mentai Sandwich must exist');

  assert.equal(options.dimensions.length, 0, 'Fore Deli should have 0 dimensions');
  assert.equal(options.addons.length, 0, 'Fore Deli should have 0 addons');
  assert.equal(options.notes.length, 0, 'Fore Deli should have 0 notes');
  assert.equal(options.skus.length, 1);
});

test('getForeProductOptions handles FOREveryone 1L bottles with sweetness & espresso but no cups', () => {
  const options = getForeProductOptions('FORE_AREN_LATTE_1L');
  assert.ok(options, 'Options for Aren Latte 1L must exist');

  assert.equal(options.dimensions.length, 0, '1L bottle should have 0 cup dimensions');
  assert.equal(options.notes.length, 1, '1L bottle should have Tingkat Kemanisan');
  assert.equal(options.notes[0].name, 'Tingkat Kemanisan');

  const espressos = options.addons.filter((a) => a.group === 'espresso');
  assert.ok(espressos.length > 0, '1L bottle should have espresso options');
});

test('calculateBottomSheetPricing correctly prices Fore Large + Oat Milk with 25% discount', () => {
  const basePrice = 23000; // Americano
  const selectedOptions = ['Ice', 'Large (+Rp7.000)'];
  const selectedAddons: Addon[] = [
    { sku: 'FORE_DAIRY_OAT', name: 'Oat Milk', price: 15000, categoryName: 'Dairy', group: 'dairy' },
    { sku: 'FORE_ESPRESSO_1_SHOT', name: '+1 Shot', price: 7000, categoryName: 'Espresso', group: 'espresso' },
  ];

  const skuPrice = 30000; // basePrice + 7000

  const pricing = calculateBottomSheetPricing(
    basePrice,
    selectedOptions,
    selectedAddons,
    1,
    skuPrice,
    'fore'
  );

  // Original: skuPrice (30.000) + Oat Milk (15.000) + 1 Shot (7.000) = 52.000
  assert.equal(pricing.originalPricePerItem, 52000);

  // Promo: 52.000 * 0.75 (diskon 25% dari total keseluruhan) = 39.000
  assert.equal(pricing.promoPricePerItem, 39000);
  assert.equal(pricing.toppingTotal, 22000);
  assert.equal(pricing.variantAddition, 7000);
});
