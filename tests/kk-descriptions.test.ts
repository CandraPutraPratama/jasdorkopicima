import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getKkMenuDescription, KK_MENU_DESCRIPTIONS } from '../src/lib/kk-menu-descriptions.ts';
import { normalizeProduct } from '../src/lib/adapter.ts';
import { filterProductsByQuery } from '../src/lib/menu-search.ts';
import type { KkProductItem } from '../src/types/kk-api.ts';
import type { Product } from '../src/types/domain.ts';

describe('Kopi Kenangan Official Menu Descriptions', () => {
  it('contains comprehensive official descriptions for Kopi Kenangan items', () => {
    assert.ok(Object.keys(KK_MENU_DESCRIPTIONS).length >= 100, 'Harus mencakup setidaknya 100 menu resmi KK');

    // Cek deskripsi Kopi Kenangan Mantan
    const kkmDesc = getKkMenuDescription('Kopi Kenangan Mantan');
    assert.strictEqual(kkmDesc, 'Kopi susu dengan gula aren asli Indonesia');

    // Cek deskripsi Bambang Choco Cheese Toast
    const toastDesc = getKkMenuDescription('Bambang Choco Cheese Toast');
    assert.strictEqual(
      toastDesc,
      'Roti toast tebal dengan isi krim coklat, keju slice & topping susu kental manis'
    );

    // Cek deskripsi Triple Cheese Bagel
    const bagelDesc = getKkMenuDescription('Triple Cheese Bagel');
    assert.strictEqual(
      bagelDesc,
      'Roti bagel bercita rasa keju dari keju parmesan dengan topping keju mozarella dan lelehan keju cheddar'
    );
  });

  it('handles case-insensitive and trimmed product names', () => {
    assert.strictEqual(
      getKkMenuDescription('  kopi kenangan mantan  '),
      'Kopi susu dengan gula aren asli Indonesia'
    );
    assert.strictEqual(
      getKkMenuDescription('triple cheese bagel'),
      'Roti bagel bercita rasa keju dari keju parmesan dengan topping keju mozarella dan lelehan keju cheddar'
    );
  });

  it('populates product description in normalizeProduct when raw description is empty', () => {
    const raw: KkProductItem = {
      id: 101,
      bundle_code: '7833007',
      product_code: '7833007000',
      name: 'Kopi Kenangan Mantan',
      description: '', // Kosong dari KK menu API
      image: 'https://example.com/kkm.jpg',
      price: 19000,
      orig_price: 19000,
      is_sold_out: false,
      is_combo_v2: false,
    };

    const normalized = normalizeProduct(raw);
    assert.strictEqual(
      normalized.description,
      'Kopi susu dengan gula aren asli Indonesia',
      'Deskripsi harus terisi otomatis dari mapping resmi KK'
    );
  });

  it('preserves raw description if KK API provides non-empty description', () => {
    const raw: KkProductItem = {
      id: 102,
      bundle_code: '999999',
      product_code: '999999000',
      name: 'Kopi Kenangan Mantan',
      description: 'Deskripsi kustom khusus promo',
      image: 'https://example.com/kkm.jpg',
      price: 19000,
      orig_price: 19000,
      is_sold_out: false,
      is_combo_v2: false,
    };

    const normalized = normalizeProduct(raw);
    assert.strictEqual(normalized.description, 'Deskripsi kustom khusus promo');
  });

  it('enables searching Kopi Kenangan products by ingredients/description keywords', () => {
    const products: Product[] = [
      {
        id: 1,
        bundleCode: '7833007',
        productCode: '7833007000',
        name: 'Kopi Kenangan Mantan',
        description: getKkMenuDescription('Kopi Kenangan Mantan'),
        basePrice: 19000,
        originalPrice: 19000,
        image: '',
        isSoldOut: false,
        isCombo: false,
      },
      {
        id: 2,
        bundleCode: '5641200',
        productCode: '5641200000',
        name: 'Triple Cheese Bagel',
        description: getKkMenuDescription('Triple Cheese Bagel'),
        basePrice: 18000,
        originalPrice: 18000,
        image: '',
        isSoldOut: false,
        isCombo: false,
      },
    ];

    // Cari "gula aren" -> harus menemukan KKM
    const arenResults = filterProductsByQuery(products, 'gula aren');
    assert.strictEqual(arenResults.length, 1);
    assert.strictEqual(arenResults[0].name, 'Kopi Kenangan Mantan');

    // Cari "keju" -> harus menemukan Triple Cheese Bagel
    const cheeseResults = filterProductsByQuery(products, 'keju');
    assert.strictEqual(cheeseResults.length, 1);
    assert.strictEqual(cheeseResults[0].name, 'Triple Cheese Bagel');
  });
});
