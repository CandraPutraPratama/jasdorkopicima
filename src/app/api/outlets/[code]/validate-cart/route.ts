import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG, isStoreInScope } from '@/config/business';
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

  // 4. Validasi ruang lingkup brand outlet (wajib Kopi Kenangan resmi)
  try {
    const rawStore = await kkApiClient.getStore(code);
    if (!rawStore || !isStoreInScope(rawStore)) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
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
