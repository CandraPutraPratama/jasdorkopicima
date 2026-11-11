import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KOPI_KENANGAN_FALLBACK_MENU,
  getKopiKenanganFallbackMenu,
  getSynthesizedKopiKenanganDrinkOptions,
} from '../src/lib/kk-menu-fallback.ts';

test('Kopi Kenangan Fallback Menu - Struktur dan Integritas', async (t) => {
  await t.test('menu fallback kanonikal memuat minimal 5 kategori dan lebih dari 50 produk', () => {
    const menu = getKopiKenanganFallbackMenu();
    assert.ok(menu.length >= 5, `Expected >= 5 categories, got ${menu.length}`);

    const totalProducts = menu.reduce((acc, cat) => acc + (cat.products?.length || 0), 0);
    assert.ok(totalProducts >= 50, `Expected >= 50 products, got ${totalProducts}`);
  });

  await t.test('menu fallback memuat Butterscotch Sea Salt Latte dengan bundleCode 6960127', () => {
    const menu = getKopiKenanganFallbackMenu();
    let found = false;
    for (const group of menu) {
      for (const prod of group.products || []) {
        if (prod.bundleCode === '6960127') {
          found = true;
          assert.strictEqual(prod.name, 'Butterscotch Sea Salt Latte');
          assert.ok(prod.basePrice > 0);
          break;
        }
      }
      if (found) break;
    }
    assert.ok(found, 'Butterscotch Sea Salt Latte (6960127) wajib ada di menu fallback');
  });

  await t.test('tidak ada karakter em dash (U+2014) di seluruh menu fallback Kopi Kenangan', () => {
    const rawJson = JSON.stringify(KOPI_KENANGAN_FALLBACK_MENU);
    assert.ok(!rawJson.includes('\u2014'), 'Menu fallback tidak boleh memuat karakter em dash (—)');
  });

  await t.test('getSynthesizedKopiKenanganDrinkOptions menghasilkan opsi minuman lengkap', () => {
    const sampleProduct = {
      id: 9999,
      bundleCode: '9999999',
      productCode: '9999999000',
      name: 'Kopi Kenangan Mantan',
      basePrice: 19000,
      originalPrice: 19000,
      isSoldOut: false,
      isCombo: false,
      category: 'Kopi',
    };

    const options = getSynthesizedKopiKenanganDrinkOptions(sampleProduct);
    assert.ok(options, 'Opsi minuman harus terdefinisi');
    assert.strictEqual(options.product.name, 'Kopi Kenangan Mantan');
    assert.ok(options.dimensions.length >= 4, 'Minuman harus memiliki minimal 4 dimensi (Temp, Size, Sugar, Ice)');
    assert.ok(options.skus.length >= 2, 'Minuman harus memiliki minimal 2 SKU (Regular & Large)');
    assert.ok(options.addons.length >= 1, 'Minuman harus memiliki topping addon');
  });
});
