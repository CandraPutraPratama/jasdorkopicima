import { NextRequest, NextResponse } from 'next/server.js';
import {
  getTelegramConfig,
  answerTelegramCallback,
  editTelegramOrderMessage,
  deleteTelegramMessage,
} from '../../../../lib/telegram.ts';
import { updateOrderStatusByAdmin } from '../../../../lib/order-service.ts';
import type { OrderStatus } from '../../../../types/order.ts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const config = getTelegramConfig();
  const adminChatId = String(config.chatId);
  const authorizedIds = adminChatId
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // 1. Tangani callback_query (klik tombol inline)
  if (body?.callback_query) {
    const cb = body.callback_query;
    const fromId = String(cb?.from?.id || '');
    const chatFromMsg = cb?.message?.chat?.id ? String(cb.message.chat.id) : '';

    const isAuthorized =
      authorizedIds.length > 0 &&
      (authorizedIds.includes(fromId) || (chatFromMsg && authorizedIds.includes(chatFromMsg)));

    if (!isAuthorized) {
      if (cb.id) {
        await answerTelegramCallback(cb.id, 'Akses ditolak: Anda bukan admin resmi Jasdor.', true);
      }
      return NextResponse.json({ ok: true, action: 'unauthorized' });
    }

    const data = String(cb.data || '');
    const [action, targetStatus, orderId] = data.split(':');

    if (action === 'status' && targetStatus && orderId) {
      const allowed: OrderStatus[] = ['antrian', 'diproses', 'selesai', 'dibatalkan'];
      if (!allowed.includes(targetStatus as OrderStatus)) {
        await answerTelegramCallback(cb.id, `Status "${targetStatus}" tidak didukung.`, true);
        return NextResponse.json({ ok: true });
      }

      try {
        const cancellationReason =
          targetStatus === 'dibatalkan' ? 'Dibatalkan oleh admin via Telegram' : undefined;
        const updatedOrder = await updateOrderStatusByAdmin(
          orderId,
          targetStatus as OrderStatus,
          cancellationReason
        );

        await answerTelegramCallback(
          cb.id,
          `✅ Status pesanan ${orderId} berhasil diubah ke ${targetStatus.toUpperCase()}!`
        );

        if (cb.message?.message_id && cb.message?.chat?.id) {
          await editTelegramOrderMessage(
            cb.message.chat.id,
            cb.message.message_id,
            updatedOrder,
            `Diubah ke: ${targetStatus.toUpperCase()} oleh Admin via Telegram`
          );
        }
      } catch (err: any) {
        await answerTelegramCallback(cb.id, `❌ Gagal: ${err.message || 'Error update'}`, true);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // 2. Tangani pesan teks biasa (misal: /start atau ketikan tidak sengaja)
  if (body?.message) {
    const msg = body.message;
    const fromId = String(msg?.from?.id || '');
    const chatId = msg?.chat?.id;
    const messageId = msg?.message_id;
    const text = String(msg?.text || '').trim();

    if (text === '/start') {
      const isAuthorized =
        authorizedIds.length > 0 &&
        (authorizedIds.includes(fromId) || (chatId && authorizedIds.includes(String(chatId))));

      const replyText = isAuthorized
        ? `👋 <b>Halo Admin Jasdor Kopi Cima!</b>\n\nBot ini khusus untuk menerima notifikasi pesanan masuk.\nSetiap ada pesanan baru, rincian pesanan dan tombol status langsung dikirim ke sini.\n\n<i>Tips: Anda tidak perlu mengetik apa pun di sini, cukup klik tombol status pada pesanan.</i>`
        : `Akses dibatasi hanya untuk admin resmi Jasdor Kopi Cima (Chat ID Anda: <code>${fromId}</code>).`;

      if (config.botToken && chatId) {
        try {
          await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: 'HTML',
              reply_markup: { remove_keyboard: true },
            }),
          });
        } catch {
          // Abaikan kesalahan koneksi Telegram
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Jika user/admin tidak sengaja mengetik atau mengirim pesan apa pun selain /start:
    // Otomatis hapus pesan tersebut seketika agar ruang chat bot tetap 100% bersih dan rapi
    if (chatId && messageId) {
      await deleteTelegramMessage(chatId, messageId);
    }

    return NextResponse.json({ ok: true, cleaned: true });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
