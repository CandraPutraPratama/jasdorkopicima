/**
 * Menghasilkan ISO string untuk awal hari ini (00:00:00 WIB / UTC+7).
 * Contoh format: "2026-10-17T00:00:00+07:00"
 */
export function getStartOfTodayWIB(referenceDate: Date = new Date()): string {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibTime = new Date(referenceDate.getTime() + wibOffsetMs);
  const year = wibTime.getUTCFullYear();
  const month = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const date = String(wibTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${date}T00:00:00+07:00`;
}

/**
 * Memformat jumlah total orderan ke format ringkas.
 * Contoh: 1636 -> "1.6k+", 2000 -> "2.0k+", 500 -> "500+"
 */
export function formatTotalOrders(total: number): string {
  if (total >= 1000) {
    const inK = (total / 1000).toFixed(1);
    return `${inK}k+`;
  }
  return `${total}+`;
}

export interface OrderStatsResult {
  today: number;
  total: number;
}
