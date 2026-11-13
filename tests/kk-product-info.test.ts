import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapProductInfoToMenu,
  mapProductInfoToOptions,
  type KkProductInfoData,
} from '../src/lib/kk-product-info.ts';
import { normalizeMenu, normalizeProductOptions } from '../src/lib/adapter.ts';
import { KkApiClient } from '../src/lib/kk-client.ts';

function makeProduct(opts: {
  bundle: string;
  name: string;
  price: string | number;
  orig?: string | number;
  soldOut?: boolean;
}) {
  return {
    product: {
      base_product: {
        id: Number(opts.bundle),
        bundle_code: opts.bundle,
        name: opts.name,
        description: 'desc',
        image: 'https://cdn.kopikenangan.com/public/abc',
        price_dec: opts.price,
        orig_price_dec: opts.orig ?? opts.price,
        type: 'MERCHANDISE',
        default_sku: `${opts.bundle}000`,
      },
      is_sold_out: opts.soldOut ?? false,
      default_selection_path: '2509-2198:2510-2200:',
      option_product_map: {
        '2509-2198:2510-2200:': {
          product_code: `${opts.bundle}000`,
          name: `${opts.name} Cold Regular`,
          display_description: 'Cold, Regular',
          price_dec: String(opts.price),
        },
        '2509-2198:2510-2201:': {
          product_code: `${opts.bundle}001`,
          name: `${opts.name} Cold Large`,
          display_description: 'Cold, Large',
          price_dec: '27000',
        },
      },
      product_dimension_wording: {
        dimension_wordings: [
          {
            dimension_code: 2509,
            dimension_text: 'Suhu',
            dimension_value_wordings: [{ value: 2198, value_text: 'Cold', value_icon: '' }],
          },
        ],
      },
      product_addon_wording: {
        addon_wordings: [
          {
            dimension_text: 'Topping',
            dimension_value_wordings: [
              {
                addon_sku: '145225001',
                value_text: 'Golden boba',
                addon_price: null,
                addon_price_dec: '6000',
                value_icon: '',
              },
            ],
          },
        ],
      },
      notes: [{ check_type: 'radio', groups: [{ option_name: 'Ice Level', value_texts: ['Less Ice'] }] }],
    },
    combo: null,
  };
}

const sample: KkProductInfoData = {
  menu_groups: [
    { group_code: 'G1', group_name: 'Coffee', bundle_codes: ['111', '222'] },
    { group_code: 'G2', group_name: 'Promo', bundle_codes: ['111'] },
    { group_code: 'G3', group_name: 'Empty', bundle_codes: [] },
  ],
  menu_items: [
    makeProduct({ bundle: '111', name: 'Kopi Kenangan Mantan', price: '22000', orig: '25000' }),
    makeProduct({ bundle: '222', name: 'Mocha Latte', price: 31000, soldOut: true }),
    { product: null, combo: { id: 1 } },
  ],
};

describe('mapProductInfoToMenu', () => {
  it('maps groups + items, converting price_dec strings to numbers', () => {
    const menu = mapProductInfoToMenu(sample);
    const coffee = menu.menu_groups.find((g) => g.group_name === 'Coffee')!;
    assert.equal(coffee.menu_products.length, 2);
    const mantan = coffee.menu_products[0];
    assert.equal(mantan.name, 'Kopi Kenangan Mantan');
    assert.strictEqual(mantan.price, 22000);
    assert.strictEqual(mantan.orig_price, 25000);
    assert.equal(mantan.bundle_code, '111');
    assert.equal(mantan.product_code, '111000');
    assert.equal(mantan.is_sold_out, false);
    assert.equal(mantan.is_combo_v2, false);
  });

  it('keeps is_sold_out=true and accepts numeric price_dec', () => {
    const menu = mapProductInfoToMenu(sample);
    const mocha = menu.menu_groups[0].menu_products[1];
    assert.equal(mocha.is_sold_out, true);
    assert.strictEqual(mocha.price, 31000);
  });

  it('skips combo items (product null) and drops empty groups', () => {
    const menu = mapProductInfoToMenu(sample);
    assert.equal(menu.menu_groups.some((g) => g.group_name === 'Empty'), false);
    const all = menu.menu_groups.flatMap((g) => g.menu_products);
    assert.equal(all.length, 3); // 111 muncul di Coffee + Promo, 222 di Coffee
  });

  it('falls back to price 0 on non-numeric price instead of NaN', () => {
    const bad: KkProductInfoData = {
      menu_groups: [{ group_code: 'G', group_name: 'Coffee', bundle_codes: ['9'] }],
      menu_items: [makeProduct({ bundle: '9', name: 'X', price: 'abc' })],
    };
    const p = mapProductInfoToMenu(bad).menu_groups[0].menu_products[0];
    assert.strictEqual(p.price, 0);
  });

  it('result works with normalizeMenu (allowlist keeps Coffee, hides combos)', () => {
    const groups = normalizeMenu(mapProductInfoToMenu(sample));
    const coffee = groups.find((g) => g.name === 'Coffee')!;
    assert.equal(coffee.products[0].basePrice, 22000);
    assert.equal(coffee.products[0].originalPrice, 25000);
  });

  it('throws when payload has no menu_groups/menu_items arrays', () => {
    assert.throws(() => mapProductInfoToMenu({} as any));
  });
});

