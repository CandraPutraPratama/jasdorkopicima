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

test('CartDrawer memuat blokade dan banner peringatan saat outlet tutup', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const cartDrawerCode = fs.readFileSync(path.resolve('src/components/CartDrawer.tsx'), 'utf-8');

  assert.ok(cartDrawerCode.includes('isOutletClosed'), 'CartDrawer harus mengecek isOutletClosed');
  assert.ok(cartDrawerCode.includes('Outlet ini sedang tutup'), 'CartDrawer harus memiliki banner outlet sedang tutup');
  assert.ok(cartDrawerCode.includes('Outlet Sedang Tutup - Tidak Bisa Dipesan'), 'CartDrawer harus menonaktifkan checkout saat outlet tutup');
  assert.ok(cartDrawerCode.includes('valData.isOutletClosed'), 'CartDrawer harus memproses respon isOutletClosed dari validate-cart');
});

test('ProductCard & ProductBottomSheet mendukung status outlet tutup', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const productCardCode = fs.readFileSync(path.resolve('src/components/ProductCard.tsx'), 'utf-8');
  const bottomSheetCode = fs.readFileSync(path.resolve('src/components/ProductBottomSheet.tsx'), 'utf-8');

  assert.ok(productCardCode.includes('isOutletClosed'), 'ProductCard harus menerima prop isOutletClosed');
  assert.ok(productCardCode.includes('Outlet tutup - '), 'ProductCard harus menyediakan penjelasan aria-label saat tutup');
  assert.ok(bottomSheetCode.includes('isOutletClosed'), 'ProductBottomSheet harus menerima prop isOutletClosed');
  assert.ok(bottomSheetCode.includes('Outlet Sedang Tutup'), 'ProductBottomSheet harus menampilkan teks Outlet Sedang Tutup saat nonaktif');
});

test('Outlet page memuat banner peringatan operasional tutup dan merender katalog read-only', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const outletPageCode = fs.readFileSync(path.resolve('src/app/outlet/[code]/page.tsx'), 'utf-8');

  assert.ok(outletPageCode.includes('isOutletClosed'), 'Halaman outlet harus memiliki flag isOutletClosed');
  assert.ok(outletPageCode.includes('Outlet ini sedang tutup - pemesanan dibuka kembali pukul'), 'Halaman outlet harus memuat teks banner pembukaan kembali');
  assert.ok(outletPageCode.includes('Katalog menu tetap dapat dilihat (read-only) untuk window shopping'), 'Halaman outlet harus menginformasikan bahwa menu tetap dapat dilihat');
});

test('OutletSearchCard menggunakan isOutletClosed dan mendukung klik seluruh kartu', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const cardCode = fs.readFileSync(path.resolve('src/components/OutletSearchCard.tsx'), 'utf-8');

  assert.ok(cardCode.includes('isOutletClosed'), 'OutletSearchCard harus mengimpor isOutletClosed');
  assert.ok(cardCode.includes('handleCardClick'), 'OutletSearchCard harus memiliki handler klik kartu');
  assert.ok(cardCode.includes('router.push'), 'OutletSearchCard harus navigasi dengan router.push');
  assert.ok(cardCode.includes("'button'") || cardCode.includes('"button"'), 'OutletSearchCard harus memiliki role button untuk aksesibilitas');
  assert.ok(cardCode.includes('Lihat Menu'), 'OutletSearchCard harus menyediakan link Lihat Menu saat outlet tutup');
});


