import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('outlet page uses resolveBrandSlugFromOutletCode and navigates back to brand page instead of portal root', () => {
  const outletPagePath = path.resolve('src/app/outlet/[code]/page.tsx');
  assert.ok(fs.existsSync(outletPagePath), 'src/app/outlet/[code]/page.tsx harus ada');

  const pageCode = fs.readFileSync(outletPagePath, 'utf-8');

  // 1. Integrasi resolveBrandSlugFromOutletCode
  assert.ok(
    pageCode.includes('resolveBrandSlugFromOutletCode'),
    'src/app/outlet/[code]/page.tsx harus menggunakan resolveBrandSlugFromOutletCode'
  );

  // 2. Header backHref harus mengarah ke brandSlug (bukan hardcoded '/')
  assert.ok(
    pageCode.includes('backHref={`/${brandSlug}`}') || pageCode.includes('backHref={`/${brandSlug}') || pageCode.includes('backHref={brandUrl}'),
    'Header backHref harus mengarah ke halaman brand terkait'
  );

  // 3. Tombol "Pilih Outlet Lain" pada closed banner harus mengarah ke brandSlug (bukan '/')
  assert.ok(
    pageCode.includes('href={`/${brandSlug}`}') || pageCode.includes('href={`/${brandSlug}') || pageCode.includes('href={brandUrl}'),
    'Tombol Pilih Outlet Lain harus mengarahkan kembali ke halaman brand terkait'
  );

  // 4. Memastikan proteksi Batch 3 (isOutletClosed, banner, validate-cart) tetap ada
  assert.ok(pageCode.includes('isOutletClosed'), 'Proteksi isOutletClosed harus tetap ada');
  assert.ok(pageCode.includes('Outlet ini sedang tutup'), 'Banner peringatan outlet tutup harus tetap ada');

  const cartDrawerPath = path.resolve('src/components/CartDrawer.tsx');
  const cartDrawerCode = fs.readFileSync(cartDrawerPath, 'utf-8');
  assert.ok(cartDrawerCode.includes('validate-cart'), 'Validasi cart API harus tetap ada di CartDrawer');
});
