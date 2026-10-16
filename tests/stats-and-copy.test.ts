import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getStartOfTodayWIB,
  formatTotalOrders,
} from '../src/lib/order-stats.ts';
import {
  TOTAL_ORDERS_BASELINE,
  RESERVED_SLUGS,
  SITE_CONFIG,
} from '../src/lib/site-config.ts';
import { TESTIMONIALS } from '../src/data/testimonials.ts';

test('order-stats: getStartOfTodayWIB menghasilkan format ISO awal hari WIB (00:00:00+07:00)', () => {
  // Test dengan reference date tertentu: 2026-10-17 02:00:00 UTC (09:00:00 WIB)
  const refDate = new Date('2026-10-17T02:00:00Z');
  const startWIB = getStartOfTodayWIB(refDate);
  assert.equal(startWIB, '2026-10-17T00:00:00+07:00');

  // Test pergantian hari WIB: 2026-10-16 18:00:00 UTC (2026-10-17 01:00:00 WIB)
  const lateUTC = new Date('2026-10-16T18:00:00Z');
  assert.equal(getStartOfTodayWIB(lateUTC), '2026-10-17T00:00:00+07:00');

  // Test format regex
  assert.match(getStartOfTodayWIB(), /^\d{4}-\d{2}-\d{2}T00:00:00\+07:00$/);
});

test('order-stats: formatTotalOrders memformat angka ke format ringkas dengan benar', () => {
  assert.equal(formatTotalOrders(1636), '1.6k+');
  assert.equal(formatTotalOrders(1699), '1.7k+');
  assert.equal(formatTotalOrders(2000), '2.0k+');
  assert.equal(formatTotalOrders(2540), '2.5k+');
  assert.equal(formatTotalOrders(500), '500+');
  assert.equal(formatTotalOrders(0), '0+');
});

test('site-config: TOTAL_ORDERS_BASELINE adalah 1636 dan testimoni terdaftar di RESERVED_SLUGS', () => {
  assert.equal(TOTAL_ORDERS_BASELINE, 1636);
  assert.ok(RESERVED_SLUGS.includes('testimoni' as any), 'testimoni harus terdaftar di RESERVED_SLUGS');
  assert.ok(SITE_CONFIG.navLinks.some((l) => l.href === '/testimoni'), 'testimoni harus ada di navLinks footer');
});

test('testimonials: dataset terstruktur dan memiliki item valid', () => {
  assert.ok(Array.isArray(TESTIMONIALS));
  assert.ok(TESTIMONIALS.length >= 3);
  for (const item of TESTIMONIALS) {
    assert.ok(item.id, 'id harus ada');
    assert.ok(item.name, 'name harus ada');
    assert.ok(item.quote, 'quote harus ada');
    assert.ok(item.brand, 'brand harus ada');
  }
});

test('verifikasi copy: tidak ada kata "independen" dan tidak ada em dash "—" di src/', () => {
  function scanDir(dir: string, extFilter: RegExp): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanDir(fullPath, extFilter));
      } else if (extFilter.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const srcFiles = scanDir(path.resolve('src'), /\.(ts|tsx|js|jsx)$/);

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    assert.ok(
      !content.toLowerCase().includes('independen'),
      `File ${file} tidak boleh memuat kata "independen"`
    );
    assert.ok(
      !content.includes('—'),
      `File ${file} tidak boleh memuat em dash U+2014 "—"`
    );
  }
});

test('verifikasi copy: teks bantuan outlet tidak memuat nomor telepon dalam kurung', () => {
  const brandPagePath = path.resolve('src/app/[brandSlug]/page.tsx');
  const portalPagePath = path.resolve('src/app/page.tsx');

  const brandPageCode = fs.readFileSync(brandPagePath, 'utf-8');
  const portalPageCode = fs.readFileSync(portalPagePath, 'utf-8');

  assert.ok(
    brandPageCode.includes('Admin siap bantu via WhatsApp</p>'),
    'Halaman brand harus menampilkan "Admin siap bantu via WhatsApp" tanpa nomor telepon'
  );
  assert.ok(
    portalPageCode.includes('Admin siap bantu via WhatsApp</p>'),
    'Halaman portal harus menampilkan "Admin siap bantu via WhatsApp" tanpa nomor telepon'
  );
});

test('api: /api/stats/order-counts mengembalikan { today, total } dengan benar', async () => {
  const { setSupabaseServerClientInstance } = await import('../src/lib/supabase-server.ts');
  const { GET } = await import('../src/app/api/stats/order-counts/route.ts');

  // Test 1: Fallback jika Supabase error
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        gte: async () => ({ count: null, error: new Error('DB Error') }),
        then: (resolve: any) => resolve({ count: null, error: new Error('DB Error') }),
      }),
    }),
  } as any);

  const fallbackRes = await GET();
  const fallbackData = await fallbackRes.json();
  assert.equal(fallbackData.today, 0);
  assert.equal(fallbackData.total, 1636);

  // Test 2: Normal response dengan data mock
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        gte: async () => ({ count: 12, error: null }),
        then: (resolve: any) => resolve({ count: 25, error: null }),
      }),
    }),
  } as any);

  const successRes = await GET();
  const successData = await successRes.json();
  assert.equal(successData.today, 12);
  assert.equal(successData.total, 1636 + 25);

  setSupabaseServerClientInstance(null);
});

