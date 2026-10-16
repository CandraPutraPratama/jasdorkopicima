import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkOutletOrderability,
  isOutletOpenBySchedule,
  isOutletClosed,
} from '../src/lib/orderability.ts';

test('checkOutletOrderability returns canOrder: true when orderType has 101, status is Active, and orderMsg is Pesan Sekarang', () => {
  const result = checkOutletOrderability({
    orderType: [101, 102],
    status: 'Active',
    orderMsg: 'Pesan Sekarang',
  });
  assert.equal(result.canOrder, true);
  assert.equal(result.reason, 'Buka');
});

test('checkOutletOrderability returns canOrder: false when orderMsg is Tutup', () => {
  const result = checkOutletOrderability({
    orderType: [101, 102],
    status: 'Active',
    orderMsg: 'Tutup',
  });
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Tutup');
});

test('checkOutletOrderability returns canOrder: false when orderMsg is Pesan online dinonaktifkan', () => {
  const result = checkOutletOrderability({
    orderType: [101, 102],
    status: 'Active',
    orderMsg: 'Pesan online dinonaktifkan',
  });
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Pesan online dinonaktifkan');
});

test('checkOutletOrderability returns canOrder: false when orderType lacks 101 (pickup)', () => {
  const result = checkOutletOrderability({
    orderType: [102],
    status: 'Active',
    orderMsg: 'Pesan Sekarang',
  });
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Pickup tidak tersedia');
});

test('checkOutletOrderability returns canOrder: false when status is not Active', () => {
  const result = checkOutletOrderability({
    orderType: [101],
    status: 'Inactive',
    orderMsg: 'Pesan Sekarang',
  });
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Outlet tidak aktif');
});

test('checkOutletOrderability returns canOrder: false when isOpen is false, even if status is Active and orderMsg is Pesan Sekarang', () => {
  const result = checkOutletOrderability({
    orderType: [101, 102],
    status: 'Active',
    orderMsg: 'Pesan Sekarang',
    isOpen: false,
  });
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Tutup');
});

test('checkOutletOrderability returns fallback reason Tutup when empty or undefined', () => {
  const result = checkOutletOrderability({});
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Tutup');
});

test('isOutletOpenBySchedule correctly checks WIB operating hours', () => {
  // Create Date at 14:30 WIB (UTC 07:30)
  const afternoonWib = new Date('2026-10-15T07:30:00Z');
  assert.equal(isOutletOpenBySchedule('10:00', '22:15', afternoonWib), true);

  // Create Date at 22:30 WIB (UTC 15:30) - after closing
  const nightWib = new Date('2026-10-15T15:30:00Z');
  assert.equal(isOutletOpenBySchedule('10:00', '22:15', nightWib), false);

  // Create Date at 08:30 WIB (UTC 01:30) - before opening
  const morningWib = new Date('2026-10-15T01:30:00Z');
  assert.equal(isOutletOpenBySchedule('10:00', '22:15', morningWib), false);

  // Missing open/close time falls back to true
  assert.equal(isOutletOpenBySchedule('', '', afternoonWib), true);
});

test('isOutletClosed acts as single source of truth across all components', () => {
  // Null/undefined outlet is not closed
  assert.equal(isOutletClosed(null), false);
  assert.equal(isOutletClosed(undefined), false);

  // Explicitly closed by isOpen: false
  assert.equal(isOutletClosed({ isOpen: false, canOrder: true }), true);

  // Explicitly closed by canOrder: false
  assert.equal(isOutletClosed({ isOpen: true, canOrder: false }), true);

  // Outside operating schedule at 22:30 WIB
  const nightWib = new Date('2026-10-15T15:30:00Z');
  assert.equal(
    isOutletClosed(
      { isOpen: true, canOrder: true, openTime: '10:00', closeTime: '22:15' },
      nightWib
    ),
    true
  );

  // Open outlet within schedule
  const afternoonWib = new Date('2026-10-15T07:30:00Z');
  assert.equal(
    isOutletClosed(
      { isOpen: true, canOrder: true, openTime: '10:00', closeTime: '22:15' },
      afternoonWib
    ),
    false
  );
});

