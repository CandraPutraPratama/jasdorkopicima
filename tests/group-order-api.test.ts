import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { POST as createGroupRoute } from '../src/app/api/group-orders/create/route.ts';
import { GET as getGroupRoute } from '../src/app/api/group-orders/[id]/route.ts';
import { POST as addItemRoute } from '../src/app/api/group-orders/[id]/items/route.ts';
import { DELETE as removeItemRoute } from '../src/app/api/group-orders/[id]/items/[itemId]/route.ts';
import { POST as lockGroupRoute } from '../src/app/api/group-orders/[id]/lock/route.ts';
import { clearGroupOrdersForTesting } from '../src/lib/group-order-service.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

describe('Group Order API Routes', () => {
  beforeEach(() => {
    clearGroupOrdersForTesting();
  });

  const mockCartItem: CartItem = {
    id: 'mock-item-hash-1',
    bundleCode: 'reguler-1',
    sku: 'SKU-001',
    name: 'Creamy Aren Latte',
    basePrice: 20000,
    skuPrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    brandSlug: 'kopi-kenangan',
    variantDescription: 'Ice, Regular, Less Sugar',
  };

  it('POST /api/group-orders/create memvalidasi input dan membuat sesi baru', async () => {
    const req = new NextRequest('http://localhost:3000/api/group-orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'kopi-kenangan',
        outletCode: 'STORE_01',
        outletName: 'Kopi Kenangan Ruko Cima',
        hostName: 'Dimas',
        hostWa: '08123456789',
      }),
    });

    const res = await createGroupRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.group.id.startsWith('GRP-'));
    assert.equal(data.group.hostName, 'Dimas');
    assert.ok(data.joinUrl.includes(data.group.id));
  });

  it('GET /api/group-orders/[id] mengambil data sesi yang valid', async () => {
    const createReq = new NextRequest('http://localhost:3000/api/group-orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'kopi-kenangan',
        outletCode: 'STORE_01',
        outletName: 'Kopi Kenangan Ruko Cima',
        hostName: 'Dimas',
      }),
    });
    const createRes = await createGroupRoute(createReq);
    const { group } = await createRes.json();

    const getReq = new NextRequest(`http://localhost:3000/api/group-orders/${group.id}`);
    const getRes = await getGroupRoute(getReq, { params: Promise.resolve({ id: group.id }) });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.group.id, group.id);
  });

  it('POST & DELETE /api/group-orders/[id]/items mengelola daftar item peserta', async () => {
    const createReq = new NextRequest('http://localhost:3000/api/group-orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'kopi-kenangan',
        outletCode: 'STORE_01',
        outletName: 'Kopi Kenangan Ruko Cima',
        hostName: 'Dimas',
      }),
    });
    const createRes = await createGroupRoute(createReq);
    const { group } = await createRes.json();

    // 1. Tambah item
    const addReq = new NextRequest(`http://localhost:3000/api/group-orders/${group.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantName: 'Sarah',
        cartItem: mockCartItem,
      }),
    });
    const addRes = await addItemRoute(addReq, { params: Promise.resolve({ id: group.id }) });
    assert.equal(addRes.status, 200);
    const addData = await addRes.json();
    assert.equal(addData.group.items.length, 1);
    const addedItemId = addData.group.items[0].id;

    // 2. Hapus item
    const delReq = new NextRequest(`http://localhost:3000/api/group-orders/${group.id}/items/${addedItemId}`, {
      method: 'DELETE',
    });
    const delRes = await removeItemRoute(delReq, {
      params: Promise.resolve({ id: group.id, itemId: addedItemId }),
    });
    assert.equal(delRes.status, 200);
    const delData = await delRes.json();
    assert.equal(delData.group.items.length, 0);
  });

  it('POST /api/group-orders/[id]/lock mengunci dan membuka sesi', async () => {
    const createReq = new NextRequest('http://localhost:3000/api/group-orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandSlug: 'kopi-kenangan',
        outletCode: 'STORE_01',
        outletName: 'Kopi Kenangan Ruko Cima',
        hostName: 'Dimas',
      }),
    });
    const createRes = await createGroupRoute(createReq);
    const { group } = await createRes.json();

    // Lock
    const lockReq = new NextRequest(`http://localhost:3000/api/group-orders/${group.id}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostToken: group.hostToken,
        action: 'lock',
      }),
    });
    const lockRes = await lockGroupRoute(lockReq, { params: Promise.resolve({ id: group.id }) });
    assert.equal(lockRes.status, 200);
    const lockData = await lockRes.json();
    assert.equal(lockData.group.status, 'locked');

    // Unlock
    const unlockReq = new NextRequest(`http://localhost:3000/api/group-orders/${group.id}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostToken: group.hostToken,
        action: 'unlock',
      }),
    });
    const unlockRes = await lockGroupRoute(unlockReq, { params: Promise.resolve({ id: group.id }) });
    assert.equal(unlockRes.status, 200);
    const unlockData = await unlockRes.json();
    assert.equal(unlockData.group.status, 'open');
  });
});
