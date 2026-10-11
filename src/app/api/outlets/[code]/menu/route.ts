import { NextRequest, NextResponse } from 'next/server';
import { kkApiClient } from '@/lib/kk-client';
import { normalizeMenu } from '@/lib/adapter';
import { cacheService, cacheKeys } from '@/lib/cache';
import { BUSINESS_CONFIG } from '@/config/business';
import type { MenuGroup } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await segmentData.params;
    if (!code) {
      return NextResponse.json({ error: 'Parameter code wajib disertakan' }, { status: 400 });
    }

    const cacheKey = cacheKeys.menu(code);
    const cached = await cacheService.get<{ menuGroups: MenuGroup[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rawMenu = await kkApiClient.queryProductMenu(code);
    const menuGroups = normalizeMenu(rawMenu);
    const responsePayload = { menuGroups };

    await cacheService.set(cacheKey, responsePayload, BUSINESS_CONFIG.cache.menuTtlSeconds);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat menu outlet' },
      { status: 500 }
    );
  }
}
