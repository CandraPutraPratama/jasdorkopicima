import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGroupOrderSession,
  addItemToGroupOrder,
  convertGroupItemsToCartItems,
  clearGroupOrdersForTesting,
} from '../src/lib/group-order-service.ts';
import { formatOrderTelegramMessage } from '../src/lib/telegram.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { OrderRecord } from '../src/types/order.ts';

describe('Group Order End-to-End Integration Flow', () => {
  it('menjalankan alur lengkap dari pembuatan room hingga format notifikasi Telegram', async () => {
    clearGroupOrdersForTesting();

    // 1. Host membuat sesi group order
    const session = await createGroupOrderSession({
      brandSlug: 'kopi-kenangan',
      outletCode: 'STORE_01',
      outletName: 'Kopi Kenangan Ruko Cima',
      hostName: 'Dimas',
      hostWa: '08123456789',
    });

    assert.ok(session.id.startsWith('GRP-'));

    // 2. Peserta 1 (Rian) menambahkan kopi
    const mockItemRian: CartItem = {
      id: 'hash-item-1',
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

    const sessionWithRian = await addItemToGroupOrder(session.id, {
      participantName: 'Rian',
      cartItem: mockItemRian,
    });
    assert.equal(sessionWithRian.items.length, 1);

    // 3. Peserta 2 (Sarah) menambahkan kopi
    const mockItemSarah: CartItem = {
      id: 'hash-item-2',
      bundleCode: 'reguler-2',
      sku: 'SKU-002',
      name: 'Butterscotch Sea Salt Latte',
      basePrice: 25000,
      skuPrice: 25000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      brandSlug: 'kopi-kenangan',
      variantDescription: 'Ice, Regular',
    };

    const finalSession = await addItemToGroupOrder(session.id, {
      participantName: 'Sarah',
      cartItem: mockItemSarah,
    });

    assert.equal(finalSession.items.length, 2);

    // 4. Host checkout: konversi group items menjadi CartItem
    const cartItems = convertGroupItemsToCartItems(finalSession.items);
    assert.equal(cartItems.length, 2);
    assert.ok(cartItems[0].notes?.includes('[Rian]'));
    assert.ok(cartItems[1].notes?.includes('[Sarah]'));

    // 5. Pesanan dibayar dan dikirimkan ke Telegram Admin
    const orderRecord: OrderRecord = {
      id: 'KK-123456',
      brand_slug: 'kopi-kenangan',
      outlet_code: finalSession.outletCode,
      outlet_name: finalSession.outletName,
      customer_name: finalSession.hostName,
      customer_wa: '08123456789',
      items: [
        {
          id: 'item-1',
          bundleCode: 'reguler-1',
          name: cartItems[0].name,
          basePrice: cartItems[0].basePrice,
          promoPrice: 12000,
          originalPrice: 20000,
          quantity: 1,
          subtotal: 12000,
          variantOptions: ['Ice, Regular'],
          notes: cartItems[0].notes,
        },
        {
          id: 'item-2',
          bundleCode: 'reguler-2',
          name: cartItems[1].name,
          basePrice: cartItems[1].basePrice,
          promoPrice: 15000,
          originalPrice: 25000,
          quantity: 1,
          subtotal: 15000,
          variantOptions: ['Ice, Regular'],
          notes: cartItems[1].notes,
        },
      ],
      subtotal: 27000,
      fee: 4600, // 2 cup x Rp 2.300
      total: 31600,
      status: 'menunggu_konfirmasi',
      notes: `[Pesanan Bareng] Host: ${finalSession.hostName} (2 cup)`,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    const telegramMsg = formatOrderTelegramMessage(orderRecord);
    assert.ok(telegramMsg.includes('PESANAN BARENG KANTOR'));
    assert.ok(telegramMsg.includes('👤 <b>Rian:</b>'));
    assert.ok(telegramMsg.includes('👤 <b>Sarah:</b>'));
  });
});
