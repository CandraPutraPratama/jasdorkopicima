import { NextRequest, NextResponse } from 'next/server';
import { searchOutlets, getFeaturedOutlets, getTotalOutletsCount } from '@/lib/outlet-service';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit.ts';
import { cleanSearchQuery } from '@/lib/sanitizer';
import type { Outlet } from '@/types/domain';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`search:${clientIp}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak pencarian outlet. Silakan tunggu beberapa saat.' },
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

  try {
    const searchParams = request.nextUrl.searchParams;
    const brandParam = searchParams.get('brand') || undefined;

    // Jika hanya meminta total count outlet database
    if (searchParams.get('count') === 'true') {
      const totalCount = await getTotalOutletsCount(brandParam);
      return NextResponse.json({ total: totalCount });
    }

    const isFeatured = searchParams.get('featured') === 'true';
    const rawKeyword = searchParams.get('q') || searchParams.get('keyword') || '';
    const keyword = cleanSearchQuery(rawKeyword);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    // Jika parameter featured diminta atau tidak ada query pencarian sama sekali
    if (isFeatured || (!keyword && !searchParams.has('q') && !searchParams.has('keyword'))) {
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
      const cacheKey = cacheKeys.storeList('__featured__', 1, limit, brandParam);
      const cached = await cacheService.get<{
        total: number;
        page: number;
        pageSize: number;
        items: Outlet[];
      }>(cacheKey);

      if (cached) {
        return NextResponse.json(cached);
      }

      const [{ items }, totalCount] = await Promise.all([
        getFeaturedOutlets(limit, brandParam),
        getTotalOutletsCount(brandParam),
      ]);

      const responsePayload = {
        total: totalCount,
        page: 1,
        pageSize: limit,
        items,
      };

      await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storeOpenStatusTtlSeconds);
      return NextResponse.json(responsePayload);
    }

    if (!keyword) {
      return NextResponse.json({
        total: 0,
        page,
        pageSize,
        items: [],
      });
    }

    const cacheKey = cacheKeys.storeList(keyword, page, pageSize, brandParam);
    const cached = await cacheService.get<{
      total: number;
      page: number;
      pageSize: number;
      items: Outlet[];
    }>(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    const { items, total } = await searchOutlets(keyword, page, pageSize, brandParam);

    const responsePayload = {
      total,
      page,
      pageSize,
      items,
    };

    // Cache status outlet selama 90 detik agar status 'Pesan Sekarang' tetap segar
    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storeOpenStatusTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat daftar outlet' },
      { status: 500 }
    );
  }
}
