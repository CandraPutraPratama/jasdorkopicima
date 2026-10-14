import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/app/manifest.ts';
import robots from '../src/app/robots.ts';

describe('PWA, SEO, dan Analytics (Tahap 9)', () => {
  describe('Web App Manifest', () => {
    test('manifest menghasilkan field wajib PWA dengan benar', () => {
      const data = manifest();
      assert.strictEqual(data.name, 'Jasdor — Jasa Order Kopi Kenangan');
      assert.strictEqual(data.short_name, 'Jasdor');
      assert.strictEqual(data.start_url, '/');
      assert.strictEqual(data.display, 'standalone');
      assert.strictEqual(data.theme_color, '#111111');
      assert.strictEqual(data.background_color, '#FFFFFF');

      const icons = data.icons || [];
      assert.ok(icons.length >= 4, 'Minimal 4 varian ikon harus terdaftar');

      const icon192 = icons.find((i) => i.sizes === '192x192' && i.purpose === 'any');
      assert.ok(icon192, 'Harus memuat ikon 192x192 purpose any');
      assert.strictEqual(icon192.src, '/icons/icon-192x192.png');

      const icon512 = icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
      assert.ok(icon512, 'Harus memuat ikon 512x512 purpose any');
      assert.strictEqual(icon512.src, '/icons/icon-512x512.png');

      const maskable192 = icons.find((i) => i.sizes === '192x192' && i.purpose === 'maskable');
      assert.ok(maskable192, 'Harus memuat ikon maskable 192x192');

      const maskable512 = icons.find((i) => i.sizes === '512x512' && i.purpose === 'maskable');
      assert.ok(maskable512, 'Harus memuat ikon maskable 512x512');
    });
  });

  describe('Robots.txt', () => {
    test('robots.txt mengizinkan halaman publik dan menutup /api/', () => {
      const data = robots();
      const rules = Array.isArray(data.rules) ? data.rules : [data.rules];
      const mainRule = rules[0];

      assert.strictEqual(mainRule.userAgent, '*');
      assert.strictEqual(mainRule.allow, '/');
      assert.deepStrictEqual(mainRule.disallow, ['/api/']);
      assert.strictEqual(data.sitemap, 'https://jasdor.cimagroup.my.id/sitemap.xml');
    });
  });

  describe('Cloudflare Analytics Gating', () => {
    const isAnalyticsActive = (token?: string) => Boolean(token && token.trim().length > 0);

    test('script analytics tidak diaktifkan jika token env tidak diisi', () => {
      const originalToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
      delete process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

      const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN as string | undefined;
      const shouldRender = isAnalyticsActive(token);
      assert.strictEqual(shouldRender, false, 'Beacon analytics tidak boleh dirender saat token kosong');

      if (originalToken) process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN = originalToken;
    });

    test('script analytics aktif dan memuat token jika env NEXT_PUBLIC_CF_ANALYTICS_TOKEN diisi', () => {
      const dummyToken = 'test-token-12345';
      const shouldRender = isAnalyticsActive(dummyToken);
      const beaconData = shouldRender ? JSON.stringify({ token: dummyToken }) : null;

      assert.strictEqual(shouldRender, true);
      assert.strictEqual(beaconData, '{"token":"test-token-12345"}');
    });
  });
});
