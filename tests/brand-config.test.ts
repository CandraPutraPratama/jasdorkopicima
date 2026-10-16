import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandConfig,
  getAllBrands,
  isReservedSlug,
  resolveBrandSlugFromOutletCode,
  type BrandConfig,
} from '../src/lib/site-config.ts';

test('getBrandConfig returns full config for kopi-kenangan', () => {
  const brand = getBrandConfig('kopi-kenangan');
  assert.ok(brand !== null, 'brand kopi-kenangan harus terdaftar');
  assert.equal(brand?.slug, 'kopi-kenangan');
  assert.equal(brand?.name, 'Kopi Kenangan');
  assert.equal(brand?.status, 'active');
  assert.equal(brand?.promoBadge, 'Hemat 50%');
  assert.equal(brand?.logo, '/brand-logos/kopi-kenangan.png');
  assert.equal(brand?.outletCountLabel, undefined, 'Tidak ada angka outlet di-hardcode di BrandConfig');
  assert.ok(brand?.accentColor);
});

test('getBrandConfig returns coming_soon status for tomoro', () => {
  const brand = getBrandConfig('tomoro');
  assert.ok(brand !== null, 'brand tomoro harus terdaftar');
  assert.equal(brand?.slug, 'tomoro');
  assert.equal(brand?.name, 'Tomoro Coffee');
  assert.equal(brand?.status, 'coming_soon');
  assert.equal(brand?.promoBadge, 'Segera Hadir');
  assert.equal(brand?.logo, undefined);
  // Aturan koreksi user: jangan tampilkan teks "0 outlet" untuk brand segera hadir
  assert.equal(brand?.outletCountLabel, undefined);
});

test('getBrandConfig returns null for unknown brand slug', () => {
  const brand = getBrandConfig('starbucks-unknown');
  assert.equal(brand, null);
});

test('getAllBrands returns registered brands list', () => {
  const brands = getAllBrands();
  assert.ok(Array.isArray(brands));
  assert.ok(brands.length >= 2);
  const slugs = brands.map((b) => b.slug);
  assert.ok(slugs.includes('kopi-kenangan'));
  assert.ok(slugs.includes('tomoro'));
});

test('isReservedSlug blocks protected system routes', () => {
  assert.equal(isReservedSlug('faq'), true);
  assert.equal(isReservedSlug('syarat-ketentuan'), true);
  assert.equal(isReservedSlug('kebijakan-privasi'), true);
  assert.equal(isReservedSlug('kontak'), true);
  assert.equal(isReservedSlug('outlet'), true);
  assert.equal(isReservedSlug('api'), true);
  assert.equal(isReservedSlug('kopi-kenangan'), false);
  assert.equal(isReservedSlug('tomoro'), false);
});

test('resolveBrandSlugFromOutletCode resolves to kopi-kenangan by default', () => {
  assert.equal(resolveBrandSlugFromOutletCode('LIPPO-PURI'), 'kopi-kenangan');
  assert.equal(resolveBrandSlugFromOutletCode('KALCIT'), 'kopi-kenangan');
});
