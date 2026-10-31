import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { createAdminSession, setSessionKVBindingForTests } from '../src/lib/admin-session.ts';
import { ADMIN_CONFIG } from '../src/lib/site-config.ts';
import { GET } from '../src/app/api/orders/[id]/route.ts';
import { POST as CONFIRM_PAYMENT } from '../src/app/api/orders/[id]/confirm-payment/route.ts';
import { buildOrderWhatsAppConfirmationMessage } from '../src/lib/whatsapp.ts';
import type { OrderRecord } from '../src/types/order.ts';

const BASE = 'https://jasdor.test';

function buildMockOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'CG-TST123',
    brand_slug: 'kopi-kenangan',
    outlet_code: 'OUT-TEST',
    outlet_name: 'Test Outlet',
    customer_name: 'Doni',
    customer_wa: '628123456789',
    items: [
      {
        id: 'item-1',
        bundleCode: 'item-1',
        name: 'Kopi Kenangan Mantan',
        quantity: 1,
        subtotal: 9500,
        basePrice: 19000,
        promoPrice: 9500,
        originalPrice: 19000,
        variantOptions: ['Iced', 'Regular'],
      },
    ],
    subtotal: 9500,
    fee: 4000,
    total: 13500,
    status: 'menunggu_pembayaran',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    access_token: '1234567890abcdef1234567890abcdef',
    ...overrides,
  };
}

function mockSupabase(order: OrderRecord | null) {
  let updatedStatus: string | null = null;
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: order, error: null }),
        }),
      }),
      update: (fields: { status?: string }) => ({
        eq: () => {
          if (fields.status) updatedStatus = fields.status;
          return Promise.resolve({ error: null });
        },
      }),
    }),
  } as never);
  return () => updatedStatus;
}

describe('PERBAIKAN 1: Dua Jalur Akses Halaman Bayar & API Order (Token vs Sesi Admin)', () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    resetRateLimitStore();
    process.env.ADMIN_SESSION_SECRET = 'super-secret-key-for-test-suite-at-least-16-bytes';
    setSessionKVBindingForTests(null);
  });

  afterEach(() => {
    setSupabaseServerClientInstance(null);
    setSessionKVBindingForTests(undefined);
    if (originalSecret) {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    } else {
      delete process.env.ADMIN_SESSION_SECRET;
    }
  });

  it('GET /api/orders/[id] tanpa token dan tanpa sesi admin menghasilkan 404 seragam', async () => {
    mockSupabase(buildMockOrder());
    const req = new Request(`${BASE}/api/orders/CG-TST123`);
    const res = await GET(req as never, { params: Promise.resolve({ id: 'CG-TST123' }) });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Pesanan tidak ditemukan');
  });

  it('GET /api/orders/[id] dengan sesi admin valid berhasil membuka data pesanan (status 200)', async () => {
    mockSupabase(buildMockOrder());
    const session = await createAdminSession();

    const req = new Request(`${BASE}/api/orders/CG-TST123`, {
      headers: {
        cookie: `${ADMIN_CONFIG.cookieName}=${encodeURIComponent(session.token)}`,
      },
    });

    const res = await GET(req as never, { params: Promise.resolve({ id: 'CG-TST123' }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.order.id, 'CG-TST123');
    // access_token TIDAK boleh bocor di respons
    assert.equal(body.order.access_token, undefined);
  });

  it('GET /api/orders/[id] dengan token akses pesanan yang valid berhasil membuka data (status 200)', async () => {
    mockMockOrder: mockSupabase(buildMockOrder());
    const req = new Request(`${BASE}/api/orders/CG-TST123?t=1234567890abcdef1234567890abcdef`);
    const res = await GET(req as never, { params: Promise.resolve({ id: 'CG-TST123' }) });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.order.id, 'CG-TST123');
  });

  it('POST /api/orders/[id]/confirm-payment menerima otorisasi sesi admin', async () => {
    const readStatus = mockSupabase(buildMockOrder());
    const session = await createAdminSession();

    const req = new Request(`${BASE}/api/orders/CG-TST123/confirm-payment`, {
      method: 'POST',
      headers: {
        cookie: `${ADMIN_CONFIG.cookieName}=${encodeURIComponent(session.token)}`,
      },
    });

    const res = await CONFIRM_PAYMENT(req as never, { params: Promise.resolve({ id: 'CG-TST123' }) });
    assert.equal(res.status, 200);
    assert.equal(readStatus(), 'antrian');
  });

  it('/bayar/[orderId]/page.tsx mendukung validasi sesi admin dan token pesanan', () => {
    const pageCode = fs.readFileSync(path.resolve('src/app/bayar/[orderId]/page.tsx'), 'utf-8');
    assert.ok(pageCode.includes('validateAdminSession'), 'Halaman bayar harus mengimpor validateAdminSession');
    assert.ok(pageCode.includes('verifyOrderAccessToken'), 'Halaman bayar harus mempertahankan verifyOrderAccessToken');
    assert.ok(pageCode.includes('!isTokenValid && !isAdmin'), 'Halaman bayar hanya 404 jika token DAN admin keduanya tidak valid');
  });
});

