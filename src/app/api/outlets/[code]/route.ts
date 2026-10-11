import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeStore } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
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
    const outlet = normalizeStore(rawStore);
    const responsePayload = { outlet };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storesTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat detail outlet' },
      { status: 500 }
    );
  }
}
