import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGroupOrderSession,
  getGroupOrderSession,
  addItemToGroupOrder,
  removeItemFromGroupOrder,
  lockGroupOrder,
  convertGroupItemsToCartItems,
  clearGroupOrdersForTesting,
} from '../src/lib/group-order-service.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

describe('Group Order Service (Pesan Bareng)', () => {
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

  it('berhasil membuat sesi group order baru dengan ID unik dan status open', async () => {
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
      hostWa: '08123456789',
    });

    assert.ok(session.id.startsWith('GRP-'));
    assert.equal(session.hostName, 'Dimas');
    assert.equal(session.outletCode, 'STORE_01');
    assert.equal(session.status, 'open');
    assert.equal(session.items.length, 0);
    assert.ok(session.hostToken.length >= 16);
  });

  it('dapat mengambil sesi group order yang tersimpan berdasarkan ID', async () => {
    const created = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
    });

    const fetched = await getGroupOrderSession(created.id);
    assert.ok(fetched !== null);
    assert.equal(fetched.id, created.id);
    assert.equal(fetched.hostName, 'Dimas');
  });

  it('mengembalikan null jika group ID tidak ditemukan atau sudah kedaluwarsa', async () => {
    const fetched = await getGroupOrderSession('GRP-NONEXIST');
    assert.equal(fetched, null);
  });

  it('berhasil menambahkan menu pilihan peserta ke dalam sesi', async () => {
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
    });

    const updated = await addItemToGroupOrder(session.id, {
      participantName: 'Rian',
      cartItem: mockCartItem,
    });

    assert.equal(updated.items.length, 1);
    const item = updated.items[0];
    assert.equal(item.participantName, 'Rian');
    assert.equal(item.productName, 'Creamy Aren Latte');
    assert.equal(item.variantDescription, 'Ice, Regular, Less Sugar');
  });

  it('dapat menghapus menu pilihan peserta dari sesi', async () => {
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
    });

    const withItem = await addItemToGroupOrder(session.id, {
      participantName: 'Rian',
      cartItem: mockCartItem,
    });

    const itemId = withItem.items[0].id;
    const afterDelete = await removeItemFromGroupOrder(session.id, itemId);
    assert.equal(afterDelete.items.length, 0);
  });

  it('menolak penambahan menu jika sesi sudah dikunci (locked) oleh Host', async () => {
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
    });

    await lockGroupOrder(session.id, session.hostToken);

    await assert.rejects(
      async () => {
        await addItemToGroupOrder(session.id, {
          participantName: 'Sarah',
          cartItem: mockCartItem,
        });
      },
      /sudah dikunci/i
    );
  });

  it('menolak penguncian sesi jika token host tidak cocok', async () => {
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
    });

    await assert.rejects(
      async () => {
        await lockGroupOrder(session.id, 'WRONG_TOKEN');
      },
      /token host tidak valid/i
    );
  });

  it('berhasil mengonversi item group order ke CartItem dengan catatan nama pemesan', () => {
    const groupItems = [
      {
        id: 'grp-item-1',
        participantName: 'Rian',
        productName: 'Creamy Aren Latte',
        variantDescription: 'Ice, Regular, Less Sugar',
        quantity: 1,
        basePrice: 20000,
        itemPrice: 12000,
        subtotal: 12000,
        cartItem: mockCartItem,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'grp-item-2',
        participantName: 'Sarah',
        productName: 'Butterscotch Sea Salt Latte',
        variantDescription: 'Ice, Regular',
        quantity: 1,
        basePrice: 25000,
        itemPrice: 15000,
        subtotal: 15000,
        cartItem: {
          ...mockCartItem,
          id: 'mock-item-hash-2',
          name: 'Butterscotch Sea Salt Latte',
          variantDescription: 'Ice, Regular',
        },
        addedAt: new Date().toISOString(),
      },
    ];

    const cartItems = convertGroupItemsToCartItems(groupItems);
    assert.equal(cartItems.length, 2);
    assert.equal(cartItems[0].name, 'Creamy Aren Latte');
    assert.ok(cartItems[0].notes?.includes('[Rian]'));
    assert.equal(cartItems[1].name, 'Butterscotch Sea Salt Latte');
    assert.ok(cartItems[1].notes?.includes('[Sarah]'));
  });
});
