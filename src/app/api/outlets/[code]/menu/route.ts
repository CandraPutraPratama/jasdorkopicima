import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope } from '@/lib/outlet-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit.ts';
import type { MenuGroup } from '@/types/domain';
import { applyCachePolicy, CACHE_POLICY } from '../../../../../lib/cache-headers.ts';

async function handleGet(
  request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`menu:${clientIp}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan menu. Silakan tunggu beberapa saat.' },
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

  const { code } = await segmentData.params;
  if (!code) {
    return NextResponse.json({ error: 'Parameter code wajib disertakan' }, { status: 400 });
  }

  const cacheKey = cacheKeys.menu(code);

  // Penanganan khusus brand Fore Coffee (flat menu, seeded di generic_cache dengan fallback statis)
  if (code.toLowerCase().startsWith('fore-')) {
    const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
    if (cached && cached.menuGroups && cached.menuGroups.length > 0) {
      return NextResponse.json(cached);
    }

    const { getForeMenuForOutlet } = await import('@/lib/fore-menu-data');
    const menuGroups = getForeMenuForOutlet(code);
    const responsePayload = { menuGroups };
    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.menuTtlSeconds);
    return NextResponse.json(responsePayload);
  }

  // Validasi apakah outlet berada dalam lingkup Kopi Kenangan resmi
  try {
    const rawStore = await kkApiClient.getStore(code);
    const inScope = await verifyStoreScope(code, rawStore);
    if (!rawStore || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
  } catch (storeErr: any) {
    if (
      storeErr.message?.includes('404') ||
      storeErr.message?.includes('tidak ditemukan') ||
      storeErr.message?.includes('not exist')
    ) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
  }

  // 1. Cek cache segar untuk Kopi Kenangan
  const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 2. Ambil dari KK API dengan proteksi stale-if-error
  try {
    const rawMenu = await kkApiClient.queryProductMenu(code);
    const menuGroups = normalizeMenu(rawMenu);
    const responsePayload = { menuGroups };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.menuTtlSeconds);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error(`[Menu API] KK gagal mengambil menu [${code}]: ${error.message}`);

    // Stale-if-error: kembalikan cache terakhir walau sudah kedaluwarsa
    const staleData = await cacheService.getStale<{ menuGroups: MenuGroup[] }>(cacheKey);
    if (staleData) {
      console.warn(`[Menu API] Menggunakan STALE data untuk outlet [${code}] karena KK error.`);
      return NextResponse.json(
        { ...staleData, isStale: true },
        { headers: { 'X-Cache-Status': 'STALE-IF-ERROR' } }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Gagal memuat menu outlet' },
      { status: 500 }
    );
  }
}

export async function GET(...args: Parameters<typeof handleGet>) {
  const response = await handleGet(...args);
  return applyCachePolicy(response, CACHE_POLICY.menu);
}
