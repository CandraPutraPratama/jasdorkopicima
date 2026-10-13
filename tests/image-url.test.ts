import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractProductImageUuid, rewriteProductImageUrl } from '../src/lib/image-url.ts';
import { normalizeProduct } from '../src/lib/adapter.ts';

describe('Image URL & Mirroring (Tahap 7-B)', () => {
  describe('extractProductImageUuid', () => {
    test('mengekstrak UUID dari pola 1 (/ID/release/pub/kk-api-management/product/<uuid>)', () => {
      const url = 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea?';
      const uuid = extractProductImageUuid(url);
      assert.strictEqual(uuid, 'ace3b7e3-7320-4adb-b9cb-61752ff91dea');
    });

    test('mengekstrak UUID dari pola 1 tanpa tanda tanya trailing', () => {
      const url = 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/73af63fc-8f5c-48c0-aece-da0307e77af8';
      const uuid = extractProductImageUuid(url);
      assert.strictEqual(uuid, '73af63fc-8f5c-48c0-aece-da0307e77af8');
    });

    test('mengekstrak UUID dari pola 2 (/public/<uuid>)', () => {
      const url = 'https://cdn.kopikenangan.com/public/392219eb-08e1-daf9-69d6-a12a8242e5be';
      const uuid = extractProductImageUuid(url);
      assert.strictEqual(uuid, '392219eb-08e1-daf9-69d6-a12a8242e5be');
    });

    test('mengembalikan huruf kecil konsisten jika sumber memiliki huruf kapital', () => {
      const url = 'https://cdn.kopikenangan.com/public/ACE3B7E3-7320-4ADB-B9CB-61752FF91DEA';
      const uuid = extractProductImageUuid(url);
      assert.strictEqual(uuid, 'ace3b7e3-7320-4adb-b9cb-61752ff91dea');
    });

    test('mengembalikan null untuk URL tanpa UUID valid', () => {
      assert.strictEqual(extractProductImageUuid('https://example.com/images/kopi.jpg'), null);
      assert.strictEqual(extractProductImageUuid('https://cdn.kopikenangan.com/public/not-a-uuid-format'), null);
      assert.strictEqual(extractProductImageUuid(''), null);
      assert.strictEqual(extractProductImageUuid(null), null);
      assert.strictEqual(extractProductImageUuid(undefined), null);
    });
  });

  describe('rewriteProductImageUrl', () => {
    const sampleUrl1 = 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea?';
    const sampleUrl2 = 'https://cdn.kopikenangan.com/public/392219eb-08e1-daf9-69d6-a12a8242e5be';
    const unknownUrl = 'https://images.unsplash.com/photo-12345';

    test('saat mode "kk", URL foto asal TIDAK berubah sama sekali', () => {
      assert.strictEqual(rewriteProductImageUrl(sampleUrl1, 'kk'), sampleUrl1);
      assert.strictEqual(rewriteProductImageUrl(sampleUrl2, 'kk'), sampleUrl2);
      assert.strictEqual(rewriteProductImageUrl(unknownUrl, 'kk'), unknownUrl);
    });

    test('saat mode "r2", URL foto pola 1 ditulis ulang ke domain R2 gambar.cimagroup.my.id', () => {
      const result = rewriteProductImageUrl(sampleUrl1, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg');
    });

    test('saat mode "r2", URL foto pola 2 ditulis ulang ke domain R2 gambar.cimagroup.my.id', () => {
      const result = rewriteProductImageUrl(sampleUrl2, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/product/392219eb-08e1-daf9-69d6-a12a8242e5be.jpg');
    });

    test('saat mode "r2", fallback aman mempertahankan URL asal jika UUID tidak dikenali', () => {
      const result = rewriteProductImageUrl(unknownUrl, 'r2');
      assert.strictEqual(result, unknownUrl);
    });

    test('mengembalikan string kosong jika input string kosong', () => {
      assert.strictEqual(rewriteProductImageUrl('', 'r2'), '');
      assert.strictEqual(rewriteProductImageUrl(null, 'r2'), '');
      assert.strictEqual(rewriteProductImageUrl(undefined, 'r2'), '');
    });
  });

  describe('Integrasi dengan normalizeProduct', () => {
    test('normalizeProduct menghasilkan gambar sesuai saklar konfigurasi', () => {
      const rawProduct = {
        id: 123,
        bundle_code: 'BND123',
        product_code: 'PRD123',
        name: 'Taro Cloud Matcha',
        description: 'Enak',
        image: 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea?',
        price: 22000,
        orig_price: 22000,
        is_sold_out: false,
        is_combo_v2: false,
      };

      const normalized = normalizeProduct(rawProduct as any);
      // Saat default (IMAGE_SOURCE=kk), tetap menunjuk ke cdn.kopikenangan.com
      assert.strictEqual(normalized.image, rawProduct.image);
    });
  });
});
