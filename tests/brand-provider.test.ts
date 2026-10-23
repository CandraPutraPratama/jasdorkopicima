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

test('getBrandOutletProvider returns provider for fore', async () => {
  const provider = getBrandOutletProvider('fore');
  assert.ok(provider !== null);
  assert.equal(typeof provider?.listFeaturedOutlets, 'function');
  assert.equal(typeof provider?.searchOutlets, 'function');
  assert.equal(typeof provider?.getOutlet, 'function');
  assert.equal(typeof provider?.getOutletCount, 'function');
  const count = await provider.getOutletCount();
  assert.ok(typeof count === 'number');
  assert.equal(count, 394, 'Fore provider harus mengembalikan jumlah 394 outlet');
});

test('getBrandOutletProvider returns active provider for tomoro returning 678 outlets', async () => {
  const provider = getBrandOutletProvider('tomoro');
  assert.ok(provider !== null);
  assert.equal(typeof provider?.listFeaturedOutlets, 'function');
  assert.equal(typeof provider?.searchOutlets, 'function');
  assert.equal(typeof provider?.getOutlet, 'function');
  assert.equal(typeof provider?.getOutletCount, 'function');
  const count = await provider.getOutletCount();
  assert.equal(count, 678, 'Tomoro provider harus mengembalikan count 678');
});

test('getBrandOutletProvider returns null for unknown brand', () => {
  const provider = getBrandOutletProvider('unknown');
  assert.equal(provider, null);
});
