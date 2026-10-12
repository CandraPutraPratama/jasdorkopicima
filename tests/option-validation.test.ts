import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findMatchingSku,
  isDimensionValueAvailable,
  calculateBottomSheetPricing,
} from '../src/lib/option-validation.ts';
import type { VariantSku, Addon } from '../src/types/domain.ts';

const mockOptionMap: Record<string, VariantSku> = {
  '2898-4064:2899-4066:2900-4069:': {
    sku: 'SKU-ICE-REG',
    combinationKey: '2898-4064:2899-4066:2900-4069:',
    name: 'Ice Regular Blend',
    description: '',
    price: 22000,
    variantAddition: 0,
  },
  '2898-4064:2899-4067:2900-4069:': {
    sku: 'SKU-ICE-LRG',
    combinationKey: '2898-4064:2899-4067:2900-4069:',
    name: 'Ice Large Blend',
    price: 28000,
    description: '',
    variantAddition: 6000,
  },
  '2898-4065:2899-4066:2900-4069:': {
    sku: 'SKU-HOT-REG',
    combinationKey: '2898-4065:2899-4066:2900-4069:',
    name: 'Hot Regular Blend',
    price: 22000,
    description: '',
    variantAddition: 0,
  },
  // Notice: Hot Large is NOT in the map!
};

test('findMatchingSku matches exact combination when all dimensions selected', () => {
  const selected = {
    2898: 4064, // Ice
    2899: 4067, // Large
    2900: 4069, // Blend
  };
  const sku = findMatchingSku(mockOptionMap, selected);
  assert.ok(sku);
  assert.equal(sku?.sku, 'SKU-ICE-LRG');
  assert.equal(sku?.variantAddition, 6000);
});

test('findMatchingSku returns null if combination does not exist', () => {
  const selected = {
    2898: 4065, // Hot
    2899: 4067, // Large (impossible combination!)
    2900: 4069,
  };
  const sku = findMatchingSku(mockOptionMap, selected);
  assert.equal(sku, null);
});

test('isDimensionValueAvailable correctly disables impossible options', () => {
  // If Hot (4065) is selected, Large (4067) should NOT be available
  const currentSelections = {
    2898: 4065, // Hot
    2900: 4069,
  };

  const isRegularAvailable = isDimensionValueAvailable(mockOptionMap, currentSelections, 2899, 4066);
  const isLargeAvailable = isDimensionValueAvailable(mockOptionMap, currentSelections, 2899, 4067);

  assert.equal(isRegularAvailable, true);
  assert.equal(isLargeAvailable, false);
});

test('calculateBottomSheetPricing accurately calculates original, promo, and flat toppings/syrup/whip', () => {
  const basePrice = 34000;
  const selectedOptions = ['Large', 'Juwara Beans']; // 5000 + 3000 = 8000
  const selectedAddons: Addon[] = [
    { sku: 'ADD-1', name: 'Grass Jelly', price: 6000, categoryName: 'Topping' }, // +6000
    { sku: 'ADD-2', name: 'Vanilla Syrup', price: 6000, categoryName: 'Syrup' }, // +6000
    { sku: 'ADD-3', name: 'Whipped Cream Chocolate', price: 0, categoryName: 'Whipped Cream' }, // +0
  ];

  // Base = 34000 (promo 50% = 17000)
  // Variant addition = 5000 + 3000 = 8000 (full price)
  // Addons = 6000 (Topping) + 6000 (Syrup) + 0 (Whip) = 12000 (full price)
  // Original price per item = 34000 + 8000 + 12000 = 54000
  // Promo price per item = 17000 + 8000 + 12000 = 37000
  const result = calculateBottomSheetPricing(basePrice, selectedOptions, selectedAddons, 2);

  assert.equal(result.variantAddition, 8000);
  assert.equal(result.toppingTotal, 12000);
  assert.equal(result.originalPricePerItem, 54000);
  assert.equal(result.promoPricePerItem, 37000);
  assert.equal(result.subtotal, 74000);
  assert.equal(result.originalTotal, 108000);
  assert.equal(result.savingsTotal, 34000); // 17000 * 2
});

test('calculateBottomSheetPricing with actual SKU price applies exact strikethrough and savings', () => {
  // Case 1: basePrice 20.000, Large SKU 30.000
  const r1 = calculateBottomSheetPricing(20000, ['Large'], [], 1, 30000);
  assert.equal(r1.originalPricePerItem, 30000);
  assert.equal(r1.promoPricePerItem, 15000);
  assert.equal(r1.savingsTotal, 15000);

  // Case 2: basePrice 20.000, Large SKU 28.000
  const r2 = calculateBottomSheetPricing(20000, ['Large'], [], 1, 28000);
  assert.equal(r2.originalPricePerItem, 28000);
  assert.equal(r2.promoPricePerItem, 15000);
  assert.equal(r2.savingsTotal, 13000);

  // Case 3: Regular 20.000, SKU 20.000
  const r3 = calculateBottomSheetPricing(20000, ['Regular'], [], 1, 20000);
  assert.equal(r3.originalPricePerItem, 20000);
  assert.equal(r3.promoPricePerItem, 10000);
  assert.equal(r3.savingsTotal, 10000);
});
