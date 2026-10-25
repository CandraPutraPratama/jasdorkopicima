import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeProductOptions } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope } from '@/lib/outlet-service';
import { safeNormalizeOutletCode } from '@/lib/sanitizer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit.ts';
import { checkAndLogMarginSafety } from '@/lib/margin-guard';
import type { ProductOptionDetails } from '@/types/domain';
import { applyCachePolicy, CACHE_POLICY } from '../../../../../../../lib/cache-headers.ts';

async function handleGet(
  request: NextRequest,
  segmentData: { params: Promise<{ code: string; bundleCode: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`options:${clientIp}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan varian produk. Silakan tunggu beberapa saat.' },
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

  const { code: rawCode, bundleCode: rawBundleCode } = await segmentData.params;
  const code = safeNormalizeOutletCode(rawCode);
  const bundleCode = safeNormalizeOutletCode(rawBundleCode);
  if (!code || !bundleCode) {
    return NextResponse.json(
      { error: 'Parameter code dan bundleCode wajib disertakan' },
      { status: 400 }
    );
  }

  const cacheKey = cacheKeys.productOptions(code, bundleCode);

  // 1. Cek cache segar
  const cached = await cacheService.get<{ options: ProductOptionDetails }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Penanganan khusus brand Fore Coffee
  if (code.toLowerCase().startsWith('fore-')) {
    const { getForeProductOptions } = await import('@/lib/fore-menu-data');
    const options = getForeProductOptions(bundleCode, code);
    if (!options) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan di outlet ini' },
        { status: 404 }
      );
    }
    const responsePayload = { options };
    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.optionsTtlSeconds);
    return NextResponse.json(responsePayload);
  }

  // 2. Ambil dari KK API dengan proteksi stale-if-error
  try {
    const store = await kkApiClient.getStore(code);
    const inScope = await verifyStoreScope(code, store);
    if (!store || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
    const rawOptions = await kkApiClient.getProductOptions(store.id, code, bundleCode);
    const options = normalizeProductOptions(rawOptions);

    // Pengaman margin berjalan: pantau jika selisih KK melebihi ambang batas impas
    checkAndLogMarginSafety({
      productName: options.product.name,
      outletCode: code,
      basePrice: options.product.basePrice,
      skus: options.skus,
    });

    const responsePayload = { options };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.optionsTtlSeconds);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error(`[Options API] KK gagal mengambil opsi [${code}/${bundleCode}]: ${error.message}`);

    if (
      error.message?.includes('404') ||
      error.message?.includes('tidak ditemukan') ||
      error.message?.includes('not exist')
    ) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }

    // Stale-if-error: kembalikan cache terakhir walau sudah kedaluwarsa
    const staleData = await cacheService.getStale<{ options: ProductOptionDetails }>(cacheKey);
    if (staleData) {
      console.warn(`[Options API] Menggunakan STALE data untuk opsi [${code}/${bundleCode}] karena KK error.`);
      return NextResponse.json(
        { ...staleData, isStale: true },
        { headers: { 'X-Cache-Status': 'STALE-IF-ERROR' } }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Gagal memuat opsi varian produk' },
      { status: 500 }
    );
  }
}

export async function GET(...args: Parameters<typeof handleGet>) {
  const response = await handleGet(...args);
  return applyCachePolicy(response, CACHE_POLICY.options);
}
