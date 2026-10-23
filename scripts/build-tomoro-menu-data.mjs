import fs from 'fs';

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }
  return lines;
}

const finalJson = JSON.parse(fs.readFileSync('docs/tomoro-menu-promo-b1g1-final.json', 'utf8'));
const cacheJson = JSON.parse(fs.readFileSync('docs/tomoro-menu-cache.json', 'utf8'));
const tierCsvRaw = fs.readFileSync('docs/tomoro-price-tier-bandara.csv', 'utf8');
const tierRows = parseCSV(tierCsvRaw);

// Map tier prices by product_id
const tierMap = new Map();
// header: product_id,name,harga_nasional,harga_bandara_palembang,harga_bandara_dhoho
tierRows.slice(1).forEach(r => {
  if (!r[0]) return;
  const pId = r[0].trim();
  tierMap.set(pId, {
    productId: pId,
    name: r[1]?.trim() || '',
    nasional: parseInt(r[2] || '0', 10),
    palembang: parseInt(r[3] || '0', 10),
    dhoho: parseInt(r[4] || '0', 10),
  });
});

// Map cache products by id
const cacheMap = new Map();
cacheJson.menuGroups.forEach(g => {
  g.products.forEach(p => {
    cacheMap.set(p.id, { ...p, groupCode: g.code, groupName: g.name });
  });
});

// Build 41 items
const products41 = [];
const groupOrder = [
  'MATCHA SERIES',
  'TOMORO SIGNATURE',
  'CLASSIC COFFEE',
  'FLAVORED LATTE',
  'CHEESE X NAILOONG SERIES',
  'REFRESHING SERIES',
  'NON COFFEE'
];

const categoryGroupMap = {
  'MATCHA SERIES': { code: 'M-TOMORO-MATCHA', name: 'Matcha Series' },
  'TOMORO SIGNATURE': { code: 'M-TOMORO-SIGNATURE', name: 'TOMORO Signature' },
  'CLASSIC COFFEE': { code: 'M-TOMORO-CLASSIC', name: 'Classic Coffee' },
  'FLAVORED LATTE': { code: 'M-TOMORO-FLAVORED', name: 'Flavored Latte' },
  'CHEESE X NAILOONG SERIES': { code: 'M-TOMORO-CHEESE', name: 'Cheese x Nailoong' },
  'REFRESHING SERIES': { code: 'M-TOMORO-REFRESHING', name: 'Refreshing Series' },
  'NON COFFEE': { code: 'M-TOMORO-NONCOFFEE', name: 'Non Coffee' }
};

finalJson.menus.forEach(m => {
  const c = cacheMap.get(m.id);
  if (!c) throw new Error(`Menu ${m.id} not in cache!`);
  const tier = tierMap.get(m.id);
  if (!tier) throw new Error(`Tier for ${m.id} not in tier CSV!`);

  products41.push({
    id: m.id,
    productCode: m.productCode,
    name: c.name,
    category: m.category,
    image: c.image,
    description: c.description || '',
    isSoldOut: false,
    isCombo: false,
    bundleCode: '',
    hargaNasional: tier.nasional || m.basePrice,
    hargaPalembang: tier.palembang || tier.nasional || m.basePrice,
    hargaDhoho: tier.dhoho || tier.nasional || m.basePrice,
  });
});

console.log('Total verified products:', products41.length);

