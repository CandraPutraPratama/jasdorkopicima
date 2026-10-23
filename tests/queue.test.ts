import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEUE_MINUTES_PER_ORDER,
  QUEUE_POPUP_THRESHOLD_MINUTES,
  estimateQueueMinutes,
  countOrderPhysicalItems,
  computeQueueStats,
} from '../src/lib/queue.ts';

test('Queue - konstanta sesuai patokan admin (4 menit per order, pop-up > 10 menit)', () => {
  assert.equal(QUEUE_MINUTES_PER_ORDER, 4);
  assert.equal(QUEUE_POPUP_THRESHOLD_MINUTES, 10);
});

test('Queue - estimasi mengikuti contoh user: 4 order aktif -> 16 menit', () => {
  assert.equal(estimateQueueMinutes(4), 16);
  assert.equal(estimateQueueMinutes(3), 12);
  assert.equal(estimateQueueMinutes(2), 8);
  assert.equal(estimateQueueMinutes(1), 4);
});

test('Queue - antrean kosong tetap 4 menit (proses ordernya sendiri)', () => {
  assert.equal(estimateQueueMinutes(0), 4);
  assert.equal(estimateQueueMinutes(-3), 4);
});

test('Queue - hitung item fisik: paket dihitung dari isinya', () => {
  // 1 paket B1G1 (isi 2) + 2 item reguler = 4 item fisik
  assert.equal(
    countOrderPhysicalItems([
      { quantity: 1, bundleDetails: [{ name: 'A' }, { name: 'B' }] },
      { quantity: 2 },
    ]),
    4
  );
  // 2 paket bundling isi 3 = 6
  assert.equal(
    countOrderPhysicalItems([
      { quantity: 2, bundleDetails: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
    ]),
    6
  );
  assert.equal(countOrderPhysicalItems([]), 0);
  assert.equal(countOrderPhysicalItems(undefined), 0);
  assert.equal(countOrderPhysicalItems(null), 0);
});

test('Queue - computeQueueStats menggabungkan jumlah order, item, dan estimasi', () => {
  const stats = computeQueueStats([
    { items: [{ quantity: 2 }] },
    { items: [{ quantity: 1, bundleDetails: [{ name: 'A' }, { name: 'B' }] }] },
    { items: [{ quantity: 3 }] },
    { items: [] },
  ]);
  assert.equal(stats.activeOrders, 4);
  assert.equal(stats.totalItems, 2 + 2 + 3 + 0);
  assert.equal(stats.estimateMinutes, 16);

  const empty = computeQueueStats([]);
  assert.deepEqual(empty, { activeOrders: 0, totalItems: 0, estimateMinutes: 4 });
});
