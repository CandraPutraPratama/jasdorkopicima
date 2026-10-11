import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRupiah } from '../src/lib/currency.ts';

test('formatRupiah formats integer to Indonesian Rupiah standard format without decimals', () => {
  assert.equal(formatRupiah(21000), 'Rp21.000');
  assert.equal(formatRupiah(2000), 'Rp2.000');
  assert.equal(formatRupiah(0), 'Rp0');
  assert.equal(formatRupiah(1500000), 'Rp1.500.000');
});

test('formatRupiah rounds any floating amounts to whole rupiah', () => {
  assert.equal(formatRupiah(21000.4), 'Rp21.000');
  assert.equal(formatRupiah(21000.7), 'Rp21.001');
});
