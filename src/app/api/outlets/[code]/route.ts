import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeStore } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG, isStoreInScope } from '@/config/business';
import type { Outlet } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await segmentData.params;
    if (!code) {
      return NextResponse.json({ error: 'Parameter code wajib disertakan' }, { status: 400 });
    }

    const cacheKey = cacheKeys.storeDetail(code);
    const cached = await cacheService.get<{ outlet: Outlet }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rawStore = await kkApiClient.getStore(code);
    if (!rawStore || !isStoreInScope(rawStore)) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }

    const outlet = normalizeStore(rawStore);
    const responsePayload = { outlet };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storeOpenStatusTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('tidak ditemukan')) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Gagal memuat detail outlet' },
      { status: 500 }
    );
  }
}
