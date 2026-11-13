import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeProductOptions } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { checkStoreScope, getOutletByCode, type StoreScopeStatus } from '@/lib/outlet-service';
import { findCrossOutletCachedOptions } from '@/lib/kk-menu-fallback';
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
    return NextResponse.json({ options });
  }

  // Penanganan khusus brand TOMORO Coffee
  if (code.toLowerCase().startsWith('tomoro-')) {
    const { getTomoroProductOptions } = await import('@/lib/tomoro-menu-data');
    const options = getTomoroProductOptions(bundleCode, code);
    if (!options) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan di outlet ini' },
        { status: 404 }
      );
    }
    return NextResponse.json({ options });
  }

  const cacheKey = cacheKeys.productOptions(code, bundleCode);

  // 1. Cek cache segar untuk Kopi Kenangan
  const cached = await cacheService.get<{ options: ProductOptionDetails }>(cacheKey);
  if (cached && cached.options) {
    return NextResponse.json(cached);
  }

  // 2. Validasi apakah outlet berada dalam lingkup resmi Kopi Kenangan
  let store: any = null;
  try {
    store = await kkApiClient.getStore(code);
  } catch (storeErr: any) {
    console.warn(`[Options API] kkApiClient.getStore error for [${code}]:`, storeErr.message);
  }

  let scopeStatus: StoreScopeStatus = 'out-of-scope';
  if (store) {
    scopeStatus = await checkStoreScope(code, store);
  } else {
    const dbOutlet = await getOutletByCode(code);
    if (dbOutlet) {
      scopeStatus = await checkStoreScope(code, dbOutlet);
      store = dbOutlet;
    }
  }

  if (scopeStatus === 'unavailable') {
    return NextResponse.json(
      { error: 'Layanan sedang sibuk. Silakan coba lagi sebentar lagi.' },
      { status: 503, headers: { 'Retry-After': '5' } }
    );
  }

  const inScope = scopeStatus === 'in-scope';
  if (!store || !inScope) {
    return NextResponse.json(
      { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
      { status: 404 }
    );
  }

  // 3. Ambil dari KK API dengan proteksi stale-if-error dan fallback cross-outlet
  try {
    const rawOptions = await kkApiClient.getProductOptions(store.id || 0, code, bundleCode);
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

    // Stale-if-error: kembalikan cache terakhir walau sudah kedaluwarsa
    const staleData = await cacheService.getStale<{ options: ProductOptionDetails }>(cacheKey);
    if (staleData && staleData.options) {
      console.warn(`[Options API] Menggunakan STALE data untuk opsi [${code}/${bundleCode}] karena KK error.`);
      return NextResponse.json(
        { ...staleData, isStale: true },
        { headers: { 'X-Cache-Status': 'STALE-IF-ERROR' } }
      );
    }

    // Cross-outlet fallback: cari opsi autentik dari snapshot generic_cache atau fallback sintetis
    const fallbackOptions = await findCrossOutletCachedOptions(bundleCode);
    if (fallbackOptions) {
      console.info(`[Options API] Menggunakan fallback opsi untuk [${bundleCode}].`);
      checkAndLogMarginSafety({
        productName: fallbackOptions.product.name,
        outletCode: code,
        basePrice: fallbackOptions.product.basePrice,
        skus: fallbackOptions.skus,
      });

      const responsePayload = { options: fallbackOptions };
      await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.optionsTtlSeconds);
      return NextResponse.json(responsePayload);
    }

    return NextResponse.json(
      { error: 'Varian produk tidak ditemukan atau tidak tersedia' },
      { status: 404 }
    );
  }
}

export async function GET(...args: Parameters<typeof handleGet>) {
  const response = await handleGet(...args);
  return applyCachePolicy(response, CACHE_POLICY.options);
}
