import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppMessage,
  cleanNotes,
  buildWhatsAppUrl,
} from '../src/lib/whatsapp.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

test('buildWhatsAppMessage produces exact required template string for Creamy Caramel Latte and Cookie scenario', () => {
  const items: CartItem[] = [
    {
      id: 'item-1',
      bundleCode: '7245645',
      name: 'Creamy Caramel Latte',
      basePrice: 34000,
      variantAddition: 8000,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: 'Hot, Large (+Rp5.000), Juwara Beans (+Rp3.000), Less Sugar, Normal Ice',
      addons: [],
      notes: 'Less Coffee, Extra Ice',
    },
    {
      id: 'item-2',
      bundleCode: '88123',
      name: 'Oatmeal Raisin Soft Baked Cookie',
      basePrice: 19000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: '',
      addons: [],
      notes: '',
    },
  ];

  const message = buildWhatsAppMessage({
    customerName: 'Budi',
    outletName: 'MERR Rungkut Surabaya (DT)',
    pickupMode: 'now',
    estimatedTime: '14:15',
    items,
  });

  const expected =
`Halo Kak, saya ingin memesan:

Brand: Kopi Kenangan
Nama: Budi
Lokasi: MERR Rungkut Surabaya (DT)
Pickup: Sekarang (estimasi siap ~jam 14:15)

Pesanan:
- 1x Creamy Caramel Latte (Hot, Large (+Rp5.000), Juwara Beans (+Rp3.000), Less Sugar, Normal Ice) Rp25.000
  Catatan: Less Coffee, Extra Ice
- 1x Oatmeal Raisin Soft Baked Cookie Rp9.500

Sub Total: Rp34.500
Biaya Jasa (Rp2.000 x 2 item): Rp4.000
Total: Rp38.500

Kamu hemat Rp26.500 dari harga normal!

Mohon konfirmasi pesanan saya. Terima kasih!`;

  assert.equal(message.trim(), expected.trim());
});

test('buildWhatsAppMessage handles single item order with Biaya Jasa (1 item): Rp4.000', () => {
  const items: CartItem[] = [
    {
      id: 'item-1',
      bundleCode: '101',
      name: 'Kopi Kenangan Mantan',
      basePrice: 20000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: 'Ice, Regular, Normal Sugar',
      addons: [],
      notes: '',
    },
  ];

  const message = buildWhatsAppMessage({
    customerName: 'Siti',
    outletName: 'Grand Indonesia',
    pickupMode: 'now',
    estimatedTime: '11:00',
    items,
  });

  assert.match(message, /Biaya Jasa \(1 item\): Rp4\.000/);
  assert.match(message, /Sub Total: Rp10\.000/);
  assert.match(message, /Total: Rp14\.000/);
});

test('buildWhatsAppMessage handles scheduled pickup format', () => {
  const items: CartItem[] = [
    {
      id: 'item-1',
      bundleCode: '101',
      name: 'Americano',
      basePrice: 15000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 2,
      variantDescription: 'Ice, Regular',
      addons: [],
      notes: '',
    },
  ];

  const message = buildWhatsAppMessage({
    customerName: 'Rian',
    outletName: 'Pakuwon Mall',
    pickupMode: 'scheduled',
    scheduledTime: '15:30',
    items,
  });

  assert.match(message, /Pickup: Terjadwal jam 15:30/);
  assert.match(message, /Biaya Jasa \(Rp2\.000 x 2 item\): Rp4\.000/);
});

test('buildWhatsAppMessage produces exact required template string for Korea Banana Latte with grouped addons and flat additions', () => {
  const items: CartItem[] = [
    {
      id: 'item-kbl',
      bundleCode: '99881',
      name: 'Korea Banana Latte',
      basePrice: 32000, // promo 16.000
      variantAddition: 8000, // Large (5k) + Juwara Beans (3k)
      toppingTotal: 12000, // Choco Sauce (6k) + Oreo (6k)
      quantity: 1,
      variantDescription: 'Iced, Large, Juwara Beans, Less Sugar, Less Ice',
      addons: [
        { sku: 'WC-1', name: 'Whipped Cream Chocolate', price: 0, categoryName: 'Whipped Cream' },
        { sku: 'SYR-1', name: 'Choco Sauce', price: 6000, categoryName: 'Syrup' },
        { sku: 'TOP-1', name: 'Oreo', price: 6000, categoryName: 'Topping' },
      ],
      notes: '',
    },
  ];

  const message = buildWhatsAppMessage({
    customerName: 'Budi',
    outletName: 'MERR Rungkut Surabaya (DT)',
    pickupMode: 'now',
    estimatedTime: '14:15',
    items,
  });

  // Base 32k / 2 = 16k + 8k + 12k = 36k
  assert.match(
    message,
    /- 1x Korea Banana Latte \(Iced, Large \(\+Rp5\.000\), Juwara Beans \(\+Rp3\.000\), Less Sugar, Less Ice, Whipped Cream: Chocolate, Syrup: Choco Sauce \(\+Rp6\.000\), Topping: Oreo \(\+Rp6\.000\)\) Rp36\.000/
  );
});

test('buildWhatsAppMessage formats toppings correctly inside parentheses with +Rp6.000', () => {
  const items: CartItem[] = [
    {
      id: 'item-1',
      bundleCode: '202',
      name: 'Avocado Coffee',
      basePrice: 28000, // promo 14k
      variantAddition: 0,
      toppingTotal: 6000,
      quantity: 1,
      variantDescription: 'Ice, Regular',
      addons: [{ sku: 'TOP-1', name: 'Grass Jelly', price: 6000, categoryName: 'Topping' }],
      notes: '',
    },
  ];

  const message = buildWhatsAppMessage({
    customerName: 'Dewi',
    outletName: 'Lippo Puri',
    pickupMode: 'now',
    estimatedTime: '13:00',
    items,
  });

  // Base 28k (promo 14k) + Topping 6k = Rp20.000
  assert.match(message, /- 1x Avocado Coffee \(Ice, Regular, Topping: Grass Jelly \(\+Rp6\.000\)\) Rp20\.000/);
});

test('cleanNotes strips control characters and limits length to 100 characters', () => {
  const dirty = 'Catatan\x00\x1Frahasia \n es banyak' + 'a'.repeat(150);
  const cleaned = cleanNotes(dirty);
  assert.ok(cleaned.length <= 100);
  assert.ok(!/[\x00-\x1F\x7F]/.test(cleaned));
});

test('buildWhatsAppUrl checks character limit and provides fallback', () => {
  const shortMsg = 'Halo Kak';
  const url1 = buildWhatsAppUrl('6287793420768', shortMsg);
  assert.ok(url1.isDirect);
  assert.match(url1.url, /https:\/\/wa\.me\/6287793420768\?text=/);

  const longMsg = 'A'.repeat(2000);
  const url2 = buildWhatsAppUrl('6287793420768', longMsg);
  assert.equal(url2.isDirect, false);
  assert.equal(url2.url, 'https://wa.me/6287793420768');
});