describe('mapProductInfoToOptions', () => {
  it('returns null for unknown bundle', () => {
    assert.equal(mapProductInfoToOptions(sample, 'nope'), null);
  });

  it('maps variant SKU prices (string -> number) and addon_price_dec', () => {
    const raw = mapProductInfoToOptions(sample, '111')!;
    assert.strictEqual(raw.base_product.price, 22000);
    assert.strictEqual(raw.option_product_map!['2509-2198:2510-2201:'].price, 27000);
    const details = normalizeProductOptions(raw);
    assert.equal(details.skus.length, 2);
    assert.equal(details.skus[1].variantAddition, 5000);
    assert.equal(details.addons[0].price, 6000);
    assert.deepEqual(details.defaultSelectionMap, { '2509': '2198', '2510': '2200' });
  });
});

describe('KkApiClient.queryProductMenu via product_info (tanpa token)', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('hanya memanggil product_info {store_code}, tanpa token/phone/authorization', async () => {
    const calls: Array<{ url: string; body: any; headers: any }> = [];
    globalThis.fetch = async (url: any, init: any) => {
      calls.push({ url: String(url), body: JSON.parse(init.body), headers: init.headers });
      return new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: sample }));
    };
    const client = new KkApiClient('https://mock-kk.test');
    const menu = await client.queryProductMenu('LIPPO-PURI');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://mock-kk.test/product/product_info');
    assert.deepEqual(calls[0].body, { store_code: 'LIPPO-PURI' });
    assert.equal(calls[0].headers.authorization, undefined);
    assert.equal(calls[0].headers.language, 'id');
    assert.ok(menu.menu_groups.length > 0);
  });

  it('retry 1x pada 5xx, lalu sukses', async () => {
    let n = 0;
    globalThis.fetch = async () => {
      n++;
      if (n === 1) return new Response('', { status: 502 });
      return new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: sample }));
    };
    const client = new KkApiClient('https://mock-kk.test');
    await client.queryProductMenu('X');
    assert.equal(n, 2);
  });

  it('TIDAK retry pada 404/4xx', async () => {
    let n = 0;
    globalThis.fetch = async () => {
      n++;
      return new Response('', { status: 404 });
    };
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.queryProductMenu('X'));
    assert.equal(n, 1);
  });

  it('error_code != 0 melempar error tanpa retry', async () => {
    let n = 0;
    globalThis.fetch = async () => {
      n++;
      return new Response(JSON.stringify({ error_code: 444, msg: 'auth error', data: null }));
    };
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.queryProductMenu('X'), /product_info/);
    assert.equal(n, 1);
  });

  it('getProductOptions memakai product_info dan memetakan bundle', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: sample }));
    const client = new KkApiClient('https://mock-kk.test');
    const opts = await client.getProductOptions(1, 'LIPPO-PURI', '222');
    assert.equal(opts.base_product.name, 'Mocha Latte');
    await assert.rejects(() => client.getProductOptions(1, 'LIPPO-PURI', 'nope'));
  });
});
