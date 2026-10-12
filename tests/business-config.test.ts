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
    assert.equal(isHiddenProduct('Kopi Kenangan Mantan'), false);
    assert.equal(isHiddenProduct('Americano'), false);
    assert.equal(isHiddenProduct('Taro Cloud Latte'), false);
  });

  it('filters brand scope: ONLY Kopi Kenangan in scope, Kenangan Signature and others out of scope', () => {
    // Pure Kopi Kenangan
    const kkStore = {
      store_code: 'S.ID.123',
      name: 'Kopi Kenangan - MERR Rungkut',
      brand_and_image: [{ brand_code: 1, brand_name: 'Kopi Kenangan' }],
    };
    assert.equal(isStoreInScope(kkStore), true);
    assert.equal(getStoreBrandName(kkStore), 'Kopi Kenangan');

    // Kenangan Signature
    const ksStore = {
      store_code: 'KS.ID.001',
      name: 'Kenangan Signature - Mall Kelapa Gading',
      brand_and_image: [{ brand_code: 10, brand_name: 'Kenangan Signature' }],
    };
    assert.equal(isStoreInScope(ksStore), false);
    assert.equal(getStoreBrandName(ksStore), 'Kenangan Signature');

    // Chigo / Chigo x Flip
    const chigoStore = {
      store_code: 'CH.ID.002',
      name: 'Chigo x Flip Burger - Grand Indonesia',
      brand_and_image: [{ brand_code: 8, brand_name: 'Chigo x Flip' }],
    };
    assert.equal(isStoreInScope(chigoStore), false);
    assert.equal(getStoreBrandName(chigoStore), 'Chigo x Flip');

    // Kenangan Heritage
    const heritageStore = {
      store_code: 'KH.ID.001',
      name: 'Kenangan Heritage - Senayan City',
      brand_and_image: [{ brand_code: 6, brand_name: 'Kenangan Heritage' }],
    };
    assert.equal(isStoreInScope(heritageStore), false);
    assert.equal(getStoreBrandName(heritageStore), 'Kenangan Heritage');
  });
});
