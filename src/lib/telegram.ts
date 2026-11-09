import { getEnvVar } from './env.ts';
import { formatRupiah } from './currency.ts';
import type { OrderRecord, OrderStatus } from '../types/order.ts';

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineButton[][];
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export function getTelegramConfig(): TelegramConfig {
  return {
    botToken: (getEnvVar('TELEGRAM_BOT_TOKEN') || '').trim(),
    chatId: (getEnvVar('TELEGRAM_ADMIN_CHAT_ID') || '').trim(),
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface ItemUnit {
  name: string;
  normalPrice: number;
}

export function getItemNormalPrice(it: OrderRecord['items'][number]): {
  unitNormal: number;
  totalNormal: number;
} {
  const qty = it.quantity || 1;
  if (it.isBundle) {
    if (typeof it.bundleNormalPrice === 'number' && it.bundleNormalPrice > 0) {
      return { unitNormal: it.bundleNormalPrice, totalNormal: it.bundleNormalPrice * qty };
    }
    if (it.bundleDetails && it.bundleDetails.length > 0) {
      const sum = it.bundleDetails.reduce(
        (acc, d) => acc + (d.normalPrice || (d.promoPrice ? d.promoPrice * 2 : 0)),
        0
      );
      if (sum > 0) {
        return { unitNormal: sum, totalNormal: sum * qty };
      }
    }
  }

  const unitNormal =
    typeof it.originalPrice === 'number' && it.originalPrice > 0
      ? it.originalPrice
      : typeof it.basePrice === 'number' && it.basePrice > 0
        ? it.basePrice
        : typeof it.promoPrice === 'number' && it.promoPrice > 0
          ? it.promoPrice * 2
          : typeof it.subtotal === 'number' && it.subtotal > 0
            ? Math.round((it.subtotal * 2) / qty)
            : 0;

  return { unitNormal, totalNormal: unitNormal * qty };
}

export interface VoucherSplitTransaction {
  items: ItemUnit[];
  totalNormal: number;
  voucherType: string;
  discount: number;
}

export interface VoucherSplitResult {
  k: number;
  transactions: VoucherSplitTransaction[];
  totalDiscount: number;
}

export function evaluateVoucherForBasket(items: ItemUnit[]): VoucherSplitTransaction {
  const sum = items.reduce((s, u) => s + u.normalPrice, 0);
  if (sum >= 50000 && sum <= 60000) {
    return {
      items,
      totalNormal: sum,
      voucherType: 'Voucher Min. 50k, Maks 30k',
      discount: Math.min(30000, Math.round(sum * 0.5)),
    };
  }

  return {
    items,
    totalNormal: sum,
    voucherType: 'Voucher Tanpa Min (Maks 35k)',
    discount: Math.min(35000, Math.round(sum * 0.5)),
  };
}

export function findBestSplit(units: ItemUnit[]): VoucherSplitResult | null {
  const total = units.reduce((s, u) => s + u.normalPrice, 0);
  if (total <= 70000 || units.length < 2) return null;

  const sorted = [...units].sort((a, b) => b.normalPrice - a.normalPrice);
  const maxK = Math.min(sorted.length, Math.max(2, Math.floor(total / 40000)));

  let bestResult: VoucherSplitResult | null = null;
  let bestScore = -1;

  for (let k = 2; k <= maxK; k++) {
    // 1. Greedy assignment (Longest Processing Time first)
    const greedyBaskets: ItemUnit[][] = Array.from({ length: k }, () => []);
    const greedySums = new Array(k).fill(0);
    for (const u of sorted) {
      let minIdx = 0;
      let minSum = Infinity;
      for (let b = 0; b < k; b++) {
        if (greedySums[b] < minSum) {
          minSum = greedySums[b];
          minIdx = b;
        }
      }
      greedyBaskets[minIdx].push(u);
      greedySums[minIdx] += u.normalPrice;
    }

    if (!greedySums.some((s) => s === 0)) {
      const txs = greedyBaskets.map(evaluateVoucherForBasket);
      const totalDisc = txs.reduce((acc, t) => acc + t.discount, 0);
      const score = totalDisc * 1000 - k;
      if (score > bestScore) {
        bestScore = score;
        bestResult = { k, transactions: txs, totalDiscount: totalDisc };
      }
    }

    // 2. Backtracking search jika sorted.length <= 14
    if (sorted.length <= 14) {
      let stateCount = 0;
      const baskets: ItemUnit[][] = Array.from({ length: k }, () => []);
      const sums = new Array(k).fill(0);

      const search = (idx: number) => {
        if (stateCount++ > 15000) return;
        if (idx === sorted.length) {
          if (sums.some((s) => s === 0)) return;
          const txs = baskets.map(evaluateVoucherForBasket);
          const totalDisc = txs.reduce((acc, t) => acc + t.discount, 0);
          const sc = totalDisc * 1000 - k;
          if (sc > bestScore) {
            bestScore = sc;
            bestResult = {
              k,
              transactions: txs.map((t) => ({ ...t, items: [...t.items] })),
              totalDiscount: totalDisc,
            };
          }
          return;
        }

        const item = sorted[idx];
        let emptyVisited = false;
        for (let b = 0; b < k; b++) {
          if (sums[b] === 0) {
            if (emptyVisited) continue;
            emptyVisited = true;
          }
          if (sums[b] >= 75000 && item.normalPrice > 15000) continue;

          baskets[b].push(item);
          sums[b] += item.normalPrice;
          search(idx + 1);
          sums[b] -= item.normalPrice;
          baskets[b].pop();
        }
      };

      search(0);
    }
  }

  if (!bestResult || bestResult.totalDiscount <= 35000) {
    return null;
  }

  return bestResult;
}

export function cleanVariantTokens(tokens: string[], productName?: string): string[] {
  const isDutchChoco = Boolean(productName && /dutch\s*choco/i.test(productName));
  const isFrappe = Boolean(productName && /frappe/i.test(productName));

  const flat: string[] = [];
  for (const t of tokens) {
    if (!t) continue;
    const parts = t.split(',').map((p) => p.trim()).filter(Boolean);
    flat.push(...parts);
  }

  const result: string[] = [];
  for (const part of flat) {
    const lower = part.toLowerCase();

    // Default beans
    if (lower === 'kenangan blend' || lower === 'fore blend' || lower === 'master blend') {
      continue;
    }
    // Default milk
    if (lower === 'milk' || lower === 'master milk') {
      continue;
    }
    // Default sugar
    if (lower === 'normal sugar' || lower === '100% sugar' || lower === 'regular sugar') {
      continue;
    }
    // Default ice
    if (lower === 'normal ice' || lower === '100% ice' || lower === 'regular ice') {
      continue;
    }
    // Default espresso
    if (lower === 'normal shot' || lower === '1 shot') {
      continue;
    }
    // Default topping
    if (lower === 'no topping' || lower === 'tanpa topping') {
      continue;
    }

    // Default whipped cream untuk frappe
    if (isFrappe) {
      if (isDutchChoco) {
        if (/coke?lat/i.test(lower) || /chocolate/i.test(lower)) {
          continue; // Default whipped cream untuk Dutch Choco Kenangan Frappe
        }
      } else {
        if (/vanil?la/i.test(lower)) {
          continue; // Default whipped cream untuk seluruh Kenangan Frappe lainnya
        }
      }
    }

    result.push(part);
  }

  return result;
}

export function formatVoucherRecommendation(order: OrderRecord): string | null {
  const isKopiKenangan =
    !order.brand_slug || order.brand_slug === 'kopi-kenangan' || order.id.startsWith('KK-');

  if (!isKopiKenangan) return null;

  const items = order.items || [];
  if (items.length === 0) return null;

  const units: ItemUnit[] = [];
  let totalOrderNormal = 0;

  for (const it of items) {
    const { unitNormal, totalNormal } = getItemNormalPrice(it);
    totalOrderNormal += totalNormal;
    const qty = it.quantity || 1;
    for (let q = 0; q < qty; q++) {
      units.push({ name: it.name, normalPrice: unitNormal });
    }
  }

  if (totalOrderNormal <= 0) return null;

  let out = `<b>💡 Rekomendasi Voucher (Kopi Kenangan):</b>\n`;
  out += `• Total Harga Normal: <b>${formatRupiah(totalOrderNormal)}</b>\n`;

  // 1. Total Normal < 50k (Di bawah 50k)
  if (totalOrderNormal < 50000) {
    const estDiscount = Math.min(35000, Math.round(totalOrderNormal * 0.5));
    const shortage = 50000 - totalOrderNormal;
    out += `• Rekomendasi: <b>Voucher Tanpa Minimal (Maks. Diskon 35k)</b>\n`;
    out += `• Est. Diskon: <b>${formatRupiah(estDiscount)}</b>\n`;
    out += `<i>ℹ️ Total normal di bawah 50k (kurang ${formatRupiah(shortage)} untuk voucher min. 50k).</i>\n`;
    return out;
  }

  // 2. Total Normal 50k - 60k (Menyentuh 50k - 60k)
  if (totalOrderNormal >= 50000 && totalOrderNormal <= 60000) {
    const estDiscount = Math.min(30000, Math.round(totalOrderNormal * 0.5));
    out += `• Rekomendasi: <b>Voucher Min. Pembelian 50k (Maks. Diskon 30k)</b>\n`;
    out += `• Est. Diskon: <b>${formatRupiah(estDiscount)}</b>\n`;
    out += `<i>ℹ️ Menyentuh rentang 50k - 60k! Wajib pakai voucher min. 50k agar voucher tanpa min hemat untuk order lain.</i>\n`;
    return out;
  }

  // 3. Total Normal > 60k s/d 70k (Menyentuh 60k - 70k)
  if (totalOrderNormal > 60000 && totalOrderNormal <= 70000) {
    const estDiscount = Math.min(35000, Math.round(totalOrderNormal * 0.5));
    out += `• Rekomendasi: <b>Voucher Tanpa Minimal (Maks. Diskon 35k)</b>\n`;
    out += `• Est. Diskon: <b>${formatRupiah(estDiscount)}</b>\n`;
    out += `<i>ℹ️ Menyentuh rentang 60k - 70k! Pakai voucher tanpa min untuk diskon maksimal s/d ${formatRupiah(estDiscount)} (voucher min. 50k mentok di Rp30.000).</i>\n`;
    return out;
  }

  // 4. Total Normal > 70k (Melebihi batas maksimal 70k untuk 1 voucher)
  const estDiscountSingle = Math.min(35000, Math.round(totalOrderNormal * 0.5));
  const split = findBestSplit(units);

  if (split) {
    out += `• <i>Total normal melebihi batas 70k untuk 1 voucher.</i>\n`;
    out += `🔥 <b>Saran: Split ${split.k} Transaksi</b> (Est. Hemat ~<b>${formatRupiah(split.totalDiscount)}</b> vs ~Rp35.000 jika 1 transaksi):\n`;
    split.transactions.forEach((tx, idx) => {
      const names = tx.items.map((u) => u.name).join(', ');
      out += `${idx + 1}. <b>Transaksi ${idx + 1} (${tx.voucherType}):</b>\n`;
      out += `   • Menu (~${formatRupiah(tx.totalNormal)} normal): ${escapeHtml(names)}\n`;
      out += `   • Est. Diskon: <b>${formatRupiah(tx.discount)}</b>\n`;
    });
    out += `• <i>Jika tetap 1 transaksi: Gunakan Voucher Tanpa Minimal (Diskon mentok Rp35.000).</i>\n`;
    return out;
  }

  out += `• <i>Total normal melebihi batas 70k untuk 1 voucher.</i>\n`;
  out += `🔥 <b>Saran: Split Transaksi</b> jika memungkinkan agar diskon tidak terpotong batas maksimal voucher.\n`;
  out += `• <i>Jika tetap 1 transaksi: Gunakan Voucher Tanpa Minimal (Diskon mentok ${formatRupiah(estDiscountSingle)}).</i>\n`;
  return out;
}

export function getBrandDisplay(brandSlug?: string, outletCode?: string): string {
  const isTomoro =
    brandSlug?.toLowerCase() === 'tomoro' ||
    outletCode?.toLowerCase().startsWith('tomoro-');

  const isFore =
    !isTomoro &&
    (brandSlug?.toLowerCase() === 'fore' ||
      outletCode?.toLowerCase().startsWith('fore-') ||
      (Boolean(brandSlug) &&
        !brandSlug!.toLowerCase().includes('kopi') &&
        !brandSlug!.toLowerCase().includes('kenangan') &&
        brandSlug!.toLowerCase().includes('fore')));

  if (isTomoro) return 'TOMORO Coffee';
  if (isFore) return 'Fore Coffee';
  return 'Kopi Kenangan';
}

export function formatPickupDisplay(pickupTime?: string | null, createdAt?: string): string {
  const isScheduled = Boolean(
    pickupTime &&
      pickupTime !== 'now' &&
      !pickupTime.trim().toLowerCase().startsWith('sekarang')
  );

  if (isScheduled && pickupTime) {
    const clean = pickupTime
      .replace(/^(dijadwalkan|terjadwal)\s*(jam)?\s*/i, '')
      .trim();
    return `🕒 DIJADWALKAN JAM ${clean.toUpperCase()}`;
  }

  if (createdAt) {
    try {
      const createdDate = new Date(createdAt);
      if (!isNaN(createdDate.getTime())) {
        const estTime = new Date(createdDate.getTime() + 15 * 60 * 1000);
        const estFormatted = estTime
          .toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace('.', ':');
        return `⚡ SEKARANG (Est. siap ~${estFormatted})`;
      }
    } catch {
      // Abaikan parsing error tanggal
    }
  }

  return '⚡ SEKARANG';
}

export function formatCustomerWaLink(customerWa?: string): string {
  const raw = customerWa || '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return escapeHtml(raw);

  const waNumber = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits;

  return `<a href="https://wa.me/${waNumber}">${escapeHtml(raw)}</a>`;
}

export function formatOrderTelegramMessage(order: OrderRecord, extraNote?: string): string {
  const statusEmoji: Record<OrderStatus, string> = {
    menunggu_pembayaran: '⏳ Menunggu Pembayaran',
    menunggu_konfirmasi: '🚨 MENUNGGU KONFIRMASI',
    antrian: '📥 MASUK ANTRIAN',
    diproses: '☕ SEDANG DIPROSES',
    selesai: '✅ SELESAI',
    dibatalkan: '❌ DIBATALKAN',
    kedaluwarsa: '⏰ KEDALUWARSA',
  };

  const statusText = statusEmoji[order.status] || order.status;

  const itemLines = (order.items || [])
    .map((it) => {
      const qty = it.quantity || 1;
      const noteStr = it.notes ? `\n   ↳ <i>Catatan: ${escapeHtml(it.notes)}</i>` : '';

      // Penanganan khusus jika item adalah paket bundling dengan rincian bundleDetails
      if (it.isBundle && it.bundleDetails && it.bundleDetails.length > 0) {
        const bundleLines = it.bundleDetails
          .map((d) => {
            const cleanedBundleOpt = d.variantDescription
              ? cleanVariantTokens([d.variantDescription], d.name).join(', ')
              : '';
            const opt = cleanedBundleOpt ? ` (${escapeHtml(cleanedBundleOpt)})` : '';
            const isFreeB1G1 =
              d.promoPrice === 0 || (it.bundleType === 'tomoro-b1g1' && d.promoPrice === 0);
            let dPrice = '';
            if (isFreeB1G1) {
              dPrice = ' - <b>GRATIS (B1G1)</b>';
            } else if (typeof d.promoPrice === 'number') {
              dPrice = ` - <b>${formatRupiah(d.promoPrice)}</b>`;
            } else if (typeof d.normalPrice === 'number') {
              dPrice = ` - <b>${formatRupiah(Math.round(d.normalPrice * 0.5))}</b>`;
            }
            const dNote = d.notes ? `\n      ↳ <i>Catatan: ${escapeHtml(d.notes)}</i>` : '';
            return `   • ${escapeHtml(d.name)}${opt}${dPrice}${dNote}`;
          })
          .join('\n');

        const parentPrice =
          typeof it.subtotal === 'number' ? ` - <b>${formatRupiah(it.subtotal)}</b>` : '';
        return `• ${qty}x <b>${escapeHtml(it.name)}</b>${parentPrice}\n${bundleLines}${noteStr}`;
      }

      // Gabungkan opsi varian dan addons (seperti Whipped Cream, Syrup, Topping)
      const optParts: string[] = [];
      if (it.variantOptions && it.variantOptions.length > 0) {
        optParts.push(...it.variantOptions.filter(Boolean));
      }
      if (it.addons && it.addons.length > 0) {
        const existingLower = optParts.join(', ').toLowerCase();
        for (const a of it.addons) {
          if (a.name && !existingLower.includes(a.name.toLowerCase())) {
            const hasSuffix = /\(\+Rp[\d.]+\)$/i.test(a.name);
            const priceSuffix =
              !hasSuffix && typeof a.price === 'number' && a.price > 0
                ? ` (+${formatRupiah(a.price)})`
                : '';
            optParts.push(`${a.name}${priceSuffix}`);
          }
        }
      }

      const cleanedOpts = cleanVariantTokens(optParts, it.name);
      const variantStr =
        cleanedOpts.length > 0
          ? ` (${escapeHtml(cleanedOpts.join(', '))})`
          : '';

      const hasPrice =
        typeof it.subtotal === 'number' ||
        typeof it.promoPrice === 'number' ||
        typeof it.basePrice === 'number';

      let priceText = '';
      if (hasPrice) {
        const subtotal =
          typeof it.subtotal === 'number'
            ? it.subtotal
            : typeof it.promoPrice === 'number'
              ? it.promoPrice * qty
              : typeof it.basePrice === 'number'
                ? it.basePrice * qty
                : 0;

        const unitPrice =
          typeof it.promoPrice === 'number' && it.promoPrice > 0
            ? it.promoPrice
            : qty > 0
              ? Math.round(subtotal / qty)
              : subtotal;

        if (qty > 1) {
          priceText = ` - <b>${formatRupiah(subtotal)}</b> (@${formatRupiah(unitPrice)})`;
        } else {
          priceText = ` - <b>${formatRupiah(subtotal)}</b>`;
        }
      }

      return `• ${qty}x <b>${escapeHtml(it.name)}</b>${variantStr}${priceText}${noteStr}`;
    })
    .join('\n');

  const brandDisplay = getBrandDisplay(order.brand_slug, order.outlet_code);
  const pickupDisplay = formatPickupDisplay(order.pickup_time, order.created_at);
  const customerWaHtml = formatCustomerWaLink(order.customer_wa);

  const computedSubtotal =
    typeof order.subtotal === 'number' && order.subtotal > 0
      ? order.subtotal
      : (order.items || []).reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const computedFee =
    typeof order.fee === 'number' ? order.fee : Math.max(0, order.total - computedSubtotal);
  const computedTotal =
    typeof order.total === 'number' && order.total > 0
      ? order.total
      : computedSubtotal + computedFee;

  let totalNormalPrice = 0;
  for (const it of order.items || []) {
    const { totalNormal } = getItemNormalPrice(it);
    totalNormalPrice += totalNormal;
  }
  const totalSavings = Math.max(0, totalNormalPrice - computedTotal);

  let text = `<b>JASDOR KOPI CIMA : PESANAN</b>\n`;
  text += `=====================\n`;
  text += `<b>Status:</b> ${statusText}\n`;
  text += `<b>Kode:</b> <code>${escapeHtml(order.id)}</code>\n`;
  text += `<b>Brand:</b> ${escapeHtml(brandDisplay)}\n`;
  if (order.outlet_name) {
    text += `<b>Outlet:</b> ${escapeHtml(order.outlet_name)}\n`;
  }
  text += `<b>Pemesan:</b> ${escapeHtml(order.customer_name)} (${customerWaHtml})\n`;
  text += `<b>Waktu Ambil:</b> ${pickupDisplay}\n`;
  text += `=====================\n`;
  text += `<b>Item Pesanan:</b>\n${itemLines || '• (Tidak ada item)'}\n`;

  if (order.notes) {
    text += `\n<b>Catatan Pesanan:</b>\n<i>${escapeHtml(order.notes)}</i>\n`;
  }

  text += `\n=====================\n`;
  text += `<b>Rincian Pembayaran:</b>\n`;
  text += `• Subtotal Menu: <b>${formatRupiah(computedSubtotal)}</b>\n`;
  text += `• Biaya Jasa Order: <b>${formatRupiah(computedFee)}</b>\n`;
  text += `• <b>Total Bayar:</b> <b>${formatRupiah(computedTotal)}</b>\n`;
  if (totalSavings > 0) {
    text += `• <i>Pelanggan hemat ${formatRupiah(totalSavings)} dari harga normal</i>\n`;
  }

  const voucherRec = formatVoucherRecommendation(order);
  if (voucherRec) {
    text += `\n=====================\n${voucherRec}`;
  }

  if (extraNote) {
    text += `\nℹ️ <i>${escapeHtml(extraNote)}</i>\n`;
  }

  return text;
}

export function getOrderInlineKeyboard(
  orderId: string,
  status: OrderStatus
): TelegramInlineKeyboardMarkup {
  if (status === 'selesai' || status === 'dibatalkan' || status === 'kedaluwarsa') {
    return { inline_keyboard: [] };
  }

  if (status === 'menunggu_konfirmasi') {
    return {
      inline_keyboard: [
        [
          { text: '📥 Masuk Antrian', callback_data: `status:antrian:${orderId}` },
          { text: '☕ Sedang Diproses', callback_data: `status:diproses:${orderId}` },
        ],
        [
          { text: '✅ Selesai', callback_data: `status:selesai:${orderId}` },
          { text: '❌ Batalkan', callback_data: `status:dibatalkan:${orderId}` },
        ],
      ],
    };
  }

  if (status === 'antrian') {
    return {
      inline_keyboard: [
        [
          { text: '☕ Sedang Diproses', callback_data: `status:diproses:${orderId}` },
          { text: '❌ Batalkan', callback_data: `status:dibatalkan:${orderId}` },
        ],
      ],
    };
  }

  if (status === 'diproses') {
    return {
      inline_keyboard: [
        [
          { text: '✅ Selesai', callback_data: `status:selesai:${orderId}` },
          { text: '❌ Batalkan', callback_data: `status:dibatalkan:${orderId}` },
        ],
      ],
    };
  }

  return { inline_keyboard: [] };
}

export async function sendTelegramOrderNotification(
  order: OrderRecord,
  overrideConfig?: Partial<TelegramConfig>
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const config = {
    ...getTelegramConfig(),
    ...overrideConfig,
  };

  if (!config.botToken || !config.chatId) {
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_ADMIN_CHAT_ID belum dikonfigurasi',
    };
  }

  const text = formatOrderTelegramMessage(order);
  const reply_markup = getOrderInlineKeyboard(order.id, order.status);

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        reply_markup,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data.ok) {
      console.warn('[Telegram] Gagal mengirim notifikasi:', data?.description || res.statusText);
      return { success: false, error: data?.description || 'Gagal mengirim pesan Telegram' };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    console.error('[Telegram] Network exception saat kirim notifikasi:', err);
    return { success: false, error: err.message || 'Koneksi ke Telegram gagal' };
  }
}

