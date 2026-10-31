import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderPricing } from '../src/lib/pricing.ts';

/**
 * Kunci keputusan pemilik (2026-10-31):
 * - Diskon 25% berlaku untuk SEMUA menu Fore termasuk seri Deli/1L
 * - Diskon memotong (harga dasar + SEMUA add-on) x qty
 * - Tanpa pembulatan khusus
 * - Fee jasa Rp0
 */
describe('Fore Coffee Pricing (keputusan pemilik 2026-10-31)', () => {
  it('diskon 25% untuk (harga dasar + add-on), fee Rp0', () => {
    // Contoh pemilik: Large +Rp7.000 di Rp31.000 -> Rp38.000 -> 25% off = Rp28.500
    const res = calculateOrderPricing(
      [
        {
          name: 'Aren Latte',
          basePrice: 31000,
          variantAddition: 7000,
          toppingTotal: 0,
          quantity: 1,
          brandSlug: 'fore',
        },
      ],
      undefined,
      'fore'
    );
    assert.equal(res.items[0].originalPricePerItem, 38000);
    assert.equal(res.items[0].promoPricePerItem, 28500);
    assert.equal(res.fee, 0);
    assert.equal(res.total, 28500);
    assert.equal(res.totalSavings, 9500);
  });

  it('add-on ikut didiskon 25% (berbeda dengan Kopi Kenangan)', () => {
    const res = calculateOrderPricing(
      [
        {
          name: 'Americano',
          basePrice: 19000,
          variantAddition: 0,
          toppingTotal: 6000,
          quantity: 2,
          brandSlug: 'fore',
        },
      ],
      undefined,
      'fore'
    );
    // (19000 + 6000) x 0.75 = 18750 per item
    assert.equal(res.items[0].originalPricePerItem, 25000);
    assert.equal(res.items[0].promoPricePerItem, 18750);
    assert.equal(res.subtotal, 37500);
    assert.equal(res.fee, 0);
    assert.equal(res.total, 37500);
  });

  it('terdeteksi sebagai Fore via outletCode awalan fore-', () => {
    const res = calculateOrderPricing(
      [
        {
          name: 'Americano',
          basePrice: 19000,
          quantity: 1,
        },
      ],
      undefined,
      'fore-senayan'
    );
    assert.equal(res.items[0].promoPricePerItem, 14250); // 19000 x 0.75
    assert.equal(res.fee, 0);
    assert.equal(res.total, 14250);
  });

  it('multi-item: fee tetap Rp0', () => {
    const res = calculateOrderPricing(
      [
        { name: 'Americano', basePrice: 19000, quantity: 1, brandSlug: 'fore' },
        { name: 'Aren Latte', basePrice: 26000, quantity: 1, brandSlug: 'fore' },
      ],
      undefined,
      'fore'
    );
    assert.equal(res.fee, 0);
    assert.equal(res.total, Math.round(19000 * 0.75) + Math.round(26000 * 0.75));
  });
});
