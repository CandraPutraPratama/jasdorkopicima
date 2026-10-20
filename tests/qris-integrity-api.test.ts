import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GET } from '../src/app/api/cron/jasdor-qris-integrity-check/route.ts';

describe('QRIS Integrity Monitoring API', () => {
  it('returns 200 with status ok and fallbackSvg.exists=true (Strategy A: Local FS)', async () => {
    const request = new Request('http://localhost:3000/api/cron/jasdor-qris-integrity-check');
    const response = await GET(request);

    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.status, 'ok');

    // Cek fallback SVG monitor
    assert.strictEqual(body.monitors.fallbackSvg.exists, true);
    assert.strictEqual(body.monitors.fallbackSvg.isMatch, true);
    assert.strictEqual(
      body.monitors.fallbackSvg.hash,
      '9c7e09eb62ec7001de99f0594e97ea52af262bde4e5f35d10530454affd68fcd'
    );
  });

  it('returns 200 with fallbackSvg.exists=true when in Cloudflare Workers using ASSETS binding (Strategy B)', async () => {
    const originalExistsSync = fs.existsSync;
    const symbol = Symbol.for('__cloudflare-context__');
    const originalContext = (globalThis as any)[symbol];
    try {
      (fs as any).existsSync = () => false;

      const expectedSvg = fs.readFileSync('public/payment/qris-cima-group.svg');
      (globalThis as any)[symbol] = {
        env: {
          ASSETS: {
            fetch: async (_url: any) => new Response(expectedSvg, { status: 200 }),
          },
        },
      };

      const request = new Request('https://jasdor.cimagroup.my.id/api/cron/jasdor-qris-integrity-check');
      const response = await GET(request);

      assert.strictEqual(response.status, 200);

      const body = await response.json();
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.monitors.fallbackSvg.exists, true);
      assert.strictEqual(body.monitors.fallbackSvg.isMatch, true);
      assert.strictEqual(
        body.monitors.fallbackSvg.hash,
        '9c7e09eb62ec7001de99f0594e97ea52af262bde4e5f35d10530454affd68fcd'
      );
    } finally {
      fs.existsSync = originalExistsSync;
      (globalThis as any)[symbol] = originalContext;
    }
  });

  it('returns 200 with fallbackSvg.exists=true when fs is unavailable and ASSETS binding absent (Strategy C: Public URL fetch)', async () => {
    const originalExistsSync = fs.existsSync;
    try {
      (fs as any).existsSync = () => false;

      // Mock request from production domain or local
      const request = new Request('https://jasdor.cimagroup.my.id/api/cron/jasdor-qris-integrity-check');
      const response = await GET(request);

      assert.strictEqual(response.status, 200);

      const body = await response.json();
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.monitors.fallbackSvg.exists, true);
      assert.strictEqual(body.monitors.fallbackSvg.isMatch, true);
      assert.strictEqual(
        body.monitors.fallbackSvg.hash,
        '9c7e09eb62ec7001de99f0594e97ea52af262bde4e5f35d10530454affd68fcd'
      );
    } finally {
      fs.existsSync = originalExistsSync;
    }
  });
});

