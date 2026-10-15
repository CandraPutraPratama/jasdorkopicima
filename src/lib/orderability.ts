import { getWibTimeParts } from './operational.ts';

export interface OutletOrderabilityInput {
  orderType?: number[] | null;
  status?: string | null;
  orderMsg?: string | null;
  isOpen?: boolean | null;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface OutletOrderabilityResult {
  canOrder: boolean;
  reason: string;
}

/**
 * Mengecek apakah jam operasional outlet sedang buka berdasarkan jam WIB saat ini.
 */
export function isOutletOpenBySchedule(
  openTime?: string | null,
  closeTime?: string | null,
  now: Date = new Date()
): boolean {
  if (!openTime || !closeTime) return true;

  const { hour, minute } = getWibTimeParts(now);
  const currentMinutes = hour * 60 + minute;

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  if (isNaN(openH) || isNaN(closeH)) return true;

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  if (closeMinutes >= openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

/**
 * Satu sumber kebenaran (Single Source of Truth) untuk menentukan apakah suatu outlet
 * sedang tutup / tidak dapat dipesan.
 */
export function isOutletClosed(
  outlet?: {
    isOpen?: boolean | null;
    canOrder?: boolean | null;
    openTime?: string | null;
    closeTime?: string | null;
  } | null,
  now: Date = new Date()
): boolean {
  if (!outlet) return false;
  if (outlet.isOpen === false) return true;
  if (outlet.canOrder === false) return true;
  if (outlet.openTime && outlet.closeTime) {
    if (!isOutletOpenBySchedule(outlet.openTime, outlet.closeTime, now)) {
      return true;
    }
  }
  return false;
}

/**
 * Memeriksa apakah suatu outlet Kopi Kenangan memenuhi kriteria bisa dipesan di jasdorkopicima.
 *
 * Aturan bisnis resmi:
 * Outlet HANYA bisa dipesan jika:
 * 1. order_type memuat 101 (Pick Up)
 * 2. status === "Active"
 * 3. order_msg === "Pesan Sekarang"
 * 4. isOpen !== false
 * 5. Berada dalam jam operasional outlet
 *
 * Jika tidak memenuhi, kembalikan alasan spesifik untuk ditampilkan di badge dan nonaktifkan pemilihan.
 */
export function checkOutletOrderability(
  outlet: OutletOrderabilityInput
): OutletOrderabilityResult {
  const { orderType, status, orderMsg, isOpen, openTime, closeTime } = outlet;

  // 0. Fallback jika outlet ditandai tutup secara eksplisit
  if (isOpen === false) {
    return {
      canOrder: false,
      reason: 'Tutup',
    };
  }

  // 0a. Cek jam operasional outlet jika ada data openTime & closeTime
  if (openTime && closeTime && !isOutletOpenBySchedule(openTime, closeTime)) {
    return {
      canOrder: false,
      reason: 'Tutup',
    };
  }

  // 0b. Fallback jika seluruh data kosong
  if (!orderMsg && !status && (!orderType || orderType.length === 0)) {
    return {
      canOrder: false,
      reason: 'Tutup',
    };
  }

  // 1. Cek order_msg terlebih dahulu (pesan dinamis real-time dari KK)
  if (orderMsg && orderMsg.trim() !== 'Pesan Sekarang') {
    return {
      canOrder: false,
      reason: orderMsg.trim(),
    };
  }

  // 2. Cek status keaktifan outlet
  if (status && status !== 'Active') {
    return {
      canOrder: false,
      reason: 'Outlet tidak aktif',
    };
  }

  // 3. Cek dukungan order_type 101 (Pick Up)
  if (!orderType || !Array.isArray(orderType) || !orderType.includes(101)) {
    return {
      canOrder: false,
      reason: 'Pickup tidak tersedia',
    };
  }

  // 4. Pastikan status adalah Active dan orderMsg adalah Pesan Sekarang
  if (status === 'Active' && orderMsg === 'Pesan Sekarang') {
    return {
      canOrder: true,
      reason: 'Buka',
    };
  }

  // 5. Fallback jika data tidak lengkap
  return {
    canOrder: false,
    reason: 'Tutup',
  };
}
