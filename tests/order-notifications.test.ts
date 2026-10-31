import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildEmergencyExpiredWhatsAppUrl,
  playOrderNotificationSound,
  triggerDeviceVibration,
  startTitleFlash,
} from '../src/lib/order-notifications.ts';

test('Order Notifications - buildEmergencyExpiredWhatsAppUrl menghasilkan URL WhatsApp darurat yang valid', () => {
  const url = buildEmergencyExpiredWhatsAppUrl('CG-88291', 35000);

  assert.ok(url.startsWith('https://wa.me/'), 'URL harus menuju wa.me');
  assert.ok(url.includes('CG-88291'), 'URL harus memuat ID pesanan');
  assert.ok(url.includes('35.000'), 'URL harus memuat nominal terformat');
  assert.ok(url.includes('kedaluwarsa') || url.includes('terlanjur'), 'Pesan harus menjelaskan situasi darurat');
});

test('Order Notifications - playOrderNotificationSound aman dijalankan di lingkungan SSR / Node tanpa error', () => {
  assert.doesNotThrow(() => {
    playOrderNotificationSound();
  }, 'Pemanggilan di lingkungan tanpa window / AudioContext tidak boleh melempar error');
});

test('Order Notifications - triggerDeviceVibration aman dijalankan di lingkungan SSR / Node tanpa error', () => {
  assert.doesNotThrow(() => {
    triggerDeviceVibration();
  }, 'Pemanggilan di lingkungan tanpa navigator.vibrate tidak boleh melempar error');
});

test('Order Notifications - startTitleFlash mengembalikan fungsi pembersih (cleanup) tanpa melempar error', () => {
  let stopFlash: (() => void) | undefined;
  assert.doesNotThrow(() => {
    stopFlash = startTitleFlash('🔔 Kopi Siap Diambil!', 'Jasdor Kopi Cima');
  });
  assert.equal(typeof stopFlash, 'function', 'startTitleFlash harus mengembalikan fungsi pembersih');
  assert.doesNotThrow(() => {
    if (stopFlash) stopFlash();
  });
});

test('Order Notifications - PaymentView.tsx memuat tombol darurat kedaluwarsa dan integrasi feedback siap ambil', () => {
  const paymentViewPath = path.resolve('src/components/PaymentView.tsx');
  assert.ok(fs.existsSync(paymentViewPath), 'PaymentView.tsx harus ada');

  const code = fs.readFileSync(paymentViewPath, 'utf-8');

  // Tombol darurat kedaluwarsa
  assert.ok(
    code.includes('Terlanjur Transfer') || code.includes('terlanjur transfer'),
    'PaymentView harus memuat tombol darurat bagi customer yang terlanjur transfer'
  );
  assert.ok(
    code.includes('buildEmergencyExpiredWhatsAppUrl'),
    'PaymentView harus menggunakan helper buildEmergencyExpiredWhatsAppUrl'
  );

  // Integrasi feedback
  assert.ok(
    code.includes('playOrderNotificationSound'),
    'PaymentView harus memanggil playOrderNotificationSound saat pesanan siap atau racikan selesai'
  );

  // Invariants
  assert.ok(!code.includes('\u2014'), 'PaymentView DILARANG memuat karakter em dash (—)');
  assert.ok(!code.toLowerCase().includes('jastip'), 'PaymentView DILARANG menggunakan kata jastip');
});