test('REGRESI ZONA WAKTU: LIPPO-PURI dan GI pada Jumat 11:40 WIB berstatus BUKA dan Jumat 23:30 WIB berstatus TUTUP', () => {
  // Pin waktu: Jumat 11:40 WIB = UTC 04:40
  const jumat1140Wib = new Date('2026-10-16T04:40:00.000Z');
  // Pin waktu: Jumat 23:30 WIB = UTC 16:30
  const jumat2330Wib = new Date('2026-10-16T16:30:00.000Z');

  // Outlet Lippo Mall Puri: 10:00 - 22:15 WIB
  const lippoPuri = {
    code: 'LIPPO-PURI',
    name: 'Lippo Mall Puri',
    isOpen: true,
    canOrder: true,
    openTime: '10:00',
    closeTime: '22:15',
  };

  // Outlet Grand Indonesia: 08:00 - 22:00 WIB
  const gi = {
    code: 'GI',
    name: 'Central Grand Indonesia 2nd Floor',
    isOpen: true,
    canOrder: true,
    openTime: '08:00',
    closeTime: '22:00',
  };

  // 1. Pada Jumat 11:40 WIB: Keduanya WAJIB BUKA (isOutletClosed: false)
  assert.equal(isOutletClosed(lippoPuri, jumat1140Wib), false, 'LIPPO-PURI harus BUKA pada 11:40 WIB');
  assert.equal(isOutletClosed(gi, jumat1140Wib), false, 'GI harus BUKA pada 11:40 WIB');

  // 2. Pada Jumat 23:30 WIB: Keduanya WAJIB TUTUP (isOutletClosed: true)
  assert.equal(isOutletClosed(lippoPuri, jumat2330Wib), true, 'LIPPO-PURI harus TUTUP pada 23:30 WIB');
  assert.equal(isOutletClosed(gi, jumat2330Wib), true, 'GI harus TUTUP pada 23:30 WIB');
});

test('checkOutletOrderability dan isOutletClosed untuk outlet dari endpoint get_store (tanpa orderMsg/status) berstatus BUKA di dalam jam operasional', () => {
  const jumat1140Wib = new Date('2026-10-16T04:40:00.000Z');

  // Bentuk data get_store: hanya isOpen, openTime, closeTime tanpa orderMsg atau status
  const getStoreOutlet = {
    code: 'LIPPO-PURI',
    name: 'Lippo Mall Puri',
    isOpen: true,
    openTime: '10:00',
    closeTime: '22:15',
  };

  const orderability = checkOutletOrderability(getStoreOutlet, jumat1140Wib);
  assert.equal(orderability.canOrder, true, 'getStoreOutlet harus canOrder: true pada 11:40 WIB');
  assert.equal(orderability.reason, 'Buka');

  const closed = isOutletClosed({ ...getStoreOutlet, canOrder: orderability.canOrder }, jumat1140Wib);
  assert.equal(closed, false, 'getStoreOutlet harus isOutletClosed: false pada 11:40 WIB');
});

test('PINNING TEST ZONA WAKTU: Outlet WITA tutup 22:00 WITA harus tampil TUTUP pada 21:30 WIB', () => {
  // 21:30 WIB (UTC+7) = UTC 14:30 = 22:30 WITA (UTC+8)
  const waktu2130Wib = new Date('2026-10-16T14:30:00.000Z');

  // Outlet Fore di Bali / Makassar (WITA, Asia/Makassar) dengan jam operasional 07:00 - 22:00
  const outletWita = {
    code: 'fore-dpsdm',
    name: 'Fore Coffee - Boarding Domestic I Gusti Ngurah Rai Bali',
    isOpen: true,
    canOrder: true,
    openTime: '07:00',
    closeTime: '22:00',
    timezone: 'Asia/Makassar',
  };

  // Jam 21:30 WIB setara 22:30 WITA, yang berarti sudah lewat jam tutup 22:00 WITA -> WAJIB TUTUP
  const isClosed = isOutletClosed(outletWita, waktu2130Wib);
  assert.equal(
    isClosed,
    true,
    'Outlet WITA yang tutup 22:00 WITA harus tampil TUTUP pada jam 21:30 WIB (22:30 WITA)'
  );

  // Verifikasi langsung ke isOutletOpenBySchedule
  const isOpenSchedule = isOutletOpenBySchedule('07:00', '22:00', waktu2130Wib, 'Asia/Makassar');
  assert.equal(
    isOpenSchedule,
    false,
    'isOutletOpenBySchedule harus bernilai false untuk 21:30 WIB di zona Asia/Makassar'
  );

  // Bandingkan jika dievaluasi di zona WIB biasa (Asia/Jakarta): 21:30 WIB masih sebelum 22:00 WIB
  const isOpenInWib = isOutletOpenBySchedule('07:00', '22:00', waktu2130Wib, 'Asia/Jakarta');
  assert.equal(
    isOpenInWib,
    true,
    'Jika dievaluasi di zona WIB biasa, 21:30 masih buka sebelum 22:00 WIB'
  );
});


