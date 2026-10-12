import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeProductOptions } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG, isStoreInScope } from '@/config/business';
import type { ProductOptionDetails } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ code: string; bundleCode: string }> }
) {
  const { code, bundleCode } = await segmentData.params;
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

  // 2. Ambil dari KK API dengan proteksi stale-if-error
  try {
    const store = await kkApiClient.getStore(code);
    if (!store || !isStoreInScope(store)) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
    const rawOptions = await kkApiClient.getProductOptions(store.id, code, bundleCode);
    const options = normalizeProductOptions(rawOptions);
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
