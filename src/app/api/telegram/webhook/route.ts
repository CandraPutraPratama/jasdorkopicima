import { NextRequest, NextResponse } from 'next/server.js';
import {
  getTelegramConfig,
  answerTelegramCallback,
  editTelegramOrderMessage,
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

  // 1. Tangani callback_query (klik tombol inline)
  if (body?.callback_query) {
    const cb = body.callback_query;
    const fromId = String(cb?.from?.id || '');

    if (!adminChatId || fromId !== adminChatId) {
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

  // 2. Tangani pesan teks biasa (misal: /start)
  if (body?.message) {
    const msg = body.message;
    const fromId = String(msg?.from?.id || '');
    const text = String(msg?.text || '').trim();

    if (text === '/start') {
      const isAuthorized = adminChatId && fromId === adminChatId;
      const replyText = isAuthorized
        ? `👋 <b>Halo Admin Jasdor Kopi Cima!</b>\n\nBot ini sudah aktif dan terhubung ke sistem Jasdor.\nSetiap ada pesanan yang menyelesaikan pembayaran, notifikasi dan tombol aksi langsung muncul di sini.`
        : `Akses dibatasi hanya untuk admin resmi Jasdor Kopi Cima (Chat ID Anda: <code>${fromId}</code>).`;

      if (config.botToken && msg.chat?.id) {
        try {
          await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              text: replyText,
              parse_mode: 'HTML',
            }),
          });
        } catch {
          // Abaikan kesalahan koneksi Telegram
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
