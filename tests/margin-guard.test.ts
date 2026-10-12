import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkAndLogMarginSafety } from '../src/lib/margin-guard.ts';

describe('Margin Guard Real-time Monitor', () => {
  it('does not trigger warning when deltas are within safe thresholds', () => {
    let warningLogged = false;
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      checkAndLogMarginSafety({
        productName: 'Kopi Kenangan Mantan',
        outletCode: 'KK.SBY.MERRNGKTDT',
        basePrice: 20000,
        skus: [
          { name: 'Regular Ice', price: 20000, variantAddition: 0 },
          { name: 'Large Ice', price: 25000, variantAddition: 5000 }, // delta 5000 <= 10000
          { name: 'Regular Juwara Beans', price: 23000, variantAddition: 3000 }, // delta 3000 <= 3000
        ],
      });
      assert.equal(warningLogged, false);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('triggers warning when Large delta exceeds Rp10.000', () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnings.push(args.join(' '));
    };

    try {
      checkAndLogMarginSafety({
        productName: 'Special Rare Coffee',
        outletCode: 'TEST.OUTLET.001',
        basePrice: 20000,
        skus: [
          { name: 'Special Rare Coffee Large', price: 32000, variantAddition: 12000 }, // delta 12000 > 10000!
        ],
      });
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /melebihi batas impas Rp10\.000/);
    } finally {
      console.warn = originalWarn;
    }
  });
});
