/**
 * Helper logika estimasi waktu pembuatan kopi oleh barista gerai
 * serta format penamaan/rekomendasi pengambilan yang realistis dan aman.
 */

export interface BrewingProgress {
  remainingSeconds: number;
  elapsedSeconds: number;
  progressPercent: number;
  isBrewing: boolean;
}

/**
 * Menghitung estimasi durasi barista meracik dalam menit berdasarkan jumlah cup.
 * 1 cup: ~8 menit
 * Tiap tambahan cup: +2 menit
 * Maksimum cap: 15 menit
 */
export function calculateBrewDurationMinutes(items?: Array<{ quantity?: number }>): number {
  if (!items || items.length === 0) {
    return 8;
  }
  const totalCups = items.reduce((sum, it) => sum + (Number(it?.quantity) || 1), 0);
  if (totalCups <= 1) {
    return 8;
  }
  return Math.min(15, 8 + (totalCups - 1) * 2);
}

/**
 * Menghitung progres dan sisa waktu racik secara live.
 */
export function getBrewingProgress(
  startTimeMs: number,
  durationMinutes: number,
  nowMs: number = Date.now()
): BrewingProgress {
  const durationMs = Math.max(1, durationMinutes) * 60 * 1000;
  const elapsedMs = Math.max(0, nowMs - startTimeMs);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / durationMs) * 100)));

  return {
    remainingSeconds,
    elapsedSeconds,
    progressPercent,
    isBrewing: remainingSeconds > 0,
  };
}

/**
 * Format teks aman rekomendasi pick up sesuai instruksi pemilik:
 * Tidak memberikan kepastian 100% siap, namun mengarahkan pelanggan
 * untuk mengecek langsung ke barista dengan menyebut nama pemesan.
 */
export function formatSafePickupInquiry(customerName: string): string {
  const cleanName = (customerName || '').trim() || 'Pemesan';
  return `sepertinya kopi sudah siap di pick up, silahkan tanya ke barista apakah orderan atas nama ${cleanName} sudah siap atau belum`;
}
