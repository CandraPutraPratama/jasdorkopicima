import test from 'node:test';
import assert from 'node:assert/strict';
import { REKOMENDASI_MENU_IDS, getRecommendedProducts } from '../src/lib/recommendations.ts';
import type { MenuGroup, Product } from '../src/types/domain.ts';

test('REKOMENDASI_MENU_IDS: kopi-kenangan memiliki tepat 8 menu sesuai spesifikasi', () => {
  const kkRecs = REKOMENDASI_MENU_IDS['kopi-kenangan'];
  assert.ok(Array.isArray(kkRecs), 'kopi-kenangan rekomendasi harus berupa array');
  assert.strictEqual(kkRecs.length, 8, 'Harus ada tepat 8 menu rekomendasi kopi-kenangan');

  const expectedMenus = [
    'Kopi Kenangan Mantan',
    'Spanish Latte',
    'Americano',
    'Latte',
    'Cappuccino',
    'Caramel Latte',
    'Vanilla Latte',
    'Milo Dinosaurus',
  ];

  for (const menu of expectedMenus) {
    assert.ok(kkRecs.includes(menu), `Menu "${menu}" harus terdaftar dalam REKOMENDASI_MENU_IDS['kopi-kenangan']`);
  }
});

test('getRecommendedProducts: mengembalikan 8 menu kurasi sesuai target persis dan case-insensitive', () => {
  const mockGroups: MenuGroup[] = [
    {
      code: 'coffee',
      name: 'Coffee',
      products: [
        { id: 1, name: 'kopi kenangan mantan', basePrice: 20000, isSoldOut: false } as Product,
        { id: 2, name: 'SPANISH LATTE', basePrice: 24000, isSoldOut: false } as Product,
        { id: 3, name: 'Americano', basePrice: 15000, isSoldOut: false } as Product,
        { id: 4, name: 'Latte', basePrice: 24000, isSoldOut: false } as Product,
        { id: 5, name: 'Cappuccino', basePrice: 24000, isSoldOut: false } as Product,
      ],
    },
    {
      code: 'non-coffee',
      name: 'Non Coffee',
      products: [
        { id: 6, name: 'Caramel Latte', basePrice: 28000, isSoldOut: false } as Product,
        { id: 7, name: 'Vanilla Latte', basePrice: 28000, isSoldOut: false } as Product,
        { id: 8, name: 'Milo Dinosaurus', basePrice: 22000, isSoldOut: false } as Product,
        { id: 9, name: 'Avocado Coffee', basePrice: 28000, isSoldOut: false } as Product,
      ],
    },
  ];

  const recs = getRecommendedProducts(mockGroups, 'kopi-kenangan');
  assert.strictEqual(recs.length, 8, 'Harus mengembalikan tepat 8 produk');
  assert.deepStrictEqual(
    recs.map((p) => p.id),
    [1, 2, 3, 4, 5, 6, 7, 8],
    'ID produk rekomendasi harus cocok dengan urutan kurasi'
  );
});

test('getRecommendedProducts: fallback ke menu lain yang tersedia jika ada menu target yang tidak ada di outlet', () => {
  const mockGroups: MenuGroup[] = [
    {
      code: 'coffee',
      name: 'Coffee',
      products: [
        { id: 1, name: 'Kopi Kenangan Mantan', basePrice: 20000, isSoldOut: false } as Product,
        { id: 2, name: 'Spanish Latte', basePrice: 24000, isSoldOut: false } as Product,
        // Menu 3-8 tidak ada, gantinya produk lain
        { id: 10, name: 'Extra Item 1', basePrice: 20000, isSoldOut: false } as Product,
        { id: 11, name: 'Extra Item 2', basePrice: 20000, isSoldOut: false } as Product,
        { id: 12, name: 'Extra Item 3', basePrice: 20000, isSoldOut: false } as Product,
        { id: 13, name: 'Extra Item 4', basePrice: 20000, isSoldOut: false } as Product,
        { id: 14, name: 'Extra Item 5', basePrice: 20000, isSoldOut: false } as Product,
        { id: 15, name: 'Extra Item 6', basePrice: 20000, isSoldOut: false } as Product,
        { id: 16, name: 'Extra Sold Out', basePrice: 20000, isSoldOut: true } as Product,
      ],
    },
  ];

  const recs = getRecommendedProducts(mockGroups, 'kopi-kenangan');
  assert.strictEqual(recs.length, 8, 'Harus tetap menghasilkan 8 produk lewat fallback');
  assert.strictEqual(recs[0].id, 1);
  assert.strictEqual(recs[1].id, 2);
  // Sold out item tidak boleh masuk fallback
  assert.ok(!recs.some((p) => p.id === 16), 'Item sold out tidak boleh dimasukkan sebagai fallback rekomendasi');
});

test('getRecommendedProducts: menangani menuGroups kosong tanpa error', () => {
  const recs = getRecommendedProducts([], 'kopi-kenangan');
  assert.strictEqual(recs.length, 0, 'Harus mengembalikan array kosong jika menuGroups kosong');
});
