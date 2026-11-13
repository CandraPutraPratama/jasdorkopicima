import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { recalculateOrderItemsWithServerPrices } from '../src/lib/order-service.ts';
import { cacheService } from '../src/lib/cache.ts';
import { BUSINESS_CONFIG } from '../src/config/business.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { Product } from '../src/types/domain.ts';

const BUNDLES = ['111', '222', '333'];

function productInfoBody() {
  return JSON.stringify({
    error_code: 0,
    msg: 'OK',
    data: {
      menu_groups: [{ group_code: 'G1', group_name: 'Coffee', bundle_codes: BUNDLES }],
      menu_items: BUNDLES.map((b) => ({
        product: {
          base_product: { id: Number(b), bundle_code: b, name: `Produk ${b}`, price_dec: '20000', orig_price_dec: '20000', default_sku: `${b}000` },
          is_sold_out: false,
          default_selection_path: '1-1:',
          option_product_map: {
            '1-1:': { product_code: `${b}000`, name: `Produk ${b} Regular`, display_description: 'Regular', price_dec: '20000' },
          },
        },
        combo: null,
      })),
    },
  });
}

describe('Opsi produk: keranjang multi-item di outlet dingin hanya 1 request ke KK', () => {
  const originalFetch = globalThis.fetch;
  const originalDelay = BUSINESS_CONFIG.client.politeDelayMs;

  beforeEach(async () => {
    await cacheService.clear();
    BUSINESS_CONFIG.client.politeDelayMs = 0;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    BUSINESS_CONFIG.client.politeDelayMs = originalDelay;
  });

  it('3 produk berbeda, cache opsi kosong -> 1 fetch product_info', async () => {
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      await new Promise((r) => setTimeout(r, 15));
      return new Response(productInfoBody());
    };

    const allProducts: Product[] = BUNDLES.map((b) => ({
      id: Number(b), bundleCode: b, productCode: `${b}000`, name: `Produk ${b}`, description: '', image: '',
      basePrice: 20000, originalPrice: 20000, isSoldOut: false, isCombo: false,
    }));
    const items: CartItem[] = BUNDLES.map((b) => ({
      id: `i-${b}`, bundleCode: b, name: `Produk ${b}`, basePrice: 20000, skuPrice: 20000, sku: `${b}000`,
      variantAddition: 0, toppingTotal: 0, quantity: 1, addons: [],
    })) as CartItem[];

    const result = await recalculateOrderItemsWithServerPrices({
      outletCode: 'LIPPO-PURI', storeId: 1, items, allProducts, tierDiff: 0,
    });

    assert.equal(result.unavailableItems.length, 0);
    assert.equal(fetchCount, 1, `diharapkan 1 fetch, terjadi ${fetchCount}`);
  });
});
