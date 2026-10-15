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


