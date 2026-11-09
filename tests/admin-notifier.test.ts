import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectNewPendingOrders,
  countPendingConfirmationOrders,
  formatAdminTitleAlert,
} from '../src/lib/admin-sound.ts';
import type { OrderRecord } from '../src/types/order.ts';

function createMockOrder(id: string, status: OrderRecord['status']): OrderRecord {
  return {
    id,
    brand_slug: 'kopi-kenangan',
    outlet_code: 'STORE_01',
    outlet_name: 'Kopi Kenangan Ruko',
    items: [],
    subtotal: 30000,
    fee: 4000,
    total: 34000,
    customer_name: 'Budi',
    customer_wa: '08123456789',
    status,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 600000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('Admin Notifier & Sound Utilities', () => {
  describe('detectNewPendingOrders', () => {
    it('mengembalikan array kosong pada initial load (isInitialLoad = true) agar tidak spam audio saat baru buka halaman', () => {
      const currentOrders = [
        createMockOrder('ORD-1', 'menunggu_konfirmasi'),
        createMockOrder('ORD-2', 'antrian'),
      ];
      const newPending = detectNewPendingOrders([], currentOrders, true);
      assert.deepEqual(newPending, []);
    });

    it('mendeteksi pesanan baru yang berstatus menunggu_konfirmasi pada polling berikutnya', () => {
      const prevOrders = [
        createMockOrder('ORD-1', 'antrian'),
      ];
      const nextOrders = [
        createMockOrder('ORD-1', 'antrian'),
        createMockOrder('ORD-2', 'menunggu_konfirmasi'),
      ];

      const newPending = detectNewPendingOrders(prevOrders, nextOrders, false);
      assert.equal(newPending.length, 1);
      assert.equal(newPending[0].id, 'ORD-2');
    });

    it('mendeteksi pesanan yang berganti status dari menunggu_pembayaran menjadi menunggu_konfirmasi', () => {
      const prevOrders = [
        createMockOrder('ORD-1', 'menunggu_pembayaran'),
      ];
      const nextOrders = [
        createMockOrder('ORD-1', 'menunggu_konfirmasi'),
      ];

      const newPending = detectNewPendingOrders(prevOrders, nextOrders, false);
      assert.equal(newPending.length, 1);
      assert.equal(newPending[0].id, 'ORD-1');
    });

    it('TIDAK memicu alert untuk pesanan menunggu_konfirmasi yang sudah ada sebelumnya dan belum berubah status', () => {
      const prevOrders = [
        createMockOrder('ORD-1', 'menunggu_konfirmasi'),
      ];
      const nextOrders = [
        createMockOrder('ORD-1', 'menunggu_konfirmasi'),
      ];

      const newPending = detectNewPendingOrders(prevOrders, nextOrders, false);
      assert.equal(newPending.length, 0);
    });

    it('TIDAK memicu alert untuk pesanan baru dengan status selain menunggu_konfirmasi (misal: antrian/selesai)', () => {
      const prevOrders = [
        createMockOrder('ORD-1', 'antrian'),
      ];
      const nextOrders = [
        createMockOrder('ORD-1', 'antrian'),
        createMockOrder('ORD-2', 'antrian'),
        createMockOrder('ORD-3', 'selesai'),
      ];

      const newPending = detectNewPendingOrders(prevOrders, nextOrders, false);
      assert.equal(newPending.length, 0);
    });
  });

  describe('countPendingConfirmationOrders', () => {
    it('menghitung dengan benar jumlah pesanan yang menunggu_konfirmasi', () => {
      const orders = [
        createMockOrder('ORD-1', 'menunggu_konfirmasi'),
        createMockOrder('ORD-2', 'antrian'),
        createMockOrder('ORD-3', 'menunggu_konfirmasi'),
        createMockOrder('ORD-4', 'selesai'),
      ];

      assert.equal(countPendingConfirmationOrders(orders), 2);
    });

    it('mengembalikan 0 jika tidak ada pesanan menunggu_konfirmasi', () => {
      const orders = [
        createMockOrder('ORD-1', 'antrian'),
        createMockOrder('ORD-2', 'selesai'),
      ];

      assert.equal(countPendingConfirmationOrders(orders), 0);
    });
  });

  describe('formatAdminTitleAlert', () => {
    it('menambahkan prefix hitungan pesanan jika ada pesanan menunggu konfirmasi', () => {
      const title = formatAdminTitleAlert(3);
      assert.equal(title, '(3) 🔔 Pesanan Masuk! | Admin Jasdor');
    });

    it('mengembalikan judul standar jika tidak ada pesanan menunggu konfirmasi', () => {
      const title = formatAdminTitleAlert(0);
      assert.equal(title, 'Panel Admin Pesanan | Jasdor Kopi Cima');
    });
  });

  describe('Integrasi Panel Admin Pesanan', () => {
    it('AdminPesananPanel mengintegrasikan audio alert, auto polling, dan notifikasi visual pesanan baru', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const panelPath = path.resolve('src/app/admin/pesanan/AdminPesananPanel.tsx');
      const code = fs.readFileSync(panelPath, 'utf-8');

      // 1. Memuat utilitas audio
      assert.ok(code.includes("import {\n  getSoundEnabled,"), 'Harus mengimpor utilitas audio');
      assert.ok(code.includes('playOrderChime'), 'Harus menggunakan playOrderChime saat pesanan baru masuk');

      // 2. Tombol kontrol suara & tes bunyi
      assert.ok(code.includes('handleToggleSound'), 'Harus memiliki handler toggle suara');
      assert.ok(code.includes('handleTestSound'), 'Harus memiliki tombol tes suara speaker');

      // 3. Auto-polling dengan delay adaptif & visibility awareness
      assert.ok(code.includes('scheduleNextPoll'), 'Harus memiliki polling otomatis adaptif');
      assert.ok(code.includes('visibilitychange'), 'Harus mendengarkan event visibilitychange browser');

      // 4. Update dynamic title & banner notifikasi
      assert.ok(code.includes('formatAdminTitleAlert'), 'Harus mengupdate judul tab browser dengan format alert');
      assert.ok(code.includes('newOrderBanner'), 'Harus menampilkan banner visual pesanan baru');
    });
  });
});
