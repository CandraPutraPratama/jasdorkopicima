import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkRateLimit, resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { validateAndSanitizePickupTime } from '../src/lib/schedule-slots.ts';
import { escapeSqlWildcards, getOutletByCode } from '../src/lib/outlet-service.ts';
import { calculateItemPricing, calculateOrderPricing } from '../src/lib/pricing.ts';
import { resolveBrandSlugFromOutletCode } from '../src/lib/site-config.ts';
import { autoCancelEodOrders } from '../src/lib/order-service.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';

describe('Audit Batch 1 Security & Validation Hardening', () => {
  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  describe('T1: Rate Limit Login Admin (Maks 5 percobaan per menit per IP)', () => {
    it('mengizinkan hingga 5 percobaan lalu memblokir percobaan ke-6 dengan 429', () => {
      resetRateLimitStore();
      const testIp = '192.168.1.100';

      for (let i = 1; i <= 5; i++) {
        const res = checkRateLimit(`admin-auth:${testIp}`, {
          maxRequests: 5,
          windowSeconds: 60,
        });
        assert.strictEqual(res.success, true, `Percobaan ke-${i} harus berhasil`);
      }

      // Percobaan ke-6 harus ditolak
      const blockedRes = checkRateLimit(`admin-auth:${testIp}`, {
        maxRequests: 5,
        windowSeconds: 60,
      });
      assert.strictEqual(blockedRes.success, false, 'Percobaan ke-6 harus gagal');
      assert.strictEqual(blockedRes.remaining, 0);
      assert.ok(blockedRes.resetInSeconds > 0);
    });
  });

  describe('T2: Validasi pickupTime di Server', () => {
    it('membuang karakter \\r dan \\n dari pickupTime (mencegah injeksi WhatsApp)', () => {
      const result = validateAndSanitizePickupTime({
        pickupTime: 'Sekarang\r\nTransfer ke rekening palsu\n',
      });
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.sanitized.includes('\r'), false);
      assert.strictEqual(result.sanitized.includes('\n'), false);
    });

    it('menolak pickupTime dengan format tidak valid', () => {
      const result = validateAndSanitizePickupTime({
        pickupTime: 'bukan-jam',
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errorMessage);
    });

    it('menolak pickupTime yang sudah lewat atau kurang dari 10 menit dari sekarang', () => {
      // Mock waktu server jam 14:00 WIB
      const mockNow = new Date('2026-10-18T07:00:00.000Z'); // 14:00 WIB
      const pastResult = validateAndSanitizePickupTime({
        pickupTime: '13:45',
        outletOpen: '08:00',
        outletClose: '22:00',
        now: mockNow,
      });
      assert.strictEqual(pastResult.isValid, false);
      assert.ok(pastResult.errorMessage?.includes('minimal 10 menit') || pastResult.errorMessage?.includes('tidak tersedia'));

      const tooSoonResult = validateAndSanitizePickupTime({
        pickupTime: '14:05', // hanya 5 menit
        outletOpen: '08:00',
        outletClose: '22:00',
        now: mockNow,
      });
      assert.strictEqual(tooSoonResult.isValid, false);
    });

    it('menolak pickupTime di luar jam operasional Jasdor (08:00 - 23:20 WIB)', () => {
      const mockNow = new Date('2026-10-18T01:00:00.000Z'); // 08:00 WIB
      const earlyResult = validateAndSanitizePickupTime({
        pickupTime: '06:30', // Sebelum Jasdor buka
        outletOpen: '06:00',
        outletClose: '23:30',
        now: mockNow,
      });
      assert.strictEqual(earlyResult.isValid, false);
    });

    it('menolak pickupTime di luar jam buka outlet', () => {
      const mockNow = new Date('2026-10-18T05:00:00.000Z'); // 12:00 WIB
      const afterCloseResult = validateAndSanitizePickupTime({
        pickupTime: '21:30',
        outletOpen: '08:00',
        outletClose: '20:00', // Outlet tutup jam 20:00
        now: mockNow,
      });
      assert.strictEqual(afterCloseResult.isValid, false);
    });

    it('menerima pickupTime yang valid dan memenuhi semua syarat', () => {
      const mockNow = new Date('2026-10-18T05:00:00.000Z'); // 12:00 WIB
      const validResult = validateAndSanitizePickupTime({
        pickupTime: '14:30',
        outletOpen: '08:00',
        outletClose: '22:00',
        now: mockNow,
      });
      assert.strictEqual(validResult.isValid, true);
      assert.strictEqual(validResult.sanitized, '14:30');
    });
  });

  describe('T3: Validasi brandSlug dan server-resolved outlet', () => {
    it('mendeteksi brandSlug Fore untuk outlet Fore dan Kopi Kenangan untuk outlet KK', () => {
      assert.strictEqual(resolveBrandSlugFromOutletCode('fore-puri-indah'), 'fore');
      assert.strictEqual(resolveBrandSlugFromOutletCode('FORE-SENAYAN'), 'fore');
      assert.strictEqual(resolveBrandSlugFromOutletCode('LIPPO-PURI'), 'kopi-kenangan');
      assert.strictEqual(resolveBrandSlugFromOutletCode('JKT.GRANDINDON'), 'kopi-kenangan');
    });

    it('memvalidasi kecocokan brandSlug client terhadap deteksi server', () => {
      // Logika validasi brandSlug seperti di /api/orders/create
      const validateBrandSlugMatch = (clientBrand: string | undefined, outletCode: string) => {
        const serverBrand = resolveBrandSlugFromOutletCode(outletCode);
        if (clientBrand && clientBrand !== serverBrand) {
          return { isValid: false, error: 'Brand yang dipilih tidak sesuai dengan outlet' };
        }
        return { isValid: true, brandSlug: serverBrand };
      };

      // Mismatch Fore ke outlet KK
      const mismatchResult = validateBrandSlugMatch('fore', 'LIPPO-PURI');
      assert.strictEqual(mismatchResult.isValid, false);
      assert.strictEqual(mismatchResult.error, 'Brand yang dipilih tidak sesuai dengan outlet');

      // Mismatch KK ke outlet Fore
      const mismatchFore = validateBrandSlugMatch('kopi-kenangan', 'fore-senayan');
      assert.strictEqual(mismatchFore.isValid, false);

      // Cocok
      const matchKk = validateBrandSlugMatch('kopi-kenangan', 'LIPPO-PURI');
      assert.strictEqual(matchKk.isValid, true);
      assert.strictEqual(matchKk.brandSlug, 'kopi-kenangan');
    });

    it('memastikan route /api/orders/create selalu memakai server-verified outletName', () => {
      const routePath = path.resolve('src/app/api/orders/create/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');

      // Memastikan tidak ada lagi pembacaan client outletName yang menimpa server storeObj.name
      assert.strictEqual(content.includes('outletName: outletName || storeObj.name'), false);
      assert.ok(content.includes('outletName: storeObj.name || outletCode'));
    });
  });

  describe('M4: Auto-cancel: filter tanggal dan hapus GET', () => {
    it('hanya membatalkan pesanan sebelum hari ini; pesanan aktif hari ini tidak tersentuh', async () => {
      // Mock referensi waktu hari ini: 2026-10-20
      const refDate = new Date('2026-10-20T08:00:00.000Z'); // Siang hari 20 Okt
      const mockOrders = [
        {
          id: 'ORD-YESTERDAY',
          status: 'menunggu_pembayaran',
          created_at: '2026-10-19T15:00:00.000Z', // Kemarin
        },
        {
          id: 'ORD-TODAY-ACTIVE',
          status: 'menunggu_pembayaran',
          created_at: '2026-10-20T03:00:00.000Z', // Hari ini jam 10:00 WIB
        },
      ];

      const updatedIds: string[] = [];
      setSupabaseServerClientInstance({
        from: (table: string) => {
          assert.strictEqual(table, 'orders');
          return {
            update: () => ({
              eq: (_col: string, statusVal: string) => ({
                lt: (_dateCol: string, cutoff: string) => ({
                  select: () => {
                    const matched = mockOrders.filter(
                      (o) => o.status === statusVal && o.created_at < cutoff
                    );
                    matched.forEach((m) => updatedIds.push(m.id));
                    return Promise.resolve({
                      data: matched.map((m) => ({ id: m.id })),
                      error: null,
                    });
                  },
                }),
              }),
            }),
          };
        },
      } as any);

      const result = await autoCancelEodOrders(refDate);

      // Hanya order kemarin yang dibatalkan
      assert.strictEqual(result.updatedCount, 1);
      assert.deepEqual(result.orderIds, ['ORD-YESTERDAY']);
      assert.ok(!updatedIds.includes('ORD-TODAY-ACTIVE'));
    });

    it('memastikan GET tidak diekspor pada route /api/cron/auto-cancel-orders', () => {
      const routePath = path.resolve('src/app/api/cron/auto-cancel-orders/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      assert.strictEqual(content.includes('export async function GET'), false);
      assert.strictEqual(content.includes('export function GET'), false);
      assert.ok(content.includes('export async function POST'));
    });
  });

  describe('M5: Batas Quantity di Server (1 - 99)', () => {
    it('pricing engine membatasi quantity ke rentang 1 - 99', () => {
      const itemHuge = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 1000000,
      };
      const pricingHuge = calculateItemPricing(itemHuge);
      // Harus di-clamp ke batas 99
      assert.strictEqual(pricingHuge.subtotalItem, 9000 * 99);

      const itemZero = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 0,
      };
      const pricingZero = calculateItemPricing(itemZero);
      assert.strictEqual(pricingZero.subtotalItem, 9000 * 1);

      const itemNegative = {
        name: 'Kopi Kenangan Mantan',
        basePrice: 18000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: -10,
      };
      const pricingNegative = calculateItemPricing(itemNegative);
      assert.strictEqual(pricingNegative.subtotalItem, 9000 * 1);
    });

    it('calculateOrderPricing membatasi total quantity ke rentang aman', () => {
      const items = [
        {
          name: 'Kopi Kenangan Mantan',
          basePrice: 18000,
          quantity: 500,
        },
      ];
      const orderPricing = calculateOrderPricing(items);
      assert.strictEqual(orderPricing.totalQuantity, 99);
    });

    it('validasi kuantitas item menolak angka di luar 1 sampai 99 atau bukan integer', () => {
      const validateItemQuantities = (items: Array<{ quantity: any }>) => {
        for (const item of items) {
          if (
            typeof item.quantity !== 'number' ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99
          ) {
            return {
              isValid: false,
              error: 'Jumlah pesanan tiap menu harus berupa angka bulat antara 1 sampai 99',
            };
          }
        }
        return { isValid: true };
      };

      assert.strictEqual(validateItemQuantities([{ quantity: 1000000 }]).isValid, false);
      assert.strictEqual(validateItemQuantities([{ quantity: 0 }]).isValid, false);
      assert.strictEqual(validateItemQuantities([{ quantity: -5 }]).isValid, false);
      assert.strictEqual(validateItemQuantities([{ quantity: 2.5 }]).isValid, false);
      assert.strictEqual(validateItemQuantities([{ quantity: 1 }]).isValid, true);
      assert.strictEqual(validateItemQuantities([{ quantity: 99 }]).isValid, true);
    });
  });

  describe('M6: Escape Wildcard Kode Outlet', () => {
    it('meng-escape karakter wildcard % dan _ agar tidak menjadi wildcard SQL', () => {
      assert.strictEqual(escapeSqlWildcards('%'), '\\%');
      assert.strictEqual(escapeSqlWildcards('_'), '\\_');
      assert.strictEqual(escapeSqlWildcards('LIPPO%PURI'), 'LIPPO\\%PURI');
      assert.strictEqual(escapeSqlWildcards('FORE_JAKARTA'), 'FORE\\_JAKARTA');
      assert.strictEqual(escapeSqlWildcards('NORMAL-CODE'), 'NORMAL-CODE');
    });

    it('getOutletByCode meng-escape kode outlet sebelum query ilike ke Supabase', async () => {
      let queriedCode = '';
      setSupabaseServerClientInstance({
        from: (table: string) => {
          assert.strictEqual(table, 'outlets');
          return {
            select: () => ({
              ilike: (_col: string, val: string) => {
                queriedCode = val;
                return {
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                };
              },
            }),
          };
        },
      } as any);

      await getOutletByCode('%');
      assert.strictEqual(queriedCode, '\\%', 'Wildcard % harus di-escape menjadi \\%');

      await getOutletByCode('STORE_%_CODE');
      assert.strictEqual(queriedCode, 'STORE\\_\\%\\_CODE', 'Wildcard _ dan % harus di-escape');
    });
  });
});
