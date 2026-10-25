import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  recalculateOrderItemsWithServerPrices,
  createOrderRecord,
} from '../src/lib/order-service.ts';
import { calculateServerOrderPricing } from '../src/lib/order-service.ts';
import { calculateBundlePricing } from '../src/lib/bundling.ts';
import { cacheService } from '../src/lib/cache.ts';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { POST } from '../src/app/api/orders/create/route.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';
import type { Product } from '../src/types/domain.ts';

describe('Server-Side Price Recalculation (K1 Security Audit)', () => {
  const originalGetStore = kkApiClient.getStore;
  const originalQueryStore = kkApiClient.queryStore;
  const originalQueryProductMenu = kkApiClient.queryProductMenu;
  const originalGetProductOptions = kkApiClient.getProductOptions;

  const mockKkStore = {
    id: 101,
    code: 'KK-TEST-01',
    name: 'Kopi Kenangan Test Outlet',
    address: 'Jl. Test No. 1',
    is_open: true,
    // Jam operasional 24 jam supaya test ini deterministik dan tidak gagal
    // hanya karena suite dijalankan lewat tengah malam (flaky berbasis jam).
    open: '00:00',
    close: '23:59',
    time_zone: 7,
  };

  const mockMenuProducts: Product[] = [
    {
      id: 1,
      bundleCode: 'KK-MANTAN',
      productCode: 'PROD-MANTAN',
      name: 'Kopi Kenangan Mantan',
      description: 'Espresso + Susu + Gula Aren',
      image: 'https://cdn.example.com/mantan.jpg',
      basePrice: 19000,
      originalPrice: 19000,
      isSoldOut: false,
      isCombo: false,
    },
    {
      id: 2,
      bundleCode: 'KK-AMERICANO',
      productCode: 'PROD-AMERICANO',
      name: 'Americano',
      description: 'Espresso + Air',
      image: 'https://cdn.example.com/americano.jpg',
      basePrice: 17000,
      originalPrice: 17000,
      isSoldOut: false,
      isCombo: false,
    },
  ];

  beforeEach(async () => {
    await cacheService.clear();

    // Default mock implementasi KK API
    kkApiClient.getStore = async () => ({ ...mockKkStore } as any);
    kkApiClient.queryStore = async () => ({ total: 1, page_index: 1, page_size: 1, store: [{ ...mockKkStore }] } as any);
    kkApiClient.queryProductMenu = async () => ({
      menu_groups: [
        {
          group_code: 'grp-1',
          group_name: 'Coffee',
          has_combo: false,
          menu_products: [
            {
              id: 1,
              bundle_code: 'KK-MANTAN',
              product_code: 'PROD-MANTAN',
              name: 'Kopi Kenangan Mantan',
              price: 19000,
              orig_price: 19000,
              is_sold_out: false,
              is_combo_v2: false,
              image: '',
            },
            {
              id: 2,
              bundle_code: 'KK-AMERICANO',
              product_code: 'PROD-AMERICANO',
              name: 'Americano',
              price: 17000,
              orig_price: 17000,
              is_sold_out: false,
              is_combo_v2: false,
              image: '',
            },
          ],
        },
      ],
    } as any);

    kkApiClient.getProductOptions = async (_outletId: number, _storeCode: string, bundleCode: string) => {
      if (bundleCode === 'KK-MANTAN') {
        return {
          base_product: {
            id: 1,
            bundle_code: 'KK-MANTAN',
            name: 'Kopi Kenangan Mantan',
            price: 19000,
            orig_price: 19000,
            is_soldout: false,
          },
          option_product_map: {
            '1-1:': { name: 'Regular', product_code: 'SKU-MANTAN-REG', price: 19000, display_description: 'Ice, Regular, Kenangan Blend, Milk, Normal Sugar' },
            '1-2:': { name: 'Large', product_code: 'SKU-MANTAN-LRG', price: 24000, display_description: 'Ice, Large, Kenangan Blend, Milk, Normal Sugar' },
          },
          product_addon_wording: [
            {
              dimension_text: 'Topping',
              dimension_value_wordings: [
                { addon_sku: 'ADDON-BOBA', value_text: 'Boba', addon_price: 6000, is_sold_out: false },
                { addon_sku: 'ADDON-GRASS-JELLY', value_text: 'Grass Jelly', addon_price: 6000, is_sold_out: true },
              ],
            },
          ],
        } as any;
      }
      throw new Error(`Options not found for ${bundleCode}`);
    };

    // Mock Supabase Server Client
    setSupabaseServerClientInstance({
      from: (table?: string) => {
        if (table === 'site_settings') {
          return {
            select: () => ({
              eq: (_col: string, val: string) => ({
                maybeSingle: async () => {
                  if (val === 'operational_override') {
                    return { data: { key: 'operational_override', value: 'force_open' }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { code: 'KK-TEST-01', brand: 'kopi-kenangan', is_in_scope: true },
                error: null,
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: { code: 'KK-TEST-01', brand: 'kopi-kenangan', is_in_scope: true },
                error: null,
              }),
            }),
          }),
          insert: (record: any) => ({
            select: () => ({
              single: async () => ({ data: { ...record, id: record.id || 'CG-TEST12' }, error: null }),
            }),
          }),
        };
      },
    } as any);
  });

  afterEach(() => {
    kkApiClient.getStore = originalGetStore;
    kkApiClient.queryStore = originalQueryStore;
    kkApiClient.queryProductMenu = originalQueryProductMenu;
    kkApiClient.getProductOptions = originalGetProductOptions;
    setSupabaseServerClientInstance(null);
  });

  describe('1. Kasus Uji Wajib: Total Order Sah Tidak Boleh Berubah 1 Rupiah Pun', () => {
    it('Campuran bundling + reguler: 30.500 + 10.000 + 4.000 + 2.000 = Rp46.500', () => {
      // 1 item paket bundling (misal total normal 61.000 -> 50% = 30.500, fee = 4.000)
      // 1 item reguler (basePrice 20.000 -> 50% = 10.000, fee = 2.000 karena ada bundling)
      const items: CartItem[] = [
        {
          id: 'bundle-1',
          bundleCode: 'bundle-3-reguler',
          name: '🎁 3 Minuman Kenangan Mantan',
          basePrice: 61000,
          bundleNormalPrice: 61000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
          isBundle: true,
          bundleType: 'bundle-3-reguler',
          bundleFee: 4000,
        },
        {
          id: 'reg-1',
          bundleCode: 'KK-TEST-REG',
          name: 'Menu Reguler',
          basePrice: 20000,
          skuPrice: 20000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
        },
      ];

      const pricing = calculateServerOrderPricing(items);
      assert.strictEqual(pricing.bundleSubtotal, 30500);
      assert.strictEqual(pricing.regularSubtotal, 10000);
      assert.strictEqual(pricing.bundleFee, 4000);
      assert.strictEqual(pricing.regularFee, 2000);
      assert.strictEqual(pricing.fee, 6000);
      assert.strictEqual(pricing.total, 46500, 'Total harus persis Rp46.500');
    });

    it('Bundling 2 Large di outlet tier +3k (LIPPO-PURI): harga normal 56.000, total bayar Rp31.500', () => {
      const tierDiff = 3000;
      // 2 Large drinks: baseline price 25.000 masing-masing + 3.000 = 28.000 masing-masing
      // Total normal = 28.000 + 28.000 = 56.000
      // Promo 50% = 28.000
      // Fee bundle-2-large = 3.500
      // Total bayar = 28.000 + 3.500 = 31.500
      const bundleDetails = [
        { name: 'Kopi Kenangan Mantan', category: 'drink' as const, variantDescription: 'Large' },
        { name: 'Kopi Kenangan Mantan', category: 'drink' as const, variantDescription: 'Large' },
      ];

      const bundlePricing = calculateBundlePricing('bundle-2-large', bundleDetails, tierDiff);
      assert.strictEqual(bundlePricing.normalPrice, 56000, 'Harga normal harus 56.000');
      assert.strictEqual(bundlePricing.promoSubtotal, 28000, 'Promo subtotal harus 28.000');
      assert.strictEqual(bundlePricing.bundleFee, 3500, 'Fee paket harus 3.500');
      assert.strictEqual(bundlePricing.total, 31500, 'Total bayar harus persis Rp31.500');
    });

    it('Order reguler 1 item: biaya jasa Rp4.000', () => {
      const items: CartItem[] = [
        {
          id: 'reg-1',
          bundleCode: 'KK-MANTAN',
          name: 'Kopi Kenangan Mantan',
          basePrice: 19000,
          skuPrice: 19000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
        },
      ];

      const pricing = calculateServerOrderPricing(items);
      assert.strictEqual(pricing.regularQuantity, 1);
      assert.strictEqual(pricing.regularFee, 4000, 'Biaya jasa 1 item reguler harus flat Rp4.000');
      assert.strictEqual(pricing.subtotal, 9500);
      assert.strictEqual(pricing.total, 13500);
    });

    it('Item dengan varian + topping: add-on tidak didiskon, hanya harga dasar kena 50%', () => {
      // basePrice: 19.000 -> 50% diskon = 9.500
      // Large variant: +5.000 (tidak didiskon)
      // Topping Boba: +6.000 (tidak didiskon)
      // Promo per item = 9.500 + 5.000 + 6.000 = 20.500
      // Total 1 item dengan fee 4.000 = 24.500
      const items: CartItem[] = [
        {
          id: 'reg-1',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-MANTAN-LRG',
          skuPrice: 24000,
          name: 'Kopi Kenangan Mantan Large',
          basePrice: 19000,
          variantAddition: 5000,
          toppingTotal: 6000,
          quantity: 1,
        },
      ];

      const pricing = calculateServerOrderPricing(items);
      assert.strictEqual(pricing.items[0].promoPricePerItem, 20500);
      assert.strictEqual(pricing.subtotal, 20500);
      assert.strictEqual(pricing.fee, 4000);
      assert.strictEqual(pricing.total, 24500);
    });
  });

  describe('2. Rekalkulasi Otoritatif Server (Abaikan Input Client)', () => {
    it('mengambil basePrice, skuPrice, variantAddition, dan toppingTotal dari server, bukan client', async () => {
      // Client mengirim item dengan nilai yang dimanipulasi:
      // basePrice: 10.000 (seharusnya 19.000)
      // skuPrice: 10.000 (seharusnya 24.000 untuk SKU-MANTAN-LRG)
      // variantAddition: 0 (seharusnya 5.000)
      // toppingTotal: 0 (padahal ada topping Boba yang harganya 6.000)
      const tamperedItems: CartItem[] = [
        {
          id: 'item-tampered',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-MANTAN-LRG',
          name: 'Kopi Kenangan Mantan',
          basePrice: 10000,
          skuPrice: 10000,
          variantAddition: 0,
          toppingTotal: 0,
          quantity: 1,
          addons: [{ sku: 'ADDON-BOBA', name: 'Boba', price: 0 } as any],
        },
      ];

      const result = await recalculateOrderItemsWithServerPrices({
        outletCode: 'KK-TEST-01',
        storeId: 101,
        items: tamperedItems,
        allProducts: mockMenuProducts,
        tierDiff: 0,
      });

      assert.strictEqual(result.unavailableItems.length, 0);
      const recomputedItem = result.items[0];

      // Nilai otoritatif server HARUS menimpa nilai client
      assert.strictEqual(recomputedItem.basePrice, 19000, 'basePrice wajib diambil dari menu server (19.000)');
      assert.strictEqual(recomputedItem.skuPrice, 24000, 'skuPrice wajib diambil dari options server (24.000)');
      assert.strictEqual(recomputedItem.variantAddition, 5000, 'variantAddition wajib 5.000 (flat Large, bukan selisih SKU)');
      assert.strictEqual(recomputedItem.toppingTotal, 6000, 'toppingTotal wajib 6.000 dari server');
      assert.strictEqual(recomputedItem.addons![0].price, 6000, 'harga addon boba wajib 6.000');

      // Total pricing server: 9.500 (50% dari 19k) + 5.000 + 6.000 = 20.500 + 4.000 fee = 24.500
      assert.strictEqual(result.pricing.total, 24500);
    });

    it('regresi checkout kustom: selisih SKU asli Large (8.000) tidak boleh mengalahkan flat Large (5.000)', async () => {
      // Kasus nyata Graha Pena Surabaya, 24 Okt 2026: Caramel Latte base 26.000,
      // SKU Large asli KK 34.000 (selisih 8.000), Espresso Shot 6.000.
      // Etalase menghitung promo 13.000 + flat Large 5.000 + 6.000 = 24.000.
      // Rekalkulasi lama memakai selisih asli (8.000) -> total server 27.000 ->
      // checkout pelanggan ditolak "Harga menu berubah".
      kkApiClient.getProductOptions = async (_outletId: number, _storeCode: string, bundleCode: string) => {
        if (bundleCode === 'KK-CARAMEL') {
          return {
            base_product: {
              id: 9,
              bundle_code: 'KK-CARAMEL',
              name: 'Caramel Latte',
              price: 26000,
              orig_price: 26000,
              is_soldout: false,
            },
            option_product_map: {
              '1-1:': { name: 'Caramel Latte', product_code: 'SKU-CARAMEL-REG', price: 26000, display_description: 'Ice, Regular, Kenangan Blend, Milk, Normal Sugar' },
              '1-2:': { name: 'Caramel Latte', product_code: 'SKU-CARAMEL-LRG', price: 34000, display_description: 'Ice, Large, Kenangan Blend, Milk, Normal Sugar' },
            },
            product_addon_wording: [
              {
                dimension_text: 'Topping',
                dimension_value_wordings: [
                  { addon_sku: 'ADDON-SHOT', value_text: 'Espresso Shot Kenangan Blend', addon_price: 6000, is_sold_out: false },
                ],
              },
            ],
          } as any;
        }
        throw new Error(`Options not found for ${bundleCode}`);
      };

      const caramelProduct: Product = {
        id: 9,
        bundleCode: 'KK-CARAMEL',
        productCode: 'PROD-CARAMEL',
        name: 'Caramel Latte',
        description: 'Caramel + Latte',
        image: 'https://cdn.example.com/caramel.jpg',
        basePrice: 26000,
        originalPrice: 26000,
        isSoldOut: false,
        isCombo: false,
      };

      // Item persis seperti yang dikirim etalase (variantAddition FLAT 5.000)
      const clientItems: CartItem[] = [
        {
          id: 'item-caramel',
          bundleCode: 'KK-CARAMEL',
          sku: 'SKU-CARAMEL-LRG',
          name: 'Caramel Latte',
          basePrice: 26000,
          skuPrice: 34000,
          variantAddition: 5000,
          toppingTotal: 6000,
          quantity: 1,
          addons: [{ sku: 'ADDON-SHOT', name: 'Espresso Shot Kenangan Blend', price: 6000 } as any],
        },
      ];

      const result = await recalculateOrderItemsWithServerPrices({
        outletCode: 'KK-TEST-01',
        storeId: 101,
        items: clientItems.map((it) => ({ ...it })),
        allProducts: [caramelProduct],
        tierDiff: 0,
      });

      assert.strictEqual(result.unavailableItems.length, 0);
      assert.strictEqual(result.items[0].variantAddition, 5000, 'variantAddition server wajib flat Large 5.000');
      assert.strictEqual(result.items[0].toppingTotal, 6000, 'toppingTotal server wajib flat 6.000');
      // Promo per item 24.000 + fee item tunggal 4.000 = 28.000, dan HARUS sama
      // persis dengan total hitungan dari item kiriman client (perbandingan route).
      assert.strictEqual(result.pricing.total, 28000);
      assert.strictEqual(calculateServerOrderPricing(clientItems).total, result.pricing.total);
    });

    it('menolak topping yang sedang sold out di outlet', async () => {
      const itemsWithSoldOutTopping: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-MANTAN-REG',
          name: 'Kopi Kenangan Mantan',
          basePrice: 19000,
          quantity: 1,
          variantAddition: 0,
          toppingTotal: 6000,
          addons: [{ sku: 'ADDON-GRASS-JELLY', name: 'Grass Jelly', price: 6000 } as any],
        },
      ];

      await assert.rejects(
        async () => {
          await recalculateOrderItemsWithServerPrices({
            outletCode: 'KK-TEST-01',
            storeId: 101,
            items: itemsWithSoldOutTopping,
            allProducts: mockMenuProducts,
            tierDiff: 0,
          });
        },
        /sedang habis|tidak tersedia/
      );
    });

    it('menolak topping yang tidak dikenal di server', async () => {
      const itemsWithUnknownTopping: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-MANTAN-REG',
          name: 'Kopi Kenangan Mantan',
          basePrice: 19000,
          quantity: 1,
          variantAddition: 0,
          toppingTotal: 1000,
          addons: [{ sku: 'ADDON-HACK', name: 'Topping Palsu', price: 1000 } as any],
        },
      ];

      await assert.rejects(
        async () => {
          await recalculateOrderItemsWithServerPrices({
            outletCode: 'KK-TEST-01',
            storeId: 101,
            items: itemsWithUnknownTopping,
            allProducts: mockMenuProducts,
            tierDiff: 0,
          });
        },
        /tidak tersedia di outlet ini/
      );
    });

    it('menolak SKU yang tidak valid atau tidak cocok dengan produk', async () => {
      const itemsWithInvalidSku: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-PALSU',
          name: 'Kopi Kenangan Mantan',
          basePrice: 19000,
          quantity: 1,
          variantAddition: 0,
          toppingTotal: 0,
        },
      ];

      await assert.rejects(
        async () => {
          await recalculateOrderItemsWithServerPrices({
            outletCode: 'KK-TEST-01',
            storeId: 101,
            items: itemsWithInvalidSku,
            allProducts: mockMenuProducts,
            tierDiff: 0,
          });
        },
        /Varian atau ukuran menu tidak valid/
      );
    });
  });

  describe('3. Manipulasi Request Ditolak HTTP 400 di /api/orders/create', () => {
    it('menolak order pembuatan brand Fore dengan HTTP 400', async () => {
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'fore',
          outletCode: 'fore-senayan',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'FORE-LATTE',
              name: 'Fore Pandan Latte',
              basePrice: 28000,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error?.includes('Fore Coffee saat ini belum dibuka') || data.error?.includes('belum bisa dipesan'));
    });

    it('menolak order brand Tomoro selama brand ditutup (coming_soon) dengan HTTP 400', async () => {
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'tomoro',
          outletCode: 'tomoro-tgr47c',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'tomoro-caffe-latte',
              name: 'Caffe Latte',
              basePrice: 25000,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error?.includes('TOMORO Coffee saat ini sedang ditutup'));
    });

    it('menolak manipulasi basePrice dengan pesan "Harga menu berubah, silakan refresh keranjangmu."', async () => {
      // Menu asli Kopi Kenangan Mantan = 19.000 -> total seharusnya 13.500 (9.500 + 4.000 fee)
      // Client mengirim basePrice = 10.000 (total client = 5.000 + 4.000 = 9.000)
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'kopi-kenangan',
          outletCode: 'KK-TEST-01',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'KK-MANTAN',
              sku: 'SKU-MANTAN-REG',
              skuPrice: 10000,
              name: 'Kopi Kenangan Mantan',
              basePrice: 10000, // Dimanipulasi lebih murah
              variantAddition: 0,
              toppingTotal: 0,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Harga menu berubah, silakan refresh keranjangmu.');
    });

    it('menolak manipulasi toppingTotal = 0 padahal ada topping dipilih', async () => {
      // Ada addon Boba (+6.000), tapi client mengisi toppingTotal = 0
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'kopi-kenangan',
          outletCode: 'KK-TEST-01',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'KK-MANTAN',
              sku: 'SKU-MANTAN-REG',
              skuPrice: 19000,
              name: 'Kopi Kenangan Mantan',
              basePrice: 19000,
              variantAddition: 0,
              toppingTotal: 0, // Manipulasi: tidak menghitung topping
              quantity: 1,
              addons: [{ sku: 'ADDON-BOBA', name: 'Boba', price: 6000 }],
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Harga menu berubah, silakan refresh keranjangmu.');
    });

    it('menolak manipulasi skuPrice diisi harga SKU murah padahal memilih SKU mahal', async () => {
      // Memilih SKU Large (harga 24.000, variantAddition 5.000), tapi mengisi skuPrice: 19.000 & variantAddition: 0
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'kopi-kenangan',
          outletCode: 'KK-TEST-01',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'KK-MANTAN',
              sku: 'SKU-MANTAN-LRG',
              skuPrice: 19000, // Seharusnya 24.000
              name: 'Kopi Kenangan Mantan Large',
              basePrice: 19000,
              variantAddition: 0, // Seharusnya 5.000
              toppingTotal: 0,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Harga menu berubah, silakan refresh keranjangmu.');
    });

    it('menolak produk yang tidak ada di menu outlet', async () => {
      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'kopi-kenangan',
          outletCode: 'KK-TEST-01',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-unknown',
              bundleCode: 'KK-GHOUL-COFFEE',
              sku: 'SKU-GHOUL',
              name: 'Ghoul Coffee',
              basePrice: 20000,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error?.includes('tidak tersedia') || data.unavailableItems?.length > 0);
    });

    it('menolak request jika data menu server gagal dimuat (JANGAN fallback ke harga client)', async () => {
      // Mock KK menu throwing error
      kkApiClient.queryProductMenu = async () => {
        throw new Error('KK upstream network timeout');
      };

      const req = new Request('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug: 'kopi-kenangan',
          outletCode: 'KK-TEST-01',
          customerName: 'Budi Santoso',
          customerWa: '081234567890',
          items: [
            {
              id: 'item-1',
              bundleCode: 'KK-MANTAN',
              sku: 'SKU-MANTAN-REG',
              skuPrice: 19000,
              name: 'Kopi Kenangan Mantan',
              basePrice: 19000,
              quantity: 1,
            },
          ],
        }),
      });

      const res = await POST(req as any);
      assert.ok(res.status === 400 || res.status === 503);
      const data = await res.json();
      assert.ok(data.error?.includes('Gagal memuat data menu') || data.error?.includes('Silakan coba beberapa saat lagi'));
    });
  });

  describe('4. Record Order di Database Memakai Seluruh Angka Server', () => {
    it('orderRecord yang disimpan di DB mencatat nilai subtotal, fee, total, dan promoPrice murni server', async () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          bundleCode: 'KK-MANTAN',
          sku: 'SKU-MANTAN-LRG',
          name: 'Kopi Kenangan Mantan Large',
          basePrice: 19000,
          skuPrice: 24000,
          variantAddition: 5000,
          toppingTotal: 6000,
          quantity: 2,
          addons: [{ sku: 'ADDON-BOBA', name: 'Boba', price: 6000, categoryName: 'Topping' }],
        },
      ];

      const record = createOrderRecord({
        outletCode: 'KK-TEST-01',
        customerName: 'Candra',
        customerWa: '6281234567890',
        items,
      });

      // Item calculation:
      // promoPrice per item = (19k * 50% = 9.500) + 5.000 + 6.000 = 20.500
      // subtotal per item = 20.500 * 2 = 41.000
      // regularFee = 2.000 * 2 = 4.000
      // total = 45.000
      assert.strictEqual(record.subtotal, 41000);
      assert.strictEqual(record.fee, 4000);
      assert.strictEqual(record.total, 45000);
      assert.strictEqual(record.items[0].promoPrice, 20500);
      assert.strictEqual(record.items[0].subtotal, 41000);
      assert.strictEqual(record.items[0].originalPrice, 30000); // 24.000 + 6.000
    });
  });
});
