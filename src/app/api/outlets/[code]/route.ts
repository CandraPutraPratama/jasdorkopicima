import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeStore } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope } from '@/lib/outlet-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { Outlet } from '@/types/domain';

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`outlet:${clientIp}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan detail outlet. Silakan tunggu beberapa saat.' },
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
    const inScope = await verifyStoreScope(code, rawStore);
    if (!rawStore || !inScope) {
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
    return NextResponse.json(
      { error: error.message || 'Gagal memuat detail outlet' },
      { status: 500 }
    );
  }
}
