import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProductsByQuery } from '../src/lib/menu-search.ts';
import type { Product } from '../src/types/domain.ts';

const mockProducts: Product[] = [
  {
    id: 1,
    bundleCode: 'tomoro-matcha-latte',
    productCode: '1350005',
    name: 'Matcha Latte',
    description: 'Kombinasi premium matcha yang wangi dan susu segar.',
    image: '',
    basePrice: 27000,
    originalPrice: 27000,
    isSoldOut: false,
    isCombo: false,
  },
  {
    id: 2,
    bundleCode: 'tomoro-matcha-oat-latte',
    productCode: '1350006',
    name: 'Matcha Oat Latte',
    description: 'Susu oat yang luar biasa enak dengan cita rasa matcha.',
    image: '',
    basePrice: 28000,
    originalPrice: 28000,
    isSoldOut: false,
    isCombo: false,
  },
  {
    id: 3,
    bundleCode: 'tomoro-aren-latte',
    productCode: '1100069',
    name: 'TOMORO Aren Latte',
    description: 'Kopi susu favorit dengan gula aren lokal dan susu segar.',
    image: '',
    basePrice: 21000,
    originalPrice: 21000,
    isSoldOut: false,
    isCombo: false,
  },
  {
    id: 4,
    bundleCode: 'tomoro-americano',
    productCode: '1100001',
    name: 'Americano',
    description: 'Kopi hitam arabika pilihan yang segar.',
    image: '',
    basePrice: 15000,
    originalPrice: 15000,
    isSoldOut: false,
    isCombo: false,
  },
];

test('filterProductsByQuery - returns empty array for empty or whitespace query', () => {
  assert.deepEqual(filterProductsByQuery(mockProducts, ''), []);
  assert.deepEqual(filterProductsByQuery(mockProducts, '   '), []);
});

test('filterProductsByQuery - filters by name (case-insensitive)', () => {
  const results = filterProductsByQuery(mockProducts, 'matcha');
  assert.equal(results.length, 2);
  assert.equal(results[0].name, 'Matcha Latte');
  assert.equal(results[1].name, 'Matcha Oat Latte');
});

test('filterProductsByQuery - filters by multi-word keywords', () => {
  const results = filterProductsByQuery(mockProducts, 'oat matcha');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Matcha Oat Latte');
});

test('filterProductsByQuery - filters by description keywords', () => {
  const results = filterProductsByQuery(mockProducts, 'arabika');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Americano');
});

test('filterProductsByQuery - deduplicates products with same code', () => {
  const duplicates = [...mockProducts, mockProducts[0]];
  const results = filterProductsByQuery(duplicates, 'matcha');
  assert.equal(results.length, 2);
});

test('filterProductsByQuery - returns empty array if no match', () => {
  const results = filterProductsByQuery(mockProducts, 'burger');
  assert.equal(results.length, 0);
});

test('filterProductsByQuery - integration with TOMORO real menu dataset', async () => {
  const { TOMORO_FINAL_PRODUCTS } = await import('../src/lib/tomoro-menu-data.ts');
  const prods = TOMORO_FINAL_PRODUCTS.map((p, idx) => ({
    id: idx + 1,
    bundleCode: p.bundleCode,
    productCode: p.productCode,
    name: p.name,
    description: p.description,
    image: p.image,
    basePrice: p.hargaNasional,
    originalPrice: p.hargaNasional,
    isSoldOut: p.isSoldOut,
    isCombo: p.isCombo,
  }));

  // Cari "matcha"
  const matchaList = filterProductsByQuery(prods, 'matcha');
  assert.ok(matchaList.length >= 4, 'Minimal 4 menu matcha di Tomoro');
  assert.ok(matchaList.some((m) => m.name === 'Matcha Latte'));

  // Cari "toast" / "sandwich" jika tidak ada
  const noMatch = filterProductsByQuery(prods, 'nasi goreng');
  assert.equal(noMatch.length, 0);

  // Cari "cloud"
  const cloudList = filterProductsByQuery(prods, 'cloud');
  assert.ok(cloudList.length >= 2, 'Menu dengan cloud foam');
});
