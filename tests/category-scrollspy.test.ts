import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  determineActiveCategory,
  CHIP_BAR_HEIGHT,
  SECTION_SCROLL_MARGIN_TOP,
  SCROLLSPY_TOP_OFFSET,
} from '../src/lib/category-scrollspy.ts';

test('determineActiveCategory: mengembalikan string kosong jika tidak ada sections', () => {
  const result = determineActiveCategory({ sections: [] });
  assert.strictEqual(result, '');
});

test('determineActiveCategory: default ke section pertama saat di posisi atas', () => {
  const sections = [
    { code: 'coffee', top: 220 },
    { code: 'non-coffee', top: 600 },
    { code: 'toast', top: 1100 },
    { code: 'food', top: 1500 },
  ];

  const result = determineActiveCategory({ sections });
  assert.strictEqual(result, 'coffee', 'Kategori pertama (coffee) harus aktif saat berada di bagian paling atas');
});

test('determineActiveCategory: berpindah ke kategori berikutnya saat section tersebut mencapai topOffset', () => {
  const sections = [
    { code: 'coffee', top: -300 },
    { code: 'non-coffee', top: 50 }, // <= topOffset (72) + 15
    { code: 'toast', top: 600 },
    { code: 'food', top: 1100 },
  ];

  const result = determineActiveCategory({ sections });
  assert.strictEqual(result, 'non-coffee', 'Kategori non-coffee harus aktif saat sudah mencapai sticky bar');
});

test('determineActiveCategory: saat scroll mencapai dasar halaman (isAtBottom: true), kategori terakhir selalu aktif', () => {
  // Sering kali kategori terakhir seperti 'food' memiliki item sedikit sehingga top-nya masih di 250px
  const sections = [
    { code: 'coffee', top: -1200 },
    { code: 'non-coffee', top: -700 },
    { code: 'toast', top: -200 },
    { code: 'food', top: 250 }, // belum mencapai topOffset 72px
  ];

  const result = determineActiveCategory({ sections, isAtBottom: true });
  assert.strictEqual(result, 'food', 'Kategori terakhir (food) harus aktif saat scroll mencapai dasar halaman');
});

test('Konstanta margin scroll: SECTION_SCROLL_MARGIN_TOP harus lebih besar dari CHIP_BAR_HEIGHT', () => {
  assert.strictEqual(SCROLLSPY_TOP_OFFSET, 72, 'SCROLLSPY_TOP_OFFSET default harus 72px');
  assert.ok(CHIP_BAR_HEIGHT >= 50, 'Tinggi bar chip minimal 50px');
  assert.ok(
    SECTION_SCROLL_MARGIN_TOP > CHIP_BAR_HEIGHT,
    'scroll-margin-top harus lebih besar dari tinggi bar chip agar judul tidak tertutup'
  );
  assert.ok(
    SECTION_SCROLL_MARGIN_TOP - CHIP_BAR_HEIGHT >= 8,
    'Jarak aman antara bar chip dan judul kategori minimal 8px'
  );
});

test('MenuCategoryNav.tsx: sticky top-0, fade gradient, dan penggeseran chip mandiri tanpa scrollIntoView', () => {
  const navCode = fs.readFileSync(path.resolve('src/components/MenuCategoryNav.tsx'), 'utf-8');

  assert.ok(navCode.includes('sticky top-0 z-20'), 'MenuCategoryNav harus sticky top-0 dengan z-index 20');
  assert.ok(navCode.includes('no-scrollbar'), 'Deretan chip harus menggunakan no-scrollbar');
  assert.ok(navCode.includes('canScrollRight'), 'MenuCategoryNav harus melacak status canScrollRight');
  assert.ok(navCode.includes('bg-gradient-to-l'), 'Harus memuat fade gradient di tepi kanan');

  // Syarat keras Item 3.1: Dilarang memakai scrollIntoView pada chip yang menyeret window
  assert.ok(
    !navCode.includes('scrollIntoView'),
    'Dilarang menggunakan scrollIntoView pada chip karena menyeret window'
  );
  assert.ok(
    navCode.includes('container.scrollTo'),
    'Penggeseran chip harus dilakukan manual pada scroll container'
  );
});

test('page.tsx dan Header.tsx mendukung sticky chip bar di tepi atas dan lompat instan', () => {
  const pageCode = fs.readFileSync(path.resolve('src/app/outlet/[code]/page.tsx'), 'utf-8');
  assert.ok(pageCode.includes('sticky={false}'), 'Header di halaman outlet harus non-sticky agar bar chip menempel di tepi atas');
  assert.ok(pageCode.includes('window.scrollTo'), 'Klik chip harus melompat menggunakan window.scrollTo');
  assert.ok(pageCode.includes("behavior: 'auto'"), 'Klik chip harus melompat instan (behavior: auto)');
  assert.ok(pageCode.includes('scroll-mt-[68px]'), 'Setiap section kategori harus memiliki scroll-margin-top 68px');
  assert.ok(pageCode.includes('isManualClickRef'), 'Harus ada mekanisme penahan scrollspy sesaat setelah klik chip');

  const headerCode = fs.readFileSync(path.resolve('src/components/Header.tsx'), 'utf-8');
  assert.ok(headerCode.includes('sticky = true'), 'Header harus mendukung prop sticky opsional (default true)');
});

test('globals.css dan layout.tsx menggunakan overflow-x: clip agar sticky tidak rusak di desktop', () => {
  const cssCode = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf-8');
  assert.ok(cssCode.includes('overflow-x: clip'), 'globals.css harus menggunakan overflow-x: clip pada html, body');

  const layoutCode = fs.readFileSync(path.resolve('src/app/layout.tsx'), 'utf-8');
  assert.ok(
    layoutCode.includes('overflow-x-clip'),
    'layout.tsx wrapper harus menggunakan overflow-x-clip (bukan overflow-x-hidden)'
  );
});
