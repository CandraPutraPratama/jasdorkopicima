import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG, isStoreInScope } from '@/config/business';
import type { MenuGroup } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  const { code } = await segmentData.params;
  if (!code) {
    return NextResponse.json({ error: 'Parameter code wajib disertakan' }, { status: 400 });
  }

  // Validasi apakah outlet berada dalam lingkup Kopi Kenangan resmi
  try {
    const rawStore = await kkApiClient.getStore(code);
    if (!rawStore || !isStoreInScope(rawStore)) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
  } catch (storeErr: any) {
    if (storeErr.message?.includes('404') || storeErr.message?.includes('tidak ditemukan')) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan' },
        { status: 404 }
      );
    }
  }

  const cacheKey = cacheKeys.menu(code);

  // 1. Cek cache segar
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
