import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextResponse } from 'next/server.js';
import {
  CACHE_POLICY,
  applyCachePolicy,
  type CachePolicy,
} from '../src/lib/cache-headers.ts';

function cacheControl(response: Response): string {
  return response.headers.get('cache-control') ?? '';
}

describe('Nomor 2 - Cache-Control edge untuk API outlets', () => {
  describe('kebijakan per endpoint', () => {
    it('menu memakai s-maxage 900 dan stale-while-revalidate 3600', () => {
      assert.equal(
        CACHE_POLICY.menu,
        'public, s-maxage=900, stale-while-revalidate=3600'
      );
    });

    it('pencarian outlet memakai s-maxage 90 dan stale-while-revalidate 300', () => {
      assert.equal(
        CACHE_POLICY.search,
        'public, s-maxage=90, stale-while-revalidate=300'
      );
    });

    it('detail outlet memakai s-maxage 90 dan stale-while-revalidate 300', () => {
      assert.equal(
        CACHE_POLICY.outlet,
        'public, s-maxage=90, stale-while-revalidate=300'
      );
    });

    it('opsi produk memakai s-maxage 3600 dan stale-while-revalidate 3600', () => {
      assert.equal(
        CACHE_POLICY.options,
        'public, s-maxage=3600, stale-while-revalidate=3600'
      );
    });

    it('validate-cart memakai no-store', () => {
      assert.equal(CACHE_POLICY.noStore, 'no-store');
    });
  });

  describe('applyCachePolicy', () => {
    const policy: CachePolicy = CACHE_POLICY.menu;

    it('menambahkan header publik pada respons 200', () => {
      const response = NextResponse.json({ ok: true }, { status: 200 });
      const result = applyCachePolicy(response, policy);
      assert.equal(cacheControl(result), policy);
    });

    it('tidak mengubah body respons', async () => {
      const payload = { menuGroups: [{ code: 'A', name: 'Baru!' }] };
      const response = NextResponse.json(payload, { status: 200 });
      const result = applyCachePolicy(response, policy);
      assert.deepEqual(await result.json(), payload);
    });

    it('tidak mengubah status code', () => {
      const ok = applyCachePolicy(NextResponse.json({}, { status: 200 }), policy);
      assert.equal(ok.status, 200);

      const notFound = applyCachePolicy(
        NextResponse.json({ error: 'x' }, { status: 404 }),
        policy
      );
      assert.equal(notFound.status, 404);
    });

    for (const status of [400, 404, 429, 500, 503]) {
      it(`respons ${status} TIDAK membawa cache publik`, () => {
        const response = NextResponse.json({ error: 'x' }, { status });
        const result = applyCachePolicy(response, policy);
        const value = cacheControl(result);

        assert.equal(value.includes('public'), false, `status ${status} tidak boleh public`);
        assert.equal(value.includes('s-maxage'), false, `status ${status} tidak boleh s-maxage`);
        assert.equal(value, 'no-store', `status ${status} harus no-store`);
      });
    }

    it('respons 201/204 juga tidak di-cache publik', () => {
      const created = applyCachePolicy(NextResponse.json({}, { status: 201 }), policy);
      assert.equal(cacheControl(created), 'no-store');

      // 204 tidak boleh punya body, jadi dibuat tanpa NextResponse.json.
      const noContent = applyCachePolicy(new NextResponse(null, { status: 204 }) as never, policy);
      assert.equal(cacheControl(noContent), 'no-store');
    });

    it('menimpa Cache-Control yang sudah ada pada respons 200', () => {
      const response = NextResponse.json({ ok: true }, {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=0' },
      });
      const result = applyCachePolicy(response, policy);
      assert.equal(cacheControl(result), policy);
    });

    it('menimpa Cache-Control lama pada respons error dengan no-store', () => {
      const response = NextResponse.json({ error: 'x' }, {
        status: 500,
        headers: { 'Cache-Control': 'public, s-maxage=900' },
      });
      const result = applyCachePolicy(response, policy);
      assert.equal(cacheControl(result), 'no-store');
    });

    it('mempertahankan header lain yang sudah ada', () => {
      const response = NextResponse.json({ ok: true }, {
        status: 200,
        headers: { 'X-Cache-Status': 'STALE-IF-ERROR' },
      });
      const result = applyCachePolicy(response, policy);
      assert.equal(result.headers.get('x-cache-status'), 'STALE-IF-ERROR');
      assert.equal(cacheControl(result), policy);
    });

    it('mempertahankan Retry-After pada 429', () => {
      const response = NextResponse.json({ error: 'x' }, {
        status: 429,
        headers: { 'Retry-After': '42' },
      });
      const result = applyCachePolicy(response, policy);
      assert.equal(result.headers.get('retry-after'), '42');
      assert.equal(cacheControl(result), 'no-store');
    });

    it('selalu menerapkan no-store untuk kebijakan noStore, termasuk 200', () => {
      const result = applyCachePolicy(
        NextResponse.json({ ok: true }, { status: 200 }),
        CACHE_POLICY.noStore
      );
      assert.equal(cacheControl(result), 'no-store');
    });

    it('menambahkan Vary Accept-Encoding agar edge tidak salah menyajikan', () => {
      const result = applyCachePolicy(NextResponse.json({}, { status: 200 }), policy);
      const vary = result.headers.get('vary') ?? '';
      assert.match(vary, /Accept-Encoding/i);
    });
  });
});
