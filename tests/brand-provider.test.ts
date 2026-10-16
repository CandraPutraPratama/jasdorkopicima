import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandOutletProvider,
  type BrandOutletProvider,
} from '../src/lib/brand-provider.ts';

test('getBrandOutletProvider returns provider for kopi-kenangan', () => {
  const provider = getBrandOutletProvider('kopi-kenangan');
  assert.ok(provider !== null);
  assert.equal(typeof provider?.listFeaturedOutlets, 'function');
  assert.equal(typeof provider?.searchOutlets, 'function');
  assert.equal(typeof provider?.getOutlet, 'function');
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
});

test('getBrandOutletProvider returns null for unknown brand', () => {
  const provider = getBrandOutletProvider('unknown');
  assert.equal(provider, null);
});
