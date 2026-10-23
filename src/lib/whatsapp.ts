import { calculateOrderPricing, getOrderBreakdown } from './pricing.ts';
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
      isBundle: it.isBundle,
      bundleType: it.bundleType,
      bundleFee: it.bundleFee,
      bundleNormalPrice: it.bundleNormalPrice,
    }))
  );

  const brandDisplay =
    input.brandName ||
    (outletName.toLowerCase().includes('tomoro')
      ? 'TOMORO Coffee'
      : outletName.toLowerCase().includes('fore')
        ? 'Fore Coffee'
        : 'Kopi Kenangan');

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
    const lineTotal = formatRupiah(itemPricing.subtotalItem);

    if (item.isBundle && item.bundleDetails && item.bundleDetails.length > 0) {
      lines.push(`- ${item.quantity}x ${item.name}`);
      for (const d of item.bundleDetails) {
        const dOpt = d.variantDescription ? ` (${d.variantDescription})` : '';
        const isFreeB1G1 = d.promoPrice === 0 || (item.bundleType === 'tomoro-b1g1' && d.promoPrice === 0);
        const dPrice = isFreeB1G1
          ? 'GRATIS (B1G1)'
          : formatRupiah(d.promoPrice || Math.round((d.normalPrice || 0) * 0.5));
        lines.push(`  • ${d.name}${dOpt} ${EM_DASH} ${dPrice}`);
        if (d.notes?.trim()) {
          lines.push(`    Catatan: ${cleanNotes(d.notes)}`);
        }
      }
    } else {
      const detailsStr = formatItemDetails(item);
      lines.push(`- ${item.quantity}x ${item.name}${detailsStr} ${lineTotal}`);
    }

    const cleanedNote = cleanNotes(item.notes);
    if (cleanedNote) {
      lines.push(`  Catatan: ${cleanedNote}`);
    }
  }

  lines.push('');
  if (orderPricing.bundleQuantity > 0) {
    lines.push(`Sub Total Bundling (${orderPricing.bundleQuantity} item): ${formatRupiah(orderPricing.bundleSubtotal)}`);
  }
  if (orderPricing.regularQuantity > 0) {
    lines.push(`Sub Total Normal (${orderPricing.regularQuantity} item): ${formatRupiah(orderPricing.regularSubtotal)}`);
  }
  if (orderPricing.bundleQuantity > 0) {
    lines.push(`Biaya Jasa Bundling: ${formatRupiah(orderPricing.bundleFee)}`);
  }
  if (orderPricing.regularQuantity > 0) {
    lines.push(`Biaya Jasa Normal: ${formatRupiah(orderPricing.regularFee)}`);
  }

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
  notes?: string;
  isBundle?: boolean;
  bundleType?: string;
  bundleNormalPrice?: number;
  bundleFee?: number;
  bundleDetails?: Array<{
    name: string;
    category?: 'drink' | 'food';
    variantDescription?: string;
    normalPrice?: number;
    promoPrice?: number;
    notes?: string;
  }>;
}

export interface OrderWhatsAppConfirmationInput {
  id: string;
  brand_slug?: string;
  outlet_name?: string;
  outlet_code: string;
  customer_name: string;
  total: number;
  subtotal?: number;
  fee?: number;
  pickup_time?: string | null;
  created_at?: string;
  items: OrderWhatsAppConfirmationItem[];
}

const EM_DASH = '\u2014';

/**
 * Membentuk pesan konfirmasi WhatsApp pasca bayar QRIS on-site.
 * SEMUA pesanan (reguler, bundling, maupun campuran) memakai satu format lengkap resmi.
 */
