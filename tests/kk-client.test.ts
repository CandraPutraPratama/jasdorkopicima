import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { KkApiClient } from '../src/lib/kk-client.ts';

describe('KkApiClient (Server Client & Token Handling)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('automatically requests token when calling authenticated endpoint', async () => {
    const calls: string[] = [];

    globalThis.fetch = async (url: any, init: any) => {
      const urlStr = String(url);
      calls.push(urlStr);

      if (urlStr.includes('/create_web_token')) {
        return new Response(
          JSON.stringify({
            error_code: 0,
            msg: 'OK',
            data: { web_order_session_token: 'mock_token_123' },
          })
        );
      }

      if (urlStr.includes('/query_web_order_product_menu')) {
        assert.strictEqual(init.headers.authorization, 'mock_token_123');
        return new Response(
          JSON.stringify({
            error_code: 0,
            msg: 'OK',
            data: { menu_groups: [] },
          })
        );
      }

      throw new Error(`Unexpected url: ${urlStr}`);
    };

    const client = new KkApiClient('https://mock-kk.test');
    const menu = await client.queryProductMenu('CIMB');
    assert.ok(menu);
    assert.deepStrictEqual(calls, [
      'https://mock-kk.test/create_web_token',
      'https://mock-kk.test/product/query_web_order_product_menu',
    ]);
  });

  it('retries exactly once when encountering error_code 444', async () => {
    let menuCallCount = 0;
    let tokenCallCount = 0;

    globalThis.fetch = async (url: any, init: any) => {
      const urlStr = String(url);

      if (urlStr.includes('/create_web_token')) {
        tokenCallCount++;
        return new Response(
          JSON.stringify({
            error_code: 0,
            msg: 'OK',
            data: { web_order_session_token: `token_v${tokenCallCount}` },
          })
        );
      }

      if (urlStr.includes('/query_web_order_product_menu')) {
        menuCallCount++;
        if (menuCallCount === 1) {
          // First attempt: simulate expired token 444
          assert.strictEqual(init.headers.authorization, 'token_v1');
          return new Response(
            JSON.stringify({
              error_code: 444,
              msg: 'auth error',
              data: null,
            })
          );
        } else {
          // Second attempt: succeeds with fresh token
          assert.strictEqual(init.headers.authorization, 'token_v2');
          return new Response(
            JSON.stringify({
              error_code: 0,
              msg: 'OK',
              data: { menu_groups: [{ group_code: 'G1', group_name: 'Coffee', has_combo: false, menu_products: [] }] },
            })
          );
        }
      }

      throw new Error(`Unexpected url: ${urlStr}`);
    };

    const client = new KkApiClient('https://mock-kk.test');
    const menu = await client.queryProductMenu('CIMB');
    assert.strictEqual(menu.menu_groups.length, 1);
    assert.strictEqual(tokenCallCount, 2);
    assert.strictEqual(menuCallCount, 2);
  });

  it('fails if error_code 444 persists on retry', async () => {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/create_web_token')) {
        return new Response(
          JSON.stringify({
            error_code: 0,
            msg: 'OK',
            data: { web_order_session_token: 'always_bad_token' },
          })
        );
      }
      return new Response(
        JSON.stringify({
          error_code: 444,
          msg: 'auth error',
          data: null,
        })
      );
    };

    const client = new KkApiClient('https://mock-kk.test');
    await assert.rejects(
      async () => {
        await client.queryProductMenu('CIMB');
      },
      /Autentikasi KK gagal permanen setelah 1x retry/
    );
  });
});
