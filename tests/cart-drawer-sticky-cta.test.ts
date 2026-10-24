import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cartDrawerCode = fs.readFileSync(
  path.resolve('src/components/CartDrawer.tsx'),
  'utf-8'
);

test('CartDrawer: tombol bayar ada di footer nempel, bukan di dalam area scroll', () => {
  const footerIdx = cartDrawerCode.indexOf('Footer tombol bayar');
  const ctaIdx = cartDrawerCode.indexOf('Lanjut ke Pembayaran');
  const queueIdx = cartDrawerCode.indexOf('Antrean:');
  assert.ok(footerIdx > 0, 'harus ada penanda footer tombol bayar');
  assert.ok(ctaIdx > footerIdx, 'tombol Lanjut ke Pembayaran harus ada di dalam footer');
  assert.ok(
    queueIdx > 0 && queueIdx < footerIdx,
    'info antrean harus tetap di area konten scroll, di atas footer'
  );
  assert.ok(
    cartDrawerCode.includes('shrink-0 border-t-2 border-[#2B1D12] bg-[#FAF4E8] p-3.5'),
    'footer harus shrink-0 dengan border atas supaya selalu nempel di bawah drawer'
  );
});

test('CartDrawer: zona bawah memakai wrapper scroll sendiri, bukan scroll di container luar', () => {
  assert.ok(
    cartDrawerCode.includes('flex flex-col min-h-0 max-h-[65vh]'),
    'container zona bawah harus flex-col berbatas tinggi supaya footer bisa nempel'
  );
  assert.ok(
    cartDrawerCode.includes('flex-1 min-h-0 overflow-y-auto overscroll-contain'),
    'form + ringkasan harus punya wrapper scroll sendiri di atas footer'
  );
});

test('CartDrawer: foto item diperkecil dari 56px ke 48px', () => {
  assert.ok(cartDrawerCode.includes('w-12 h-12'), 'thumbnail item harus w-12 h-12 (48px)');
  assert.ok(cartDrawerCode.includes('sizes="48px"'), 'sizes gambar harus 48px');
  assert.ok(!cartDrawerCode.includes('w-14 h-14'), 'tidak boleh ada lagi thumbnail 56px');
});

test('CartDrawer: ketiga varian tombol footer tetap ada', () => {
  assert.ok(
    cartDrawerCode.includes('Outlet Sedang Tutup - Tidak Bisa Dipesan'),
    'varian outlet tutup harus tetap ada'
  );
  assert.ok(
    cartDrawerCode.includes('Lanjut ke Pembayaran'),
    'varian normal harus tetap ada'
  );
});
