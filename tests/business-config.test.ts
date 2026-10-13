import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOptionAddition,
  classifyAddonGroup,
  isHiddenOptionValue,
  isAllowedMenuGroup,
  getAllowedMenuGroupIndex,
  isHiddenProduct,
  isStoreInScope,
  getStoreBrandName,
  isAllowedProductBrand,
} from '../src/config/business.ts';

describe('Business Configuration & Classification Helpers', () => {
  it('returns exact flat addition values per specification', () => {
    assert.equal(getOptionAddition('Large'), 5000);
    assert.equal(getOptionAddition('large'), 5000);
    assert.equal(getOptionAddition('Juwara Beans'), 3000);
    assert.equal(getOptionAddition('Oatside'), 3000);
    assert.equal(getOptionAddition('Regular'), 0);
    assert.equal(getOptionAddition('Kenangan Blend'), 0);
    assert.equal(getOptionAddition('Milk'), 0);
    assert.equal(getOptionAddition('Normal Sugar'), 0);
    assert.equal(getOptionAddition('Less Sugar'), 0);
    assert.equal(getOptionAddition('No Sugar'), 0);
    assert.equal(getOptionAddition('Normal Ice'), 0);
    assert.equal(getOptionAddition('Less Ice'), 0);
    assert.equal(getOptionAddition('Hot'), 0);
    assert.equal(getOptionAddition('Ice'), 0);
  });

  it('identifies hidden option values like Jumbo', () => {
    assert.equal(isHiddenOptionValue('Jumbo'), true);
    assert.equal(isHiddenOptionValue('jumbo'), true);
    assert.equal(isHiddenOptionValue('Large'), false);
    assert.equal(isHiddenOptionValue('Regular'), false);
  });

  it('classifies addon groups accurately', () => {
    // Whipped Cream
    assert.equal(classifyAddonGroup('No Whipped Cream', 'Whipped Cream'), 'whipped_cream');
    assert.equal(classifyAddonGroup('Whipped Cream Vanilla', 'Whipped Cream'), 'whipped_cream');
    assert.equal(classifyAddonGroup('Whipped Cream Chocolate', 'Whipped Cream'), 'whipped_cream');

    // Syrup
    assert.equal(classifyAddonGroup('Choco Sauce', 'Syrup'), 'syrup');
    assert.equal(classifyAddonGroup('Butterscotch Sauce', 'Syrup'), 'syrup');
    assert.equal(classifyAddonGroup('Vanilla Syrup', 'Syrup'), 'syrup');
    assert.equal(classifyAddonGroup('Salted Caramel Sauce'), 'syrup');

    // Topping
    assert.equal(classifyAddonGroup('Espresso Shot Kenangan Blend', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Espresso Shot Juwara Beans', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Golden boba', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Grass Jelly', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Oreo', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Caramel Crumble', 'Topping'), 'topping');
    assert.equal(classifyAddonGroup('Gula Aren', 'Topping'), 'topping');
  });

  it('filters and sorts menu groups by allowlist', () => {
    assert.equal(isAllowedMenuGroup('Baru!'), true);
    assert.equal(isAllowedMenuGroup('baru!'), true);
    assert.equal(isAllowedMenuGroup(' Coffee '), true);
    assert.equal(isAllowedMenuGroup('Non Coffee'), true);
    assert.equal(isAllowedMenuGroup('Kenangan Frappe'), true);
    assert.equal(isAllowedMenuGroup('Kenangan Toast'), true);
    assert.equal(isAllowedMenuGroup('Food'), true);

    // Disallowed groups
    assert.equal(isAllowedMenuGroup('Promo & Combo'), false);
    assert.equal(isAllowedMenuGroup('Manual Brew'), false);
    assert.equal(isAllowedMenuGroup('Special Merchandise'), false);

    // Ordering
    assert.equal(getAllowedMenuGroupIndex('Baru!'), 0);
    assert.equal(getAllowedMenuGroupIndex('Coffee'), 1);
    assert.equal(getAllowedMenuGroupIndex('Non Coffee'), 2);
    assert.equal(getAllowedMenuGroupIndex('Kenangan Frappe'), 3);
    assert.equal(getAllowedMenuGroupIndex('Kenangan Toast'), 4);
    assert.equal(getAllowedMenuGroupIndex('Food'), 5);
  });

  it('identifies hidden products like Seliter (case insensitive)', () => {
    assert.equal(isHiddenProduct('Seliter Kenangan Mantan'), true);
    assert.equal(isHiddenProduct('seliter americano'), true);
    assert.equal(isHiddenProduct('SELITER LATTE'), true);
    assert.equal(isHiddenProduct('Krunchi Truffle Mushroom Sauce'), true);
    assert.equal(isHiddenProduct('ChiMate Chicken Burger Truffle Mushroom'), true);
    assert.equal(isHiddenProduct('Chicken Burger Truffle Mushroom Sauce'), false); // filtered by brand 'Chigo'
    assert.equal(isHiddenProduct('Kopi Kenangan Mantan'), false);
    assert.equal(isHiddenProduct('Americano'), false);
    assert.equal(isHiddenProduct('Taro Cloud Latte'), false);
  });

  it('filters brand scope per Perbaikan Lingkup A rules', () => {
    // 1. Kopi Kenangan murni (masuk)
    const kkMurni = {
      code: 'S.ID.123',
      name: 'Kopi Kenangan - MERR Rungkut',
      brand_and_image: [{ brand_code: 1, brand_name: 'Kopi Kenangan' }],
    };
    assert.equal(isStoreInScope(kkMurni), true);
    assert.equal(getStoreBrandName(kkMurni), 'Kopi Kenangan');

    // 2. Kopi Kenangan + Chigo (masuk)
    const kkPlusChigo = {
      code: 'TANJUNGDUREN',
      name: 'Ruko Tanjung Duren',
      brand_and_image: [
        { brand_code: 1, brand_name: 'Kopi Kenangan' },
        { brand_code: 8, brand_name: 'Chigo x Flip' },
      ],
    };
    assert.equal(isStoreInScope(kkPlusChigo), true);
    assert.equal(getStoreBrandName(kkPlusChigo), 'Kopi Kenangan + Chigo');

    // 3. Outlet gabungan yang namanya memuat "Chigo" (masuk karena memiliki brand_code 1)
    const kkChigoName = {
      code: 'BKS.CHIGO.KK',
      name: 'Kopi Kenangan x Chigo Grand Galaxy',
      brand_and_image: [
        { brand_code: 1, brand_name: 'Kopi Kenangan' },
        { brand_code: 4, brand_name: 'Chigo' },
      ],
    };
    assert.equal(isStoreInScope(kkChigoName), true);
    assert.equal(getStoreBrandName(kkChigoName), 'Kopi Kenangan + Chigo');

    // 4. Chigo saja (keluar)
    const chigoSaja = {
      code: 'TGR.CGBPDLTNS',
      name: 'Chigo BP Delatinos',
      brand_and_image: [{ brand_code: 4, brand_name: 'Chigo' }],
    };
    assert.equal(isStoreInScope(chigoSaja), false);
    assert.equal(getStoreBrandName(chigoSaja), 'Chigo x Flip');

    // 5. Signature (keluar)
    const signature = {
      code: 'KS.ID.001',
      name: 'Kenangan Signature - Mall Kelapa Gading',
      brand_and_image: [{ brand_code: 10, brand_name: 'Kenangan Signature' }],
    };
    assert.equal(isStoreInScope(signature), false);
    assert.equal(getStoreBrandName(signature), 'Kenangan Signature');

    // 6. Heritage (keluar)
    const heritage = {
      code: 'KH.ID.001',
      name: 'Kenangan Heritage - Senayan City',
      brand_and_image: [{ brand_code: 6, brand_name: 'Kenangan Heritage' }],
    };
    assert.equal(isStoreInScope(heritage), false);
    assert.equal(getStoreBrandName(heritage), 'Kenangan Heritage');

    // 7. Tanpa brand (keluar)
    const tanpaBrand = {
      code: 'BCR.JAB.O0001',
      name: 'KopKen Alfamid Subandi',
      brand_and_image: [],
    };
    assert.equal(isStoreInScope(tanpaBrand), false);
    assert.equal(getStoreBrandName(tanpaBrand), 'Tanpa Brand');
  });

  it('validates allowedProductBrands allowlist strictly (case-insensitive) and empty brand rules', () => {
    // Official allowed brands (case-insensitive)
    assert.equal(isAllowedProductBrand('Kopi Kenangan'), true);
    assert.equal(isAllowedProductBrand('kopi kenangan'), true);
    assert.equal(isAllowedProductBrand('KOPI KENANGAN'), true);
    assert.equal(isAllowedProductBrand('Cerita Roti'), true);
    assert.equal(isAllowedProductBrand('cerita roti'), true);
    assert.equal(isAllowedProductBrand('CERITA ROTI'), true);
    assert.equal(isAllowedProductBrand('Kenangan Manis'), true);
    assert.equal(isAllowedProductBrand('kenangan manis'), true);

    // Disallowed brands
    assert.equal(isAllowedProductBrand('Chigo'), false);
    assert.equal(isAllowedProductBrand('CHIGO'), false);
    assert.equal(isAllowedProductBrand('FLIP'), false);
    assert.equal(isAllowedProductBrand('Flip'), false);
    assert.equal(isAllowedProductBrand('Satu Kenangan'), false);
    assert.equal(isAllowedProductBrand('Random Brand'), false);

    // Empty brand handling based on outlet in-scope status
    assert.equal(isAllowedProductBrand('', true), true);
    assert.equal(isAllowedProductBrand(undefined, true), true);
    assert.equal(isAllowedProductBrand(null, true), true);
    assert.equal(isAllowedProductBrand('   ', true), true);

    assert.equal(isAllowedProductBrand('', false), false);
    assert.equal(isAllowedProductBrand(undefined, false), false);
    assert.equal(isAllowedProductBrand(null, false), false);
    assert.equal(isAllowedProductBrand('   ', false), false);
  });
});

