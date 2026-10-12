import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenu, normalizeProductOptions } from '../src/lib/adapter.ts';
import type { KkMenuData, KkProductOptionsData } from '../src/types/kk-api.ts';

describe('Adapter: normalizeMenu and normalizeProductOptions', () => {
  it('filters and sorts menu groups strictly according to allowlist', () => {
    const rawMenu: KkMenuData = {
      menu_groups: [
        {
          group_code: 'promo',
          group_name: 'Promo & Combo',
          menu_products: [{ id: 1, name: 'Paket Mantan', is_combo_v2: false } as any],
        },
        {
          group_code: 'food',
          group_name: ' FOOD ',
          menu_products: [{ id: 2, name: 'Toast Choco', is_combo_v2: false } as any],
        },
        {
          group_code: 'brew',
          group_name: 'Manual Brew',
          menu_products: [{ id: 3, name: 'V60 Gayo', is_combo_v2: false } as any],
        },
        {
          group_code: 'baru',
          group_name: 'baru!',
          menu_products: [{ id: 4, name: 'Taro Cloud Latte', is_combo_v2: false } as any],
        },
        {
          group_code: 'coffee',
          group_name: 'Coffee',
          menu_products: [{ id: 5, name: 'Kopi Kenangan Mantan', is_combo_v2: false } as any],
        },
        {
          group_code: 'empty_frappe',
          group_name: 'Kenangan Frappe',
          menu_products: [], // group kosong harus diabaikan
        },
      ],
    };

    const normalized = normalizeMenu(rawMenu);
    assert.equal(normalized.length, 3);
    // Harus berurutan: Baru!, Coffee, Food (Kenangan Frappe kosong jadi tidak ada)
    assert.equal(normalized[0].name, 'baru!');
    assert.equal(normalized[1].name, 'Coffee');
    assert.equal(normalized[2].name, 'FOOD');
  });

  it('filters out Jumbo from dimensions and optionMap', () => {
    const rawOptions: KkProductOptionsData = {
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
    };

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
});
