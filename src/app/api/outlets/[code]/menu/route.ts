import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { verifyStoreScope, getOutletByCode } from '@/lib/outlet-service';
import { getKopiKenanganFallbackMenu } from '@/lib/kk-menu-fallback';
import { safeNormalizeOutletCode } from '@/lib/sanitizer';
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

  const { code: rawCode } = await segmentData.params;
  const code = safeNormalizeOutletCode(rawCode);
  if (!code) {
    return NextResponse.json({ error: 'Parameter code wajib disertakan' }, { status: 400 });
  }

  const cacheKey = cacheKeys.menu(code);

  // Penanganan khusus brand TOMORO Coffee (flat 39 menu, dengan tier harga bandara per outlet)
  if (code.toLowerCase().startsWith('tomoro-')) {
    const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
    if (cached && cached.menuGroups && cached.menuGroups.length > 0) {
      return NextResponse.json(cached);
    }

    const { getTomoroMenuForOutlet } = await import('@/lib/tomoro-menu-data');
    const menuGroups = getTomoroMenuForOutlet(code);
    const responsePayload = { menuGroups };
    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.menuTtlSeconds);
    return NextResponse.json(responsePayload);
  }

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
  let rawStore: any = null;
  try {
    rawStore = await kkApiClient.getStore(code);
  } catch (storeErr: any) {
    console.warn(`[Menu API] kkApiClient.getStore error for [${code}]:`, storeErr.message);
  }

  let isVerifiedInScope = false;
  if (rawStore) {
    isVerifiedInScope = await verifyStoreScope(code, rawStore);
  } else {
    const dbOutlet = await getOutletByCode(code);
    if (dbOutlet) {
      isVerifiedInScope = await verifyStoreScope(code, dbOutlet);
    }
  }

  if (!isVerifiedInScope) {
    return NextResponse.json(
      { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
      { status: 404 }
    );
  }

  // 1. Cek cache segar untuk Kopi Kenangan
  const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
  if (cached && cached.menuGroups && cached.menuGroups.length > 0) {
    return NextResponse.json(cached);
  }

  // 2. Ambil dari KK API dengan proteksi stale-if-error dan fallback kanonikal
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
    if (staleData && staleData.menuGroups && staleData.menuGroups.length > 0) {
      console.warn(`[Menu API] Menggunakan STALE data untuk outlet [${code}] karena KK error.`);
      return NextResponse.json(
        { ...staleData, isStale: true },
        { headers: { 'X-Cache-Status': 'STALE-IF-ERROR' } }
      );
    }

    // Fallback menu kanonikal Kopi Kenangan jika KK API token tidak dapat dijangkau
    console.info(`[Menu API] Menggunakan menu kanonikal fallback untuk [${code}].`);
    const fallbackMenu = getKopiKenanganFallbackMenu();
    const fallbackPayload = { menuGroups: fallbackMenu, isFallback: true };
    await cacheService.set(cacheKey, fallbackPayload, BUSINESS_CONFIG.cache.menuTtlSeconds);
    return NextResponse.json(fallbackPayload);
  }
}

export async function GET(...args: Parameters<typeof handleGet>) {
  const response = await handleGet(...args);
  return applyCachePolicy(response, CACHE_POLICY.menu);
}
