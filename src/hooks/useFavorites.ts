'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'jasdor_favorite_products';

/**
 * Hook untuk mengelola daftar menu favorit pengguna di localStorage.
 * Tersimpan persisten antar sesi browser.
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((id) => String(id));
        }
      }
    } catch (err) {
      console.warn('Gagal membaca favorit dari localStorage:', err);
    }
    return [];
  });

  // Tambah / Hapus menu dari daftar favorit
  const toggleFavorite = useCallback((productId: number | string) => {
    const idStr = String(productId);
    setFavoriteIds((prev) => {
      const exists = prev.includes(idStr);
      const next = exists ? prev.filter((id) => id !== idStr) : [...prev, idStr];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Gagal menyimpan favorit ke localStorage:', err);
      }
      return next;
    });
  }, []);

  // Periksa apakah sebuah produk berstatus favorit
  const isFavorite = useCallback(
    (productId: number | string) => {
      return favoriteIds.includes(String(productId));
    },
    [favoriteIds]
  );

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    isLoaded,
  };
}
