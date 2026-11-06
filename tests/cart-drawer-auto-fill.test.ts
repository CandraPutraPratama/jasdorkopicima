import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cartDrawerCode = fs.readFileSync(
  path.resolve('src/components/CartDrawer.tsx'),
  'utf-8'
);

test('CartDrawer mengintegrasikan fitur auto-fill nama dan nomor WhatsApp dari saved-customer', () => {
  // 1. Memeriksa impor getSavedCustomer dan saveSavedCustomer
  assert.ok(
    cartDrawerCode.includes("import { getSavedCustomer, saveSavedCustomer } from '@/lib/saved-customer'"),
    'CartDrawer harus mengimpor getSavedCustomer dan saveSavedCustomer'
  );

  // 2. Memeriksa adanya auto-fill state dan effect saat drawer dibuka
  assert.ok(
    cartDrawerCode.includes('getSavedCustomer()'),
    'CartDrawer harus memanggil getSavedCustomer saat drawer dibuka'
  );
  assert.ok(
    cartDrawerCode.includes('hasAutoFilled'),
    'CartDrawer harus memiliki state hasAutoFilled'
  );

  // 3. Memeriksa penyimpanan data pelanggan saat order berhasil
  assert.ok(
    cartDrawerCode.includes('saveSavedCustomer(trimmedName, sanitizedPhone)'),
    'CartDrawer harus menyimpan info pelanggan setelah order berhasil dibuat'
  );

  // 4. Memeriksa badge indikator tersimpan otomatis di UI
  assert.ok(
    cartDrawerCode.includes('Tersimpan otomatis'),
    'CartDrawer harus menampilkan teks indikator Tersimpan otomatis'
  );

  // 5. Bebas dari karakter em dash (U+2014)
  assert.ok(
    !cartDrawerCode.includes('—'),
    'CartDrawer tidak boleh memuat em dash'
  );
});

