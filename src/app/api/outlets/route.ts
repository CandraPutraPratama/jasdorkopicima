import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeStores } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import type { Outlet } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    const cacheKey = cacheKeys.storeList(keyword, page, pageSize);
    const cached = await cacheService.get<{ total: number; page: number; pageSize: number; items: Outlet[] }>(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    const rawData = await kkApiClient.queryStore({
      pageNum: page,
      pageSize,
      keyword,
    });

    const responsePayload = {
      total: rawData.total || 0,
      page,
      pageSize,
      items: normalizeStores(rawData.store || []),
    };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storesTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat daftar outlet' },
      { status: 500 }
    );
  }
}
