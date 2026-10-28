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
      const variantStr =
        it.variantOptions && it.variantOptions.length > 0
          ? ` (${escapeHtml(it.variantOptions.join(', '))})`
          : '';
      const noteStr = it.notes ? `\n   ↳ <i>Catatan: ${escapeHtml(it.notes)}</i>` : '';
      return `• ${qty}x <b>${escapeHtml(it.name)}</b>${variantStr}${noteStr}`;
    })
    .join('\n');

  let text = `<b>JASDOR KOPI CIMA : PESANAN</b>\n`;
  text += `=====================\n`;
  text += `<b>Status:</b> ${statusText}\n`;
  text += `<b>Kode:</b> <code>${escapeHtml(order.id)}</code>\n`;
  if (order.outlet_name) {
    text += `<b>Outlet:</b> ${escapeHtml(order.outlet_name)}\n`;
  }
  text += `<b>Pemesan:</b> ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_wa)})\n`;
  text += `<b>Total:</b> <b>${formatRupiah(order.total)}</b>\n`;
  text += `=====================\n`;
  text += `<b>Item Pesanan:</b>\n${itemLines || '• (Tidak ada item)'}\n`;

  if (order.notes) {
    text += `\n<b>Catatan Pesanan:</b>\n<i>${escapeHtml(order.notes)}</i>\n`;
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
