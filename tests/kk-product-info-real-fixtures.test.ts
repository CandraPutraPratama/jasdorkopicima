import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  mapProductInfoToMenu,
  mapProductInfoToOptions,
  type KkProductInfoData,
} from '../src/lib/kk-product-info.ts';
import { normalizeMenu, normalizeProductOptions } from '../src/lib/adapter.ts';
import type { MenuGroup, Product, ProductOptionDetails } from '../src/types/domain.ts';

/**
 * Fixture = potongan respons ASLI POST /product/product_info (13 Nov 2026), dipangkas ke
 * beberapa produk dan hanya field yang dibaca mapper. Nilai (harga, SKU, add-on, status habis)
 * tidak diubah. Kategori resmi: Baru!, Coffee, Non Coffee, Kenangan Frappe, Kenangan Toast, Food.
 */
const here = dirname(fileURLToPath(import.meta.url));
function load(store: string): KkProductInfoData {
  return JSON.parse(readFileSync(join(here, 'fixtures', `kk-product-info-${store}.json`), 'utf8')).data;
}

const ALLOWED_GROUPS = ['Baru!', 'Coffee', 'Non Coffee', 'Kenangan Frappe', 'Kenangan Toast', 'Food'];

function menuOf(store: string): MenuGroup[] {
  return normalizeMenu(mapProductInfoToMenu(load(store)));
}
function allProducts(menu: MenuGroup[]): Product[] {
  return menu.flatMap((g) => g.products);
}
function optionsOf(store: string, productName: string): ProductOptionDetails {
  const data = load(store);
  const item = data.menu_items.find((i) => i.product?.base_product?.name === productName);
  assert.ok(item?.product?.base_product?.bundle_code, `${productName} ada di fixture ${store}`);
  const raw = mapProductInfoToOptions(data, item.product.base_product.bundle_code as string);
  assert.ok(raw);
  return normalizeProductOptions(raw);
}
function skuPrice(opt: ProductOptionDetails, name: string): number {
  const sku = opt.skus.find((s) => s.name === name);
  assert.ok(sku, `SKU "${name}" ada`);
  return sku.price;
}

// Nilai di bawah diambil dari respons asli ketiga outlet.
const TIERS = [
  { store: 'LIPPO-PURI', mantan: 22000, americano: 18000, matcha: 24000, americanoLarge: 20000, matchaLarge: 31000, soldOut: 'Master Chef Peach Aren Latte' },
  { store: 'AEON.BSD', mantan: 22000, americano: 18000, matcha: 24000, americanoLarge: 20000, matchaLarge: 31000, soldOut: 'Master Chef Peach Aren Latte' },
  { store: 'TNG.SOETTA2', mantan: 32000, americano: 30000, matcha: 32000, americanoLarge: 36000, matchaLarge: 41000, soldOut: 'Sparks Americano' },
];

