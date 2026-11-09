import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { OrderRecord } from '../src/types/order.ts';
import {
  formatOrderTelegramMessage,
  getOrderInlineKeyboard,
  sendTelegramOrderNotification,
  findBestSplit,
  cleanVariantTokens,
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
        msg.includes('• 2x <b>Kopi Kenangan Mantan</b> (Ice, Regular) - <b>Rp36.000</b> (@Rp18.000)'),
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

    it('menampilkan brand dan waktu pengambilan (sekarang vs terjadwal) dengan jelas', () => {
      // 1. Mode Sekarang
      const orderNow: OrderRecord = {
        ...mockOrder,
        pickup_time: 'Sekarang (~10 menit)',
        created_at: '2026-11-06T10:00:00.000Z',
      };
      const msgNow = formatOrderTelegramMessage(orderNow);
      assert.ok(msgNow.includes('<b>Brand:</b> Kopi Kenangan'));
      assert.ok(msgNow.includes('Waktu Ambil:') || msgNow.includes('Pickup:'));
      assert.ok(msgNow.toLowerCase().includes('sekarang'));

      // 2. Mode Terjadwal
      const orderScheduled: OrderRecord = {
        ...mockOrder,
        pickup_time: '15:30',
      };
      const msgScheduled = formatOrderTelegramMessage(orderScheduled);
      assert.ok(msgScheduled.includes('15:30'));
      assert.ok(
        msgScheduled.toLowerCase().includes('dijadwalkan') ||
          msgScheduled.toLowerCase().includes('terjadwal')
      );
    });

    it('menampilkan link WhatsApp pemesan yang dapat diklik langsung', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(
        msg.includes('wa.me/'),
        `Harus menyediakan tautan langsung ke WhatsApp pemesan, pesan aktual: ${msg}`
      );
    });

    it('menampilkan rincian pembayaran: subtotal menu, biaya jasa order, dan total bayar', () => {
      const msg = formatOrderTelegramMessage(mockOrder);
      assert.ok(msg.includes('Subtotal Menu:') || msg.includes('Sub Total Menu:'));
      assert.ok(msg.includes('Biaya Jasa Order:') || msg.includes('Biaya Jasa:'));
      assert.ok(msg.includes('Total Bayar:') || msg.includes('Total:'));
      assert.ok(msg.includes('Rp36.000')); // Subtotal menu
      assert.ok(msg.includes('Rp2.000')); // Fee jasa
      assert.ok(msg.includes('Rp38.000')); // Total
    });

    it('menampilkan header khusus Pesanan Bareng dan nama pemesan per cup untuk pesanan rombongan', () => {
      const groupOrder: OrderRecord = {
        ...mockOrder,
        notes: '[Pesanan Bareng] Host: Dimas (2 cup)',
        items: [
          {
            id: 'item-grp-1',
            bundleCode: 'reguler-1',
            name: 'Creamy Aren Latte',
            basePrice: 20000,
            promoPrice: 12000,
            originalPrice: 20000,
            quantity: 1,
            subtotal: 12000,
            variantOptions: ['Ice, Regular'],
            notes: '[Rian] Less Sugar',
          },
          {
            id: 'item-grp-2',
            bundleCode: 'reguler-2',
            name: 'Americano',
            basePrice: 15000,
            promoPrice: 10000,
            originalPrice: 15000,
            quantity: 1,
            subtotal: 10000,
            variantOptions: ['Hot, Regular'],
            notes: '[Sarah]',
          },
        ],
      };

      const msg = formatOrderTelegramMessage(groupOrder);
      assert.ok(msg.includes('PESANAN BARENG KANTOR'), 'Harus menampilkan header Pesanan Bareng');
      assert.ok(msg.includes('👤 <b>Rian:</b> 1x <b>Creamy Aren Latte</b>'), 'Harus menampilkan nama Rian');
      assert.ok(msg.includes('👤 <b>Sarah:</b> 1x <b>Americano</b>'), 'Harus menampilkan nama Sarah');
    });

    it('menyertakan addons menu reguler jika item memiliki addon tambahan', () => {
      const orderWithAddons: OrderRecord = {
        ...mockOrder,
        items: [
          {
            id: 'item-addon',
            bundleCode: 'single-1',
            name: 'Kopi Kenangan Mantan',
            basePrice: 18000,
            promoPrice: 18000,
            originalPrice: 20000,
            quantity: 1,
            subtotal: 24000,
            variantOptions: ['Ice', 'Regular', 'Normal Sugar'],
            addons: [
              { name: 'Topping: Grass Jelly', price: 6000 },
            ],
          },
        ],
      };
      const msg = formatOrderTelegramMessage(orderWithAddons);
      assert.ok(
        msg.includes('Grass Jelly'),
        `Harus menyertakan addon Grass Jelly pada item di pesan Telegram, pesan aktual: ${msg}`
      );
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

      it('merekomendasikan Split > 2 Transaksi (misal 4 transaksi) untuk order besar (224k) agar hemat maksimal', () => {
        const orderLarge224k: OrderRecord = {
          ...mockOrder,
          items: [
            {
              id: 'b-1',
              bundleCode: 'b-reg-1',
              name: 'Bundling 3 Reguler',
              isBundle: true,
              basePrice: 53000,
              originalPrice: 53000,
              bundleNormalPrice: 53000,
              promoPrice: 29500,
              quantity: 1,
              subtotal: 29500,
            },
            {
              id: 'b-2',
              bundleCode: 'b-reg-2',
              name: 'Bundling 3 Reguler',
              isBundle: true,
              basePrice: 53000,
              originalPrice: 53000,
              bundleNormalPrice: 53000,
              promoPrice: 29500,
              quantity: 1,
              subtotal: 29500,
            },
            {
              id: 'b-3',
              bundleCode: 'b-reg-3',
              name: 'Bundling 3 Reguler',
              isBundle: true,
              basePrice: 53000,
              originalPrice: 53000,
              bundleNormalPrice: 53000,
              promoPrice: 29500,
              quantity: 1,
              subtotal: 29500,
            },
            {
              id: 'm-1',
              bundleCode: 'milo',
              name: 'Milo Dinosaurus',
              basePrice: 32000,
              originalPrice: 32000,
              promoPrice: 16000,
              quantity: 1,
              subtotal: 16000,
            },
            {
              id: 'm-2',
              bundleCode: 'oreo',
              name: 'Oreo Shake',
              basePrice: 33000,
              originalPrice: 33000,
              promoPrice: 16500,
              quantity: 1,
              subtotal: 16500,
            },
          ],
        };
        // Total normal: 53k + 53k + 53k + 32k + 33k = 224.000
        const msg = formatOrderTelegramMessage(orderLarge224k);
        assert.ok(msg.includes('Total Harga Normal: <b>Rp224.000</b>'));
        assert.ok(msg.includes('Split 4 Transaksi'), 'Harus merekomendasikan split 4 transaksi');
        assert.ok(msg.includes('Transaksi 1'));
        assert.ok(msg.includes('Transaksi 2'));
        assert.ok(msg.includes('Transaksi 3'));
        assert.ok(msg.includes('Transaksi 4'));
        assert.ok(msg.includes('Est. Hemat ~<b>Rp112.000</b>'));
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

  describe('cleanVariantTokens helper', () => {
    it('membersihkan opsi default standar (beans, milk, normal sugar, normal ice) sehingga tersisa varian dasar', () => {
      const raw = ['Ice', 'Regular', 'Kenangan Blend', 'Milk', 'Normal Sugar', 'Normal Ice'];
      const cleaned = cleanVariantTokens(raw, 'Creamy Aren Latte');
      assert.deepEqual(cleaned, ['Ice', 'Regular']);
    });

    it('mempertahankan kustomisasi non-standar (Less Sugar, Less Ice, Oat Milk, Topping)', () => {
      const raw = ['Ice', 'Regular', 'Kenangan Blend', 'Oat Milk', 'Less Sugar', 'Less Ice'];
      const cleaned = cleanVariantTokens(raw, 'Creamy Aren Latte');
      assert.deepEqual(cleaned, ['Ice', 'Regular', 'Oat Milk', 'Less Sugar', 'Less Ice']);
    });

    it('membersihkan default Whipped Cream Vanilla untuk Kenangan Frappe biasa, namun menampilkan jika memilih Whipped Cream Coklat', () => {
      // Menu Kenangan Frappe biasa: default Whipped Cream Vanilla
      const defaultFrappe = ['Ice', 'Regular', 'Kenangan Blend', 'Milk', 'Normal Sugar', 'Normal Ice', 'Whipped Cream Vanilla'];
      assert.deepEqual(cleanVariantTokens(defaultFrappe, 'Butterscotch Kenangan Frappe'), ['Ice', 'Regular']);

      // Jika custom ke Whipped Cream Coklat: tampilkan
      const customFrappe = ['Ice', 'Regular', 'Kenangan Blend', 'Milk', 'Normal Sugar', 'Normal Ice', 'Whipped Cream Coklat'];
      assert.deepEqual(cleanVariantTokens(customFrappe, 'Butterscotch Kenangan Frappe'), ['Ice', 'Regular', 'Whipped Cream Coklat']);
    });

    it('membersihkan default Whipped Cream Coklat untuk Dutch Choco Kenangan Frappe, namun menampilkan jika memilih Whipped Cream Vanilla', () => {
      // Dutch Choco: default Whipped Cream Coklat
      const defaultDutch = ['Ice', 'Regular', 'Kenangan Blend', 'Milk', 'Normal Sugar', 'Normal Ice', 'Whipped Cream Coklat'];
      assert.deepEqual(cleanVariantTokens(defaultDutch, 'Dutch Choco Kenangan Frappe'), ['Ice', 'Regular']);

      // Jika custom ke Vanilla: tampilkan
      const customDutch = ['Ice', 'Regular', 'Kenangan Blend', 'Milk', 'Normal Sugar', 'Normal Ice', 'Whipped Cream Vanilla'];
      assert.deepEqual(cleanVariantTokens(customDutch, 'Dutch Choco Kenangan Frappe'), ['Ice', 'Regular', 'Whipped Cream Vanilla']);
    });
  });

  describe('findBestSplit algorithm', () => {
    it('mengembalikan null jika total normal <= 70k atau item < 2', () => {
      assert.equal(findBestSplit([{ name: 'Kopi Kenangan Mantan', normalPrice: 30000 }]), null);
      assert.equal(findBestSplit([
        { name: 'A', normalPrice: 30000 },
        { name: 'B', normalPrice: 30000 },
      ]), null); // total 60k <= 70k
    });

    it('mempartisi order 224k menjadi 4 transaksi terdistribusi optimal', () => {
      const units = [
        { name: 'Bundling 3 Reguler', normalPrice: 53000 },
        { name: 'Bundling 3 Reguler', normalPrice: 53000 },
        { name: 'Bundling 3 Reguler', normalPrice: 53000 },
        { name: 'Milo Dinosaurus', normalPrice: 32000 },
        { name: 'Oreo Shake', normalPrice: 33000 },
      ];
      const result = findBestSplit(units);
      assert.ok(result);
      assert.equal(result.k, 4);
      assert.equal(result.totalDiscount, 112000);
      assert.equal(result.transactions.length, 4);
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
