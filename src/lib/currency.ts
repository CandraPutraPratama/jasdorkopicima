/**
 * Format angka nominal ke format mata uang Rupiah standar Indonesia:
 * Contoh: Rp21.000, Rp2.000, Rp0 (tanpa spasi dan tanpa desimal).
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  const formattedNumber = new Intl.NumberFormat('id-ID').format(rounded);
  return `Rp${formattedNumber}`;
}
