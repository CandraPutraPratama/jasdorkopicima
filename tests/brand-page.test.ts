import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('dynamic brand page exists and handles active, coming_soon, and reserved/unknown routes', () => {
  const brandPagePath = path.resolve('src/app/[brandSlug]/page.tsx');
  assert.ok(fs.existsSync(brandPagePath), 'src/app/[brandSlug]/page.tsx harus ada');

  const pageCode = fs.readFileSync(brandPagePath, 'utf-8');

  // 1. Validasi proteksi slug & 404
  assert.ok(pageCode.includes('notFound()') || pageCode.includes('notFound'), 'Halaman brand harus memanggil notFound() untuk slug invalid');
  assert.ok(pageCode.includes('isReservedSlug'), 'Halaman brand harus memeriksa isReservedSlug');
  assert.ok(pageCode.includes('getBrandConfig'), 'Halaman brand harus memeriksa getBrandConfig');

  // 2. Tampilan Segera Hadir untuk brand pilot seperti Tomoro
  assert.ok(pageCode.includes('coming_soon'), 'Halaman brand harus menangani status coming_soon');
  assert.ok(pageCode.includes('Segera Hadir'), 'Halaman brand harus memuat badge/pesan Segera Hadir');
  assert.ok(pageCode.includes('Kembali ke Portal'), 'Halaman segera hadir harus memiliki link kembali ke portal');

  // 3. Tampilan Brand Aktif (Kopi Kenangan)
  assert.ok(pageCode.includes('OutletSearchCard'), 'Halaman brand aktif harus merender OutletSearchCard');
  assert.ok(pageCode.includes('HEMAT 50%') || pageCode.includes('promoBadge'), 'Halaman brand aktif harus memuat badge promo');
  assert.ok(pageCode.includes('Pilih Outlet') || pageCode.includes('Cari Outlet'), 'Halaman brand aktif harus memuat bagian pemilihan outlet');

  // 4. Istilah bisnis: Tidak boleh ada jastip
  assert.ok(!pageCode.toLowerCase().includes('jastip'), 'Tidak boleh ada kata jastip pada halaman brand');
});
