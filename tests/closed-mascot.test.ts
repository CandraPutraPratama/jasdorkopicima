import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mascot = readFileSync('src/components/ClosedMascot.tsx', 'utf8');
const screen = readFileSync('src/components/ClosedScreen.tsx', 'utf8');

test('ClosedMascot punya dua varian: tutup dan istirahat', () => {
  assert.ok(mascot.includes("variant === 'tutup'"), 'varian tutup harus ada');
  assert.ok(mascot.includes('TUTUP'), 'papan TUTUP harus ada di varian tutup');
  assert.ok(mascot.includes('>Z<'), 'huruf Z tidur harus ada di varian istirahat');
  assert.ok(mascot.includes('cm-steam'), 'uap kopi harus ada di varian istirahat');
});

test('ClosedMascot animasi murni CSS dan hormat reduced-motion', () => {
  assert.ok(mascot.includes('prefers-reduced-motion: no-preference'), 'keyframe hanya jalan tanpa reduced-motion');
  assert.ok(mascot.includes('@keyframes cm-swing'), 'goyang papan harus ada');
  assert.ok(mascot.includes('@keyframes cm-zzz'), 'animasi Z harus ada');
  assert.ok(!mascot.includes('setInterval') && !mascot.includes('setTimeout'), 'tidak ada timer JS');
});

test('ClosedScreen memakai ClosedMascot dan memilih varian dari alasan tutup', () => {
  assert.ok(screen.includes('ClosedMascot'), 'ClosedScreen harus merender ClosedMascot');
  assert.ok(screen.includes("sementara oleh admin"), 'force_closed harus dipetakan ke istirahat');
  assert.ok(!screen.includes('Status Icon Badge'), 'badge jam statis sudah diganti panggung animasi');
});

test('Ketiga halaman meneruskan varian ke ClosedScreen', () => {
  for (const path of ['src/app/page.tsx', 'src/app/[brandSlug]/page.tsx', 'src/app/outlet/[code]/page.tsx']) {
    const src = readFileSync(path, 'utf8');
    assert.ok(
      src.includes("overrideType === 'force_closed' ? 'istirahat' : 'tutup'"),
      `${path} harus meneruskan varian istirahat saat force_closed`
    );
  }
});
