import type { MenuGroup } from '../types/domain.ts';

/**
 * Sumber menu Kopi Kenangan yang boleh disajikan ke pelanggan:
 * - 'live'  : diambil dari KK API (atau cache segar dari hasil KK API)
 * - 'stale' : cache ASLI outlet itu yang sudah kedaluwarsa (stale-if-error)
 *
 * Menu kanonikal/baseline TIDAK termasuk. Harga outlet berbeda-beda (tier mal,
 * bandara), jadi menu baseline yang disajikan sebagai menu outlet bisa membuat
 * harga terlalu murah dan merugikan.
 */
export type MenuSource = 'live' | 'stale';

export interface MenuCachePayload {
  menuGroups: MenuGroup[];
  /** Penanda baris lama yang menyimpan menu kanonikal. Tidak boleh dipakai lagi. */
  isFallback?: boolean;
}

export interface MenuCacheLike {
  get<T>(key: string): Promise<T | null>;
  getStale<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

/** True bila payload berisi menu asli outlet (bukan kanonikal, tidak kosong). */
export function isRealMenu(payload: MenuCachePayload | null | undefined): payload is MenuCachePayload {
  return Boolean(
    payload &&
      !payload.isFallback &&
      Array.isArray(payload.menuGroups) &&
      payload.menuGroups.length > 0
  );
}

export async function readFreshRealMenu(
  cache: MenuCacheLike,
  cacheKey: string
): Promise<MenuGroup[] | null> {
  const cached = await cache.get<MenuCachePayload>(cacheKey);
  return isRealMenu(cached) ? cached.menuGroups : null;
}

export async function readStaleRealMenu(
  cache: MenuCacheLike,
  cacheKey: string
): Promise<MenuGroup[] | null> {
  const stale = await cache.getStale<MenuCachePayload>(cacheKey);
  return isRealMenu(stale) ? stale.menuGroups : null;
}

export interface ResolvedMenu {
  source: MenuSource;
  menuGroups: MenuGroup[];
}

/**
 * Urutan: live KK -> stale cache asli -> null (pemanggil membalas error ramah).
 * Hanya hasil LIVE yang ditulis ke cache (dengan TTL menu penuh). Data stale
 * tidak pernah ditulis ulang, sehingga tidak bisa "menempel" sebagai menu segar.
 */
export async function loadLiveMenuOrStale(params: {
  cache: MenuCacheLike;
  cacheKey: string;
  ttlSeconds: number;
  fetchLive: () => Promise<MenuGroup[]>;
  onLiveError?: (error: unknown) => void;
}): Promise<ResolvedMenu | null> {
  const { cache, cacheKey, ttlSeconds, fetchLive, onLiveError } = params;

  try {
    const menuGroups = await fetchLive();
    if (!Array.isArray(menuGroups) || menuGroups.length === 0) {
      throw new Error('Menu live kosong');
    }
    await cache.set(cacheKey, { menuGroups }, ttlSeconds);
    return { source: 'live', menuGroups };
  } catch (error) {
    onLiveError?.(error);
    const stale = await readStaleRealMenu(cache, cacheKey);
    return stale ? { source: 'stale', menuGroups: stale } : null;
  }
}
