import type {
  Outlet,
  MenuGroup,
  Product,
  VariantDimension,
  VariantSku,
  Addon,
  ProductNoteGroup,
  ProductOptionDetails,
} from '../types/domain.ts';

import type {
  KkStoreItem,
  KkMenuData,
  KkProductItem,
  KkProductOptionsData,
} from '../types/kk-api.ts';

/**
 * Menormalkan data 1 store/outlet dari KK ke domain Outlet
 */
export function normalizeStore(raw: KkStoreItem): Outlet {
  return {
    id: raw.id,
    code: raw.code || '',
    name: (raw.name || '').trim(),
    address: (raw.address || '').trim(),
    isOpen: Boolean(raw.is_open),
    openTime: raw.open || '',
    closeTime: raw.close || '',
    timeZone: raw.time_zone || 7,
    phone: raw.phone || undefined,
    distanceStr: raw.distance_str || undefined,
  };
}

/**
 * Menormalkan daftar store/outlet dari KK
 */
export function normalizeStores(rawList: KkStoreItem[] = []): Outlet[] {
  return rawList.map(normalizeStore);
}

/**
 * Menormalkan 1 produk KK ke domain Product
 */
export function normalizeProduct(raw: KkProductItem): Product {
  return {
    id: raw.id,
    bundleCode: String(raw.bundle_code || ''),
    productCode: String(raw.product_code || ''),
    name: (raw.name || '').trim(),
    description: (raw.description || '').trim(),
    image: raw.image || '',
    basePrice: raw.price || 0,
    originalPrice: raw.orig_price || raw.price || 0,
    isSoldOut: Boolean(raw.is_sold_out),
    isCombo: Boolean(raw.is_combo_v2),
  };
}

/**
 * Menormalkan seluruh menu outlet dari KK ke domain MenuGroup[].
 * Sesuai keputusan: item combo (is_combo_v2 = true) DISEMBUNYIKAN untuk MVP.
 */
export function normalizeMenu(raw: KkMenuData): MenuGroup[] {
  const groups: MenuGroup[] = [];

  for (const rawGroup of raw?.menu_groups || []) {
    // Saring keluar produk combo (is_combo_v2 === true)
    const filteredProducts = (rawGroup.menu_products || [])
      .filter((p) => !p.is_combo_v2)
      .map(normalizeProduct);

    // Hanya masukkan grup jika masih memiliki produk aktif
    if (filteredProducts.length > 0) {
      groups.push({
        code: rawGroup.group_code || '',
        name: (rawGroup.group_name || '').trim(),
        products: filteredProducts,
      });
    }
  }

  return groups;
}

/**
 * Menormalkan opsi varian, SKU kombinasi, dan addon produk dari KK ke ProductOptionDetails.
 * Harga varian dihitung dari selisih: sku.price - basePrice.
 */
export function normalizeProductOptions(raw: KkProductOptionsData): ProductOptionDetails {
  const base = raw.base_product || ({} as any);
  const basePrice = base.price || 0;

  const product: Product = {
    id: base.id || 0,
    bundleCode: String(base.bundle_code || ''),
    productCode: '',
    name: (base.name || '').trim(),
    description: (base.description || '').trim(),
    image: base.image || '',
    basePrice,
    originalPrice: base.orig_price || basePrice,
    isSoldOut: Boolean(base.is_soldout),
    isCombo: false,
  };

  // Dimensions (Size, Beans, Temperature, Milk, Sugar)
  const dimensions: VariantDimension[] = [];
  const rawDims = raw.product_dimension_wording?.dimension_wordings || [];
  for (const d of rawDims) {
    dimensions.push({
      code: d.dimension_code,
      name: (d.dimension_text || '').trim(),
      values: (d.dimension_value_wordings || []).map((v) => ({
        id: v.value,
        name: (v.value_text || '').trim(),
        icon: v.icon || undefined,
      })),
    });
  }

  // Variant SKUs
  const skus: VariantSku[] = [];
  const rawSkus = raw.option_product_map || {};
  for (const item of Object.values(rawSkus)) {
    const skuPrice = item.price || 0;
    const variantAddition = Math.max(0, skuPrice - basePrice);

    skus.push({
      sku: String(item.product_code || ''),
      name: (item.name || '').trim(),
      description: (item.display_description || '').trim(),
      price: skuPrice,
      variantAddition,
    });
  }

  // Addons / Toppings / Sauces
  const addons: Addon[] = [];
  const rawAddonGroups = Array.isArray(raw.product_addon_wording)
    ? raw.product_addon_wording
    : raw.product_addon_wording?.addon_wordings || [];

  for (const addonGroup of rawAddonGroups) {
    const categoryName = (addonGroup.dimension_text || '').trim();
    for (const item of addonGroup.dimension_value_wordings || []) {
      addons.push({
        sku: String(item.addon_sku || ''),
        name: (item.value_text || '').trim(),
        price: item.addon_price || 0,
        categoryName,
        icon: item.value_icon || undefined,
      });
    }
  }

  // Notes (e.g. Ice Level)
  const notes: ProductNoteGroup[] = [];
  for (const noteItem of raw.notes || []) {
    for (const g of noteItem.groups || []) {
      notes.push({
        name: (g.option_name || '').trim(),
        type: noteItem.check_type || 'radio',
        options: g.value_texts || [],
      });
    }
  }

  return {
    product,
    dimensions,
    skus,
    addons,
    notes,
  };
}
