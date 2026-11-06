import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cartDrawerCode = fs.readFileSync(
  path.resolve('src/components/CartDrawer.tsx'),
  'utf-8'
);

test('CartDrawer: menyediakan tombol refresh interaktif saat error perubahan harga menu muncul', () => {
  // 1. Memeriksa adanya logika kondisional khusus error refresh
  assert.ok(
    cartDrawerCode.includes("errorMessage.toLowerCase().includes('refresh')"),
    'CartDrawer harus memeriksa apakah errorMessage memuat instruksi refresh'
  );

  // 2. Memeriksa pemanggilan window.location.reload()
  assert.ok(
    cartDrawerCode.includes('window.location.reload()'),
    'Tombol refresh harus memanggil window.location.reload()'
  );

  // 3. Memeriksa label tombol yang jelas bagi pengguna
  assert.ok(
    cartDrawerCode.includes('Perbarui Keranjang Sekarang'),
    'Label tombol harus Perbarui Keranjang Sekarang'
  );

  // 4. Memeriksa tombol tidak menggunakan em dash
  assert.ok(
    !cartDrawerCode.includes('—'),
    'CartDrawer tidak boleh memuat em dash (U+2014)'
  );
});
