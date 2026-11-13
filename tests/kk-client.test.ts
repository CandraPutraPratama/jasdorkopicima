import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { KkApiClient } from '../src/lib/kk-client.ts';
import { BUSINESS_CONFIG } from '../src/config/business.ts';

describe('KkApiClient (transport, queryStore, getStore)', () => {
  const originalFetch = globalThis.fetch;
  const originalClient = { ...BUSINESS_CONFIG.client };

  beforeEach(() => {
    // Tanpa jeda sopan agar test cepat; kasus polite delay mengaturnya sendiri.
    BUSINESS_CONFIG.client.politeDelayMs = 0;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    BUSINESS_CONFIG.client.politeDelayMs = originalClient.politeDelayMs;
    BUSINESS_CONFIG.client.timeoutMs = originalClient.timeoutMs;
  });

  it('queryStore: POST ke /store/query_store dengan keyword, paginasi, dan header standar tanpa authorization', async () => {
    let seen: { url: string; init: any } | null = null;
    globalThis.fetch = async (url: any, init: any) => {
      seen = { url: String(url), init };
      return new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: { stores: [{ store_code: 'CIMB' }] } }));
    };

    const client = new KkApiClient('https://mock-kk.test');
    const data: any = await client.queryStore({ keyword: 'cimb', pageNum: 2, pageSize: 5 });

    assert.deepStrictEqual(data, { stores: [{ store_code: 'CIMB' }] });
    assert.ok(seen);
    const call = seen as { url: string; init: any };
    assert.equal(call.url, 'https://mock-kk.test/store/query_store');
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.headers['Content-Type'], 'application/json');
    assert.equal(call.init.headers['language'], 'id');
    assert.equal(call.init.headers.authorization, undefined);
    const body = JSON.parse(call.init.body);
    assert.equal(body.keyword, 'cimb');
    assert.equal(body.page_num, 2);
    assert.equal(body.page_size, 5);
    assert.deepStrictEqual(body.page, { page_index: 2, page_size: 5 });
  });

  it('queryStore: error_code != 0 melempar error berpesan Indonesia', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ error_code: 500, msg: 'boom', data: null }));
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.queryStore(), /Gagal mengambil daftar outlet: boom \(kode: 500\)/);
  });

  it('getStore: POST /store/get_store dengan store_code dan mengembalikan data', async () => {
    let body: any = null;
    let url = '';
    globalThis.fetch = async (u: any, init: any) => {
      url = String(u);
      body = JSON.parse(init.body);
      return new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: { store_code: 'CIMB', is_open: true } }));
    };
    const client = new KkApiClient('https://mock-kk.test');
    const store: any = await client.getStore('CIMB');
    assert.equal(url, 'https://mock-kk.test/store/get_store');
    assert.deepStrictEqual(body, { store_code: 'CIMB' });
    assert.equal(store.is_open, true);
  });

  it('getStore: error_code != 0 melempar error yang menyebut kode outlet', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ error_code: 404, msg: 'not found', data: null }));
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.getStore('XYZ'), /Gagal mengambil detail outlet XYZ: not found \(kode: 404\)/);
  });

  it('error HTTP non-2xx pada endpoint tanpa retry melempar "HTTP Error <status>"', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response('nope', { status: 503, statusText: 'Service Unavailable' });
    };
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.getStore('CIMB'), /HTTP Error 503/);
    assert.equal(calls, 1, 'getStore tidak boleh retry');
  });

  it('timeout: request yang menggantung di-abort dan melempar pesan timeout', async () => {
    BUSINESS_CONFIG.client.timeoutMs = 30;
    globalThis.fetch = (_url: any, init: any) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err: any = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(() => client.getStore('CIMB'), /request timeout setelah 30ms pada \/store\/get_store/);
  });

  it('polite delay: dua request berturut-turut dijeda minimal sebesar politeDelayMs', async () => {
    BUSINESS_CONFIG.client.politeDelayMs = 120;
    const stamps: number[] = [];
    globalThis.fetch = async () => {
      stamps.push(Date.now());
      return new Response(JSON.stringify({ error_code: 0, msg: 'OK', data: {} }));
    };
    const client = new KkApiClient('https://mock-kk.test');
    await client.getStore('A');
    await client.getStore('B');
    assert.equal(stamps.length, 2);
    // toleransi 10 ms untuk granularitas timer
    assert.ok(stamps[1] - stamps[0] >= 110, `selisih ${stamps[1] - stamps[0]}ms < 110ms`);
  });
});

