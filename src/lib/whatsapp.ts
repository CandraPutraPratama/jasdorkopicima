import { calculateOrderPricing } from './pricing.ts';
import { formatRupiah } from './currency.ts';
import type { CartItem } from './cart-reducer.ts';
import type { Addon } from '../types/domain.ts';
import {
  getOptionAddition,
  isHiddenOptionValue,
  classifyAddonGroup,
  addonPrices,
} from '../config/business.ts';

export interface BuildWhatsAppMessageInput {
  customerName: string;
  outletName: string;
  pickupMode: 'now' | 'scheduled';
  estimatedTime?: string;
  scheduledTime?: string;
  items: CartItem[];
  brandName?: string;
}

import { cleanNotes, cleanCustomerName } from './sanitizer.ts';

export { cleanNotes, cleanCustomerName };

/**
 * Format rincian varian flat dan addon per grup di dalam kurung:
 * (Iced, Large (+Rp5.000), Juwara Beans (+Rp3.000), Less Sugar, Whipped Cream: Chocolate, Syrup: Choco Sauce (+Rp6.000), Topping: Oreo (+Rp6.000))
 */
export function formatItemDetails(item: CartItem): string {
  const parts: string[] = [];

  // 1. Opsi Varian
  if (item.variantDescription && item.variantDescription.trim()) {
    const tokens = item.variantDescription
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const token of tokens) {
      // Hapus suffix harga sebelumnya jika ada (misal: "Large (+Rp5.000)")
      const cleanToken = token.replace(/\s*\(\+Rp[\d.]+\)$/i, '').trim();
      if (!cleanToken || isHiddenOptionValue(cleanToken)) continue;

      const addition = getOptionAddition(cleanToken);
      if (addition > 0) {
        parts.push(`${cleanToken} (+${formatRupiah(addition)})`);
      } else {
        parts.push(cleanToken);
      }
    }
  }

  // 2. Addon dikelompokkan ke 3 grup: Whipped Cream, Syrup, Topping
  if (item.addons && item.addons.length > 0) {
    const whipped: Addon[] = [];
    const syrups: Addon[] = [];
    const toppings: Addon[] = [];

    for (const addon of item.addons) {
      const group = addon.group || classifyAddonGroup(addon.name, addon.categoryName || addon.category);
      if (group === 'whipped_cream') {
        whipped.push(addon);
      } else if (group === 'syrup') {
        syrups.push(addon);
      } else if (group === 'topping') {
        toppings.push(addon);
      }
    }

    if (whipped.length > 0) {
      // Whipped cream gratis, tanpa harga. Jika 'No Whipped Cream' tampilkan 'Tanpa'. Hapus prefix redundant 'Whipped Cream ' jika ada
      const names = whipped.map((w) => {
        const clean = w.name.trim();
        if (/^no\s+whipped\s+cream$/i.test(clean)) {
          return 'Tanpa';
        }
        return clean.replace(/^Whipped Cream\s+/i, '').trim();
      });
      parts.push(`Whipped Cream: ${names.join(', ')}`);
    }

    if (syrups.length > 0) {
      const syrupParts = syrups.map(
        (s) => `${s.name} (+${formatRupiah(addonPrices.syrup)})`
      );
      parts.push(`Syrup: ${syrupParts.join(', ')}`);
    }

    if (toppings.length > 0) {
      const toppingParts = toppings.map(
        (t) => `${t.name} (+${formatRupiah(addonPrices.topping)})`
      );
      parts.push(`Topping: ${toppingParts.join(', ')}`);
    }
  }

  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
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
      skuPrice: it.skuPrice,
      variantAddition: it.variantAddition,
      toppingTotal: it.toppingTotal,
      quantity: it.quantity,
    }))
  );

  const brandDisplay =
    input.brandName ||
    (outletName.toLowerCase().includes('fore') ? 'Fore Coffee' : 'Kopi Kenangan');

  const lines: string[] = [];
  lines.push('Halo Kak, saya ingin memesan:');
  lines.push('');
  lines.push(`Brand: ${brandDisplay}`);
  lines.push(`Nama: ${cleanCustomerName(customerName)}`);
  lines.push(`Lokasi: ${outletName.trim()}`);
  lines.push(pickupLine);
  lines.push('');
  lines.push('Pesanan:');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPricing = orderPricing.items[i];

    const detailsStr = formatItemDetails(item);
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

export interface OrderWhatsAppConfirmationItem {
  name: string;
  quantity: number;
  subtotal: number;
  variantOptions?: string[];
  addons?: Array<{ name: string; price?: number }>;
}

export interface OrderWhatsAppConfirmationInput {
  id: string;
  outlet_name?: string;
  outlet_code: string;
  customer_name: string;
  total: number;
  items: OrderWhatsAppConfirmationItem[];
}

/**
 * Membentuk pesan konfirmasi WhatsApp pasca bayar QRIS on-site.
 * Format:
 * Halo admin, saya sudah bayar pesanan #CG-XXXXXX
 * Outlet: [nama outlet]
 * - [qty]x [nama item] ([opsi/varian]) — RpXXX
 * - ...
 * Total: RpXXX
 * Nama: [nama pemesan]
 */
export function buildOrderWhatsAppConfirmationMessage(
  order: OrderWhatsAppConfirmationInput
): string {
  const outletLabel = order.outlet_name?.trim() || order.outlet_code;
  const lines: string[] = [
    `Halo admin, saya sudah bayar pesanan #${order.id}`,
    `Outlet: ${outletLabel}`,
  ];

  for (const it of order.items) {
    const optParts: string[] = [];
    if (it.variantOptions && it.variantOptions.length > 0) {
      optParts.push(...it.variantOptions.filter(Boolean));
    }
    if (it.addons && it.addons.length > 0) {
      optParts.push(...it.addons.map((a) => a.name).filter(Boolean));
    }
    const optText = optParts.length > 0 ? ` (${optParts.join(', ')})` : '';
    lines.push(`- ${it.quantity}x ${it.name}${optText} — ${formatRupiah(it.subtotal)}`);
  }

  lines.push(`Total: ${formatRupiah(order.total)}`);
  lines.push(`Nama: ${order.customer_name}`);

  return lines.join('\n');
}
