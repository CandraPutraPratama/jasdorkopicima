import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu, normalizeStore } from '@/lib/adapter';
import { isOutletClosed } from '@/lib/orderability';
import { verifyStoreScope } from '@/lib/outlet-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validateCustomerName, validateCustomerPhone } from '@/lib/sanitizer';
import { getJasdorOperationalStatus } from '@/lib/operational';
import { OPERATIONAL_GATE_ENABLED } from '@/lib/feature-flags';
import { createOrderRecord, saveOrderToDb } from '@/lib/order-service';
import type { CartItem } from '@/lib/cart-reducer';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  // 1. Rate limiting: maksimal 15 pesanan per menit per IP
  const rateLimit = checkRateLimit(`order-create:${clientIp}`, {
    maxRequests: 15,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak permintaan pembuatan pesanan. Silakan tunggu beberapa saat.',
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Batasi ukuran body (maksimal 25KB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 25600) {
    return NextResponse.json(
      { error: 'Ukuran payload melebihi batas maksimal (25KB)' },
      { status: 413 }
    );
  }

  // 3. Parse dan validasi payload
  let body: {
    brandSlug?: string;
    outletCode?: string;
    outletName?: string;
    customerName?: string;
    customerWa?: string;
    items?: CartItem[];
    pickupTime?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Format body request tidak valid (wajib JSON)' },
      { status: 400 }
    );
  }

  const {
    brandSlug = 'kopi-kenangan',
    outletCode,
    outletName = '',
    customerName,
    customerWa,
    items,
    pickupTime,
    notes,
  } = body;

  if (!outletCode || typeof outletCode !== 'string') {
    return NextResponse.json({ error: 'Kode outlet wajib disertakan' }, { status: 400 });
  }

  const nameVal = validateCustomerName(customerName);
  if (!nameVal.isValid) {
    return NextResponse.json(
      { error: nameVal.errorMessage || 'Nama pemesan tidak valid' },
      { status: 400 }
    );
  }

  const phoneVal = validateCustomerPhone(customerWa);
  if (!phoneVal.isValid) {
    return NextResponse.json(
      { error: phoneVal.errorMessage || 'Nomor WhatsApp tidak valid' },
      { status: 400 }
    );
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Keranjang belanja tidak boleh kosong' },
      { status: 400 }
    );
  }

  if (items.length > 50) {
    return NextResponse.json(
      { error: 'Jumlah item dalam pesanan melebihi batas maksimal (50 item)' },
      { status: 400 }
    );
  }

  // 4. Periksa jam operasional Jasdor (jika feature flag aktif)
  if (OPERATIONAL_GATE_ENABLED) {
    const jasdorStatus = getJasdorOperationalStatus();
    if (!jasdorStatus.isOpen) {
      return NextResponse.json(
        {
          error:
            'Layanan Jasdor saat ini sedang di luar jam operasional. Silakan pesan kembali saat jam operasional buka.',
          isJasdorClosed: true,
        },
        { status: 400 }
      );
    }
  }

  // 5. Penanganan khusus brand Fore Coffee
  if (outletCode.toLowerCase().startsWith('fore-') || brandSlug === 'fore') {
    try {
      const { getOutletByCode } = await import('@/lib/outlet-service');
      const { getForeMenuForOutlet } = await import('@/lib/fore-menu-data');
      const storeObj = await getOutletByCode(outletCode);

      if (!storeObj) {
        return NextResponse.json(
          { error: 'Outlet Fore tidak ditemukan atau di luar jangkauan layanan' },
          { status: 404 }
        );
      }

      if (isOutletClosed(storeObj)) {
        const reason = storeObj.orderReason || 'Outlet sedang tutup';
        return NextResponse.json(
          {
            error: `Outlet ${storeObj.name || outletCode} sedang tutup (${reason}). Pemesanan tidak dapat diproses.`,
            isOutletClosed: true,
            reason,
          },
          { status: 400 }
        );
      }

      // Validasi menu Fore
      const menuGroups = getForeMenuForOutlet(outletCode);
      const allProducts = menuGroups.flatMap((g) => g.products || []);
      const unavailableItems: Array<{ name: string; reason: string }> = [];

      for (const item of items) {
        const prod = allProducts.find((p) => p.bundleCode === item.bundleCode);
        if (!prod) {
          unavailableItems.push({
            name: item.name || 'Produk',
            reason: 'Menu sudah tidak tersedia di outlet ini',
          });
        }
      }

      if (unavailableItems.length > 0) {
        return NextResponse.json(
          {
            error: 'Beberapa menu dalam keranjang tidak tersedia di outlet ini',
            unavailableItems,
          },
          { status: 400 }
        );
      }

      const orderRecord = createOrderRecord({
        brandSlug: 'fore',
        outletCode,
        outletName: outletName || storeObj.name || outletCode,
        customerName: nameVal.sanitized,
        customerWa: phoneVal.sanitized,
        items,
        pickupTime,
        notes,
      });

      const savedOrder = await saveOrderToDb(orderRecord);

      return NextResponse.json({
        success: true,
        orderId: savedOrder.id,
        redirectUrl: `/bayar/${savedOrder.id}`,
        order: savedOrder,
      });
    } catch (err: any) {
      console.error('[CreateOrder Fore] Kesalahan saat memproses pesanan:', err);
      return NextResponse.json(
        {
          error: err.message || 'Terjadi kesalahan sistem saat membuat pesanan Fore.',
        },
        { status: 500 }
      );
    }
  }

  // 6. Validasi ruang lingkup dan status buka/tutup outlet Kopi Kenangan (Single Source of Truth)
  try {
    const rawStore = await kkApiClient.getStore(outletCode);
    const inScope = await verifyStoreScope(outletCode, rawStore);

    if (!rawStore || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan layanan' },
        { status: 404 }
      );
    }

    try {
      const qRes = await kkApiClient.queryStore({ keyword: outletCode, pageSize: 5 });
      const matched = (qRes.store || []).find(
        (s) => s.code?.toUpperCase() === outletCode.toUpperCase()
      );
      if (matched) {
        if (matched.order_msg) rawStore.order_msg = matched.order_msg;
        if (matched.status) rawStore.status = matched.status;
        if (matched.order_type) rawStore.order_type = matched.order_type;
        if (matched.real_close_time) rawStore.real_close_time = matched.real_close_time;
      }
    } catch {}

    const storeObj = normalizeStore(rawStore);

    if (isOutletClosed(storeObj)) {
      const reason = storeObj.orderReason || 'Outlet sedang tutup';
      return NextResponse.json(
        {
          error: `Outlet ${storeObj.name || outletCode} sedang tutup (${reason}). Pemesanan tidak dapat diproses.`,
          isOutletClosed: true,
          reason,
        },
        { status: 400 }
      );
    }

    // 6. Validasi ketersediaan menu fresh dari outlet
    const rawMenu = await kkApiClient.queryProductMenu(outletCode);
    const menuGroups = normalizeMenu(rawMenu);
    const allProducts = menuGroups.flatMap((g) => g.products || []);
    const unavailableItems: Array<{ name: string; reason: string }> = [];

    for (const item of items) {
      const freshProd = allProducts.find((p) => p.bundleCode === item.bundleCode);
      if (!freshProd) {
        unavailableItems.push({
          name: item.name || 'Produk',
          reason: 'Menu sudah tidak tersedia di outlet ini',
        });
      } else if (freshProd.isSoldOut) {
        unavailableItems.push({
          name: freshProd.name || item.name,
          reason: 'Stok sedang habis di outlet ini',
        });
      }
    }

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Beberapa menu dalam keranjang tidak tersedia atau habis di outlet ini',
          unavailableItems,
        },
        { status: 400 }
      );
    }

    // 7. Kalkulasi harga murni server dan simpan ke Supabase
    const orderRecord = createOrderRecord({
      brandSlug,
      outletCode,
      outletName: outletName || storeObj.name || outletCode,
      customerName: nameVal.sanitized,
      customerWa: phoneVal.sanitized,
      items,
      pickupTime,
      notes,
    });

    const savedOrder = await saveOrderToDb(orderRecord);

    return NextResponse.json({
      success: true,
      orderId: savedOrder.id,
      redirectUrl: `/bayar/${savedOrder.id}`,
      order: savedOrder,
    });
  } catch (err: any) {
    console.error('[CreateOrder] Kesalahan saat memproses pesanan:', err);
    return NextResponse.json(
      {
        error: err.message || 'Terjadi kesalahan sistem saat membuat pesanan.',
      },
      { status: 500 }
    );
  }
}
