import type {
  KkMenuData,
  KkMenuGroupItem,
  KkProductItem,
  KkProductOptionsData,
  KkOptionSkuItem,
} from '../types/kk-api.ts';

/**
 * Respons `POST /product/product_info {store_code}` (tanpa token/phone).
 * Hanya field yang dipakai mapper yang dideklarasikan; sisanya diabaikan.
 */
type Num = string | number | null | undefined;

interface ProductInfoSku {
  product_code?: string;
  name?: string;
  display_description?: string;
  price_dec?: Num;
}

interface ProductInfoProduct {
  base_product?: {
    id?: number;
    bundle_code?: string;
    name?: string;
    description?: string;
    image?: string;
    price_dec?: Num;
    orig_price_dec?: Num;
    default_sku?: string;
  };
  is_sold_out?: boolean | null;
  default_selection_path?: string | null;
  option_product_map?: Record<string, ProductInfoSku> | null;
  product_dimension_wording?: KkProductOptionsData['product_dimension_wording'];
  product_addon_wording?: {
    addon_wordings?: Array<{
      dimension_text: string;
      dimension_value_wordings?: Array<{
        addon_sku: string;
        value_text: string;
        addon_price?: Num;
        addon_price_dec?: Num;
        value_icon?: string;
      }>;
    }>;
  } | null;
  notes?: KkProductOptionsData['notes'] | null;
}

export interface KkProductInfoData {
  menu_groups: Array<{ group_code?: string; group_name?: string; bundle_codes?: string[] | null }>;
  menu_items: Array<{ product?: ProductInfoProduct | null; combo?: unknown }>;
}

/** price_dec datang sebagai string ("22000"); NaN/kosong menjadi 0, bukan NaN. */
function toPrice(value: Num): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function assertShape(data: KkProductInfoData | null | undefined): asserts data is KkProductInfoData {
  if (!data || !Array.isArray(data.menu_groups) || !Array.isArray(data.menu_items)) {
    throw new Error('Respons product_info tidak memiliki menu_groups/menu_items');
  }
}

function toProductItem(product: ProductInfoProduct): KkProductItem {
  const base = product.base_product || {};
  const price = toPrice(base.price_dec);
  return {
    id: base.id || 0,
    bundle_code: String(base.bundle_code || ''),
    product_code: String(base.default_sku || ''),
    name: base.name || '',
    description: base.description || '',
    image: base.image || '',
    price,
    orig_price: toPrice(base.orig_price_dec) || price,
    is_sold_out: Boolean(product.is_sold_out),
    is_combo_v2: false,
  };
}

/**
 * product_info -> format KkMenuData yang sudah dipakai normalizeMenu().
 * Item combo (product null) dilewati. Grup tanpa produk dibuang. Hasilnya ringkas:
 * hanya field menu, tanpa option_product_map/addon/notes (itu ada di mapProductInfoToOptions).
 */
export function mapProductInfoToMenu(data: KkProductInfoData): KkMenuData {
  assertShape(data);

  const byBundle = new Map<string, KkProductItem>();
  for (const item of data.menu_items) {
    if (!item?.product?.base_product?.bundle_code) continue;
    const mapped = toProductItem(item.product);
    byBundle.set(mapped.bundle_code, mapped);
  }

  // product_info bisa memuat dua grup bernama sama (contoh: "Food" dan "Food" HeritageFood
  // dengan cookie yang sama). Gabungkan per nama grup dan buang produk ganda berdasarkan bundle_code.
  const groups: KkMenuGroupItem[] = [];
  const byName = new Map<string, KkMenuGroupItem>();
  for (const g of data.menu_groups) {
    const products = (g.bundle_codes || [])
      .map((code) => byBundle.get(String(code)))
      .filter((p): p is KkProductItem => Boolean(p));
    if (products.length === 0) continue;
    const name = g.group_name || '';
    const nameKey = name.trim().toLowerCase();
    const existing = byName.get(nameKey);
    if (existing) {
      const seen = new Set(existing.menu_products.map((p) => p.bundle_code));
      for (const p of products) {
        if (!seen.has(p.bundle_code)) {
          existing.menu_products.push(p);
          seen.add(p.bundle_code);
        }
      }
      continue;
    }
    const group: KkMenuGroupItem = {
      group_code: g.group_code || '',
      group_name: name,
      has_combo: false,
      menu_products: [...products],
    };
    byName.set(nameKey, group);
    groups.push(group);
  }

  return { menu_groups: groups };
}

/** "2509-2198:2510-2200:" -> { "2509": "2198", "2510": "2200" } */
function parseSelectionPath(path: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of (path || '').split(':')) {
    const [dim, val] = part.split('-');
    if (dim && val) result[dim] = val;
  }
  return result;
}

/** product_info -> KkProductOptionsData untuk satu bundle (null jika tidak ada). */
export function mapProductInfoToOptions(
  data: KkProductInfoData,
  bundleCode: string
): KkProductOptionsData | null {
  assertShape(data);

  const product = data.menu_items
    .map((i) => i?.product)
    .find((p) => p?.base_product?.bundle_code === bundleCode);
  if (!product || !product.base_product) return null;

  const base = product.base_product;
  const price = toPrice(base.price_dec);

  const optionMap: Record<string, KkOptionSkuItem> = {};
  for (const [key, sku] of Object.entries(product.option_product_map || {})) {
    optionMap[key] = {
      product_code: sku.product_code || '',
      name: sku.name || '',
      display_description: sku.display_description || '',
      price: toPrice(sku.price_dec),
    };
  }

  const addonWordings = (product.product_addon_wording?.addon_wordings || []).map((group) => ({
    dimension_text: group.dimension_text,
    dimension_value_wordings: (group.dimension_value_wordings || []).map((a) => ({
      addon_sku: a.addon_sku,
      value_text: a.value_text,
      addon_price: toPrice(a.addon_price_dec ?? a.addon_price),
      value_icon: a.value_icon,
    })),
  }));

  return {
    base_product: {
      id: base.id || 0,
      bundle_code: String(base.bundle_code || ''),
      name: base.name || '',
      description: base.description || '',
      image: base.image || '',
      price,
      orig_price: toPrice(base.orig_price_dec) || price,
      is_soldout: Boolean(product.is_sold_out),
    },
    product_dimension_wording: product.product_dimension_wording || undefined,
    option_product_map: optionMap,
    default_selection_impact_sku: parseSelectionPath(product.default_selection_path),
    product_addon_wording: { addon_wordings: addonWordings },
    notes: product.notes || [],
  };
}
