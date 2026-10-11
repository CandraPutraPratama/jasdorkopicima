import test from 'node:test';
import assert from 'node:assert/strict';
import { checkOutletOrderability } from '../src/lib/orderability.ts';

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

test('checkOutletOrderability returns fallback reason Tutup when empty or undefined', () => {
  const result = checkOutletOrderability({});
  assert.equal(result.canOrder, false);
  assert.equal(result.reason, 'Tutup');
});
