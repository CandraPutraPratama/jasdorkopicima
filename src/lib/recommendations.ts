import type { MenuGroup, Product } from '@/types/domain';

/**
 * Daftar konfigurasi menu rekomendasi kurasi per brand.
 * Digunakan sebagai fallback kategori saat pengguna belum memiliki menu favorit di perangkatnya.
 */
export const REKOMENDASI_MENU_IDS: Record<string, string[]> = {
  'kopi-kenangan': [
    'Kopi Kenangan Mantan',
    'Spanish Latte',
    'Americano',
    'Latte',
    'Cappuccino',
    'Caramel Latte',
    'Vanilla Latte',
    'Milo Dinosaurus',
  ],
  fore: [
    'Butterscotch Sea Salt Latte',
    'Aren Latte',
    'Americano',
    'Cafe Latte',
    'Pandan Latte',
    'Matcha Green Tea',
    'Classic Drip',
    'Hibiscus Lychee Peach Yakult',
  ],
};

/**
 * Mengambil daftar produk rekomendasi kurasi untuk brand tertentu dari kelompok menu outlet.
 * Pencocokan dilakukan case-insensitive dengan nama persis terlebih dahulu,
 * kemudian substring, dan fallback ke menu populer yang tersedia.
 */
export function getRecommendedProducts(
  menuGroups: MenuGroup[],
  brandSlug: string = 'kopi-kenangan'
): Product[] {
  const brandKey = brandSlug.toLowerCase().includes('fore') ? 'fore' : 'kopi-kenangan';
  const targetNames = REKOMENDASI_MENU_IDS[brandKey] || REKOMENDASI_MENU_IDS['kopi-kenangan'];

  const allProducts: Product[] = [];
  const seenIds = new Set<number>();

  for (const group of menuGroups) {
    if (!group.products) continue;
    for (const prod of group.products) {
      if (!seenIds.has(prod.id)) {
        seenIds.add(prod.id);
        allProducts.push(prod);
      }
    }
  }

  const result: Product[] = [];
  const resultIds = new Set<number>();

  // 1. Cari berdasarkan kecocokan nama persis (case-insensitive & trimmed)
  for (const targetName of targetNames) {
    const norm = targetName.trim().toLowerCase();
    const match = allProducts.find(
      (p) => !resultIds.has(p.id) && p.name.trim().toLowerCase() === norm
    );
    if (match) {
      result.push(match);
      resultIds.add(match.id);
    }
  }

  // 2. Fallback pencocokan parsial jika ada nama yang sedikit berbeda
  if (result.length < targetNames.length) {
    for (const targetName of targetNames) {
      if (result.length >= targetNames.length) break;
      const norm = targetName.trim().toLowerCase();
      const match = allProducts.find(
        (p) => !resultIds.has(p.id) && p.name.trim().toLowerCase().includes(norm)
      );
      if (match) {
        result.push(match);
        resultIds.add(match.id);
      }
    }
  }

  // 3. Fallback lengkapi jika ada menu yang tidak tersedia di outlet tersebut
  if (result.length < 8 && allProducts.length > 0) {
    for (const prod of allProducts) {
      if (result.length >= 8) break;
      if (!resultIds.has(prod.id) && !prod.isSoldOut) {
        result.push(prod);
        resultIds.add(prod.id);
      }
    }
  }

  return result;
}