describe('PERBAIKAN 2: Tampilan Halaman Bayar (PaymentView) Mengikuti Status', () => {
  it('PaymentView hanya merender section QRIS saat status menunggu_pembayaran', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');

    // Section QRIS harus eksklusif untuk menunggu_pembayaran
    assert.ok(
      pvCode.includes("status === 'menunggu_pembayaran' && (\n          <section className=\"bg-[#FFFDF9] rounded-3xl"),
      'QRIS section harus di-guard dengan status === menunggu_pembayaran'
    );
    assert.ok(
      !pvCode.includes("status !== 'kedaluwarsa' && status !== 'dibatalkan' && (\n          <section className=\"bg-[#FFFDF9] rounded-3xl"),
      'QRIS section tidak boleh memakai guard lama yang bocor ke status menunggu_konfirmasi dan diproses'
    );
  });

  it('PaymentView menyembunyikan sticky bottom bar saat status diproses', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');

    // Sticky bottom bar hanya untuk menunggu_pembayaran dan menunggu_konfirmasi
    assert.ok(
      pvCode.includes("status === 'menunggu_pembayaran' || status === 'menunggu_konfirmasi'") &&
      !pvCode.includes("status === 'menunggu_pembayaran' || status === 'menunggu_konfirmasi' || status === 'diproses'"),
      'Sticky bottom bar tidak boleh di-render saat status diproses'
    );
  });

  it('PaymentView merender banner Pembayaran Terverifikasi & Pesanan Diproses saat status diproses', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');
    assert.ok(pvCode.includes('Pembayaran Terverifikasi & Pesanan Diproses'));
    assert.ok(pvCode.includes('Jadwal Pick up:'));
  });

  it('PaymentView merender kartu antrean menenangkan, estimasi ~15 - 25 menit, dan kebijakan anti-cancel/refund', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');
    assert.ok(pvCode.includes('Pesanan Masuk Antrian'));
    assert.ok(pvCode.includes('~15 - 25 Menit'));
    assert.ok(pvCode.includes('Harap Menunggu dengan Santai:'));
    assert.ok(pvCode.includes('Kebijakan Pembatalan & Refund:'));
    assert.ok(pvCode.includes('TIDAK DAPAT DIBATALKAN atau di-refund sepihak yaa kak🥰🙏.'));
    assert.ok(pvCode.includes('Admin Memproses'));
    assert.ok(pvCode.includes('Pesanan diterima'));
    assert.ok(pvCode.includes('Siap Di Pick Up/Ambil'));
  });

  it('PaymentView tidak menghentikan polling otomatis sebelum order mencapai status final', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');
    // Polling harus tetap aktif saat antrian atau diproses, berhenti jika selesai, dibatalkan, atau kedaluwarsa
    assert.ok(
      !pvCode.includes("status === 'diproses' || status === 'selesai' || status === 'dibatalkan'"),
      'Auto-polling tidak boleh berhenti saat status masih diproses'
    );
  });

  it('PaymentView merender alur Sedang Diracik Barista dan rekomendasi pick-up aman saat status selesai', () => {
    const pvCode = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf-8');
    assert.ok(pvCode.includes('Pesananmu sedang Dibuat'), 'Harus ada tampilan barista sedang membuat');
    assert.ok(
      pvCode.includes('Halo kak👋! sepertinya kopi sudah siap di pick up, silahkan tanya ke barista/kasir apakah orderan atas nama'),
      'Harus menggunakan kata-kata aman pick-up sesuai permintaan user'
    );
    assert.ok(!pvCode.includes('\u2014'), 'PaymentView tidak boleh mengandung em dash (—)');
  });
});