for (const t of TIERS) {
  describe(`product_info asli ${t.store}`, () => {
    const menu = menuOf(t.store);
    const products = allProducts(menu);
    const byName = (n: string) => products.find((p) => p.name === n);

    it('hanya kategori allowlist yang tampil (Promo, Merchandise, Freezy, Oatside Series, Boulangerie disaring)', () => {
      for (const g of menu) assert.ok(ALLOWED_GROUPS.includes(g.name), `kategori tak terduga: ${g.name}`);
      const names = new Set(menu.map((g) => g.name));
      assert.ok(names.has('Coffee') && names.has('Non Coffee') && names.has('Food'));
      for (const hidden of ['Promo', 'Merchandise', 'Freezy', 'Oatside Series', 'Kenangan Boulangerie']) {
        assert.ok(!names.has(hidden), `${hidden} tidak boleh tampil`);
      }
    });

    it('produk Seliter ada di respons mentah tetapi tersembunyi di menu', () => {
      const raw = load(t.store);
      const rawNames = raw.menu_items.map((i) => i.product?.base_product?.name || '');
      assert.ok(rawNames.some((n) => /seliter/i.test(n)));
      assert.ok(!products.some((p) => /seliter/i.test(p.name)));
    });

    it('produk non-menu (merchandise, combo) tidak tampil', () => {
      assert.ok(!products.some((p) => /tumbler/i.test(p.name)));
    });

    it('harga dasar outlet', () => {
      assert.equal(byName('Kopi Kenangan Mantan')?.basePrice, t.mantan);
      assert.equal(byName('Americano')?.basePrice, t.americano);
      assert.equal(byName('Matcha Latte')?.basePrice, t.matcha);
      const p = byName('Americano');
      assert.equal(p?.originalPrice, t.americano);
    });

    it('status habis dibawa dari is_sold_out', () => {
      assert.equal(byName(t.soldOut)?.isSoldOut, true);
      assert.equal(byName('Americano')?.isSoldOut, false);
    });

    it('harga asli Large diambil dari SKU KK (Americano & Matcha Latte)', () => {
      const am = optionsOf(t.store, 'Americano');
      assert.equal(skuPrice(am, 'Americano Cold Large Kenangan Blend Normal Sugar'), t.americanoLarge);
      assert.equal(skuPrice(am, 'Americano Cold Regular Kenangan Blend Normal Sugar'), t.americano);
      const mt = optionsOf(t.store, 'Matcha Latte');
      assert.equal(skuPrice(mt, 'Matcha Latte Cold Large Fresh Milk Normal Sugar'), t.matchaLarge);
    });

    it('Oatside dan Juwara Beans datang sebagai selisih SKU (+3.000 dan +2.000 dari harga SKU asli)', () => {
      const km = optionsOf(t.store, 'Kopi Kenangan Mantan');
      const regular = skuPrice(km, 'Kopi Kenangan Mantan Cold Regular Kenangan Blend Fresh Milk Normal Sugar');
      assert.equal(regular, t.mantan);
      assert.equal(skuPrice(km, 'Kopi Kenangan Mantan Cold Regular Kenangan Blend Oatside Milk Normal Sugar') - regular, 3000);
      assert.equal(skuPrice(km, 'Kopi Kenangan Mantan Cold Regular Juwara Beans Fresh Milk Normal Sugar') - regular, 2000);
    });

    it('add-on: Syrup dan Topping 6.000; Choco Sauce 3.000; terklasifikasi; harga numerik', () => {
      const am = optionsOf(t.store, 'Americano');
      const add = (n: string) => am.addons.find((a) => a.name === n);
      assert.equal(add('Vanilla Syrup')?.price, 6000);
      assert.equal(add('Vanilla Syrup')?.group, 'syrup');
      assert.equal(add('Gula Aren')?.price, 6000);
      assert.equal(add('Gula Aren')?.group, 'topping');
      assert.equal(add('Choco Sauce')?.price, 3000);
      for (const a of am.addons) assert.equal(typeof a.price, 'number');
    });

    it('dimensi varian mencakup Suhu dan Ukuran dengan default yang diparse dari selection path', () => {
      const am = optionsOf(t.store, 'Americano');
      const dimNames = am.dimensions.map((d) => d.name);
      assert.ok(dimNames.includes('Suhu') && dimNames.includes('Ukuran'));
      assert.ok(Object.keys(am.defaultSelectionMap ?? {}).length >= 2);
    });
  });
}

describe('product_info asli: selisih terhadap perilaku sebelum migrasi', () => {
  for (const t of TIERS) {
    it(`${t.store}: kategori Food hanya satu dan tidak ada produk ganda`, () => {
      const menu = menuOf(t.store);
      assert.equal(menu.filter((g) => g.name === 'Food').length, 1);
      const codes = allProducts(menu).map((p) => p.bundleCode);
      assert.equal(new Set(codes).size, codes.length);
      const food = menu.find((g) => g.name === 'Food');
      assert.ok(food?.products.some((p) => p.name === 'Roti Srikaya'), 'produk Food asli tetap ada');
      assert.ok(food?.products.some((p) => p.name === 'Choco Chip Cookies'), 'cookie tetap ada sekali');
    });

    it(`${t.store}: SKU berukuran Jumbo tidak ada di opsi produk mana pun`, () => {
      const data = load(t.store);
      for (const item of data.menu_items) {
        const code = item.product?.base_product?.bundle_code;
        if (!code) continue;
        const raw = mapProductInfoToOptions(data, code as string);
        assert.ok(raw);
        const opt = normalizeProductOptions(raw);
        assert.ok(!opt.skus.some((s) => /jumbo/i.test(s.name)), `${opt.product.name} membawa SKU Jumbo`);
        assert.ok(!Object.values(opt.optionMap).some((s) => /jumbo/i.test(s.name)));
      }
    });
  }
});
