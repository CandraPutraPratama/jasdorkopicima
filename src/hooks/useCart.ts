'use client';

import { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import {
  cartReducer,
  initialCartState,
  type CartState,
  type CartItem,
} from '@/lib/cart-reducer';
import { calculateOrderPricing, type OrderPricingResult } from '@/lib/pricing';

const STORAGE_KEY = 'jasdor_cart_v1';

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [pendingSwitch, setPendingSwitch] = useState<{
    item: Omit<CartItem, 'id'>;
    outletCode: string;
    outletName: string;
  } | null>(null);

  // 1. Muat state dari sessionStorage saat mount di browser
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartState = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'RESTORE_CART', payload: parsed });
        }
      }
    } catch (err) {
      console.warn('[useCart] Gagal memuat keranjang dari sessionStorage:', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Simpan setiap perubahan ke sessionStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[useCart] Gagal menyimpan keranjang ke sessionStorage:', err);
    }
  }, [state, isInitialized]);

  // Hitung total ringkasan harga pesanan secara terpusat dengan pricing.ts
  const pricing: OrderPricingResult = useMemo(() => {
    return calculateOrderPricing(
      state.items.map((it) => ({
        name: it.name,
        basePrice: it.basePrice,
        skuPrice: it.skuPrice,
        variantAddition: it.variantAddition,
        toppingTotal: it.toppingTotal,
        quantity: it.quantity,
        isBundle: it.isBundle,
        bundleType: it.bundleType,
        bundleFee: it.bundleFee,
        bundleNormalPrice: it.bundleNormalPrice,
      }))
    );
  }, [state.items]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'id'>, outletCode: string, outletName: string) => {
      // Cek apakah keranjang saat ini berisi item dari outlet yang berbeda
      if (
        state.outletCode &&
        state.outletCode !== outletCode &&
        state.items.length > 0
      ) {
        // Minta konfirmasi pergantian outlet
        setPendingSwitch({ item, outletCode, outletName });
        return false;
      }

      dispatch({
        type: 'ADD_ITEM',
        payload: { item, outletCode, outletName },
      });
      return true;
    },
    [state.outletCode, state.items.length]
  );

  const confirmSwitchOutlet = useCallback(() => {
    if (!pendingSwitch) return;
    dispatch({ type: 'CLEAR_CART' });
    dispatch({
      type: 'ADD_ITEM',
      payload: pendingSwitch,
    });
    setPendingSwitch(null);
  }, [pendingSwitch]);

  const cancelSwitchOutlet = useCallback(() => {
    setPendingSwitch(null);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  return {
    items: state.items,
    outletCode: state.outletCode,
    outletName: state.outletName,
    totalQuantity: pricing.totalQuantity,
    pricing,
    isInitialized,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    pendingSwitch,
    confirmSwitchOutlet,
    cancelSwitchOutlet,
  };
}