describe('PERBAIKAN 3: Format Pesan WhatsApp Terpadu untuk Semua Pesanan', () => {
  it('Order reguler tanpa bundling menghasilkan format lengkap (bukan format ringkas lama)', () => {
    const order = {
      id: 'CG-REG123',
      brand_slug: 'kopi-kenangan',
      customer_name: 'Rian Pratama',
      outlet_name: 'Mall Kelapa Gading',
      outlet_code: 'MKG-1',
      pickup_time: 'now',
      created_at: '2026-10-22T08:00:00.000Z',
      total: 13500,
      subtotal: 9500,
      fee: 4000,
      items: [
        {
          name: 'Kopi Kenangan Mantan',
          quantity: 1,
          subtotal: 9500,
          variantOptions: ['Iced', 'Regular', 'Normal Sugar'],
          notes: 'Sedotan satu',
        },
      ],
    };

    const msg = buildOrderWhatsAppConfirmationMessage(order);

    // Awalan lengkap resmi diawali banner wajib lampirkan bukti pembayaran
    assert.ok(msg.startsWith('📸 *[WAJIB LAMPIRKAN FOTO BUKTI PEMBAYARAN]*'));
    assert.ok(msg.includes('Halo Kak, saya sudah bayar pesanan #CG-REG123'));
    assert.ok(!msg.includes('Halo admin'));

    // Metadata pesanan
    assert.ok(msg.includes('Brand: Kopi Kenangan'));
    assert.ok(msg.includes('Nama: Rian Pratama'));
    assert.ok(msg.includes('Outlet: Mall Kelapa Gading'));
    assert.ok(msg.includes('Pickup: Sekarang (estimasi siap ~jam'));

    // Item reguler dengan varian dan catatan
    assert.ok(msg.includes('- 1x Kopi Kenangan Mantan (Iced, Regular, Normal Sugar) - Rp9.500'));
    assert.ok(msg.includes('Catatan: Sedotan satu'));

    // Rincian subtotal & fee
    assert.ok(msg.includes('Sub Total Normal (1 item): Rp9.500'));
    assert.ok(msg.includes('Biaya Jasa Normal: Rp4.000'));
    assert.ok(!msg.includes('Sub Total Bundling'));
    assert.ok(!msg.includes('Biaya Jasa Bundling'));
    assert.ok(msg.includes('Total: Rp13.500'));

    // Penghematan & Penutup
    assert.ok(msg.includes('Kamu hemat Rp5.500 dari harga normal!')); // 19.000 - 13.500 = 5.500
    assert.ok(msg.includes('Mohon konfirmasi pesanan saya. Terima kasih!'));
  });

  it('Tidak ada lagi kemunculan "Halo admin, saya sudah bayar" di seluruh berkas src/', () => {
    const srcDir = path.resolve('src');
    function searchDir(dir: string) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
          searchDir(full);
        } else if (/\.(ts|tsx)$/.test(f.name)) {
          const content = fs.readFileSync(full, 'utf-8');
          assert.ok(
            !content.includes('Halo admin, saya sudah bayar'),
            `Format ringkas lama ditemukan di ${full}`
          );
        }
      }
    }
    searchDir(srcDir);
  });
});
