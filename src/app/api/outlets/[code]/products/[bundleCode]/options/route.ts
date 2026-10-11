import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeProductOptions } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import type { ProductOptionDetails } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ code: string; bundleCode: string }> }
) {
  try {
    const { code, bundleCode } = await segmentData.params;
    if (!code || !bundleCode) {
      return NextResponse.json(
        { error: 'Parameter code dan bundleCode wajib disertakan' },
        { status: 400 }
      );
    }

    const cacheKey = cacheKeys.productOptions(code, bundleCode);
    const cached = await cacheService.get<{ options: ProductOptionDetails }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Ambil detail store untuk mendapatkan id (outlet_id) yang dibutuhkan KK
    const store = await kkApiClient.getStore(code);
    const rawOptions = await kkApiClient.getProductOptions(store.id, code, bundleCode);
    const options = normalizeProductOptions(rawOptions);
    const responsePayload = { options };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.optionsTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat opsi varian produk' },
      { status: 500 }
    );
  }
}
