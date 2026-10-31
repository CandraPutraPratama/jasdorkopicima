import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  QUEUE_MINUTES_PER_ORDER,
  QUEUE_POPUP_THRESHOLD_MINUTES,
  getQueueLoadInfo,
  estimateQueueMinutes,
} from '../src/lib/queue.ts';

test('Queue Traffic - SLA admin 3 menit per order untuk 1-3 item', () => {
  assert.equal(QUEUE_MINUTES_PER_ORDER, 3);
  assert.equal(QUEUE_POPUP_THRESHOLD_MINUTES, 10);

  // 1 order = 3 menit
  assert.equal(estimateQueueMinutes(1), 3);
  // 3 order = 9 menit (masih di bawah ambang batas popup 10 mnt)
  assert.equal(estimateQueueMinutes(3), 9);
  // 4 order = 12 menit (melewati ambang batas popup 10 mnt -> memicu konfirmasi ramah)
  assert.equal(estimateQueueMinutes(4), 12);
});

test('Queue Traffic - getQueueLoadInfo mengembalikan tier visual yang akurat', () => {
  // Level 1: Lancar (0 - 3 order)
  const loadZero = getQueueLoadInfo(0);
  assert.equal(loadZero.level, 'lancar');
  assert.equal(loadZero.label, 'Antrean Lancar');
  assert.equal(loadZero.dotColor, 'bg-emerald-500');

  const loadThree = getQueueLoadInfo(3);
  assert.equal(loadThree.level, 'lancar');
  assert.equal(loadThree.label, 'Antrean Lancar');

  // Level 2: Ramai (4 - 7 order)
  const loadFour = getQueueLoadInfo(4);
  assert.equal(loadFour.level, 'ramai');
  assert.equal(loadFour.label, 'Sedang Ramai');
  assert.equal(loadFour.dotColor, 'bg-amber-500');

  const loadSeven = getQueueLoadInfo(7);
  assert.equal(loadSeven.level, 'ramai');
  assert.equal(loadSeven.label, 'Sedang Ramai');

  // Level 3: Padat (8+ order)
  const loadEight = getQueueLoadInfo(8);
  assert.equal(loadEight.level, 'padat');
  assert.equal(loadEight.label, 'Antrean Padat');
  assert.equal(loadEight.dotColor, 'bg-rose-500');

  const loadTen = getQueueLoadInfo(10);
  assert.equal(loadTen.level, 'padat');
  assert.equal(loadTen.label, 'Antrean Padat');
});

test('Queue Traffic - File QueueInfoBar.tsx memenuhi spesifikasi UI neo-brutalist dan aksesibilitas', () => {
  const filePath = path.resolve('src/components/QueueInfoBar.tsx');
  assert.ok(fs.existsSync(filePath), 'QueueInfoBar.tsx harus ada');

  const code = fs.readFileSync(filePath, 'utf-8');

  // Aksesibilitas
  assert.ok(code.includes('aria-label='), 'QueueInfoBar harus memiliki aria-label untuk pembaca layar');

  // Integrasi logika
  assert.ok(code.includes('useQueueStatus'), 'QueueInfoBar harus memanggil hook useQueueStatus');
  assert.ok(code.includes('getQueueLoadInfo'), 'QueueInfoBar harus memanggil getQueueLoadInfo');

  // Neo-brutalist styling
  assert.ok(code.includes('border-[#2B1D12]') || code.includes('border-2'), 'Harus memakai border neo-brutalist');
  assert.ok(code.includes('animate-pulse') || code.includes('animate-ping'), 'Harus memiliki animasi denyut live');

  // Invariant kepatuhan
  assert.ok(!code.includes('\u2014'), 'QueueInfoBar DILARANG memuat karakter em dash (—)');
  assert.ok(!code.toLowerCase().includes('jastip'), 'QueueInfoBar DILARANG menggunakan kata jastip');
});

test('Queue Traffic - Portal Page (src/app/page.tsx) memuat QueueInfoBar', () => {
  const portalPath = path.resolve('src/app/page.tsx');
  const code = fs.readFileSync(portalPath, 'utf-8');

  assert.ok(code.includes('QueueInfoBar'), 'Portal page harus mengimpor dan menampilkan QueueInfoBar');
});

test('Queue Traffic - Brand Page (src/app/[brandSlug]/page.tsx) memuat QueueInfoBar', () => {
  const brandPagePath = path.resolve('src/app/[brandSlug]/page.tsx');
  const code = fs.readFileSync(brandPagePath, 'utf-8');

  assert.ok(code.includes('QueueInfoBar'), 'Brand page harus mengimpor dan menampilkan QueueInfoBar');
});
