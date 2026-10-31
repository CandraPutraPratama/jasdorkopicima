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

    it('menampilkan informasi harga di sebelah menu untuk item qty = 1', () => {
      const singleItemOrder: OrderRecord = {
        ...mockOrder,
        items: [
          {
            id: 'item-single',
            bundleCode: 'single-1',
            name: 'Americano',
            basePrice: 15000,
            promoPrice: 15000,
            originalPrice: 15000,
            quantity: 1,
            subtotal: 15000,
            variantOptions: ['Ice', 'Regular'],
          },
        ],
      };
      const msg = formatOrderTelegramMessage(singleItemOrder);
      assert.ok(
        msg.includes('• 1x <b>Americano</b> (Ice, Regular) - <b>Rp15.000</b>'),
        `Harus menampilkan harga menu Rp15.000 di sebelah nama menu, pesan aktual: ${msg}`
      );
    });

    it('menampilkan informasi subtotal dan harga satuan (@harga) untuk item qty > 1', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(
        msg.includes('• 2x <b>Kopi Kenangan Mantan</b> (Ice, Regular, Normal Sugar) - <b>Rp36.000</b> (@Rp18.000)'),
        `Harus menampilkan subtotal Rp36.000 dan harga satuan @Rp18.000, pesan aktual: ${msg}`
      );
      assert.ok(
        msg.includes('↳ <i>Catatan: Sedikit es</i>'),
        `Catatan harus tetap tampil rapi di baris baru`
      );
    });

    it('menampilkan rincian harga per menu di dalam paket bundling', () => {
      const bundleOrder: OrderRecord = {
        ...mockOrder,
        items: [
          {
            id: 'bundle-1',
            bundleCode: 'b-1',
            name: 'Paket Bundling Kopi Kenangan',
            basePrice: 28500,
            promoPrice: 28500,
            originalPrice: 35000,
            quantity: 1,
            subtotal: 28500,
            isBundle: true,
            bundleDetails: [
              {
                name: 'Kopi Kenangan Mantan',
                variantDescription: 'Ice, Regular',
                promoPrice: 15000,
              },
              {
                name: 'Americano',
                variantDescription: 'Ice, Regular',
                promoPrice: 13500,
              },
            ],
          },
        ],
      };
      const msg = formatOrderTelegramMessage(bundleOrder);
      assert.ok(msg.includes('• 1x <b>Paket Bundling Kopi Kenangan</b> - <b>Rp28.500</b>'));
      assert.ok(msg.includes('   • Kopi Kenangan Mantan (Ice, Regular) - <b>Rp15.000</b>'));
      assert.ok(msg.includes('   • Americano (Ice, Regular) - <b>Rp13.500</b>'));
    });

    it('menampilkan status dengan badge yang jelas', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(msg.includes('Menunggu Konfirmasi') || msg.includes('MENUNGGU KONFIRMASI'));
    });

    describe('Rekomendasi Voucher Kopi Kenangan', () => {
      it('merekomendasikan Voucher Tanpa Minimal jika total harga normal < 50k', () => {
        const orderSmall: OrderRecord = {
          ...mockOrder,
          items: [
            {
              id: 'item-small',
              bundleCode: 's-1',
              name: 'Americano',
              basePrice: 15000,
              promoPrice: 15000,
              originalPrice: 18000,
              quantity: 2,
              subtotal: 30000,
            },
          ],
        };
        // Total normal: 18.000 x 2 = 36.000 (< 50k)
        const msg = formatOrderTelegramMessage(orderSmall);
        assert.ok(msg.includes('Rekomendasi Voucher (Kopi Kenangan)'), 'Harus ada section voucher');
        assert.ok(msg.includes('Total Harga Normal: <b>Rp36.000</b>'));
        assert.ok(msg.includes('Voucher Tanpa Minimal (Maks. Diskon 35k)'));
        assert.ok(msg.includes('di bawah 50k'));
      });

      it('merekomendasikan Voucher Min. Pembelian 50k jika total harga normal menyentuh 50k - 60k', () => {
        const orderMedium: OrderRecord = {
          ...mockOrder,
          items: [
            {
              id: 'item-med-1',
              bundleCode: 's-1',
              name: 'Kopi Kenangan Mantan',
              basePrice: 18000,
              promoPrice: 18000,
              originalPrice: 24000,
              quantity: 1,
              subtotal: 18000,
            },
            {
              id: 'item-med-2',
              bundleCode: 's-2',
              name: 'Americano',
              basePrice: 15000,
              promoPrice: 15000,
              originalPrice: 30000,
              quantity: 1,
              subtotal: 15000,
            },
          ],
        };
        // Total normal: 24.000 + 30.000 = 54.000 (di antara 50k - 60k)
        const msg = formatOrderTelegramMessage(orderMedium);
        assert.ok(msg.includes('Total Harga Normal: <b>Rp54.000</b>'));
        assert.ok(msg.includes('Voucher Min. Pembelian 50k (Maks. Diskon 30k)'));
        assert.ok(msg.includes('Menyentuh rentang 50k - 60k'));
      });

      it('merekomendasikan Voucher Tanpa Minimal jika total harga normal menyentuh 60k - 70k', () => {
        const orderSixtyToSeventy: OrderRecord = {
          ...mockOrder,
          items: [
            {
              id: 'item-68k',
              bundleCode: 's-1',
              name: 'Avocado Coffee',
              basePrice: 34000,
              promoPrice: 34000,
              originalPrice: 34000,
              quantity: 2,
              subtotal: 68000,
            },
          ],
        };
        // Total normal: 34.000 x 2 = 68.000 (60k - 70k)
        const msg = formatOrderTelegramMessage(orderSixtyToSeventy);
        assert.ok(msg.includes('Total Harga Normal: <b>Rp68.000</b>'));
        assert.ok(msg.includes('Voucher Tanpa Minimal (Maks. Diskon 35k)'));
        assert.ok(msg.includes('Menyentuh rentang 60k - 70k'));
      });

      it('merekomendasikan Split 2 Transaksi jika total harga normal > 70k (melebihi kapasitas voucher tunggal 70k)', () => {
        const orderBulk: OrderRecord = {
          ...mockOrder,
          items: [
            {
              id: 'item-1',
              bundleCode: 's-1',
              name: 'Kopi Kenangan Mantan',
              basePrice: 18000,
              promoPrice: 18000,
              originalPrice: 25000,
              quantity: 2,
              subtotal: 36000,
            },
            {
              id: 'item-2',
              bundleCode: 's-2',
              name: 'Americano',
              basePrice: 15000,
              promoPrice: 15000,
              originalPrice: 20000,
              quantity: 2,
              subtotal: 30000,
            },
            {
              id: 'item-3',
              bundleCode: 's-3',
              name: 'Vanilla Latte',
              basePrice: 20000,
              promoPrice: 20000,
              originalPrice: 25000,
              quantity: 2,
              subtotal: 40000,
            },
          ],
        };
        // Total normal: (25.000*2) + (20.000*2) + (25.000*2) = 50k + 40k + 50k = 140.000 (> 70k)
        const msg = formatOrderTelegramMessage(orderBulk);
        assert.ok(msg.includes('Total Harga Normal: <b>Rp140.000</b>'));
        assert.ok(msg.includes('Total normal melebihi batas 70k'));
        assert.ok(msg.includes('Split 2 Transaksi'));
        assert.ok(msg.includes('Transaksi 1'));
        assert.ok(msg.includes('Transaksi 2'));
      });

      it('TIDAK menampilkan rekomendasi voucher Kopi Kenangan untuk brand lain (Tomoro/Fore)', () => {
        const orderTomoro: OrderRecord = {
          ...mockOrder,
          id: 'TC-1028-TEST',
          brand_slug: 'tomoro',
        };
        const msg = formatOrderTelegramMessage(orderTomoro);
        assert.ok(!msg.includes('Rekomendasi Voucher (Kopi Kenangan)'));
      });
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
