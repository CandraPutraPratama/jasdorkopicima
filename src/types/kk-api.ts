/**
 * Struktur respons mentah API Kopi Kenangan Web Order.
 * Hanya digunakan di dalam modul Adapter.
 */

export interface KkApiResponse<T> {
  error_code: number;
  msg: string;
  data: T;
}

export interface KkStoreItem {
  id: number;
  code: string;
  name: string;
  address: string;
  is_open: boolean;
  open: string;
  close: string;
  time_zone: number;
  time_zone_second?: number;
  phone?: string;
  distance_str?: string;
  open_status?: string;
  latitude?: string;
  longitude?: string;
  order_type?: number[];
  status?: string;
  order_msg?: string;
}

export interface KkQueryStoreData {
  total: number;
  page_index: number;
  page_size: number;
  store: KkStoreItem[];
}

export interface KkProductItem {
  id: number;
  bundle_code: string;
  product_code: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  orig_price: number;
  is_sold_out: boolean;
  is_combo_v2: boolean;
  brand?: string;
}

export interface KkMenuGroupItem {
  group_code: string;
  group_name: string;
  has_combo: boolean;
  menu_products: KkProductItem[];
}

export interface KkMenuData {
  menu_groups: KkMenuGroupItem[];
}

export interface KkOptionDimensionValue {
  value: number;
  value_text: string;
  icon?: string;
}

export interface KkOptionDimension {
  dimension_code: number;
  dimension_text: string;
  dimension_value_wordings: KkOptionDimensionValue[];
}

export interface KkDimensionWordingData {
  dimension_wordings: KkOptionDimension[];
}

export interface KkOptionSkuItem {
  product_code: string;
  name: string;
  display_description: string;
  price: number;
}

export interface KkAddonWordingItem {
  dimension_text: string;
  dimension_value_wordings: Array<{
    addon_sku: string;
    value_text: string;
    addon_price: number;
    value_icon?: string;
  }>;
}

export interface KkNoteGroupItem {
  check_type: string;
  groups: Array<{
    option_name: string;
    value_texts: string[];
  }>;
}

export interface KkProductAddonWordingData {
  addon_wordings: KkAddonWordingItem[];
}

export interface KkProductOptionsData {
  base_product: {
    id: number;
    bundle_code: string;
    name: string;
    description?: string;
    image: string;
    price: number;
    orig_price?: number;
    is_soldout?: boolean;
  };
  product_dimension_wording?: KkDimensionWordingData;
  option_product_map?: Record<string, KkOptionSkuItem>;
  default_selection_impact_sku?: Record<string, string>;
  default_selection_notes?: Record<string, string>;
  product_addon_wording?: KkProductAddonWordingData | KkAddonWordingItem[];
  notes?: KkNoteGroupItem[];
}
