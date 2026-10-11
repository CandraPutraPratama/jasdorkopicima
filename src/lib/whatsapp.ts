import { calculateOrderPricing } from './pricing.ts';
import { formatRupiah } from './currency.ts';
import type { CartItem } from './cart-reducer.ts';

export interface BuildWhatsAppMessageInput {
  customerName: string;
  outletName: string;
  pickupMode: 'now' | 'scheduled';
  estimatedTime?: string;
  scheduledTime?: string;
  items: CartItem[];
}

/**
 * Membersihkan catatan dari karakter kontrol dan membatasi maksimal 100 karakter.
 */
export function cleanNotes(notes?: string): string {
  if (!notes) return '';
  return notes
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Membangun format string pesan pesanan resmi untuk dikirim ke WhatsApp.
 * Mengikuti template persis sesuai instruksi spesifikasi Tahap 5B.
 */
export function buildWhatsAppMessage(input: BuildWhatsAppMessageInput): string {
  const { customerName, outletName, pickupMode, estimatedTime, scheduledTime, items } = input;

  const pickupLine =
    pickupMode === 'now'
      ? `Pickup: Sekarang (estimasi siap ~jam ${estimatedTime || 'segera'})`
      : `Pickup: Terjadwal jam ${scheduledTime || ''}`;

  const orderPricing = calculateOrderPricing(
    items.map((it) => ({
      name: it.name,
      basePrice: it.basePrice,
      variantAddition: it.variantAddition,
      toppingTotal: it.toppingTotal,
      quantity: it.quantity,
    }))
  );

  const lines: string[] = [];
  lines.push('Halo Kak, saya ingin memesan:');
  lines.push('');
  lines.push('Brand: Kopi Kenangan');
  lines.push(`Nama: ${customerName.trim()}`);
  lines.push(`Lokasi: ${outletName.trim()}`);
  lines.push(pickupLine);
  lines.push('');
  lines.push('Pesanan:');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPricing = orderPricing.items[i];

    // Bangun rincian varian dan topping di dalam kurung
    const parts: string[] = [];
    if (item.variantDescription && item.variantDescription.trim()) {
      parts.push(item.variantDescription.trim());
    }

    if (item.addons && item.addons.length > 0) {
      const toppingStr = item.addons
        .map((a) => `${a.name} (+${formatRupiah(a.price)})`)
        .join(', ');
      parts.push(`Topping: ${toppingStr}`);
    }

    const detailsStr = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    const lineTotal = formatRupiah(itemPricing.subtotalItem);

    lines.push(`- ${item.quantity}x ${item.name}${detailsStr} ${lineTotal}`);

    const cleanedNote = cleanNotes(item.notes);
    if (cleanedNote) {
      lines.push(`  Catatan: ${cleanedNote}`);
    }
  }

  lines.push('');
  lines.push(`Sub Total: ${formatRupiah(orderPricing.subtotal)}`);

  const feeLine =
    orderPricing.totalQuantity === 1
      ? 'Biaya Jasa (1 item): Rp4.000'
      : `Biaya Jasa (Rp2.000 x ${orderPricing.totalQuantity} item): ${formatRupiah(orderPricing.fee)}`;

  lines.push(feeLine);
  lines.push(`Total: ${formatRupiah(orderPricing.total)}`);
  lines.push('');
  lines.push(`Kamu hemat ${formatRupiah(orderPricing.totalSavings)} dari harga normal!`);
  lines.push('');
  lines.push('Mohon konfirmasi pesanan saya. Terima kasih!');

  return lines.join('\n');
}

/**
 * Membentuk URL WhatsApp dengan validasi panjang URL maksimal ~1800 karakter.
 * Jika melewati batas, kembalikan isDirect: false agar UI menampilkan tombol Salin Pesan.
 */
export function buildWhatsAppUrl(
  phoneNumber: string,
  message: string
): { url: string; isDirect: boolean; encodedText: string } {
  const encodedText = encodeURIComponent(message);
  const directUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

  if (directUrl.length <= 1800) {
    return {
      url: directUrl,
      isDirect: true,
      encodedText,
    };
  }

  return {
    url: `https://wa.me/${phoneNumber}`,
    isDirect: false,
    encodedText,
  };
}
