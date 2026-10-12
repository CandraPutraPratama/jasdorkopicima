import type { Addon } from '../types/domain.ts';
import { cleanNotes } from './whatsapp.ts';

export interface CartItem {
  id: string;
  bundleCode: string;
  sku?: string;
  skuPrice?: number;
  name: string;
  image?: string;
  basePrice: number;
  variantAddition: number;
  toppingTotal: number;
  quantity: number;
  variantDescription?: string;
  addons?: Addon[];
  notes?: string;
}

export interface CartState {
  outletCode: string | null;
  outletName: string | null;
  items: CartItem[];
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: Omit<CartItem, 'id'>; outletCode: string; outletName: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'RESTORE_CART'; payload: CartState };

/**
 * Menghasilkan hash unik untuk item berdasarkan isi konfigurasinya.
 * Item dengan produk, SKU, varian, topping, dan catatan yang sama persis akan memiliki hash yang sama.
 */
export function generateCartItemId(item: Omit<CartItem, 'id'>): string {
  const sortedAddons = (item.addons || [])
    .map((a) => a.sku)
    .sort()
    .join(',');
  const cleaned = cleanNotes(item.notes);
  return `${item.bundleCode}_${item.sku || 'default'}_${sortedAddons}_${cleaned}`;
}

export const initialCartState: CartState = {
  outletCode: null,
  outletName: null,
  items: [],
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, outletCode, outletName } = action.payload;
      const itemId = generateCartItemId(item);

      // Jika keranjang sebelumnya milik outlet lain, reset otomatis
      const isDifferentOutlet = state.outletCode && state.outletCode !== outletCode;
      const currentItems = isDifferentOutlet ? [] : [...state.items];

      const existingIndex = currentItems.findIndex((it) => it.id === itemId);

      if (existingIndex >= 0) {
        currentItems[existingIndex] = {
          ...currentItems[existingIndex],
          quantity: currentItems[existingIndex].quantity + item.quantity,
        };
      } else {
        currentItems.push({
          ...item,
          id: itemId,
        });
      }

      return {
        outletCode,
        outletName,
        items: currentItems,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((it) => it.id !== id),
        };
      }

      return {
        ...state,
        items: state.items.map((it) =>
          it.id === id ? { ...it, quantity: Math.min(99, quantity) } : it
        ),
      };
    }

    case 'REMOVE_ITEM': {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.filter((it) => it.id !== id),
      };
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
      };
    }

    case 'RESTORE_CART': {
      return action.payload;
    }

    default:
      return state;
  }
}
