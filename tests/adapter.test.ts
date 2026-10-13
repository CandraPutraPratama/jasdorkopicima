import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenu, normalizeProductOptions, normalizeStores } from '../src/lib/adapter.ts';
import type { KkMenuData, KkProductOptionsData } from '../src/types/kk-api.ts';

describe('Adapter: normalizeMenu and normalizeProductOptions', () => {
  it('filters and sorts menu groups strictly according to allowlist', () => {
    const rawMenu = {
      menu_groups: [
        {
          group_code: 'promo',
          group_name: 'Promo & Combo',
          menu_products: [{ id: 1, name: 'Paket Mantan', is_combo_v2: false }],
        },
        {
          group_code: 'food',
          group_name: ' FOOD ',
          menu_products: [{ id: 2, name: 'Toast Choco', is_combo_v2: false }],
        },
        {
          group_code: 'brew',
          group_name: 'Manual Brew',
          menu_products: [{ id: 3, name: 'V60 Gayo', is_combo_v2: false }],
        },
        {
          group_code: 'baru',
          group_name: 'baru!',
          menu_products: [{ id: 4, name: 'Taro Cloud Latte', is_combo_v2: false }],
        },
        {
          group_code: 'coffee',
          group_name: 'Coffee',
          menu_products: [{ id: 5, name: 'Kopi Kenangan Mantan', is_combo_v2: false }],
        },
        {
          group_code: 'empty_frappe',
          group_name: 'Kenangan Frappe',
          menu_products: [], // group kosong harus diabaikan
        },
      ],
    } as unknown as KkMenuData;

    const normalized = normalizeMenu(rawMenu);
    assert.equal(normalized.length, 3);
    // Harus berurutan: Baru!, Coffee, Food (Kenangan Frappe kosong jadi tidak ada)
    assert.equal(normalized[0].name, 'baru!');
    assert.equal(normalized[1].name, 'Coffee');
    assert.equal(normalized[2].name, 'FOOD');
  });

  it('filters out Jumbo from dimensions and optionMap', () => {
    const rawOptions = {
      base_product: {
        id: 101,
        bundle_code: 'PROD_101',
        name: 'Kopi Kenangan Mantan',
        price: 18000,
        orig_price: 18000,
      },
      product_dimension_wording: {
        bundle_id: 101,
        dimension_wordings: [
          {
            dimension_code: 1,
            dimension_text: 'Size',
            dimension_value_wordings: [
              { value: 1001, value_text: 'Regular' },
              { value: 1002, value_text: 'Large' },
              { value: 1003, value_text: 'Jumbo' }, // harus disembunyikan
            ],
          },
        ],
      },
      option_product_map: {
        '1001': {
          product_code: 'SKU_REG',
          name: 'Kopi Kenangan Mantan Regular',
          price: 18000,
        },
        '1002': {
          product_code: 'SKU_LRG',
          name: 'Kopi Kenangan Mantan Large',
          price: 23000,
        },
        '1003': {
          product_code: 'SKU_JUMBO',
          name: 'Kopi Kenangan Mantan Jumbo',
          price: 28000,
        },
      },
      product_addon_wording: {
        addon_wordings: [
          {
            dimension_text: 'Syrup',
            dimension_value_wordings: [
              { addon_sku: 'SYR_1', value_text: 'Vanilla Syrup', addon_price: 6000 },
            ],
          },
        ],
      },
    } as unknown as KkProductOptionsData;

    const normalized = normalizeProductOptions(rawOptions);
    const sizeDim = normalized.dimensions.find((d) => d.name === 'Size');
    assert.ok(sizeDim);
    // Hanya Regular dan Large, Jumbo harus tidak ada
    assert.deepEqual(
      sizeDim.values.map((v) => v.name),
      ['Regular', 'Large']
    );

    // SKU Jumbo harus tidak ada di optionMap dan skus
    assert.equal(normalized.optionMap['1003'], undefined);
    assert.ok(normalized.optionMap['1001']);
    assert.ok(normalized.optionMap['1002']);
    assert.equal(normalized.skus.length, 2);
  });

  it('filters out Seliter products from menu groups in normalizeMenu', () => {
    const rawMenu = {
      menu_groups: [
        {
          group_code: 'coffee',
          group_name: 'Coffee',
          menu_products: [
            { id: 1, name: 'Kopi Kenangan Mantan', is_combo_v2: false },
            { id: 2, name: 'Seliter Kenangan Mantan', is_combo_v2: false },
            { id: 3, name: 'SELITER AMERICANO', is_combo_v2: false },
            { id: 4, name: 'Americano', is_combo_v2: false },
          ],
        },
      ],
    } as unknown as KkMenuData;

    const normalized = normalizeMenu(rawMenu);
    assert.equal(normalized.length, 1);
    const productNames = normalized[0].products.map((p) => p.name);
    assert.deepEqual(productNames, ['Kopi Kenangan Mantan', 'Americano']);
  });

  it('filters out out-of-scope stores (Kenangan Signature, Chigo, etc.) in normalizeStores', () => {
    const rawStores = [
      {
        id: 1,
        code: 'S.ID.001',
        name: 'Kopi Kenangan - Senayan City',
        brand_and_image: [{ brand_code: 1, brand_name: 'Kopi Kenangan' }],
        business_hours: [{ open_time: '08:00', close_time: '22:00' }],
      },
      {
        id: 2,
        code: 'KS.ID.001',
        name: 'Kenangan Signature - Mall Kelapa Gading',
        brand_and_image: [{ brand_code: 10, brand_name: 'Kenangan Signature' }],
        business_hours: [{ open_time: '08:00', close_time: '22:00' }],
      },
      {
        id: 3,
        code: 'CH.ID.002',
        name: 'Chigo x Flip Burger - Grand Indonesia',
        brand_and_image: [{ brand_code: 8, brand_name: 'Chigo x Flip' }],
        business_hours: [{ open_time: '08:00', close_time: '22:00' }],
      },
    ] as any;

    const normalized = normalizeStores(rawStores);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].code, 'S.ID.001');
    assert.equal(normalized[0].name, 'Kopi Kenangan - Senayan City');
  });

  it('filters out non-allowed product brands in normalizeMenu according to allowlist', () => {
    const rawMenu = {
      menu_groups: [
        {
          group_code: 'baru',
          group_name: 'Baru!',
          menu_products: [
            { id: 101, name: 'Taro Cloud Latte', is_combo_v2: false, brand: 'Kopi Kenangan' },
            { id: 102, name: 'Krunchi Truffle Mushroom Sauce', is_combo_v2: false, brand: 'Chigo' },
            { id: 103, name: 'ChiMate Chicken Burger Truffle Mushroom', is_combo_v2: false, brand: 'FLIP' },
            { id: 104, name: 'Chicken Burger Truffle Mushroom Sauce', is_combo_v2: false, brand: 'CHIGO' },
            { id: 105, name: 'Minuman Satu Kenangan', is_combo_v2: false, brand: 'Satu Kenangan' },
            { id: 106, name: 'Unknown Brand Item', is_combo_v2: false, brand: 'Random Unknown Brand' },
            { id: 107, name: 'Produk Tanpa Brand Valid', is_combo_v2: false, brand: '' },
          ],
        },
        {
          group_code: 'food',
          group_name: 'Food',
          menu_products: [
            { id: 301, name: 'Roti Coklat Klasik', is_combo_v2: false, brand: 'Cerita Roti' },
            { id: 302, name: 'Brownies Kenangan Manis', is_combo_v2: false, brand: 'Kenangan Manis' },
            { id: 303, name: 'Loaded Fries Truffle', is_combo_v2: false, brand: 'CHIGO' },
          ],
        },
      ],
    } as unknown as KkMenuData;

    // 1. Saat outlet in-scope (default): produk brand diizinkan + produk tanpa brand lolos
    const normalizedInScope = normalizeMenu(rawMenu, true);
    assert.equal(normalizedInScope.length, 2);
    assert.deepEqual(
      normalizedInScope[0].products.map((p) => p.name),
      ['Taro Cloud Latte', 'Produk Tanpa Brand Valid']
    );
    assert.deepEqual(
      normalizedInScope[1].products.map((p) => p.name),
      ['Roti Coklat Klasik', 'Brownies Kenangan Manis']
    );

    // 2. Saat outlet out-of-scope: produk tanpa brand TIDAK lolos
    const normalizedOutOfScope = normalizeMenu(rawMenu, false);
    assert.deepEqual(
      normalizedOutOfScope[0].products.map((p) => p.name),
      ['Taro Cloud Latte']
    );
  });
});