export async function editTelegramOrderMessage(
  chatId: string | number,
  messageId: number,
  order: OrderRecord,
  extraNote?: string,
  overrideConfig?: Partial<TelegramConfig>
): Promise<{ success: boolean; error?: string }> {
  const config = {
    ...getTelegramConfig(),
    ...overrideConfig,
  };

  if (!config.botToken) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi' };
  }

  const text = formatOrderTelegramMessage(order, extraNote);
  const reply_markup = getOrderInlineKeyboard(order.id, order.status);

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data.ok) {
      console.warn('[Telegram] Gagal mengedit pesan:', data?.description || res.statusText);
      return { success: false, error: data?.description || 'Gagal mengedit pesan Telegram' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Telegram] Network exception saat edit pesan:', err);
    return { success: false, error: err.message || 'Koneksi ke Telegram gagal' };
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string,
  showAlert = false,
  overrideConfig?: Partial<TelegramConfig>
): Promise<void> {
  const config = {
    ...getTelegramConfig(),
    ...overrideConfig,
  };

  if (!config.botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${config.botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error('[Telegram] Gagal answerCallbackQuery:', err);
  }
}

/**
 * Menghapus pesan Telegram (misalnya pesan teks yang tidak sengaja diketik oleh user/admin).
 */
export async function deleteTelegramMessage(
  chatId: string | number,
  messageId: number,
  overrideConfig?: Partial<TelegramConfig>
): Promise<boolean> {
  const config = {
    ...getTelegramConfig(),
    ...overrideConfig,
  };

  if (!config.botToken) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    const data = (await res.json()) as any;
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}
