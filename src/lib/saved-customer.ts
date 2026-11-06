/**
 * Manajemen Penyimpanan Informasi Pelanggan (Nama & Nomor WhatsApp)
 *
 * Memungkinkan pelanggan setia dan reseller untuk auto-fill nama dan nomor WhatsApp
 * secara instan tanpa perlu mengetik ulang pada setiap pesanan.
 * Data disimpan secara lokal di localStorage perangkat pengguna.
 */

import { validateCustomerName, validateCustomerPhone } from './sanitizer.ts';

export const SAVED_CUSTOMER_STORAGE_KEY = 'jasdor_saved_customer_info';

export interface SavedCustomerInfo {
  name: string;
  phone: string;
  waInputPhone: string;
  updatedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getSafeStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Mengambil informasi nama dan nomor WhatsApp pelanggan yang tersimpan.
 */
export function getSavedCustomer(customStorage?: StorageLike): SavedCustomerInfo | null {
  const storage = getSafeStorage(customStorage);
  if (!storage) return null;

  try {
    const raw = storage.getItem(SAVED_CUSTOMER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.name === 'string' &&
      typeof parsed.phone === 'string' &&
      parsed.name.trim().length > 0 &&
      parsed.phone.trim().length >= 9
    ) {
      const cleanPhone = parsed.phone.trim();
      const waInputPhone = typeof parsed.waInputPhone === 'string'
        ? parsed.waInputPhone.trim()
        : cleanPhone.replace(/^(\+62|62|0)/, '');

      return {
        name: parsed.name.trim(),
        phone: cleanPhone,
        waInputPhone,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan informasi nama dan nomor WhatsApp pelanggan ke localStorage.
 * Melakukan validasi dan sanitasi sebelum menyimpan.
 */
export function saveSavedCustomer(
  name: string,
  phone: string,
  customStorage?: StorageLike
): boolean {
  const storage = getSafeStorage(customStorage);
  if (!storage) return false;

  const nameVal = validateCustomerName(name);
  if (!nameVal.isValid || !nameVal.sanitized) return false;

  const phoneVal = validateCustomerPhone(phone);
  if (!phoneVal.isValid || !phoneVal.sanitized) return false;

  const fullPhone = phoneVal.sanitized;
  const waInputPhone = fullPhone.replace(/^62/, '');

  const payload: SavedCustomerInfo = {
    name: nameVal.sanitized,
    phone: fullPhone,
    waInputPhone,
    updatedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(SAVED_CUSTOMER_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Menghapus data pelanggan tersimpan dari localStorage.
 */
export function clearSavedCustomer(customStorage?: StorageLike): void {
  const storage = getSafeStorage(customStorage);
  if (!storage) return;

  try {
    storage.removeItem(SAVED_CUSTOMER_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}
