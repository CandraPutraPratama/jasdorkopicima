import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { GET } from '../src/app/api/operational-status/route.ts';
import { CACHE_POLICY } from '../src/lib/cache-headers.ts';

const EXPECTED_SUCCESS_CACHE = 'public, s-maxage=30, stale-while-revalidate=60';

describe('Edge Cache-Control: /api/operational-status', () => {
  describe('definisi kebijakan cache', () => {
    it('CACHE_POLICY.operationalStatus bernilai tepat (30s s-maxage, 60s swr)', () => {
      assert.equal(CACHE_POLICY.operationalStatus, EXPECTED_SUCCESS_CACHE);
    });
  });

  describe('respons sukses 200 untuk pengunjung normal', () => {
    it('membawa Cache-Control publik yang tepat dan Vary: Accept-Encoding', async () => {
      const request = new NextRequest('http://localhost:3000/api/operational-status');
      const res = await GET(request);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), EXPECTED_SUCCESS_CACHE);
      assert.match(res.headers.get('vary') ?? '', /accept-encoding/i);
    });

    it('tidak lagi memakai no-store tanpa alasan simulasi', async () => {
      const request = new NextRequest('http://localhost:3000/api/operational-status');
      const res = await GET(request);
      assert.notEqual(res.headers.get('cache-control'), 'no-store, no-cache, must-revalidate');
    });
  });

  describe('mode simulasi atau non-200', () => {
    it('memakai no-store saat parameter ?simulate=... disertakan', async () => {
      const request = new NextRequest('http://localhost:3000/api/operational-status?simulate=closed');
      const res = await GET(request);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'no-store');
    });
  });
});
