import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('portal page component and BrandCard exist and enforce Variant C specifications', () => {
  const brandCardPath = path.resolve('src/components/BrandCard.tsx');
  const portalPagePath = path.resolve('src/app/page.tsx');

  assert.ok(fs.existsSync(brandCardPath), 'src/components/BrandCard.tsx harus ada');
  assert.ok(fs.existsSync(portalPagePath), 'src/app/page.tsx harus ada');

  const cardCode = fs.readFileSync(brandCardPath, 'utf-8');
  const portalCode = fs.readFileSync(portalPagePath, 'utf-8');

  // 1. BrandCard checks
  assert.ok(cardCode.includes('Hemat 50%') || cardCode.includes('promoBadge'), 'BrandCard harus menampilkan badge promo');
  assert.ok(cardCode.includes('Segera Hadir'), 'BrandCard harus menangani status Segera Hadir');
  assert.ok(cardCode.includes('outletCount'), 'BrandCard harus mendukung prop outletCount dinamis');
  assert.ok(cardCode.includes('brand.logo'), 'BrandCard harus mendukung logo brand');
  assert.ok(cardCode.includes('object-contain'), 'Logo brand harus ditampilkan proporsional (object-contain)');
  // Aturan koreksi 1: Brand segera hadir tidak menampilkan 0 outlet
  assert.ok(!cardCode.includes("'0 outlet'"), 'BrandCard tidak boleh menampilkan string 0 outlet');

  // 2. Portal page checks
  assert.ok(portalCode.includes('CIMA GROUP') || portalCode.includes('Cima Group'), 'Portal harus memuat branding Cima Group');
  assert.ok(portalCode.includes('Jajan Favorit, Setengah Harga'), 'Portal harus memuat judul hero yang disetujui');
  assert.ok(portalCode.includes('getBrandOutletProvider'), 'Portal harus memuat outlet count dinamis dari BrandOutletProvider');
  assert.ok(portalCode.includes('outletCount'), 'Portal harus meneruskan outletCount ke BrandCard');
  // Aturan baru: Trust strip 3 item (Total Orderan, Orderan Hari Ini, Testimoni)
  assert.ok(portalCode.includes('TrustStrip'), 'Portal harus memuat komponen TrustStrip');
  // Section Testimoni dengan 3 TODO placeholders
  assert.ok(portalCode.includes('TODO'), 'Portal harus memuat penanda TODO jelas pada placeholder testimoni');
});
