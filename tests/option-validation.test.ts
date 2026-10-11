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

test('calculateBottomSheetPricing accurately calculates original, promo, and toppings', () => {
  const basePrice = 20000;
  const matchedSku: VariantSku = {
    sku: 'SKU-1',
    combinationKey: '',
    name: 'Test',
    description: '',
    price: 26000,
    variantAddition: 6000,
  };
  const selectedAddons: Addon[] = [
    { sku: 'ADD-1', name: 'Grass Jelly', price: 4000, categoryName: 'Topping' },
    { sku: 'ADD-2', name: 'Boba', price: 3000, categoryName: 'Topping' },
  ];

  // Base = 20000 (promo 50% = 10000)
  // Variant addition = 6000 (full price)
  // Toppings = 4000 + 3000 = 7000 (full price)
  // Original price per item = 20000 + 6000 + 7000 = 33000
  // Promo price per item = 10000 + 6000 + 7000 = 23000
  const result = calculateBottomSheetPricing(basePrice, matchedSku, selectedAddons, 2);

  assert.equal(result.originalPricePerItem, 33000);
  assert.equal(result.promoPricePerItem, 23000);
  assert.equal(result.subtotal, 46000);
  assert.equal(result.originalTotal, 66000);
});
