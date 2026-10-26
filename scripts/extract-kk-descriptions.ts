import { kkApiClient } from '../src/lib/kk-client.ts';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Fetching KALCIT store & menu...');
  const store = await kkApiClient.getStore('KALCIT');
  const menu = await kkApiClient.queryProductMenu('KALCIT');

  const allProducts = menu.menu_groups.flatMap((g) => g.menu_products);
  const uniqueMap = new Map<string, { bundle_code: string; name: string }>();
  for (const p of allProducts) {
    if (!uniqueMap.has(p.name)) {
      uniqueMap.set(p.name, { bundle_code: p.bundle_code, name: p.name });
    }
  }

  console.log(`Found ${uniqueMap.size} unique products in KALCIT. Fetching options...`);
  const descriptions: Record<string, string> = {};

  const entries = Array.from(uniqueMap.values());
  // Process in small batches with polite delay
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    try {
      const opt = await kkApiClient.getProductOptions(store.id, 'KALCIT', item.bundle_code);
      const desc = (opt.base_product?.description || '').trim();
      if (desc) {
        descriptions[item.name] = desc;
      }
    } catch (err: any) {
      console.warn(`[${i + 1}/${entries.length}] Failed for ${item.name}: ${err.message}`);
    }
    if ((i + 1) % 20 === 0 || i === entries.length - 1) {
      console.log(`Progress: ${i + 1}/${entries.length} (Collected: ${Object.keys(descriptions).length})`);
    }
  }

  // Sort alphabetically
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(descriptions).sort()) {
    sorted[k] = descriptions[k];
  }

  const outPath = path.resolve('src/lib/kk-menu-descriptions.ts');
  const content = `/**
 * Mapping Deskripsi Resmi Produk Kopi Kenangan
 * Diekstrak langsung dari endpoint resmi KK get_web_order_product_options.
 * Digunakan agar seluruh kartu menu katalog dan lembar kustomisasi memiliki deskripsi yang kaya dan informatif.
 */
export const KK_MENU_DESCRIPTIONS: Record<string, string> = ${JSON.stringify(sorted, null, 2)};

/**
 * Mengambil deskripsi resmi produk Kopi Kenangan berdasarkan nama produk.
 */
export function getKkMenuDescription(name?: string): string {
  if (!name) return '';
  const cleanName = name.trim();
  if (KK_MENU_DESCRIPTIONS[cleanName]) {
    return KK_MENU_DESCRIPTIONS[cleanName];
  }

  // Case-insensitive fallback
  const lower = cleanName.toLowerCase();
  for (const [key, val] of Object.entries(KK_MENU_DESCRIPTIONS)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  return '';
}
`;

  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`Successfully generated ${outPath} with ${Object.keys(sorted).length} menu descriptions!`);
}

main().catch(console.error);
