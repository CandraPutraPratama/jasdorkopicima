import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { OrderRecord } from '../src/types/order.ts';
import {
  formatOrderTelegramMessage,
  getOrderInlineKeyboard,
  sendTelegramOrderNotification,
} from '../src/lib/telegram.ts';

const mockOrder: OrderRecord = {
  id: 'KK-1028-TEST',
  brand_slug: 'kopi-kenangan',
  outlet_code: 'OUT-001',
  outlet_name: 'Kopi Kenangan - Mall Cima',
  customer_name: 'Budi Santoso',
  customer_wa: '08123456789',
  items: [
    {
      id: 'item-1',
      bundleCode: 'single-1',
      name: 'Kopi Kenangan Mantan',
      basePrice: 18000,
      promoPrice: 18000,
      originalPrice: 20000,
      quantity: 2,
      subtotal: 36000,
      variantOptions: ['Ice', 'Regular', 'Normal Sugar'],
      notes: 'Sedikit es',
    },
  ],
  subtotal: 36000,
  fee: 2000,
  total: 38000,
  status: 'menunggu_konfirmasi',
  notes: 'Tolong antar ke lantai 2',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 3600000).toISOString(),
};

describe('Telegram Integration: Formatter & Keyboard', () => {
  describe('formatOrderTelegramMessage', () => {
    it('memformat kode pesanan, nama pemesan, dan total dengan benar', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(msg.includes('KK-1028-TEST'));
      assert.ok(msg.includes('Budi Santoso'));
      assert.ok(msg.includes('08123456789'));
      assert.ok(msg.includes('38.000'));
      assert.ok(msg.includes('Kopi Kenangan Mantan'));
      assert.ok(msg.includes('Sedikit es'));
      assert.ok(msg.includes('Tolong antar ke lantai 2'));
    });

    it('menampilkan status dengan badge yang jelas', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(msg.includes('Menunggu Konfirmasi') || msg.includes('MENUNGGU KONFIRMASI'));
    });
  });

  describe('getOrderInlineKeyboard', () => {
    it('memberikan tombol Antrian, Proses, Selesai, dan Batalkan untuk status menunggu_konfirmasi', () => {
      const keyboard = getOrderInlineKeyboard('KK-1028-TEST', 'menunggu_konfirmasi');
      assert.ok(Array.isArray(keyboard.inline_keyboard));
      const allButtons = keyboard.inline_keyboard.flat();
      const callbackDatas = allButtons.map((b) => b.callback_data);

      assert.ok(callbackDatas.some((cb) => cb?.includes('status:antrian:KK-1028-TEST')));
      assert.ok(callbackDatas.some((cb) => cb?.includes('status:diproses:KK-1028-TEST')));
      assert.ok(callbackDatas.some((cb) => cb?.includes('status:dibatalkan:KK-1028-TEST')));
    });

    it('memberikan tombol Diproses dan Batalkan saat status sudah antrian', () => {
      const keyboard = getOrderInlineKeyboard('KK-1028-TEST', 'antrian');
      const allButtons = keyboard.inline_keyboard.flat();
      const callbackDatas = allButtons.map((b) => b.callback_data);

      assert.ok(callbackDatas.some((cb) => cb?.includes('status:diproses:KK-1028-TEST')));
      assert.ok(callbackDatas.some((cb) => cb?.includes('status:dibatalkan:KK-1028-TEST')));
      assert.ok(!callbackDatas.some((cb) => cb?.includes('status:antrian:KK-1028-TEST')));
    });

    it('memberikan tombol Selesai saat status diproses', () => {
      const keyboard = getOrderInlineKeyboard('KK-1028-TEST', 'diproses');
      const allButtons = keyboard.inline_keyboard.flat();
      const callbackDatas = allButtons.map((b) => b.callback_data);

      assert.ok(callbackDatas.some((cb) => cb?.includes('status:selesai:KK-1028-TEST')));
      assert.ok(!callbackDatas.some((cb) => cb?.includes('status:diproses:KK-1028-TEST')));
    });

    it('mengosongkan tombol aksi ketika status selesai atau dibatalkan', () => {
      const keyboardSelesai = getOrderInlineKeyboard('KK-1028-TEST', 'selesai');
      assert.equal(keyboardSelesai.inline_keyboard.length, 0);

      const keyboardBatal = getOrderInlineKeyboard('KK-1028-TEST', 'dibatalkan');
      assert.equal(keyboardBatal.inline_keyboard.length, 0);
    });
  });

  describe('sendTelegramOrderNotification safe fallback', () => {
    it('tidak melempar uncaught error jika token/chat ID belum dikonfigurasi', async () => {
      // Tidak boleh crash aplikasi utama jika telegram gagal kirim
      const result = await sendTelegramOrderNotification(mockOrder, {
        botToken: '',
        chatId: '',
      });
      assert.equal(result.success, false);
      assert.ok(result.error);
    });
  });
});
