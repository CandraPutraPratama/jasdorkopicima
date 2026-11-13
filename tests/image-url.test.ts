import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractProductImageUuid, rewriteProductImageUrl } from '../src/lib/image-url.ts';
import { normalizeProduct, normalizeProductOptions } from '../src/lib/adapter.ts';

describe('Image URL & Manifest Mirroring (Tahap 7-B & 7-C)', () => {
  test('gambar placeholder bawaan KK dikembalikan kosong agar UI memakai fallback, di source kk maupun r2', () => {
    const placeholder = 'https://cdn.kopikenangan.com/public/5376bb69-9e4f-6cb5-5bc7-b1503a7a4032';
    assert.strictEqual(rewriteProductImageUrl(placeholder, 'kk'), '');
    assert.strictEqual(rewriteProductImageUrl(placeholder, 'r2'), '');
    const real = 'https://cdn.kopikenangan.com/public/392219eb-08e1-daf9-69d6-a12a8242e5be';
    assert.strictEqual(rewriteProductImageUrl(real, 'kk'), real);
  });

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

  describe('lookupManifestMirrorUrl & rewriteProductImageUrl', () => {
    // Sampel menu image yang ada di manifest
    const sampleMenuUrl = 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea?';
    // Sampel opsi product image yang ada di manifest
    const sampleOptionProductUrl = 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/6c925d17-6b7f-4952-9831-b0032ffd62e0?';
    // Sampel addon icon yang ada di manifest (PNG)
    const sampleAddonIconUrl = 'https://cdn.kopikenangan.com/public/9cd1e244-71b6-cda9-7b55-ad29237aaef3';
    // Sampel dimension attribute icon yang ada di manifest
    const sampleAttributeIconUrl = 'https://cdn.kopikenangan.com/image/attribute_image/Ice.png';
    // URL tidak dikenal / belum termirror
    const unmirroredUrl = 'https://cdn.kopikenangan.com/public/00000000-0000-0000-0000-000000000000';
    const externalUrl = 'https://images.unsplash.com/photo-12345';

    test('saat mode "kk", URL foto asal TIDAK berubah sama sekali', () => {
      assert.strictEqual(rewriteProductImageUrl(sampleMenuUrl, 'kk'), sampleMenuUrl);
      assert.strictEqual(rewriteProductImageUrl(sampleOptionProductUrl, 'kk'), sampleOptionProductUrl);
      assert.strictEqual(rewriteProductImageUrl(sampleAddonIconUrl, 'kk'), sampleAddonIconUrl);
      assert.strictEqual(rewriteProductImageUrl(sampleAttributeIconUrl, 'kk'), sampleAttributeIconUrl);
      assert.strictEqual(rewriteProductImageUrl(unmirroredUrl, 'kk'), unmirroredUrl);
      assert.strictEqual(rewriteProductImageUrl(externalUrl, 'kk'), externalUrl);
    });

    test('saat mode "r2", gambar menu termirror ditulis ulang ke domain R2', () => {
      const result = rewriteProductImageUrl(sampleMenuUrl, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg');
    });

    test('saat mode "r2", gambar opsi product.image termirror ditulis ulang ke domain R2', () => {
      const result = rewriteProductImageUrl(sampleOptionProductUrl, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/product/6c925d17-6b7f-4952-9831-b0032ffd62e0.jpg');
    });

    test('saat mode "r2", ikon addon termirror ditulis ulang ke domain R2 dengan ekstensi asli (.png)', () => {
      const result = rewriteProductImageUrl(sampleAddonIconUrl, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/product/9cd1e244-71b6-cda9-7b55-ad29237aaef3.png');
    });

    test('saat mode "r2", ikon attribute termirror ditulis ulang ke prefix attribute/ (.png)', () => {
      const result = rewriteProductImageUrl(sampleAttributeIconUrl, 'r2');
      assert.strictEqual(result, 'https://gambar.cimagroup.my.id/attribute/Ice.png');
    });

    test('saat mode "r2", URL tak dikenal di manifest WAJIB dibiarkan apa adanya (tidak ditebak)', () => {
      assert.strictEqual(rewriteProductImageUrl(unmirroredUrl, 'r2'), unmirroredUrl);
      assert.strictEqual(rewriteProductImageUrl(externalUrl, 'r2'), externalUrl);
    });

    test('mengembalikan string kosong jika input string kosong / falsy', () => {
      assert.strictEqual(rewriteProductImageUrl('', 'r2'), '');
      assert.strictEqual(rewriteProductImageUrl(null, 'r2'), '');
      assert.strictEqual(rewriteProductImageUrl(undefined, 'r2'), '');
    });
  });

  describe('Integrasi dengan normalizeProduct (Menu)', () => {
    test('gambar menu yang ada di manifest tertulis ulang ke R2 saat mode r2', () => {
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
      assert.strictEqual(
        normalized.image,
        'https://gambar.cimagroup.my.id/product/ace3b7e3-7320-4adb-b9cb-61752ff91dea.jpg'
      );
    });

    test('gambar menu yang TIDAK ada di manifest tetap memakai URL aslinya (regresi pengerasan)', () => {
      const unmirroredMenuUrl = 'https://cdn.kopikenangan.com/public/99999999-9999-9999-9999-999999999999';
      const rawProduct = {
        id: 124,
        bundle_code: 'BND124',
        product_code: 'PRD124',
        name: 'Produk Baru Eksperimen',
        description: 'Baru',
        image: unmirroredMenuUrl,
        price: 20000,
        orig_price: 20000,
        is_sold_out: false,
        is_combo_v2: false,
      };

      const normalized = normalizeProduct(rawProduct as any);
      assert.strictEqual(normalized.image, unmirroredMenuUrl);
    });
  });

  describe('Integrasi dengan normalizeProductOptions (Endpoint Opsi Produk)', () => {
    test('menulis ulang ketiga kelas field opsi: product.image, dimensions icon, dan addons icon saat termirror', () => {
      const rawOptions = {
        base_product: {
          id: 12382,
          bundle_code: '7245645',
          name: 'Taro Cloud Latte',
          description: 'Espresso creamy',
          image: 'https://cdn.kopikenangan.com/ID/release/pub/kk-api-management/product/6c925d17-6b7f-4952-9831-b0032ffd62e0?',
          price: 22000,
          orig_price: 22000,
          is_soldout: false,
        },
        product_dimension_wording: {
          dimension_wordings: [
            {
              dimension_code: 1,
              dimension_text: 'Temperature',
              dimension_value_wordings: [
                {
                  value: 101,
                  value_text: 'Ice',
                  icon: 'https://cdn.kopikenangan.com/image/attribute_image/Ice.png',
                },
                {
                  value: 102,
                  value_text: 'Hot',
                  icon: 'https://cdn.kopikenangan.com/image/attribute_image/Hot.png',
                },
                {
                  value: 103,
                  value_text: 'Custom Temp Unmirrored',
                  icon: 'https://cdn.kopikenangan.com/image/attribute_image/UnknownTemp.png',
                },
              ],
            },
          ],
        },
        option_product_map: {
          '101': {
            name: 'Taro Cloud Latte Ice',
            price: 22000,
            product_code: 'SKU101',
          },
        },
        product_addon_wording: {
          addon_wordings: [
            {
              dimension_text: 'Topping',
              dimension_value_wordings: [
                {
                  addon_sku: 'ADD1',
                  value_text: 'Boba',
                  addon_price: 4000,
                  value_icon: 'https://cdn.kopikenangan.com/public/9cd1e244-71b6-cda9-7b55-ad29237aaef3',
                },
                {
                  addon_sku: 'ADD2',
                  value_text: 'Grass Jelly Unmirrored',
                  addon_price: 4000,
                  value_icon: 'https://cdn.kopikenangan.com/public/00000000-9999-8888-7777-666666666666',
                },
              ],
            },
          ],
        },
      };

      const normalized = normalizeProductOptions(rawOptions as any);

      // 1. product.image
      assert.strictEqual(
        normalized.product.image,
        'https://gambar.cimagroup.my.id/product/6c925d17-6b7f-4952-9831-b0032ffd62e0.jpg'
      );

      // 2. dimensions[].values[].icon
      const tempDim = normalized.dimensions.find((d) => d.name === 'Temperature');
      assert.ok(tempDim);
      assert.strictEqual(
        tempDim.values.find((v) => v.name === 'Ice')?.icon,
        'https://gambar.cimagroup.my.id/attribute/Ice.png'
      );
      assert.strictEqual(
        tempDim.values.find((v) => v.name === 'Hot')?.icon,
        'https://gambar.cimagroup.my.id/attribute/Hot.png'
      );
      // Ikon yang tidak ada di manifest dibiarkan apa adanya
      assert.strictEqual(
        tempDim.values.find((v) => v.name === 'Custom Temp Unmirrored')?.icon,
        'https://cdn.kopikenangan.com/image/attribute_image/UnknownTemp.png'
      );

      // 3. addons[].icon
      const bobaAddon = normalized.addons.find((a) => a.name === 'Boba');
      assert.ok(bobaAddon);
      assert.strictEqual(
        bobaAddon.icon,
        'https://gambar.cimagroup.my.id/product/9cd1e244-71b6-cda9-7b55-ad29237aaef3.png'
      );
      // Addon ikon yang tidak ada di manifest dibiarkan apa adanya
      const unmirroredAddon = normalized.addons.find((a) => a.name === 'Grass Jelly Unmirrored');
      assert.ok(unmirroredAddon);
      assert.strictEqual(
        unmirroredAddon.icon,
        'https://cdn.kopikenangan.com/public/00000000-9999-8888-7777-666666666666'
      );
    });
  });
});
