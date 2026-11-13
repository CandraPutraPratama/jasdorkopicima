import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import { checkStoreScope, getOutletByCode, type StoreScopeStatus } from '@/lib/outlet-service';
import {
  loadLiveMenuOrStale,
  readFreshRealMenu,
  readStaleRealMenu,
  type MenuSource,
} from '@/lib/menu-source';
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

  // Cache segar dicek PERTAMA (hanya menu asli; baris menu kanonikal lama diabaikan).
  // Menu hanya pernah ditulis ke cache setelah outlet lolos verifikasi, jadi hit
  // cache tidak perlu memanggil KK API + Supabase lagi.
  const freshMenu = await readFreshRealMenu(cacheService, cacheKey);
  if (freshMenu) {
    return menuJson(freshMenu, 'live');
  }

  // Validasi apakah outlet berada dalam lingkup Kopi Kenangan resmi
  let rawStore: any = null;
  try {
    rawStore = await kkApiClient.getStore(code);
  } catch (storeErr: any) {
    console.warn(`[Menu API] kkApiClient.getStore error for [${code}]:`, storeErr.message);
  }

  let scopeStatus: StoreScopeStatus = 'out-of-scope';
  if (rawStore) {
    scopeStatus = await checkStoreScope(code, rawStore);
  } else {
    const dbOutlet = await getOutletByCode(code);
    if (dbOutlet) {
      scopeStatus = await checkStoreScope(code, dbOutlet);
    }
  }

  if (scopeStatus === 'unavailable') {
    // Kegagalan sementara (Supabase/KK tidak terjangkau), BUKAN outlet tidak ada.
    const staleMenu = await readStaleRealMenu(cacheService, cacheKey);
    if (staleMenu) {
      return menuJson(staleMenu, 'stale');
    }
    return NextResponse.json(
      { error: 'Layanan sedang sibuk. Silakan coba lagi sebentar lagi.' },
      { status: 503, headers: { 'Retry-After': '5' } }
    );
  }

  if (scopeStatus !== 'in-scope') {
    return NextResponse.json(
      { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
      { status: 404 }
    );
  }

  // Urutan: live KK -> stale cache ASLI outlet -> error ramah.
  // Menu kanonikal/baseline sengaja TIDAK dipakai (harga tier outlet bisa salah).
  const resolved = await loadLiveMenuOrStale({
    cache: cacheService,
    cacheKey,
    ttlSeconds: BUSINESS_CONFIG.cache.menuTtlSeconds,
    fetchLive: async () => normalizeMenu(await kkApiClient.queryProductMenu(code)),
    onLiveError: (error: any) =>
      console.error(`[Menu API] KK gagal mengambil menu [${code}]: ${error?.message}`),
  });

  if (!resolved) {
    return NextResponse.json(
      { error: 'Menu gagal dimuat, coba lagi sebentar.' },
      { status: 500, headers: { 'Retry-After': '5' } }
    );
  }

  if (resolved.source === 'stale') {
    console.warn(`[Menu API] Menggunakan STALE data asli untuk outlet [${code}] karena KK error.`);
  }
  return menuJson(resolved.menuGroups, resolved.source);
}

/** Respons menu yang selalu jujur soal sumbernya (body + header X-Menu-Source). */
function menuJson(menuGroups: MenuGroup[], source: MenuSource) {
  const response = NextResponse.json({
    menuGroups,
    source,
    ...(source === 'stale' ? { isStale: true } : {}),
  });
  response.headers.set('X-Menu-Source', source);
  return response;
}

export async function GET(...args: Parameters<typeof handleGet>) {
  const response = await handleGet(...args);
  // Data stale tidak boleh ikut di-cache edge 15 menit.
  const policy =
    response.headers.get('X-Menu-Source') === 'stale' ? CACHE_POLICY.noStore : CACHE_POLICY.menu;
  return applyCachePolicy(response, policy);
}
