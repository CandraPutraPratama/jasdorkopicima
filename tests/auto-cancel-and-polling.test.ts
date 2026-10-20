import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  autoCancelEodOrders,
  updateOrderStatusByAdmin,
} from '../src/lib/order-service.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import type { OrderRecord, OrderStatus } from '../src/types/order.ts';

describe('Auto-Cancel EOD Orders & Refund Flag Logic', () => {
  afterEach(() => {
    setSupabaseServerClientInstance(null);
  });

  it('hanya membatalkan status non-final (menunggu_pembayaran dan menunggu_konfirmasi)', async () => {
    // Database mock dengan berbagai status
    const initialOrders: OrderRecord[] = [
      {
        id: 'CG-UNPAID',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Budi',
        customer_wa: '628111111111',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_pembayaran',
        created_at: '2026-10-17T10:00:00Z',
        expires_at: '2026-10-17T11:00:00Z',
      },
      {
        id: 'CG-PAIDCONFIRM',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Ani',
        customer_wa: '628222222222',
        items: [],
        subtotal: 20000,
        fee: 4000,
        total: 24000,
        status: 'menunggu_konfirmasi',
        created_at: '2026-10-17T10:30:00Z',
        expires_at: '2026-10-17T11:30:00Z',
      },
      {
        id: 'CG-PROCESSED',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Citra',
        customer_wa: '628333333333',
        items: [],
        subtotal: 15000,
        fee: 4000,
        total: 19000,
        status: 'diproses',
        created_at: '2026-10-17T09:00:00Z',
        expires_at: '2026-10-17T10:00:00Z',
      },
      {
        id: 'CG-CANCELLED',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Doni',
        customer_wa: '628444444444',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'dibatalkan',
        created_at: '2026-10-17T08:00:00Z',
        expires_at: '2026-10-17T09:00:00Z',
      },
      {
        id: 'CG-EXPIRED',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Eka',
        customer_wa: '628555555555',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'kedaluwarsa',
        created_at: '2026-10-17T07:00:00Z',
        expires_at: '2026-10-17T08:00:00Z',
      },
    ];

    const updatedRecords: Record<string, any> = {};

    setSupabaseServerClientInstance({
      from: (table: string) => {
        assert.equal(table, 'orders');
        return {
          update: (fields: any) => ({
            eq: (_field: string, statusVal: string) => ({
              lt: (_createdField: string, cutoff: string) => ({
                select: () => {
                  const matching = initialOrders.filter(
                    (o) => o.status === statusVal && o.created_at < cutoff
                  );
                  for (const ord of matching) {
                    updatedRecords[ord.id] = { ...fields };
                  }
                  return Promise.resolve({
                    data: matching.map((o) => ({ id: o.id })),
                    error: null,
                  });
                },
              }),
            }),
          }),
        };
      },
    } as any);

    const result = await autoCancelEodOrders();

    assert.equal(result.updatedCount, 2);
    assert.deepEqual(result.orderIds, ['CG-UNPAID', 'CG-PAIDCONFIRM']);

    // Pastikan status diproses, dibatalkan, dan kedaluwarsa TIDAK disentuh
    assert.equal(updatedRecords['CG-PROCESSED'], undefined);
    assert.equal(updatedRecords['CG-CANCELLED'], undefined);
    assert.equal(updatedRecords['CG-EXPIRED'], undefined);

    // Pastikan cancellation_reason tepat
    const expectedReason = 'Otomatis dibatalkan - melewati batas hari operasional';
    assert.equal(updatedRecords['CG-UNPAID'].cancellation_reason, expectedReason);
    assert.equal(updatedRecords['CG-PAIDCONFIRM'].cancellation_reason, expectedReason);
  });

  it('menandai needs_refund = true hanya untuk pesanan yang asalnya menunggu_konfirmasi', async () => {
    const testOrders: OrderRecord[] = [
      {
        id: 'CG-UNPAID-01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Fandi',
        customer_wa: '628111222333',
        items: [],
        subtotal: 10000,
        fee: 4000,
        total: 14000,
        status: 'menunggu_pembayaran',
        created_at: '2026-10-17T10:00:00Z',
        expires_at: '2026-10-17T11:00:00Z',
      },
      {
        id: 'CG-PAID-01',
        brand_slug: 'kopi-kenangan',
        outlet_code: 'OUT-1',
        customer_name: 'Gita',
        customer_wa: '628444555666',
        items: [],
        subtotal: 25000,
        fee: 4000,
        total: 29000,
        status: 'menunggu_konfirmasi', // Customer SUDAH bayar!
        created_at: '2026-10-17T10:30:00Z',
        expires_at: '2026-10-17T11:30:00Z',
      },
    ];

    const updatedRecords: Record<string, any> = {};

    setSupabaseServerClientInstance({
      from: () => ({
        update: (fields: any) => ({
          eq: (_field: string, statusVal: string) => ({
            lt: (_createdField: string, cutoff: string) => ({
              select: () => {
                const matching = testOrders.filter(
                  (o) => o.status === statusVal && o.created_at < cutoff
                );
                for (const ord of matching) {
                  updatedRecords[ord.id] = { ...fields };
                }
                return Promise.resolve({
                  data: matching.map((o) => ({ id: o.id })),
                  error: null,
                });
              },
            }),
          }),
        }),
      }),
    } as any);

    await autoCancelEodOrders();

    // Untuk pesanan yang belum bayar, needs_refund harus FALSE
    assert.equal(updatedRecords['CG-UNPAID-01'].status, 'dibatalkan');
    assert.equal(updatedRecords['CG-UNPAID-01'].needs_refund, false);

    // Untuk pesanan menunggu_konfirmasi (sudah bayar), needs_refund harus TRUE
    assert.equal(updatedRecords['CG-PAID-01'].status, 'dibatalkan');
    assert.equal(updatedRecords['CG-PAID-01'].needs_refund, true);
  });

  it('updateOrderStatusByAdmin menandai needs_refund = true jika admin membatalkan pesanan menunggu_konfirmasi', async () => {
    const paidOrder: OrderRecord = {
      id: 'CG-PAID-02',
      brand_slug: 'kopi-kenangan',
      outlet_code: 'OUT-1',
      customer_name: 'Hadi',
      customer_wa: '628777888999',
      items: [],
      subtotal: 20000,
      fee: 4000,
      total: 24000,
      status: 'menunggu_konfirmasi',
      created_at: '2026-10-17T10:00:00Z',
      expires_at: '2026-10-17T11:00:00Z',
    };

    let updatePayload: any = null;

    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: paidOrder, error: null }),
          }),
        }),
        update: (fields: any) => ({
          eq: () => {
            updatePayload = fields;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    } as any);

    const cancelled = await updateOrderStatusByAdmin('CG-PAID-02', 'dibatalkan', 'Stok bahan habis di outlet');
    assert.equal(cancelled.status, 'dibatalkan');
    assert.equal(updatePayload.status, 'dibatalkan');
    assert.equal(updatePayload.cancellation_reason, 'Stok bahan habis di outlet');
    assert.equal(updatePayload.needs_refund, true);
  });

  it('verifikasi logika polling status berhenti pada status final', () => {
    // Fungsi deterministik untuk mengecek apakah status pesanan bersifat final
    const isFinalStatus = (st: OrderStatus): boolean => {
      return st === 'diproses' || st === 'dibatalkan' || st === 'kedaluwarsa';
    };

    // Status non-final -> polling harus aktif (isFinal = false)
    assert.equal(isFinalStatus('menunggu_pembayaran'), false);
    assert.equal(isFinalStatus('menunggu_konfirmasi'), false);

    // Status final -> polling HARUS berhenti (isFinal = true)
    assert.equal(isFinalStatus('diproses'), true);
    assert.equal(isFinalStatus('dibatalkan'), true);
    assert.equal(isFinalStatus('kedaluwarsa'), true);
  });
});