export function buildOrderWhatsAppConfirmationMessage(
  order: OrderWhatsAppConfirmationInput
): string {
  const outletLabel = order.outlet_name?.trim() || order.outlet_code;
  const brandDisplay =
    order.brand_slug?.toLowerCase() === 'tomoro' || order.outlet_code.toLowerCase().startsWith('tomoro-')
      ? 'TOMORO Coffee'
      : order.brand_slug &&
        !order.brand_slug.toLowerCase().includes('kopi') &&
        !order.brand_slug.toLowerCase().includes('kenangan') &&
        order.brand_slug.toLowerCase().includes('fore')
        ? 'Fore Coffee'
        : 'Kopi Kenangan';

  let pickupLine = 'Pickup: Sekarang (estimasi siap ~jam segera)';
  if (order.pickup_time && order.pickup_time !== 'now') {
    if (order.pickup_time.startsWith('Dijadwalkan') || order.pickup_time.startsWith('Terjadwal')) {
      pickupLine = `Pickup: ${order.pickup_time.replace('Terjadwal', 'Dijadwalkan')}`;
    } else {
      pickupLine = `Pickup: Dijadwalkan jam ${order.pickup_time}`;
    }
  } else if (order.created_at) {
    try {
      const createdDate = new Date(order.created_at);
      const estTime = new Date(createdDate.getTime() + 15 * 60 * 1000);
      const estFormatted = estTime
        .toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace('.', ':');
      pickupLine = `Pickup: Sekarang (estimasi siap ~jam ${estFormatted})`;
    } catch {
      pickupLine = 'Pickup: Sekarang (estimasi siap ~jam segera)';
    }
  }

  const lines: string[] = [];
  lines.push(`Halo Kak, saya sudah bayar pesanan #${order.id}`);
  lines.push('');
  lines.push(`Brand: ${brandDisplay}`);
  lines.push(`Nama: ${cleanCustomerName(order.customer_name)}`);
  lines.push(`Outlet: ${outletLabel}`);
  lines.push(pickupLine);
  lines.push('');
  lines.push('Pesanan:');

  let totalNormalPrice = 0;

  for (const it of order.items) {
    const isThisBundle =
      it.isBundle ||
      it.bundleType === 'tomoro-b1g1' ||
      Boolean(it.bundleDetails && it.bundleDetails.length > 0) ||
      it.name.toLowerCase().includes('bundling') ||
      it.name.toLowerCase().includes('b1g1');

    if (isThisBundle) {
      lines.push(`- ${it.quantity}x ${it.name}`);

      if (it.bundleDetails && it.bundleDetails.length > 0) {
        for (const d of it.bundleDetails) {
          const isFreeB1G1 = d.promoPrice === 0 || (it.bundleType === 'tomoro-b1g1' && d.promoPrice === 0);
          const normalP = d.normalPrice || (d.promoPrice ? d.promoPrice * 2 : 0);
          const promoP = isFreeB1G1 ? 0 : (d.promoPrice || Math.round(normalP * 0.5));
          totalNormalPrice += normalP * it.quantity;

          const optText = d.variantDescription ? ` (${d.variantDescription})` : '';
          const promoPriceDisplay = isFreeB1G1 ? 'GRATIS (B1G1)' : formatRupiah(promoP);
          lines.push(`  • ${d.name}${optText} ${EM_DASH} ${promoPriceDisplay}`);
          if (d.notes?.trim()) {
            lines.push(`    Catatan: ${cleanNotes(d.notes)}`);
          }
        }
      } else if (it.variantOptions && it.variantOptions.length > 0) {
        for (const opt of it.variantOptions) {
          lines.push(`  • ${opt}`);
        }
        totalNormalPrice += (it.bundleNormalPrice || it.subtotal * 2) * it.quantity;
      } else {
        totalNormalPrice += (it.bundleNormalPrice || it.subtotal * 2) * it.quantity;
      }
    } else {
      const optParts: string[] = [];
      if (it.variantOptions && it.variantOptions.length > 0) {
        optParts.push(...it.variantOptions.filter(Boolean));
      }
      if (it.addons && it.addons.length > 0) {
        optParts.push(...it.addons.map((a) => a.name).filter(Boolean));
      }
      const optText = optParts.length > 0 ? ` (${optParts.join(', ')})` : '';
      lines.push(`- ${it.quantity}x ${it.name}${optText} - ${formatRupiah(it.subtotal)}`);
      if (it.notes?.trim()) {
        lines.push(`  Catatan: ${cleanNotes(it.notes)}`);
      }
      totalNormalPrice += (it.subtotal * 2) * it.quantity;
    }
  }

  const breakdown = getOrderBreakdown(order.items, order.fee);

  lines.push('');
  if (breakdown.bundleQuantity > 0) {
    lines.push(`Sub Total Bundling (${breakdown.bundleQuantity} item): ${formatRupiah(breakdown.bundleSubtotal)}`);
  }
  if (breakdown.regularQuantity > 0) {
    lines.push(`Sub Total Normal (${breakdown.regularQuantity} item): ${formatRupiah(breakdown.regularSubtotal)}`);
  }
  if (breakdown.bundleQuantity > 0) {
    lines.push(`Biaya Jasa Bundling: ${formatRupiah(breakdown.bundleFee)}`);
  }
  if (breakdown.regularQuantity > 0) {
    lines.push(`Biaya Jasa Normal: ${formatRupiah(breakdown.regularFee)}`);
  }
  lines.push(`Total: ${formatRupiah(order.total)}`);

  // "Kamu hemat" = total harga normal − total bayar
  const totalSavings = Math.max(0, totalNormalPrice - order.total);
  lines.push('');
  lines.push(`Kamu hemat ${formatRupiah(totalSavings)} dari harga normal!`);
  lines.push('');
  lines.push('Mohon konfirmasi pesanan saya. Terima kasih!');

  return lines.join('\n');
}