describe('KkApiClient: satu fetch product_info per outlet (dedupe in-flight)', () => {
  const originalFetch = globalThis.fetch;
  const originalDelay = BUSINESS_CONFIG.client.politeDelayMs;

  const productInfoBody = JSON.stringify({
    error_code: 0,
    msg: 'OK',
    data: {
      menu_groups: [{ group_code: 'G1', group_name: 'Coffee', bundle_codes: ['111', '222'] }],
      menu_items: ['111', '222'].map((b) => ({
        product: {
          base_product: { id: Number(b), bundle_code: b, name: `P${b}`, price_dec: '20000', default_sku: `${b}000` },
          is_sold_out: false,
          option_product_map: {},
        },
        combo: null,
      })),
    },
  });

  beforeEach(() => {
    BUSINESS_CONFIG.client.politeDelayMs = 0;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    BUSINESS_CONFIG.client.politeDelayMs = originalDelay;
  });

  function countingFetch(): { calls: string[] } {
    const state = { calls: [] as string[] };
    globalThis.fetch = async (_url: any, init: any) => {
      state.calls.push(JSON.parse(init.body).store_code);
      await new Promise((r) => setTimeout(r, 20)); // beri kesempatan request lain masuk saat in-flight
      return new Response(productInfoBody);
    };
    return state;
  }

  it('menu + opsi dua produk berbeda yang diminta bersamaan untuk 1 outlet hanya 1 request ke KK', async () => {
    const state = countingFetch();
    const client = new KkApiClient('https://mock-kk.test');
    const [menu, o1, o2] = await Promise.all([
      client.queryProductMenu('LIPPO-PURI'),
      client.getProductOptions(0, 'LIPPO-PURI', '111'),
      client.getProductOptions(0, 'LIPPO-PURI', '222'),
    ]);
    assert.equal(state.calls.length, 1);
    assert.equal(menu.menu_groups[0].menu_products.length, 2);
    assert.equal(o1.base_product.bundle_code, '111');
    assert.equal(o2.base_product.bundle_code, '222');
  });

  it('outlet berbeda tidak berbagi fetch', async () => {
    const state = countingFetch();
    const client = new KkApiClient('https://mock-kk.test');
    await Promise.all([client.queryProductMenu('AEON.BSD'), client.queryProductMenu('TNG.SOETTA2')]);
    assert.deepStrictEqual(state.calls.sort(), ['AEON.BSD', 'TNG.SOETTA2']);
  });

  it('tidak ada memo: panggilan setelah fetch selesai mengambil ulang (status habis tetap segar)', async () => {
    const state = countingFetch();
    const client = new KkApiClient('https://mock-kk.test');
    await client.queryProductMenu('LIPPO-PURI');
    await client.queryProductMenu('LIPPO-PURI');
    assert.equal(state.calls.length, 2);
  });

  it('gagal dibagi ke semua pemanggil bersamaan (retry 5xx hanya 1x total), lalu panggilan berikutnya mencoba lagi', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response('bad', { status: 502, statusText: 'Bad Gateway' });
    };
    const client = new KkApiClient('https://mock-kk.test');
    const results = await Promise.allSettled([
      client.queryProductMenu('LIPPO-PURI'),
      client.getProductOptions(0, 'LIPPO-PURI', '111'),
    ]);
    assert.ok(results.every((r) => r.status === 'rejected'));
    assert.equal(calls, 2, '1 percobaan + 1 retry, bukan per pemanggil');

    globalThis.fetch = async () => new Response(productInfoBody);
    const menu = await client.queryProductMenu('LIPPO-PURI');
    assert.equal(menu.menu_groups.length, 1);
  });
});
