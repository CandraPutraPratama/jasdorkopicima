import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  normalizeStore,
  normalizeStores,
  normalizeMenu,
  normalizeProductOptions,
} from '../src/lib/adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../docs/api-samples');

describe('Response Normalization Adapter', () => {
  it('normalizes single store correctly without leaking internal fields', async () => {
    const rawData = JSON.parse(
      await fs.readFile(path.join(SAMPLES_DIR, 'get_store.sample.json'), 'utf-8')
    );

    const store = normalizeStore(rawData.data);
    assert.strictEqual(store.code, 'CIMB');
    assert.strictEqual(store.name, 'Graha CIMB Niaga');
    assert.strictEqual(store.isOpen, true);
    assert.strictEqual(store.openTime, '07:00:00');
    assert.strictEqual(store.closeTime, '15:00:00');
    // Ensure raw fields like time_zone_second are not in Outlet domain interface
    assert.strictEqual((store as any).time_zone_second, undefined);
  });

  it('normalizes store list correctly', async () => {
    const rawData = JSON.parse(
      await fs.readFile(path.join(SAMPLES_DIR, 'query_store.sample.json'), 'utf-8')
    );

    const stores = normalizeStores(rawData.data.store);
    assert.ok(stores.length > 0);
    assert.ok(stores.some((s) => s.code === 'CIMB'));
  });

  it('normalizes menu and hides all combo items (is_combo_v2)', async () => {
    const rawData = JSON.parse(
      await fs.readFile(path.join(SAMPLES_DIR, 'query_web_order_product_menu.sample.json'), 'utf-8')
    );

    const menu = normalizeMenu(rawData.data);
    assert.ok(menu.length > 0);

    // Verify no product in any group has isCombo === true or is_combo_v2 === true
    for (const group of menu) {
      for (const product of group.products) {
        assert.strictEqual(product.isCombo, false);
      }
    }

    // Verify Coffee group exists and contains products
    const coffeeGroup = menu.find((g) => g.name === 'Coffee');
    assert.ok(coffeeGroup);
    assert.ok(coffeeGroup.products.length > 0);
  });

  it('normalizes product options and computes correct variant additions', async () => {
    const rawData = JSON.parse(
      await fs.readFile(path.join(SAMPLES_DIR, 'get_web_order_product_options.sample.json'), 'utf-8')
    );

    const details = normalizeProductOptions(rawData.data);
    assert.strictEqual(details.product.name, 'Taro Cloud Latte');
    assert.strictEqual(details.product.basePrice, 22000);

    // Verify dimensions exist (Size, Beans, Temperature, Milk, Sugar)
    assert.ok(details.dimensions.length >= 4);

    // Verify SKUs have calculated variantAddition = price - basePrice
    const largeSku = details.skus.find((s) => s.description.includes('Large') && s.description.includes('Kenangan Blend'));
    assert.ok(largeSku);
    assert.strictEqual(largeSku.price, 29000);
    assert.strictEqual(largeSku.variantAddition, 7000); // 29000 - 22000 = 7000

    const regularBaseSku = details.skus.find((s) => s.description.includes('Regular') && s.description.includes('Kenangan Blend') && s.description.includes('Milk'));
    assert.ok(regularBaseSku);
    assert.strictEqual(regularBaseSku.price, 22000);
    assert.strictEqual(regularBaseSku.variantAddition, 0); // 22000 - 22000 = 0

    // Verify addons exist with addon_price
    assert.ok(details.addons.length > 0);
    const topping = details.addons.find((a) => a.name.includes('Juwara Beans') || a.name.includes('Boba'));
    assert.ok(topping);
    assert.strictEqual(topping.price, 6000);
  });
});
