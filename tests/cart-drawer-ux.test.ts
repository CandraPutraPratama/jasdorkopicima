import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_WHATSAPP_PATH,
  OFFICIAL_WHATSAPP_COLOR,
  renderWhatsAppSvgMarkup,
} from '../src/lib/whatsapp-icon.ts';
import { validateCustomerName } from '../src/lib/sanitizer.ts';
import { calculateAvailableScheduleSlots, isValidScheduleSlot } from '../src/lib/schedule-slots.ts';

test('WhatsAppIcon merender path SVG Simple Icons resmi dengan warna hijau #25D366', () => {
  assert.strictEqual(OFFICIAL_WHATSAPP_COLOR, '#25D366');
  assert.ok(OFFICIAL_WHATSAPP_PATH.startsWith('M17.472 14.382'));

  const html = renderWhatsAppSvgMarkup();
  assert.ok(html.includes('viewBox="0 0 24 24"'), 'viewBox harus 0 0 24 24');
  assert.ok(html.includes('text-[#25D366]'), 'harus memuat kelas warna brand #25D366');
  assert.ok(html.includes('M17.472 14.382'), 'harus memuat path resmi WhatsApp Simple Icons');
  assert.ok(html.includes('role="img"'), 'harus memiliki role img');
});

test('WhatsAppIcon mendukung custom className', () => {
  const html = renderWhatsAppSvgMarkup({ className: 'h-5 w-5 text-green-500' });
  assert.ok(html.includes('h-5 w-5 text-green-500'));
});

test('Validasi nama pemesan: nama kosong ditolak dengan pesan yang sesuai', () => {
  const result = validateCustomerName('');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.errorMessage, 'Silakan isi nama pemesan terlebih dahulu.');
});

test('Validasi nama pemesan: nama sah diterima', () => {
  const result = validateCustomerName('Budi Prasetyo');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.sanitized, 'Budi Prasetyo');
});

test('Logika jadwal pickup: memverifikasi slot valid dan kelipatan 15 menit', () => {
  const slotsResult = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 4,
    outletOpen: '08:00',
    outletClose: '22:00',
  });
  assert.strictEqual(slotsResult.isAvailable, true);
  assert.ok(slotsResult.slots.length > 0);
  assert.strictEqual(slotsResult.slots[0], '10:15');
  assert.strictEqual(isValidScheduleSlot(slotsResult.slots[0]), true);
});

test('globals.css mendefinisikan kelas .cart-items-scroll lintas browser (Firefox & WebKit)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf-8');

  assert.ok(css.includes('.cart-items-scroll'), 'Harus memuat definisi kelas .cart-items-scroll');
  assert.ok(css.includes('scrollbar-width: thin'), 'Harus memuat scrollbar-width: thin untuk Firefox');
  assert.ok(css.includes('scrollbar-color: #a8a29e transparent'), 'Harus memuat scrollbar-color stone-400 transparent');
  assert.ok(css.includes('.cart-items-scroll::-webkit-scrollbar'), 'Harus memuat ::-webkit-scrollbar');
  assert.ok(css.includes('.cart-items-scroll::-webkit-scrollbar-thumb'), 'Harus memuat ::-webkit-scrollbar-thumb');
  assert.ok(css.includes('#a8a29e'), 'Warna thumb harus stone-400 (#a8a29e)');
});

