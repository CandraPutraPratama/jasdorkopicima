import fs from 'node:fs/promises';
import path from 'node:path';
import { TOMORO_FINAL_PRODUCTS as oldProducts } from '../src/lib/tomoro-menu-data.ts';
import { TOMORO_CUSTOMIZATION_CONFIGS } from '../src/lib/tomoro-customization-data.ts';

async function updateTomoroMenuData() {
  function slugify(str) {
    const clean = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return clean.startsWith('tomoro-') ? clean : 'tomoro-' + clean;
  }

  const final36 = TOMORO_CUSTOMIZATION_CONFIGS.map((cfg) => {
    const existing = oldProducts.find((p) => p.name.trim().toLowerCase() === cfg.name.trim().toLowerCase());
    return {
      id: existing ? existing.id : `T_${cfg.no}`,
      productCode: existing ? existing.productCode : `TOMORO_${cfg.no}`,
      name: cfg.name,
      category: cfg.category,
      image: existing ? existing.image : '',
      description: existing ? existing.description : '',
      isSoldOut: false,
      isCombo: false,
      bundleCode: slugify(cfg.name),
      hargaNasional: cfg.hargaNormal,
      hargaPalembang: existing ? existing.hargaPalembang : Math.round(cfg.hargaNormal * 1.4),
      hargaDhoho: existing ? existing.hargaDhoho : Math.round(cfg.hargaNormal * 1.2),
    };
  });

  const fileContent = `/**
 * Data Menu Otoritatif TOMORO Coffee (Jasdor)
 *
 * KRITERIA MUTLAK:
 * - 36 menu final yang disetujui & disesuaikan langsung dengan aplikasi resmi TOMORO (Excel otoritatif user).
 * - Seluruh item mendukung kustomisasi menu (Cupsize Small, Temp Iced, Sweetness, Pilihan Susu, Topping, Add-on).
 * - Flat menu dengan override tier bandara (Palembang: tomoro-plb03b-m, tomoro-plb03d-m; Dhoho: tomoro-ked01a-m).
 */

import type {
  MenuGroup,
  Product,
  ProductOptionDetails,
  VariantDimension,
  VariantSku,
  Addon,
  ProductNoteGroup,
} from '../types/domain.ts';
import { getTomoroItemConfig } from './tomoro-customization-data.ts';

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

export const TOMORO_FINAL_PRODUCTS: TomoroProductItem[] = ${JSON.stringify(final36, null, 2)};

export const TOMORO_FINAL_PRODUCT_NAMES = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.name.trim().toLowerCase())
);

export const TOMORO_FINAL_PRODUCT_IDS = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.id.trim())
);

export const TOMORO_PRODUCT_MAP = new Map<string, TomoroProductItem>();
for (const p of TOMORO_FINAL_PRODUCTS) {
  TOMORO_PRODUCT_MAP.set(p.name.trim().toLowerCase(), p);
  TOMORO_PRODUCT_MAP.set(p.name.trim(), p);
  TOMORO_PRODUCT_MAP.set(p.id.trim(), p);
  TOMORO_PRODUCT_MAP.set(p.id.trim().toLowerCase(), p);
  TOMORO_PRODUCT_MAP.set(p.productCode.trim(), p);
  TOMORO_PRODUCT_MAP.set(p.bundleCode.trim().toLowerCase(), p);
}

/**
 * Memeriksa apakah nama/id produk termasuk dalam 36 menu final Tomoro yang diizinkan.
 */
export function isTomoroItemEligible(idOrNameOrCode?: string | null): boolean {
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
 * Mengembalikan null jika menu tidak termasuk dalam 36 menu final yang diizinkan.
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
 * Mengelompokkan 36 menu final ke dalam 7 kategori resmi dengan harga tier outlet tersebut.
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

/**
 * Menemukan produk TOMORO berdasarkan bundleCode, productCode, id, atau nama.
 */
export function findTomoroProduct(identifier: string, outletCode?: string | null): Product | null {
  if (!identifier) return null;
  const menuGroups = getTomoroMenuForOutlet(outletCode);
  const norm = identifier.trim().toLowerCase();

  for (const group of menuGroups) {
    for (const prod of group.products) {
      if (
        prod.bundleCode.toLowerCase() === norm ||
        prod.productCode.toLowerCase() === norm ||
        prod.name.toLowerCase() === norm ||
        String(prod.id).toLowerCase() === norm
      ) {
        return prod;
      }
    }
  }

  return null;
}

/**
 * Menghasilkan ProductOptionDetails lengkap untuk produk TOMORO Coffee.
 * Mengikuti konfigurasi otoritatif hasil verifikasi Excel user:
 * - Ukuran Cup: Small
 * - Suhu: Iced
 * - Sweetness: Normal Sweet, Less Sweet (bila aktif)
 * - Susu: Master Milk (+Rp0), Oat Milk (+Rp5.000), Coconut Milk (+Rp5.000) (bila aktif)
 * - Topping: No Topping (+Rp0), Sea Salt Cloud (+Rp5.000), Cheese Cloud (+Rp5.000) (bila aktif)
 * - Add-on: Sugar Syrup (+Rp0) (bila aktif)
 */
export function getTomoroProductOptions(
  bundleCode: string,
  outletCode?: string | null
): ProductOptionDetails | null {
  const product = findTomoroProduct(bundleCode, outletCode);
  if (!product) return null;

  const itemConfig = getTomoroItemConfig(product.name);
  if (!itemConfig || !itemConfig.adaKustom) {
    const skuCode = \`\${product.bundleCode}_DEFAULT\`;
    const sku: VariantSku = {
      sku: skuCode,
      combinationKey: 'default',
      name: product.name,
      description: product.description,
      price: product.basePrice,
      variantAddition: 0,
    };

    return {
      product,
      dimensions: [],
      skus: [sku],
      optionMap: { default: sku },
      defaultSelectionMap: {},
      addons: [],
      notes: [],
    };
  }

  // 1. Dimensions: Ukuran Cup (Small) & Suhu (Iced)
  const dimensions: VariantDimension[] = [
    {
      code: 1,
      name: 'Ukuran Cup',
      values: [{ id: 1, name: 'Small' }],
    },
    {
      code: 2,
      name: 'Suhu',
      values: [{ id: 1, name: 'Iced' }],
    },
  ];

  const defaultSelectionMap: Record<string, string> = {
    '1': '1', // Small
    '2': '1', // Iced
  };

  const skuCode = \`\${product.bundleCode}_SM_ICE\`;
  const sku: VariantSku = {
    sku: skuCode,
    combinationKey: '1-1:2-1:',
    name: \`\${product.name} (Small, Iced)\`,
    description: product.description,
    price: product.basePrice,
    variantAddition: 0,
  };
  const skus: VariantSku[] = [sku];
  const optionMap: Record<string, VariantSku> = {
    '1-1:2-1:': sku,
  };

  // 2. Notes: Sweetness
  const notes: ProductNoteGroup[] = [];
  if (itemConfig.sweetness.active) {
    const sweetOptions: string[] = [];
    if (itemConfig.sweetness.normal) sweetOptions.push('Normal Sweet');
    if (itemConfig.sweetness.less) sweetOptions.push('Less Sweet');
    if (sweetOptions.length > 0) {
      notes.push({
        name: 'Sweetness',
        options: sweetOptions,
      });
    }
  }

  // 3. Addons: Susu, Topping, Add-on
  const addons: Addon[] = [];

  // Pilihan Susu (Dairy)
  // Diskon 50%: Normal +Rp10.000 -> Promo +Rp5.000
  if (itemConfig.milk.active) {
    if (itemConfig.milk.masterMilk) {
      addons.push({
        sku: 'TOMORO_DAIRY_MASTER',
        name: 'Master Milk',
        price: 0,
        categoryName: 'Pilihan Susu',
        group: 'dairy',
        isSoldOut: false,
      });
    }
    if (itemConfig.milk.oatMilk) {
      addons.push({
        sku: 'TOMORO_DAIRY_OAT',
        name: 'Oat Milk',
        price: 5000,
        categoryName: 'Pilihan Susu',
        group: 'dairy',
        isSoldOut: false,
      });
    }
    if (itemConfig.milk.coconutMilk) {
      addons.push({
        sku: 'TOMORO_DAIRY_COCONUT',
        name: 'Coconut Milk',
        price: 5000,
        categoryName: 'Pilihan Susu',
        group: 'dairy',
        isSoldOut: false,
      });
    }
  }

  // Pilihan Topping
  // Normal Flat Rp5.000 (TIDAK KENA DISKON)
  if (itemConfig.topping.active) {
    if (itemConfig.topping.noTopping) {
      addons.push({
        sku: 'TOMORO_TOP_NONE',
        name: 'No Topping',
        price: 0,
        categoryName: 'Pilihan Topping',
        group: 'topping',
        isSoldOut: false,
      });
    }
    if (itemConfig.topping.seaSaltCloud) {
      addons.push({
        sku: 'TOMORO_TOP_SEASALT',
        name: 'Sea Salt Cloud',
        price: 5000,
        categoryName: 'Pilihan Topping',
        group: 'topping',
        isSoldOut: false,
      });
    }
    if (itemConfig.topping.cheeseCloud) {
      addons.push({
        sku: 'TOMORO_TOP_CHEESE',
        name: 'Cheese Cloud',
        price: 5000,
        categoryName: 'Pilihan Topping',
        group: 'topping',
        isSoldOut: false,
      });
    }
  }

  // Add-on Tambahan (Sugar Syrup)
  if (itemConfig.addon.active && itemConfig.addon.sugarSyrup) {
    addons.push({
      sku: 'TOMORO_ADDON_SUGAR_SYRUP',
      name: 'Sugar Syrup',
      price: 0,
      categoryName: 'Add on',
      group: 'syrup',
      isSoldOut: false,
    });
  }

  return {
    product,
    dimensions,
    skus,
    optionMap,
    defaultSelectionMap,
    addons,
    notes,
  };
}
`;

  await fs.writeFile(path.resolve('src/lib/tomoro-menu-data.ts'), fileContent, 'utf-8');
  console.log('Sukses memperbarui src/lib/tomoro-menu-data.ts dengan 36 menu final & kustomisasi lengkap!');
}

updateTomoroMenuData().catch((err) => {
  console.error('Gagal update tomoro-menu-data:', err);
  process.exit(1);
});
