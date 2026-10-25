/**
 * Domain Models resmi aplikasi jasdorkopicima.
 * Seluruh kode backend/frontend HANYA mengonsumsi tipe domain ini,
 * terisolasi sepenuhnya dari struktur data internal Kopi Kenangan.
 */

export interface Outlet {
  id: number;
  code: string;
  name: string;
  address: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  timeZone: number;
  phone?: string;
  distanceStr?: string;
  orderType?: number[];
  status?: string;
  orderMsg?: string;
  canOrder: boolean;
  orderReason?: string;
  timezone?: string;
  brand?: string;
}

export interface Product {
  id: number;
  bundleCode: string;
  productCode: string;
  name: string;
  description: string;
  image: string;
  basePrice: number;
  originalPrice: number;
  isSoldOut: boolean;
  isCombo: boolean;
}

export interface MenuGroup {
  code: string;
  name: string;
  products: Product[];
}

export interface VariantDimensionValue {
  id: number;
  name: string;
  icon?: string;
}

export interface VariantDimension {
  code: number;
  name: string;
  values: VariantDimensionValue[];
}

export interface VariantSku {
  sku: string;
  combinationKey: string;
  name: string;
  description: string;
  price: number;
  /** Tambahan harga = sku.price - basePrice */
  variantAddition: number;
}

export interface Addon {
  sku: string;
  name: string;
  price: number;
  categoryName: string;
  category?: string;
  icon?: string;
  isSoldOut?: boolean;
  group?: 'whipped_cream' | 'syrup' | 'topping' | 'dairy' | 'espresso' | null;
}

export interface ProductNoteGroup {
  name: string;
  type: string;
  options: string[];
}

export interface ProductOptionDetails {
  product: Product;
  dimensions: VariantDimension[];
  skus: VariantSku[];
  optionMap: Record<string, VariantSku>;
  defaultSelectionMap?: Record<string, string>;
  addons: Addon[];
  notes: ProductNoteGroup[];
}
