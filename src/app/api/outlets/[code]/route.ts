import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeStore } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope, getOutletByCode } from '@/lib/outlet-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit.ts';
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

    // Penanganan khusus brand Fore Coffee
    if (code.toLowerCase().startsWith('fore-')) {
      const foreOutlet = await getOutletByCode(code);
      if (!foreOutlet) {
        return NextResponse.json(
          { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
          { status: 404 }
        );
      }

      const responsePayload = { outlet: foreOutlet };
      await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.storeOpenStatusTtlSeconds);
      return NextResponse.json(responsePayload);
    }

    const rawStore = await kkApiClient.getStore(code);
    const inScope = await verifyStoreScope(code, rawStore);
    if (!rawStore || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }

    // Ambil data real-time dari queryStore (order_msg, status, order_type, real_close_time)
    try {
      const qRes = await kkApiClient.queryStore({ keyword: code, pageSize: 5 });
      const matched = (qRes.store || []).find((s) => s.code?.toUpperCase() === code.toUpperCase());
      if (matched) {
        if (matched.order_msg) rawStore.order_msg = matched.order_msg;
        if (matched.status) rawStore.status = matched.status;
        if (matched.order_type) rawStore.order_type = matched.order_type;
        if (matched.real_close_time) rawStore.real_close_time = matched.real_close_time;
      }
    } catch (e: any) {
      console.warn(`[ApiOutletDetail] Gagal mengambil queryStore enrichment untuk [${code}]:`, e.message);
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
