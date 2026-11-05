import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderPricing,
  calculateItemPricing,
  calculateFlatVariantAddition,
  calculateFlatAddonTotal,
} from '../src/lib/pricing.ts';

describe('Pricing Engine (Pure Calculation)', () => {
  it('calculates single item pricing correctly (Latte with variants)', () => {
    // Latte: harga dasar Rp34.000, Large +Rp5.000, Juwara +Rp3.000
    const item = {
      name: 'Creamy Caramel Latte',
      basePrice: 34000,
      variantAddition: 8000, // Large 5000 + Juwara 3000
      toppingTotal: 0,
      quantity: 1,
    };

    const result = calculateItemPricing(item);
    // harga asli = 34000 + 8000 = 42000
    assert.strictEqual(result.originalPricePerItem, 42000);
    // harga promo = (34000 * 0.5) + 8000 = 17000 + 8000 = 25000
    assert.strictEqual(result.promoPricePerItem, 25000);
    assert.strictEqual(result.savingsPerItem, 17000);
  });

  it('calculates single item pricing for cookie without variants', () => {
    // Cookie: harga dasar Rp19.000
    const item = {
      name: 'Oatmeal Raisin Soft Baked Cookie',
      basePrice: 19000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
    };

    const result = calculateItemPricing(item);
    assert.strictEqual(result.originalPricePerItem, 19000);
    assert.strictEqual(result.promoPricePerItem, 9500);
    assert.strictEqual(result.savingsPerItem, 9500);
  });

  it('matches the exact brief scenario with subtotal, fee, total, and savings', () => {
    const items = [
      {
        name: 'Creamy Caramel Latte',
        basePrice: 34000,
        variantAddition: 8000, // Large (+Rp5.000), Juwara Beans (+Rp3.000)
        toppingTotal: 0,
        quantity: 1,
      },
      {
        name: 'Oatmeal Raisin Soft Baked Cookie',
        basePrice: 19000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 1,
      },
    ];

    const orderPricing = calculateOrderPricing(items);
    assert.strictEqual(orderPricing.totalQuantity, 2);
    assert.strictEqual(orderPricing.subtotal, 34500);
    assert.strictEqual(orderPricing.fee, 4600);
    assert.strictEqual(orderPricing.total, 39100);
    assert.strictEqual(orderPricing.totalSavings, 26500);
  });

  it('applies Rp4.000 fee when order has exactly 1 item (single quantity)', () => {
    const items = [
      {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 1,
      },
    ];

    const orderPricing = calculateOrderPricing(items);
    assert.strictEqual(orderPricing.totalQuantity, 1);
    assert.strictEqual(orderPricing.fee, 4000);
    assert.strictEqual(orderPricing.subtotal, 9000);
    assert.strictEqual(orderPricing.total, 13000);
  });

  it('applies Rp2.300 x 2 = Rp4.600 fee when quantity is 2 of the same menu item', () => {
    const items = [
      {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 2,
      },
    ];

    const orderPricing = calculateOrderPricing(items);
    assert.strictEqual(orderPricing.totalQuantity, 2);
    assert.strictEqual(orderPricing.fee, 4600);
    assert.strictEqual(orderPricing.subtotal, 18000);
    assert.strictEqual(orderPricing.total, 22600);
  });

  it('applies Rp2.300 x 5 = Rp11.500 fee when order has 5 items', () => {
    const items = [
      {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 3,
      },
      {
        name: 'Americano',
        basePrice: 15000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 2,
      },
    ];

    const orderPricing = calculateOrderPricing(items);
    assert.strictEqual(orderPricing.totalQuantity, 5);
    assert.strictEqual(orderPricing.fee, 11500);
  });

  it('calculates toppings correctly with zero discount on toppings', () => {
    const item = {
      name: 'Avocado Coffee',
      basePrice: 28000,
      variantAddition: 0,
      toppingTotal: 6000, // e.g. Boba +Rp6.000
      quantity: 1,
    };

    const result = calculateItemPricing(item);
    // Asli: 28000 + 6000 = 34000
    assert.strictEqual(result.originalPricePerItem, 34000);
    // Promo: (28000 / 2) + 6000 = 14000 + 6000 = 20000
    assert.strictEqual(result.promoPricePerItem, 20000);
    assert.strictEqual(result.savingsPerItem, 14000);
  });

  it('calculates flat additions for Large, Juwara, Oatside, and combinations', () => {
    // Large: 5000
    assert.strictEqual(calculateFlatVariantAddition(['Large']), 5000);
    // Juwara Beans: 3000
    assert.strictEqual(calculateFlatVariantAddition(['Juwara Beans']), 3000);
    // Oatside: 3000
    assert.strictEqual(calculateFlatVariantAddition(['Oatside']), 3000);
    // Regular, Kenangan Blend, Milk, Less Sugar, Less Ice: 0
    assert.strictEqual(
      calculateFlatVariantAddition(['Regular', 'Kenangan Blend', 'Milk', 'Less Sugar', 'Less Ice']),
      0
    );
    // Combination: Large + Juwara Beans = 8000
    assert.strictEqual(calculateFlatVariantAddition(['Large', 'Juwara Beans']), 8000);
    // Combination: Large + Juwara Beans + Oatside = 11000
    assert.strictEqual(calculateFlatVariantAddition(['Large', 'Juwara Beans', 'Oatside']), 11000);
  });

  it('calculates flat addon totals for Whipped Cream, Syrup, and Topping', () => {
    // Whipped Cream is gratis (0)
    const whip = [{ name: 'Whipped Cream Chocolate', categoryName: 'Whipped Cream' }];
    assert.strictEqual(calculateFlatAddonTotal(whip), 0);

    // Syrup: +6.000 per pilihan
    const syrups = [
      { name: 'Vanilla Syrup', categoryName: 'Syrup' },
      { name: 'Butterscotch Sauce', categoryName: 'Syrup' },
    ];
    assert.strictEqual(calculateFlatAddonTotal(syrups), 12000);

    // Topping: +6.000 per pilihan
    const toppings = [
      { name: 'Oreo', categoryName: 'Topping' },
      { name: 'Grass Jelly', categoryName: 'Topping' },
      { name: 'Espresso Shot Juwara Beans', categoryName: 'Topping' },
    ];
    assert.strictEqual(calculateFlatAddonTotal(toppings), 18000);

    // Combination of Whipped Cream (0) + 1 Syrup (6k) + 1 Topping (6k) = 12.000
    const combo = [
      { name: 'Whipped Cream Vanilla', categoryName: 'Whipped Cream' },
      { name: 'Choco Sauce', categoryName: 'Syrup' },
      { name: 'Oreo', categoryName: 'Topping' },
    ];
    assert.strictEqual(calculateFlatAddonTotal(combo), 12000);
  });

  describe('Revisi 5C Required Test Cases for Strikethrough & Savings', () => {
    it('Case 1: basePrice Rp20.000, SKU Large Rp30.000 -> asli Rp30.000, promo Rp15.000, hemat Rp15.000', () => {
      const item = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 20000,
        skuPrice: 30000,
        variantAddition: 5000, // Large flat +5k
        toppingTotal: 0,
        quantity: 1,
      };

      const result = calculateItemPricing(item);
      assert.strictEqual(result.originalPricePerItem, 30000);
      assert.strictEqual(result.promoPricePerItem, 15000);
      assert.strictEqual(result.savingsPerItem, 15000);
    });

    it('Case 2: basePrice Rp20.000, SKU Large Rp28.000 -> asli Rp28.000, promo Rp15.000, hemat Rp13.000', () => {
      const item = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 20000,
        skuPrice: 28000,
        variantAddition: 5000, // Large flat +5k
        toppingTotal: 0,
        quantity: 1,
      };

      const result = calculateItemPricing(item);
      assert.strictEqual(result.originalPricePerItem, 28000);
      assert.strictEqual(result.promoPricePerItem, 15000);
      assert.strictEqual(result.savingsPerItem, 13000);
    });

    it('Case 3: Regular Rp20.000 -> asli Rp20.000, promo Rp10.000, hemat Rp10.000', () => {
      const item = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 20000,
        skuPrice: 20000,
        variantAddition: 0, // Regular flat 0
        toppingTotal: 0,
        quantity: 1,
      };

      const result = calculateItemPricing(item);
      assert.strictEqual(result.originalPricePerItem, 20000);
      assert.strictEqual(result.promoPricePerItem, 10000);
      assert.strictEqual(result.savingsPerItem, 10000);
    });

    it('Fallback SKU: missing skuPrice falls back to basePrice + variantAddition + toppingTotal and logs warning', () => {
      const item = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 20000,
        // skuPrice not provided
        variantAddition: 5000, // Large flat +5k
        toppingTotal: 6000, // 1 Syrup/Topping +6k
        quantity: 1,
      };

      const result = calculateItemPricing(item);
      // Fallback: 20000 + 5000 + 6000 = 31000
      assert.strictEqual(result.originalPricePerItem, 31000);
      // Promo: 10000 + 5000 + 6000 = 21000
      assert.strictEqual(result.promoPricePerItem, 21000);
      // Hemat: 31000 - 21000 = 10000
      assert.strictEqual(result.savingsPerItem, 10000);
    });
  });
});
