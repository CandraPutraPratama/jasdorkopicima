import type { Product } from '../types/domain.ts';

/**
 * Menyaring daftar produk menu berdasarkan kata kunci pencarian.
 * - Mengabaikan huruf besar/kecil (case-insensitive).
 * - Mendukung pencarian kata majemuk (multi-token search, misal: "oat matcha").
 * - Mencocokkan nama menu dan deskripsi menu.
 * - Menghindari duplikasi produk (deduplikasi berdasarkan bundleCode / productCode / id).
 * - Memberikan prioritas urutan ke menu yang namanya langsung mengandung kata kunci.
 */
export function filterProductsByQuery(products: Product[], query: string): Product[] {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const seenKeys = new Set<string>();
  const matches: Array<{ product: Product; isNameMatch: boolean; startsWithName: boolean }> = [];

  for (const product of products) {
    if (!product || !product.name) continue;

    // Kunci unik untuk deduplikasi
    const uniqueKey = product.bundleCode || product.productCode || String(product.id);
    if (seenKeys.has(uniqueKey)) continue;

    const nameLower = product.name.toLowerCase();
    const descLower = (product.description || '').toLowerCase();

    // Seluruh token wajib cocok (di nama ATAU di deskripsi)
    const allTokensMatch = tokens.every(
      (token) => nameLower.includes(token) || descLower.includes(token)
    );

    if (allTokensMatch) {
      seenKeys.add(uniqueKey);
      const isNameMatch = tokens.every((token) => nameLower.includes(token));
      const startsWithName = nameLower.startsWith(trimmed);

      matches.push({
        product,
        isNameMatch,
        startsWithName,
      });
    }
  }

  // Sorting: Nama yang diawali kata kunci -> Nama yang mengandung kata kunci -> Deskripsi
  matches.sort((a, b) => {
    if (a.startsWithName && !b.startsWithName) return -1;
    if (!a.startsWithName && b.startsWithName) return 1;
    if (a.isNameMatch && !b.isNameMatch) return -1;
    if (!a.isNameMatch && b.isNameMatch) return 1;
    return a.product.name.localeCompare(b.product.name, 'id');
  });

  return matches.map((m) => m.product);
}
