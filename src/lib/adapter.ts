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

import { checkOutletOrderability } from './orderability.ts';
import {
  isAllowedMenuGroup,
  getAllowedMenuGroupIndex,
  isHiddenOptionValue,
  isHiddenProduct,
  isStoreInScope,
  classifyAddonGroup,
} from '../config/business.ts';

/**
 * Menormalkan data 1 store/outlet dari KK ke domain Outlet
 */
export function normalizeStore(raw: KkStoreItem): Outlet {
  const orderability = checkOutletOrderability({
    orderType: raw.order_type,
    status: raw.status,
    orderMsg: raw.order_msg,
    isOpen: Boolean(raw.is_open),
  });

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
    orderType: raw.order_type,
    status: raw.status,
    orderMsg: raw.order_msg,
    canOrder: orderability.canOrder,
    orderReason: orderability.reason,
  };
}

/**
 * Menormalkan daftar store/outlet dari KK (hanya yang masuk dalam ruang lingkup brand Kopi Kenangan)
 */
export function normalizeStores(rawList: KkStoreItem[] = []): Outlet[] {
  return rawList
    .filter((s) => isStoreInScope(s))
    .map(normalizeStore);
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
 * Sesuai keputusan: item combo (is_combo_v2 = true) dan produk tersembunyi (Seliter) DISEMBUNYIKAN di sisi server.
 */
export function normalizeMenu(raw: KkMenuData): MenuGroup[] {
  const groups: MenuGroup[] = [];

  for (const rawGroup of raw?.menu_groups || []) {
    const groupName = (rawGroup.group_name || '').trim();

    // Saring kelompok menu yang tidak ada di allowlist resmi
    if (!isAllowedMenuGroup(groupName)) {
      continue;
    }

    // Saring keluar produk combo (is_combo_v2 === true) dan produk tersembunyi (misal Seliter)
    const filteredProducts = (rawGroup.menu_products || [])
      .filter((p) => !p.is_combo_v2 && !isHiddenProduct(p.name))
      .map(normalizeProduct);

    // Hanya masukkan grup jika masih memiliki produk aktif
    if (filteredProducts.length > 0) {
      groups.push({
        code: rawGroup.group_code || '',
        name: groupName,
        products: filteredProducts,
      });
    }
  }

  // Urutkan kelompok menu sesuai urutan allowlist
  groups.sort((a, b) => {
    const idxA = getAllowedMenuGroupIndex(a.name);
    const idxB = getAllowedMenuGroupIndex(b.name);
    return idxA - idxB;
  });

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
  const hiddenValueIds = new Set<number>();

  for (const d of rawDims) {
    const values = [];
    for (const v of d.dimension_value_wordings || []) {
      const vName = (v.value_text || '').trim();
      if (isHiddenOptionValue(vName)) {
        hiddenValueIds.add(v.value);
        continue;
      }
      values.push({
        id: v.value,
        name: vName,
        icon: v.icon || undefined,
      });
    }

    if (values.length > 0) {
      dimensions.push({
        code: d.dimension_code,
        name: (d.dimension_text || '').trim(),
        values,
      });
    }
  }

  // Variant SKUs & Option Product Map
  const skus: VariantSku[] = [];
  const optionMap: Record<string, VariantSku> = {};
  const rawSkus = raw.option_product_map || {};

  for (const [key, item] of Object.entries(rawSkus)) {
    const keyParts = key.split(/[,_]/).map((s) => Number(s.trim()));
    const hasHiddenVal = keyParts.some((id) => hiddenValueIds.has(id));
    const skuName = (item.name || '').trim();
    if (hasHiddenVal || isHiddenOptionValue(skuName)) {
      continue;
    }

    const skuPrice = item.price || 0;
    const variantAddition = Math.max(0, skuPrice - basePrice);

    const variantSku: VariantSku = {
      sku: String(item.product_code || ''),
      combinationKey: key,
      name: skuName,
      description: (item.display_description || '').trim(),
      price: skuPrice,
      variantAddition,
    };

    skus.push(variantSku);
    optionMap[key] = variantSku;
  }

  // Addons / Toppings / Sauces
  const addons: Addon[] = [];
  const rawAddonGroups = Array.isArray(raw.product_addon_wording)
    ? raw.product_addon_wording
    : raw.product_addon_wording?.addon_wordings || [];

  for (const addonGroup of rawAddonGroups) {
    const categoryName = (addonGroup.dimension_text || '').trim();
    for (const item of addonGroup.dimension_value_wordings || []) {
      const aName = (item.value_text || '').trim();
      const group = classifyAddonGroup(aName, categoryName);

      // Addon yang tidak bisa dipetakan ke salah satu grup: JANGAN ditampilkan
      if (!group) {
        continue;
      }

      addons.push({
        sku: String(item.addon_sku || ''),
        name: aName,
        price: item.addon_price || 0,
        categoryName,
        icon: item.value_icon || undefined,
        isSoldOut: Boolean((item as any).is_sold_out || (item as any).is_soldout),
        group,
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

  const defaultSelectionMap = (raw.default_selection_impact_sku || {}) as Record<string, string>;

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
