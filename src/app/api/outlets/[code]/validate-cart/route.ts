import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu, normalizeStore } from '@/lib/adapter';
import { isOutletClosed } from '@/lib/orderability';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope } from '@/lib/outlet-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface ValidateCartItemInput {
  bundleCode: string;
  sku?: string;
  name: string;
  quantity?: number;
}

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  const clientIp = getClientIp(request.headers);

  // 1. Pembatasan laju (Rate limit: maksimal 20 request per menit per IP)
  const rateLimit = checkRateLimit(`validate-cart:${clientIp}`, {
    maxRequests: 20,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak permintaan validasi stok. Silakan tunggu beberapa saat.',
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

  const { code } = await segmentData.params;
  if (!code) {
    return NextResponse.json({ error: 'Parameter code outlet wajib disertakan' }, { status: 400 });
  }

  // 2. Batasi ukuran body request (maksimal 10KB untuk mencegah eksploitasi payload)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    return NextResponse.json(
      { error: 'Ukuran payload melebihi batas maksimal (10KB)' },
      { status: 413 }
    );
  }

  // 3. Parse dan validasi body request
  let body: { items?: ValidateCartItemInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format body request tidak valid (wajib JSON)' }, { status: 400 });
  }

  const items = body?.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Daftar item keranjang wajib disertakan dan tidak boleh kosong' },
      { status: 400 }
    );
  }

  if (items.length > 50) {
    return NextResponse.json(
      { error: 'Jumlah item dalam satu pesanan maksimal 50 item' },
      { status: 400 }
    );
  }

  // 4. Penanganan khusus brand Fore Coffee
  if (code.toLowerCase().startsWith('fore-')) {
    const { getOutletByCode } = await import('@/lib/outlet-service');
    const { getForeMenuForOutlet } = await import('@/lib/fore-menu-data');
    const outlet = await getOutletByCode(code);
    if (!outlet) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }

    if (isOutletClosed(outlet)) {
      const reasonText = outlet.orderReason || 'Outlet sedang tutup';
      return NextResponse.json({
        valid: false,
        uncertain: false,
        isOutletClosed: true,
        outletReason: reasonText,
        openTime: outlet.openTime || '',
        closeTime: outlet.closeTime || '',
        message: `Outlet ${outlet.name || code} sedang tutup (${reasonText}). Pemesanan tidak dapat diproses, silakan pilih outlet lain.`,
        unavailableItems: [
          {
            name: outlet.name || 'Outlet',
            reason: `Outlet sedang tutup (${reasonText})`,
          },
        ],
      });
    }

    const menuGroups = getForeMenuForOutlet(code);
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
      return NextResponse.json({
        valid: false,
        uncertain: false,
        unavailableItems,
      });
    }

    return NextResponse.json({
      valid: true,
      uncertain: false,
      unavailableItems: [],
    });
  }

  // 5. Validasi ruang lingkup brand dan status operasional outlet Kopi Kenangan (buka/tutup)
  let storeObj;
  try {
    const rawStore = await kkApiClient.getStore(code);
    const inScope = await verifyStoreScope(code, rawStore);
    if (!rawStore || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
    try {
      const qRes = await kkApiClient.queryStore({ keyword: code, pageSize: 5 });
      const matched = (qRes.store || []).find((s) => s.code?.toUpperCase() === code.toUpperCase());
      if (matched) {
        if (matched.order_msg) rawStore.order_msg = matched.order_msg;
        if (matched.status) rawStore.status = matched.status;
        if (matched.order_type) rawStore.order_type = matched.order_type;
        if (matched.real_close_time) rawStore.real_close_time = matched.real_close_time;
      }
    } catch {}
    storeObj = normalizeStore(rawStore);
  } catch (storeErr: any) {
    if (
      storeErr.message?.includes('404') ||
      storeErr.message?.includes('tidak ditemukan') ||
      storeErr.message?.includes('not exist')
    ) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
    console.warn(`[ValidateCart] Gagal memeriksa status outlet [${code}]:`, storeErr.message);
  }

  // Jika status outlet TUTUP atau tidak bisa dipesan, blokir validasi keranjang
  if (storeObj && isOutletClosed(storeObj)) {
    const reasonText = storeObj.orderReason || 'Outlet sedang tutup';
    return NextResponse.json({
      valid: false,
      uncertain: false,
      isOutletClosed: true,
      outletReason: reasonText,
      openTime: storeObj.openTime || '',
      closeTime: storeObj.closeTime || '',
      message: `Outlet ${storeObj.name || code} sedang tutup (${reasonText}). Pemesanan tidak dapat diproses, silakan pilih outlet lain.`,
      unavailableItems: [
        {
          name: storeObj.name || 'Outlet',
          reason: `Outlet sedang tutup (${reasonText})`,
        },
      ],
    });
  }

  // 5. Pengecekan stok FRESH langsung dari KK API (bypass cache)
  try {
    const rawMenu = await kkApiClient.queryProductMenu(code);
    const menuGroups = normalizeMenu(rawMenu);

    // Sekaligus menyegarkan cache menu yang ada di sistem
    const cacheKey = cacheKeys.menu(code);
    await cacheService.set(cacheKey, { menuGroups }, BUSINESS_CONFIG.cache.menuTtlSeconds);

    const allProducts = menuGroups.flatMap((g) => g.products || []);
    const unavailableItems: Array<{ name: string; reason: string }> = [];

    const { normalizeProductName } = await import('@/lib/bundling');

    for (const item of items) {
      if ((item as any).isBundle && Array.isArray((item as any).bundleDetails)) {
        for (const detail of (item as any).bundleDetails) {
          const normDetail = normalizeProductName(detail.name);
          const freshProd = allProducts.find(
            (p) => normalizeProductName(p.name) === normDetail
          );
          if (!freshProd) {
            unavailableItems.push({
              name: `${detail.name} (isi ${item.name})`,
              reason: 'Menu tidak tersedia di outlet ini',
            });
          } else if (freshProd.isSoldOut) {
            unavailableItems.push({
              name: `${freshProd.name} (isi ${item.name})`,
              reason: 'Stok sedang habis di outlet ini',
            });
          }
        }
        continue;
      }

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
      return NextResponse.json({
        valid: false,
        uncertain: false,
        unavailableItems,
      });
    }

    return NextResponse.json({
      valid: true,
      uncertain: false,
      unavailableItems: [],
    });
  } catch (error: any) {
    console.warn(`[ValidateCart] Gagal menghubungi KK API untuk [${code}]: ${error.message}. Mengaktifkan mode uncertain.`);

    // Jika KK gagal dihubungi (timeout, blokir, dll), jangan memblokir total
    // Kembalikan flag uncertain agar customer diberi pilihan konfirmasi via WhatsApp
    return NextResponse.json({
      valid: true,
      uncertain: true,
      message: 'Koneksi ke outlet sedang lambat atau tidak dapat dipastikan. Kamu tetap dapat melanjutkan pesanan dengan konfirmasi langsung lewat WhatsApp.',
      unavailableItems: [],
    });
  }
}
