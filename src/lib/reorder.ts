import type { CartItem, CartState } from './cart-reducer.ts';
import type { OrderRecord, OrderItemSnapshot } from '../types/order.ts';
import { generateCartItemId } from './cart-reducer.ts';
import type { Addon } from '../types/domain.ts';

const CART_STORAGE_KEY = 'jasdor_cart_v1';

/**
 * Mengonversi snapshot item dari OrderRecord menjadi CartItem yang siap dimasukkan ke keranjang.
 */
export function orderItemToCartItem(
  item: OrderItemSnapshot,
  brandSlug?: string
): CartItem {
  const variantDescription =
    item.variantOptions && item.variantOptions.length > 0
      ? item.variantOptions.join(', ')
      : undefined;

  const addons: Addon[] = item.addons
    ? item.addons.map((a, idx) => ({
        sku: `reorder_addon_${idx}_${a.name.replace(/\s+/g, '_')}`,
        name: a.name,
        price: a.price,
        categoryName: 'Addon',
      }))
    : [];

  const toppingTotal = addons.reduce((acc, a) => acc + (a.price || 0), 0);
  const isFore = brandSlug === 'fore';
  const basePrice = item.basePrice || item.originalPrice || item.promoPrice || 0;
  const targetPrice = isFore ? (item.originalPrice || item.basePrice || 0) : (item.promoPrice || basePrice);
  const variantAddition = Math.max(0, targetPrice - basePrice);

  const cartItemCandidate: Omit<CartItem, 'id'> = {
    bundleCode: item.bundleCode,
    sku: item.sku,
    skuPrice: targetPrice,
    name: item.name,
    basePrice,
    variantAddition,
    toppingTotal,
    quantity: item.quantity || 1,
    variantDescription,
    addons,
    notes: item.notes,
    brandSlug: brandSlug,
    isBundle: item.isBundle,
    bundleType: item.bundleType,
    bundleFee: item.bundleFee,
    bundleNormalPrice: item.bundleNormalPrice,
    bundleDetails: item.bundleDetails,
  };

  return {
    ...cartItemCandidate,
    id: generateCartItemId(cartItemCandidate),
  };
}

/**
 * Mempersiapkan CartState lengkap dari data pesanan yang dipilih.
 */
export function prepareReorderState(order: OrderRecord): CartState {
  const items: CartItem[] = (order.items || []).map((it) =>
    orderItemToCartItem(it, order.brand_slug)
  );

  return {
    outletCode: order.outlet_code,
    outletName: order.outlet_name || order.outlet_code,
    items,
  };
}

/**
 * Membuat ringkasan singkat daftar item untuk ditampilkan di kartu Pesan Lagi.
 * Contoh: "2x Kopi Kenangan Mantan, 1x Americano"
 */
export function getReorderItemSummary(
  items: OrderItemSnapshot[] | undefined,
  maxItems = 2
): string {
  if (!items || items.length === 0) return 'Menu Pilihan';

  const parts = items.slice(0, maxItems).map((it) => `${it.quantity || 1}x ${it.name}`);
  const remaining = items.length - maxItems;

  if (remaining > 0) {
    return `${parts.join(', ')} (+${remaining} lainnya)`;
  }

  return parts.join(', ');
}

/**
 * Menjalankan aksi "Pesan Lagi" (Reorder):
 * 1. Menyimpan state keranjang pesanan lama ke sessionStorage.
 * 2. Mengarahkan halaman ke outlet terkait dengan query `?openCart=true`.
 */
export function executeReorder(
  order: OrderRecord,
  router: { push: (url: string) => void }
): void {
  const cartState = prepareReorderState(order);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    } catch (err) {
      console.warn('[executeReorder] Gagal menyimpan ke sessionStorage:', err);
    }
  }

  router.push(`/outlet/${encodeURIComponent(order.outlet_code)}?openCart=true`);
}