const tsContent = `/**
 * Data Menu Otoritatif TOMORO Coffee (Jasdor)
 *
 * KRITERIA MUTLAK:
 * - HANYA 41 menu final yang diizinkan (docs/tomoro-menu-promo-b1g1-final.json).
 * - Ke-36 menu lain di cache (semua FOOD, 1L, bundle, Master S.O.E, Triple Pistachio, Healing, Frappe)
 *   TIDAK dijual di Jasdor dan server wajib menolaknya.
 * - Flat menu dengan override tier bandara (Palembang: tomoro-plb03b-m, tomoro-plb03d-m; Dhoho: tomoro-ked01a-m).
 * - Deskripsi dari cache apa adanya (Kopi Susu Aren & Peach Oolong Milk Tea kosong).
 * - Fallback gambar artisanal otomatis untuk Spanish Latte (Limited Edition Cup).
 */

import type { MenuGroup, Product } from '../types/domain.ts';

export const TOMORO_AIRPORT_PALEMBANG_OUTLET_CODES = new Set<string>([
  'tomoro-plb03b-m', // Bandara SMB II Palembang Gate 3
  'tomoro-plb03d-m', // Landside Bandara Palembang
]);

export const TOMORO_AIRPORT_DHOHO_OUTLET_CODES = new Set<string>([
  'tomoro-ked01a-m', // Bandara Dhoho Kediri
]);

export function getTomoroAirportTier(outletCode?: string | null): 'palembang' | 'dhoho' | 'national' {
  if (!outletCode) return 'national';
  const norm = outletCode.trim().toLowerCase();
  if (TOMORO_AIRPORT_PALEMBANG_OUTLET_CODES.has(norm)) return 'palembang';
  if (TOMORO_AIRPORT_DHOHO_OUTLET_CODES.has(norm)) return 'dhoho';
  return 'national';
}

export interface TomoroProductItem {
  id: string;
  productCode: string;
  name: string;
  category: string;
  image: string;
  description: string;
  isSoldOut: boolean;
  isCombo: boolean;
  bundleCode: string;
  hargaNasional: number;
  hargaPalembang: number;
  hargaDhoho: number;
}

export const TOMORO_FINAL_PRODUCTS: TomoroProductItem[] = ${JSON.stringify(products41, null, 2)};

export const TOMORO_FINAL_PRODUCT_IDS = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.id)
);

export const TOMORO_FINAL_PRODUCT_NAMES = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.name.trim().toLowerCase())
);

/** Peta lookup cepat berdasarkan ID dan nama lowercase */
export const TOMORO_PRODUCT_MAP = new Map<string, TomoroProductItem>();
TOMORO_FINAL_PRODUCTS.forEach((p) => {
  TOMORO_PRODUCT_MAP.set(p.id, p);
  TOMORO_PRODUCT_MAP.set(p.name.trim().toLowerCase(), p);
  if (p.productCode) {
    TOMORO_PRODUCT_MAP.set(p.productCode, p);
  }
});

/**
 * Memeriksa apakah suatu menu termasuk dalam 41 menu final yang diizinkan untuk brand TOMORO Coffee.
 */
export function isTomoroItemEligible(idOrNameOrCode: string): boolean {
  if (!idOrNameOrCode) return false;
  const clean = idOrNameOrCode.trim();
  const lower = clean.toLowerCase();
  return (
    TOMORO_PRODUCT_MAP.has(clean) ||
    TOMORO_PRODUCT_MAP.has(lower) ||
    TOMORO_FINAL_PRODUCT_IDS.has(clean) ||
    TOMORO_FINAL_PRODUCT_NAMES.has(lower)
  );
}

/**
 * Mengambil harga normal (pre-promo) menu Tomoro untuk outlet tertentu (memperhitungkan tier bandara).
 * Mengembalikan null jika menu tidak termasuk dalam 41 menu final yang diizinkan.
 */
export function getTomoroProductNormalPrice(
  idOrNameOrCode: string,
  outletCode?: string | null
): number | null {
  if (!idOrNameOrCode) return null;
  const clean = idOrNameOrCode.trim();
  const lower = clean.toLowerCase();
  const prod = TOMORO_PRODUCT_MAP.get(clean) || TOMORO_PRODUCT_MAP.get(lower);
  if (!prod) return null;

  const tier = getTomoroAirportTier(outletCode);
  if (tier === 'palembang') return prod.hargaPalembang;
  if (tier === 'dhoho') return prod.hargaDhoho;
  return prod.hargaNasional;
}

/**
 * Menghasilkan menuGroups resmi Tomoro Coffee untuk outlet tertentu.
 * Mengelompokkan 41 menu final ke dalam 7 kategori resmi dengan harga tier outlet tersebut.
 */
export function getTomoroMenuForOutlet(outletCode?: string | null): MenuGroup[] {
  const tier = getTomoroAirportTier(outletCode);

  const categoryConfigs: Array<{ category: string; code: string; name: string }> = [
    { category: 'MATCHA SERIES', code: 'M-TOMORO-MATCHA', name: 'Matcha Series' },
    { category: 'TOMORO SIGNATURE', code: 'M-TOMORO-SIGNATURE', name: 'TOMORO Signature' },
    { category: 'CLASSIC COFFEE', code: 'M-TOMORO-CLASSIC', name: 'Classic Coffee' },
    { category: 'FLAVORED LATTE', code: 'M-TOMORO-FLAVORED', name: 'Flavored Latte' },
    { category: 'CHEESE X NAILOONG SERIES', code: 'M-TOMORO-CHEESE', name: 'Cheese x Nailoong' },
    { category: 'REFRESHING SERIES', code: 'M-TOMORO-REFRESHING', name: 'Refreshing Series' },
    { category: 'NON COFFEE', code: 'M-TOMORO-NONCOFFEE', name: 'Non Coffee' },
  ];

  return categoryConfigs.map((cfg) => {
    const catProducts = TOMORO_FINAL_PRODUCTS.filter((p) => p.category === cfg.category);
    const domainProducts: Product[] = catProducts.map((p) => {
      const normalPrice =
        tier === 'palembang'
          ? p.hargaPalembang
          : tier === 'dhoho'
            ? p.hargaDhoho
            : p.hargaNasional;

      return {
        id: p.id as any,
        bundleCode: p.bundleCode,
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        image: p.image,
        basePrice: normalPrice,
        originalPrice: normalPrice,
        isSoldOut: p.isSoldOut,
        isCombo: p.isCombo,
      };
    });

    return {
      code: cfg.code,
      name: cfg.name,
      products: domainProducts,
    };
  });
}
`;

fs.writeFileSync('src/lib/tomoro-menu-data.ts', tsContent);
console.log('Successfully generated src/lib/tomoro-menu-data.ts');
