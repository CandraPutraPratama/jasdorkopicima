import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEUE_MINUTES_PER_ORDER,
  QUEUE_POPUP_THRESHOLD_MINUTES,
  QUEUE_ACTIVE_STATUSES,
  estimateQueueMinutes,
  countOrderPhysicalItems,
  computeQueueStats,
  getQueueLoadInfo,
} from '../src/lib/queue.ts';

test('Queue - status yang dihitung adalah antrian dan diproses', () => {
  assert.deepEqual([...QUEUE_ACTIVE_STATUSES], ['antrian', 'diproses']);
});

test('Queue - konstanta sesuai SLA admin (maks 3 menit per invoice/order, pop-up > 10 menit)', () => {
  assert.equal(QUEUE_MINUTES_PER_ORDER, 3);
  assert.equal(QUEUE_POPUP_THRESHOLD_MINUTES, 10);
});

test('Queue - estimasi mengikuti SLA 3 menit per order', () => {
  assert.equal(estimateQueueMinutes(4), 12);
  assert.equal(estimateQueueMinutes(3), 9);
  assert.equal(estimateQueueMinutes(2), 6);
  assert.equal(estimateQueueMinutes(1), 3);
});

test('Queue - antrean kosong tetap 3 menit (proses ordernya sendiri)', () => {
  assert.equal(estimateQueueMinutes(0), 3);
  assert.equal(estimateQueueMinutes(-3), 3);
});

test('Queue - getQueueLoadInfo mengklasifikasikan beban antrean secara akurat', () => {
  // 0 antrean -> Lancar
  const emptyLoad = getQueueLoadInfo(0);
  assert.equal(emptyLoad.level, 'lancar');
  assert.equal(emptyLoad.label, 'Antrean Lancar');
  assert.equal(emptyLoad.adminProcessMinutes, 3);
  assert.match(emptyLoad.description, /langsung/i);

  // 1-3 antrean -> Lancar
  const mildLoad = getQueueLoadInfo(2);
  assert.equal(mildLoad.level, 'lancar');
  assert.equal(mildLoad.label, 'Antrean Lancar');
  assert.equal(mildLoad.adminProcessMinutes, 6);
  assert.match(mildLoad.description, /2 order di depan/i);

  // 4-7 antrean -> Sedang Ramai
  const busyLoad = getQueueLoadInfo(5);
  assert.equal(busyLoad.level, 'ramai');
  assert.equal(busyLoad.label, 'Sedang Ramai');
  assert.equal(busyLoad.adminProcessMinutes, 15);
  assert.match(busyLoad.description, /5 order di depan/i);

  // 8+ antrean -> Antrean Padat
  const heavyLoad = getQueueLoadInfo(9);
  assert.equal(heavyLoad.level, 'padat');
  assert.equal(heavyLoad.label, 'Antrean Padat');
  assert.equal(heavyLoad.adminProcessMinutes, 27);
  assert.match(heavyLoad.description, /9 order di depan/i);
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
  assert.equal(stats.estimateMinutes, 12);

  const empty = computeQueueStats([]);
  assert.deepEqual(empty, { activeOrders: 0, totalItems: 0, estimateMinutes: 3 });
});
