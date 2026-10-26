import type { Product, ProductOptionDetails, VariantSku } from '../types/domain.ts';
import { getKkMenuDescription } from './kk-menu-descriptions.ts';

/**
 * Pola regex kata kunci menu makanan / non-minuman (roti, pastry, bakery, pasta, snack, dan air mineral).
 * Digunakan untuk mendeteksi menu non-kustomisasi secara deterministik.
 */
export const FOOD_OR_NON_CUSTOMIZABLE_NAME_PATTERN =
  /\b(bagel|toast|panini|croissant|donut|doughnut|cookie|cookies|spaghetti|pasta|choux|puff|bread|roti|chiffon|cake|pie|muffin|brownie|brownies|quiche|sandwich|scone|waffle|air mineral)\b/i;

/**
 * Helper untuk memberikan fallback deskripsi produk yang sesuai (makanan vs minuman).
 */
export function getProductDescriptionFallback(
  product: { description?: string; name: string; category?: string },
  isFood: boolean
): string {
  if (product.description && product.description.trim() !== '') {
    return product.description.trim();
  }
  const officialDesc = getKkMenuDescription(product.name);
  if (officialDesc) {
    return officialDesc;
  }
  if (isFood) {
    return 'Menu lezat siap saji, tambahkan catatan jika ada permintaan khusus.';
  }
  return 'Pilih varian suhu, ukuran, dan topping favoritmu.';
}

/**
 * Daftar nama kategori / kelompok menu yang pasti merupakan makanan/non-minuman.
 */
export const FOOD_CATEGORY_NAMES = new Set([
  'kenangan toast',
  'food',
  'cerita roti',
  'kenangan manis',
  'bakery',
  'pastry',
  'snack',
  'fore deli',
]);

/**
 * Mengecek apakah suatu produk merupakan menu makanan atau menu non-minuman yang tidak memiliki kustomisasi varian.
 */
export function isFoodOrNonCustomizableProduct(product: {
  name: string;
  category?: string;
}): boolean {
  if (!product || !product.name) return false;

  // 1. Cek berdasarkan kelompok / kategori menu
  if (product.category) {
    const cleanCat = product.category.trim().toLowerCase();
    if (FOOD_CATEGORY_NAMES.has(cleanCat)) {
      return true;
    }
  }

  // 2. Cek berdasarkan kata kunci nama produk (mencakup menu makanan di kelompok "Baru!", dll)
  return FOOD_OR_NON_CUSTOMIZABLE_NAME_PATTERN.test(product.name);
}

/**
 * Menghasilkan ProductOptionDetails sintetis untuk produk non-kustomisasi (makanan / non-minuman).
 * Memiliki dimensions: [], addons: [], notes: [], dan 1 default SKU.
 */
export function getSynthesizedNonCustomizableOptions(product: Product): ProductOptionDetails {
  const defaultSkuCode = product.productCode || `${product.bundleCode || product.id}000`;
  const desc = product.description || getKkMenuDescription(product.name);
  const defaultSku: VariantSku = {
    sku: defaultSkuCode,
    combinationKey: '',
    name: product.name,
    description: desc,
    price: product.basePrice,
    variantAddition: 0,
  };

  return {
    product: {
      ...product,
      description: desc,
    },
    dimensions: [],
    skus: [defaultSku],
    optionMap: {
      '': defaultSku,
    },
    defaultSelectionMap: {},
    addons: [],
    notes: [],
  };
}

/**
 * Client-Side In-Memory Cache untuk opsi varian produk.
 * Memastikan setelah 1x diambil, pemanggilan berikutnya instan 0 ms tanpa skeleton.
 */
const clientOptionsMemoryCache = new Map<string, ProductOptionDetails>();

export function getClientCachedProductOptions(
  outletCode: string,
  bundleCode: string
): ProductOptionDetails | undefined {
  const key = `${outletCode.toUpperCase()}:${bundleCode}`;
  return clientOptionsMemoryCache.get(key);
}

export function setClientCachedProductOptions(
  outletCode: string,
  bundleCode: string,
  options: ProductOptionDetails
): void {
  const key = `${outletCode.toUpperCase()}:${bundleCode}`;
  clientOptionsMemoryCache.set(key, options);
}

export function clearClientCachedProductOptions(): void {
  clientOptionsMemoryCache.clear();
}
