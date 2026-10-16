import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandOutletProvider,
} from '../src/lib/brand-provider.ts';

test('getBrandOutletProvider returns provider for kopi-kenangan', async () => {
  const provider = getBrandOutletProvider('kopi-kenangan');
  assert.ok(provider !== null);
  assert.equal(typeof provider?.listFeaturedOutlets, 'function');
  assert.equal(typeof provider?.searchOutlets, 'function');
  assert.equal(typeof provider?.getOutlet, 'function');
  assert.equal(typeof provider?.getOutletCount, 'function');
  const count = await provider.getOutletCount();
  assert.ok(typeof count === 'number');
  assert.ok(count > 0, 'Kopi Kenangan provider harus mengembalikan jumlah outlet > 0');
});

test('getBrandOutletProvider returns stub provider for tomoro returning empty results without fake data', async () => {
  const provider = getBrandOutletProvider('tomoro');
  assert.ok(provider !== null);
  const featured = await provider.listFeaturedOutlets();
  assert.deepEqual(featured, []);

  const search = await provider.searchOutlets('mall');
  assert.deepEqual(search, []);

  const outlet = await provider.getOutlet('TOMORO-PURI');
  assert.equal(outlet, null);

  const count = await provider.getOutletCount();
  assert.equal(count, 0, 'Tomoro provider harus mengembalikan count 0');
});

test('getBrandOutletProvider returns null for unknown brand', () => {
  const provider = getBrandOutletProvider('unknown');
  assert.equal(provider, null);
});
