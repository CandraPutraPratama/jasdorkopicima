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

Sub Total Normal (2 item): Rp34.500
Biaya Jasa Normal: Rp4.000
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

  assert.match(message, /Biaya Jasa Normal: Rp4\.000/);
  assert.match(message, /Sub Total Normal \(1 item\): Rp10\.000/);
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
  assert.match(message, /Biaya Jasa Normal: Rp4\.000/);
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

test('buildWhatsAppMessage formats No Whipped Cream as Whipped Cream: Tanpa', () => {
  const items: CartItem[] = [
    {
      id: 'item-frappe-nowhip',
      bundleCode: '77123',
      name: 'Butterscotch Kenangan Frappe',
      basePrice: 28000,
      variantAddition: 0,
      toppingTotal: 0,
      quantity: 1,
      variantDescription: 'Ice, Regular, Normal Sugar, Normal Ice',
      addons: [
        { sku: 'WC-0', name: 'No Whipped Cream', price: 0, categoryName: 'Whipped Cream' },
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

  assert.match(
    message,
    /- 1x Butterscotch Kenangan Frappe \(Ice, Regular, Normal Sugar, Normal Ice, Whipped Cream: Tanpa\) Rp14\.000/
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

test('buildOrderWhatsAppConfirmationMessage formats pre-filled message correctly with items and options', async () => {
  const { buildOrderWhatsAppConfirmationMessage } = await import('../src/lib/whatsapp.ts');

  const order = {
    id: 'CG-AB12CD',
    outlet_name: 'Lippo Mall Puri',
    outlet_code: 'LIPPO-PURI',
    customer_name: 'Budi Santoso',
    total: 38000,
    items: [
      {
        name: 'Kopi Kenangan Mantan',
        quantity: 1,
        subtotal: 18000,
        variantOptions: ['Iced', 'Large (+Rp5.000)', 'Less Sugar'],
        addons: [{ name: 'Topping: Boba (+Rp6.000)', price: 6000 }],
      },
      {
        name: 'Oatmeal Raisin Soft Baked Cookie',
        quantity: 2,
        subtotal: 20000,
        variantOptions: [],
        addons: [],
      },
    ],
  };

  const message = buildOrderWhatsAppConfirmationMessage(order);

  const expected = [
    'Halo Kak, saya sudah bayar pesanan #CG-AB12CD',
    '',
    'Brand: Kopi Kenangan',
    'Nama: Budi Santoso',
    'Outlet: Lippo Mall Puri',
    'Pickup: Sekarang (estimasi siap ~jam segera)',
    '',
    'Pesanan:',
    '- 1x Kopi Kenangan Mantan (Iced, Large (+Rp5.000), Less Sugar, Topping: Boba (+Rp6.000)) - Rp18.000',
    '- 2x Oatmeal Raisin Soft Baked Cookie - Rp20.000',
    '',
    'Sub Total Normal (3 item): Rp38.000',
    'Biaya Jasa Normal: Rp6.000',
    'Total: Rp38.000',
    '',
    'Kamu hemat Rp78.000 dari harga normal!',
    '',
    'Mohon konfirmasi pesanan saya. Terima kasih!',
  ].join('\n');

  assert.equal(message, expected);
});

test('buildOrderWhatsAppConfirmationMessage fallbacks to outlet_code if outlet_name is empty', async () => {
  const { buildOrderWhatsAppConfirmationMessage } = await import('../src/lib/whatsapp.ts');

  const order = {
    id: 'CG-999999',
    outlet_name: '',
    outlet_code: 'GI-JAKARTA',
    customer_name: 'Siti Aminah',
    total: 15000,
    items: [
      {
        name: 'Americano',
        quantity: 1,
        subtotal: 15000,
        variantOptions: ['Hot'],
      },
    ],
  };

  const message = buildOrderWhatsAppConfirmationMessage(order);
  assert.ok(message.includes('Halo Kak, saya sudah bayar pesanan #CG-999999'));
  assert.ok(!message.includes('Halo admin'));
  assert.ok(message.includes('Outlet: GI-JAKARTA'));
  assert.ok(message.includes('- 1x Americano (Hot) - Rp15.000'));
  assert.ok(message.includes('Sub Total Normal (1 item): Rp15.000'));
  assert.ok(message.includes('Total: Rp15.000'));
  assert.ok(message.includes('Nama: Siti Aminah'));
  assert.ok(message.includes('Kamu hemat'));
});

test('buildOrderWhatsAppConfirmationMessage formats Bundling 3 Reguler exactly as required', async () => {
  const { buildOrderWhatsAppConfirmationMessage } = await import('../src/lib/whatsapp.ts');

  const order = {
    id: 'CG-BND001',
    brand_slug: 'kopi-kenangan',
    customer_name: 'Candra',
    outlet_name: 'Lippo Mall Puri',
    outlet_code: 'LIPPO-PURI',
    pickup_time: '15:30',
    subtotal: 28500, // 57.000 * 50%
    fee: 4000,
    total: 32500, // 28.500 + 4.000
    items: [
      {
        name: 'Bundling 3 Reguler',
        quantity: 1,
        subtotal: 28500,
        isBundle: true,
        bundleType: 'bundle-3-reguler',
        bundleNormalPrice: 57000,
        bundleDetails: [
          {
            name: 'Kopi Kenangan Mantan',
            variantDescription: 'Less Sugar, Normal Ice',
            normalPrice: 19000,
            promoPrice: 9500,
          },
          {
            name: 'Americano',
            variantDescription: 'Normal Sugar, Normal Ice',
            normalPrice: 15000,
            promoPrice: 7500,
            notes: 'Pisah es',
          },
          {
            name: 'Milo Dinosaurus',
            variantDescription: 'Less Sugar, Less Ice',
            normalPrice: 23000,
            promoPrice: 11500,
          },
        ],
      },
    ],
  };

  const message = buildOrderWhatsAppConfirmationMessage(order);

  const expected = [
    'Halo Kak, saya sudah bayar pesanan #CG-BND001',
    '',
    'Brand: Kopi Kenangan',
    'Nama: Candra',
    'Outlet: Lippo Mall Puri',
    'Pickup: Dijadwalkan jam 15:30',
    '',
    'Pesanan:',
    '- 1x Bundling 3 Reguler',
    '  \u2022 Kopi Kenangan Mantan (Less Sugar, Normal Ice) \u2014 Rp9.500',
    '  \u2022 Americano (Normal Sugar, Normal Ice) \u2014 Rp7.500',
    '    Catatan: Pisah es',
    '  \u2022 Milo Dinosaurus (Less Sugar, Less Ice) \u2014 Rp11.500',
    '',
    'Sub Total Bundling (1 item): Rp28.500',
    'Biaya Jasa Bundling: Rp4.000',
    'Total: Rp32.500',
    '',
    'Kamu hemat Rp24.500 dari harga normal!',
    '',
    'Mohon konfirmasi pesanan saya. Terima kasih!',
  ].join('\n');

  assert.equal(message.trim(), expected.trim());
});

test('buildOrderWhatsAppConfirmationMessage formats Bundling 2 Large with pickup now and created_at', async () => {
  const { buildOrderWhatsAppConfirmationMessage } = await import('../src/lib/whatsapp.ts');

  const order = {
    id: 'CG-BND002',
    brand_slug: 'kopi-kenangan',
    customer_name: 'Dewi Lestari',
    outlet_name: 'Grand Indonesia',
    outlet_code: 'GI-JAKARTA',
    pickup_time: 'now',
    created_at: '2026-10-17T07:00:00Z', // 14:00 WIB -> +15m = 14:15
    subtotal: 26000, // 52.000 * 50%
    fee: 3500,
    total: 29500,
    items: [
      {
        name: 'Bundling 2 Large',
        quantity: 1,
        subtotal: 26000,
        isBundle: true,
        bundleType: 'bundle-2-large',
        bundleNormalPrice: 52000,
        bundleDetails: [
          {
            name: 'Kopi Kenangan Mantan',
            variantDescription: 'Less Sugar, Normal Ice',
            normalPrice: 26000,
            promoPrice: 13000,
          },
          {
            name: 'Latte',
            variantDescription: 'No Sugar, Less Ice',
            normalPrice: 26000,
            promoPrice: 13000,
          },
        ],
      },
    ],
  };

  const message = buildOrderWhatsAppConfirmationMessage(order);

  assert.ok(message.includes('Halo Kak, saya sudah bayar pesanan #CG-BND002'));
  assert.ok(message.includes('Brand: Kopi Kenangan'));
  assert.ok(message.includes('Outlet: Grand Indonesia'));
  assert.ok(message.includes('Pickup: Sekarang (estimasi siap ~jam 14:15)'));
  assert.ok(message.includes('- 1x Bundling 2 Large'));
  assert.ok(message.includes('  \u2022 Kopi Kenangan Mantan (Less Sugar, Normal Ice) \u2014 Rp13.000'));
  assert.ok(message.includes('  \u2022 Latte (No Sugar, Less Ice) \u2014 Rp13.000'));
  assert.ok(message.includes('Sub Total Bundling (1 item): Rp26.000'));
  assert.ok(message.includes('Biaya Jasa Bundling: Rp3.500'));
  assert.ok(message.includes('Total: Rp29.500'));
  // Hemat = 52.000 - 29.500 = 22.500
  assert.ok(message.includes('Kamu hemat Rp22.500 dari harga normal!'));
});

