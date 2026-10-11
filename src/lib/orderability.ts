export interface OutletOrderabilityInput {
  orderType?: number[] | null;
  status?: string | null;
  orderMsg?: string | null;
  isOpen?: boolean | null;
}

export interface OutletOrderabilityResult {
  canOrder: boolean;
  reason: string;
}

/**
 * Memeriksa apakah suatu outlet Kopi Kenangan memenuhi kriteria bisa dipesan di jasdorkopicima.
 *
 * Aturan bisnis resmi:
 * Outlet HANYA bisa dipesan jika:
 * 1. order_type memuat 101 (Pick Up)
 * 2. status === "Active"
 * 3. order_msg === "Pesan Sekarang"
 *
 * Jika tidak memenuhi, kembalikan alasan spesifik untuk ditampilkan di badge dan nonaktifkan pemilihan.
 */
export function checkOutletOrderability(
  outlet: OutletOrderabilityInput
): OutletOrderabilityResult {
  const { orderType, status, orderMsg } = outlet;

  // 0. Fallback jika seluruh data kosong
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
