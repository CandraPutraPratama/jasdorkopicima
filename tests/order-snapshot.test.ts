import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderSummarySnapshot,
  formatOrderSummaryDetail,
  type OrderSummarySnapshot,
} from '../src/lib/order-snapshot.ts';
import { calculateOrderPricing } from '../src/lib/pricing.ts';
import { cartReducer, initialCartState } from '../src/lib/cart-reducer.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

test('order-snapshot: mereproduksi alur checkout, pengosongan keranjang, dan pencegahan 0 item / Rp0', () => {
  // 1. Pelanggan memasukkan 3 item ke dalam keranjang di Ruko Rawamangun (Jl. Paus)
  const item1: Omit<CartItem, 'id'> = {
    bundleCode: 'BND-1',
    sku: 'SKU-1',
    name: 'Kopi Kenangan Mantan',
    basePrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 2,
  };
  const item2: Omit<CartItem, 'id'> = {
    bundleCode: 'BND-2',
    sku: 'SKU-2',
    name: 'Chocolate Choux Puff',
    basePrice: 12000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
  };

  let cartState = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: {
      item: item1,
      outletCode: 'JKT.RUKORWM',
      outletName: 'Ruko Rawamangun (Jl. Paus)',
    },
  });
  cartState = cartReducer(cartState, {
    type: 'ADD_ITEM',
    payload: {
      item: item2,
      outletCode: 'JKT.RUKORWM',
      outletName: 'Ruko Rawamangun (Jl. Paus)',
    },
  });

  // Hitung pricing sebelum checkout
  const pricingBeforeClear = calculateOrderPricing(cartState.items);
  assert.equal(pricingBeforeClear.totalQuantity, 3);
  // (20000/2 + 2000) * 2 = 24000; (12000/2 + 2000) * 1 = 8000; subtotal 32000 + 4000 jasa = Rp36.000 (atau sesuai formula pricing)
  assert.ok(pricingBeforeClear.total > 0);

  const customerName = 'Mercy';
  const outletName = cartState.outletName || 'Ruko Rawamangun (Jl. Paus)';

  // 2. Tahap Kirim Pesanan: Snapshot ditangkap sebelum keranjang dikosongkan
  let orderSnapshot: OrderSummarySnapshot | null = null;
  const dispatchWhatsAppOrder = (): OrderSummarySnapshot => {
    return createOrderSummarySnapshot({
      customerName,
      pricing: pricingBeforeClear,
      outletName,
    });
  };

  orderSnapshot = dispatchWhatsAppOrder();

  assert.ok(orderSnapshot);
  assert.equal(orderSnapshot.totalQuantity, 3);
  assert.equal(orderSnapshot.total, pricingBeforeClear.total);
  assert.equal(orderSnapshot.outletName, 'Ruko Rawamangun (Jl. Paus)');
  assert.equal(orderSnapshot.customerName, 'Mercy');

  // 3. Pelanggan menekan tombol "Sudah" di dialog konfirmasi WhatsApp
  // Keranjang dikosongkan (onClearCart)
  const handleConfirmWhatsAppSent = () => {
    // Fallback bila snapshot belum ada
    if (!orderSnapshot) {
      orderSnapshot = createOrderSummarySnapshot({
        customerName,
        pricing: pricingBeforeClear,
        outletName,
      });
    }
    // Keranjang dikosongkan
    cartState = cartReducer(cartState, { type: 'CLEAR_CART' });
  };

  handleConfirmWhatsAppSent();

  // Bukti: State keranjang sekarang kosong!
  assert.equal(cartState.items.length, 0);
  const pricingAfterClear = calculateOrderPricing(cartState.items);
  assert.equal(pricingAfterClear.totalQuantity, 0);
  assert.equal(pricingAfterClear.total, 0);

  // Jika kode lama membaca langsung dari state keranjang yang telah kosong:
  const bugSummary = `${pricingAfterClear.totalQuantity} item • Rp${pricingAfterClear.total}`;
  assert.equal(bugSummary, '0 item • Rp0', 'Sebelum perbaikan, layar sukses menampilkan 0 item • Rp0');

  // 4. Layar sukses menampilkan detail ringkas dari snapshot yang tersimpan
  const activeSnapshot = orderSnapshot ?? createOrderSummarySnapshot({
    customerName,
    pricing: pricingAfterClear,
    outletName,
  });

  const successDetail = formatOrderSummaryDetail(activeSnapshot);
  assert.notEqual(successDetail, '0 item • Rp0');
  assert.equal(successDetail, formatOrderSummaryDetail(pricingBeforeClear));
  assert.ok(successDetail.startsWith('3 item • '));
  assert.equal(activeSnapshot.outletName, 'Ruko Rawamangun (Jl. Paus)');
  assert.equal(activeSnapshot.customerName, 'Mercy');

  // 5. Ketika tombol "Selesai & Tutup" ditekan, snapshot dibersihkan
  orderSnapshot = null;
  assert.equal(orderSnapshot, null);
});

test('order-snapshot: format kasus uji spesifik (3 item • Rp63.500)', () => {
  const snapshot = createOrderSummarySnapshot({
    customerName: 'Mercy',
    pricing: {
      totalQuantity: 3,
      total: 63500,
    },
    outletName: 'Ruko Rawamangun (Jl. Paus)',
  });

  assert.equal(snapshot.totalQuantity, 3);
  assert.equal(snapshot.total, 63500);
  assert.equal(snapshot.outletName, 'Ruko Rawamangun (Jl. Paus)');
  assert.equal(snapshot.customerName, 'Mercy');

  const detailText = formatOrderSummaryDetail(snapshot);
  assert.equal(detailText, '3 item • Rp63.500');
});

test('order-snapshot: fallback nilai default aman jika pricing bernilai null/undefined', () => {
  const snapshot = createOrderSummarySnapshot({
    customerName: '   ',
    pricing: null,
    outletName: '',
  });

  assert.equal(snapshot.customerName, '');
  assert.equal(snapshot.totalQuantity, 0);
  assert.equal(snapshot.total, 0);
  assert.equal(snapshot.outletName, 'Kopi Kenangan');
  assert.equal(formatOrderSummaryDetail(snapshot), '0 item • Rp0');
});
