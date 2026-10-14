import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  lockScroll,
  unlockScroll,
  getScrollLockCount,
} from '../src/hooks/useScrollLock.ts';

// Helper mock DOM sederhana untuk menguji logika lockScroll dan unlockScroll di Node environment
function setupMockDom(initialScrollY = 320) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  let scrolledToY: number | null = null;
  const bodyStyles: Record<string, string> = {};

  const mockDocument = {
    body: {
      style: bodyStyles,
      scrollTop: initialScrollY,
    },
    documentElement: {
      scrollTop: initialScrollY,
      clientWidth: 1000,
    },
  };

  const mockWindow = {
    scrollY: initialScrollY,
    pageYOffset: initialScrollY,
    innerWidth: 1015, // selisih 15px lebar scrollbar
    scrollTo: (x: number, y: number) => {
      scrolledToY = y;
    },
  };

  (globalThis as any).window = mockWindow;
  (globalThis as any).document = mockDocument;

  return {
    getScrolledToY: () => scrolledToY,
    getBodyStyles: () => bodyStyles,
    cleanup: () => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).document = originalDocument;
    },
  };
}

test('lockScroll mengunci body dengan position fixed dan menyimpan offset scroll', () => {
  const dom = setupMockDom(450);

  // Pastikan kondisi awal 0
  while (getScrollLockCount() > 0) {
    unlockScroll();
  }

  lockScroll();
  assert.strictEqual(getScrollLockCount(), 1, 'Lock count harus bertambah jadi 1');
  assert.strictEqual(dom.getBodyStyles().position, 'fixed', 'Body harus position: fixed');
  assert.strictEqual(dom.getBodyStyles().top, '-450px', 'Top offset harus -450px');
  assert.strictEqual(dom.getBodyStyles().overflow, 'hidden', 'Overflow harus hidden');
  assert.strictEqual(dom.getBodyStyles().width, '100%', 'Width harus 100%');
  assert.strictEqual(dom.getBodyStyles().paddingRight, '15px', 'Padding right harus mengimbangi lebar scrollbar (15px)');

  unlockScroll();
  assert.strictEqual(getScrollLockCount(), 0, 'Lock count harus kembali 0');
  assert.strictEqual(dom.getBodyStyles().position, '', 'Position harus dikembalikan');
  assert.strictEqual(dom.getBodyStyles().top, '', 'Top harus dikembalikan');
  assert.strictEqual(dom.getScrolledToY(), 450, 'Window harus di-scroll kembali tepat ke 450px');

  dom.cleanup();
});

test('Reference counting: overlay bertumpuk tidak melepas kunci sebelum overlay terakhir ditutup', () => {
  const dom = setupMockDom(200);

  while (getScrollLockCount() > 0) {
    unlockScroll();
  }

  // Buka overlay 1 (misal: CartDrawer)
  lockScroll();
  assert.strictEqual(getScrollLockCount(), 1);
  assert.strictEqual(dom.getBodyStyles().position, 'fixed');
  assert.strictEqual(dom.getBodyStyles().top, '-200px');

  // Buka overlay 2 bertumpuk (misal: dialog konfirmasi "Sudah kirim WA?")
  lockScroll();
  assert.strictEqual(getScrollLockCount(), 2, 'Lock count harus naik jadi 2');
  assert.strictEqual(dom.getBodyStyles().position, 'fixed');

  // Tutup overlay 2
  unlockScroll();
  assert.strictEqual(getScrollLockCount(), 1, 'Lock count harus turun ke 1');
  assert.strictEqual(dom.getBodyStyles().position, 'fixed', 'Body harus tetap terkunci saat masih ada overlay terbuka');
  assert.strictEqual(dom.getScrolledToY(), null, 'Scroll belum boleh dipulihkan');

  // Tutup overlay 1
  unlockScroll();
  assert.strictEqual(getScrollLockCount(), 0, 'Lock count harus 0');
  assert.strictEqual(dom.getBodyStyles().position, '', 'Body kunci dilepas');
  assert.strictEqual(dom.getScrolledToY(), 200, 'Scroll dipulihkan ke 200px');

  dom.cleanup();
});

test('Semua file overlay mengimpor useScrollLock dan menerapkan overscroll-contain & touch-none', () => {
  const cartDrawerCode = fs.readFileSync(path.resolve('src/components/CartDrawer.tsx'), 'utf-8');
  assert.ok(cartDrawerCode.includes("useScrollLock"), 'CartDrawer harus menggunakan useScrollLock');
  assert.ok(cartDrawerCode.includes("overscroll-contain"), 'CartDrawer harus memiliki overscroll-contain');
  assert.ok(cartDrawerCode.includes("touch-none"), 'CartDrawer harus memiliki touch-none pada backdrop');

  const productSheetCode = fs.readFileSync(path.resolve('src/components/ProductBottomSheet.tsx'), 'utf-8');
  assert.ok(productSheetCode.includes("useScrollLock"), 'ProductBottomSheet harus menggunakan useScrollLock');
  assert.ok(productSheetCode.includes("overscroll-contain"), 'ProductBottomSheet harus memiliki overscroll-contain');
  assert.ok(productSheetCode.includes("touch-none"), 'ProductBottomSheet harus memiliki touch-none pada backdrop/header');

  const switchModalCode = fs.readFileSync(path.resolve('src/components/SwitchOutletModal.tsx'), 'utf-8');
  assert.ok(switchModalCode.includes("useScrollLock"), 'SwitchOutletModal harus menggunakan useScrollLock');
  assert.ok(switchModalCode.includes("overscroll-contain"), 'SwitchOutletModal harus memiliki overscroll-contain');
  assert.ok(switchModalCode.includes("touch-none"), 'SwitchOutletModal harus memiliki touch-none pada backdrop');
});
