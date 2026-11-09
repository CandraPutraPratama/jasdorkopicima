import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isFoodOrNonCustomizableProduct,
  getSynthesizedNonCustomizableOptions,
  getProductDescriptionFallback,
  getInitialWhippedCream,
} from '../src/lib/product-customization.ts';
import type { Product } from '../src/types/domain.ts';
import { cleanNotes } from '../src/lib/whatsapp.ts';

describe('Food & Non-Customizable Products - Detection & Sheet Flow', () => {
  it('detects food products by category and name accurately', () => {
    // Kategori makanan / pastry resmi
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Triple Cheese Bagel', category: 'Food' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Bambang Choco Cheese Toast', category: 'Kenangan Toast' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Roti Coklat Klasik', category: 'Cerita Roti' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Soft Baked Cookie', category: 'Kenangan Manis' }),
      true
    );

    // Menu makanan di kelompok "Baru!" (terdeteksi lewat kata kunci nama)
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Triple Cheese Bagel', category: 'Baru!' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Classic Peanut Butter Panini', category: 'Baru!' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Butter Croissant' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Chocolate Donut' }),
      true
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Air Mineral' }),
      true
    );
  });

  it('does NOT treat customizable drinks as food or non-customizable', () => {
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Kopi Kenangan Mantan', category: 'Coffee' }),
      false
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Taro Cloud Matcha', category: 'Baru!' }),
      false
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Americano', category: 'Coffee' }),
      false
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Matcha Kenangan Frappe', category: 'Kenangan Frappe' }),
      false
    );
    assert.strictEqual(
      isFoodOrNonCustomizableProduct({ name: 'Avocado Coffee', category: 'Coffee' }),
      false
    );
  });

  it('generates synthesized options for non-customizable food products without dimensions/addons/notes', () => {
    const foodProduct: Product = {
      id: 5641200,
      bundleCode: '5641200',
      productCode: '5641200000',
      name: 'Triple Cheese Bagel',
      description: 'Roti bagel keju lezat',
      image: 'https://example.com/bagel.jpg',
      basePrice: 18000,
      originalPrice: 18000,
      isSoldOut: false,
      isCombo: false,
      category: 'Food',
    };

    const options = getSynthesizedNonCustomizableOptions(foodProduct);

    assert.strictEqual(options.product.name, 'Triple Cheese Bagel');
    assert.strictEqual(options.dimensions.length, 0, 'Dimensions harus kosong');
    assert.strictEqual(options.addons.length, 0, 'Addons harus kosong');
    assert.strictEqual(options.notes.length, 0, 'Notes harus kosong');
    assert.strictEqual(options.skus.length, 1, 'Harus memiliki 1 default SKU');
    assert.strictEqual(options.skus[0].price, 18000);
    assert.strictEqual(options.skus[0].variantAddition, 0);
  });

  it('sanitizes and preserves customer notes for food requests (e.g. minta dipanasin)', () => {
    const note = 'Minta tolong dipanasin yaa';
    const cleaned = cleanNotes(note);
    assert.strictEqual(cleaned, 'Minta tolong dipanasin yaa');

    // Memotong catatan jika melebihi 100 karakter
    const longNote = 'A'.repeat(120);
    assert.strictEqual(cleanNotes(longNote).length, 100);
  });

  it('provides food-appropriate fallback description without mentioning suhu, ukuran, or topping', () => {
    // 1. Makanan resmi KK dengan deskripsi kosong dari API otomatis terisi deskripsi resmi
    const toastFallback = getProductDescriptionFallback(
      { name: 'Bambang Choco Cheese Toast', description: '', category: 'Kenangan Toast' },
      true
    );
    assert.strictEqual(
      toastFallback,
      'Roti toast tebal dengan isi krim coklat, keju slice & topping susu kental manis'
    );
    assert.strictEqual(toastFallback.includes('Pilih varian suhu'), false);

    // 2. Makanan kustom/tidak terdaftar tanpa deskripsi menggunakan fallback santun
    const unlistedFoodFallback = getProductDescriptionFallback(
      { name: 'Roti Panggang Spesial Custom', description: '', category: 'Food' },
      true
    );
    assert.strictEqual(
      unlistedFoodFallback,
      'Menu lezat siap saji, tambahkan catatan jika ada permintaan khusus.'
    );

    // 3. Makanan dengan deskripsi bawaan tetap menampilkan deskripsinya
    const bagelWithDesc = getProductDescriptionFallback(
      { name: 'Triple Cheese Bagel', description: 'Roti bagel keju lezat', category: 'Food' },
      true
    );
    assert.strictEqual(bagelWithDesc, 'Roti bagel keju lezat');

    // 4. Minuman unlisted dengan deskripsi kosong menampilkan ajakan memilih varian
    const drinkFallback = getProductDescriptionFallback(
      { name: 'Minuman Rahasia Non Listing', description: '', category: 'Coffee' },
      false
    );
    assert.strictEqual(drinkFallback, 'Pilih varian suhu, ukuran, dan topping favoritmu.');
  });

  describe('getInitialWhippedCream defaults', () => {
    const mockWhippedOptions = {
      product: { name: 'Frappe' } as any,
      dimensions: [],
      skus: [],
      optionMap: {},
      defaultSelectionMap: {},
      addons: [
        { sku: 'WC-1', name: 'Whipped Cream Vanilla', price: 0, categoryName: 'Whipped Cream', group: 'whipped_cream' as const },
        { sku: 'WC-2', name: 'Whipped Cream Coklat', price: 0, categoryName: 'Whipped Cream', group: 'whipped_cream' as const },
        { sku: 'WC-0', name: 'No Whipped Cream', price: 0, categoryName: 'Whipped Cream', group: 'whipped_cream' as const },
      ],
      notes: [],
    };

    it('memilih default Whipped Cream Vanilla untuk menu Kenangan Frappe biasa', () => {
      const selected = getInitialWhippedCream(mockWhippedOptions, 'Butterscotch Kenangan Frappe');
      assert.ok(selected);
      assert.strictEqual(selected.name, 'Whipped Cream Vanilla');

      const selectedMatcha = getInitialWhippedCream(mockWhippedOptions, 'Matcha Kenangan Frappe');
      assert.ok(selectedMatcha);
      assert.strictEqual(selectedMatcha.name, 'Whipped Cream Vanilla');
    });

    it('memilih default Whipped Cream Coklat khusus untuk Dutch Choco Kenangan Frappe', () => {
      const selected = getInitialWhippedCream(mockWhippedOptions, 'Dutch Choco Kenangan Frappe');
      assert.ok(selected);
      assert.strictEqual(selected.name, 'Whipped Cream Coklat');
    });

    it('mengembalikan null jika tidak ada opsi whipped cream', () => {
      const selected = getInitialWhippedCream({ ...mockWhippedOptions, addons: [] }, 'Kopi Kenangan Mantan');
      assert.strictEqual(selected, null);
    });
  });
});
