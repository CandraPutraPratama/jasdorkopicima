import { getSupabaseServerClient, isCustomSupabaseClientInstance } from './supabase-server.ts';
import { isMinOrder50kMode } from './feature-flags.ts';

export type OperationalOverride = 'auto' | 'force_open' | 'force_closed' | 'temporary_break';

export interface SiteSettingsResponse {
  min_order_50k_mode: boolean;
  bundling_only_mode: boolean;
  operational_override: OperationalOverride;
  brand_status?: Record<string, boolean>;
}

export class SiteSettingsError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SiteSettingsError';
    this.cause = cause;
  }
}

interface CachedSetting {
  value: string | null;
  expiresAt: number;
}

const siteSettingsMemoryCache = new Map<string, CachedSetting>();
const SITE_SETTINGS_MEMORY_TTL_MS = 60_000; // 60 detik cache di memori isolate Worker

/**
 * Mengambil nilai pengaturan situs berdasarkan key dari database Supabase.
 * Mengembalikan null jika key tidak ditemukan atau jika tabel belum tersedia.
 * Dilengkapi memory cache agar Cloudflare Worker tidak kehabisan CPU (Error 1102).
 */
export async function getSiteSetting(key: string): Promise<string | null> {
  const isMock = isCustomSupabaseClientInstance();
  if (!isMock) {
    const cached = siteSettingsMemoryCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // Jika tabel belum dibuat (misal migrasi belum dijalankan), log peringatan dan kembalikan null
      console.warn(`[SiteSettings] Gagal membaca key "${key}":`, error.message);
      if (!isMock) {
        const cached = siteSettingsMemoryCache.get(key);
        if (cached) return cached.value;
      }
      return null;
    }

    const val = data?.value ?? null;
    if (!isMock) {
      siteSettingsMemoryCache.set(key, { value: val, expiresAt: Date.now() + SITE_SETTINGS_MEMORY_TTL_MS });
    }
    return val;
  } catch (err: unknown) {
    console.warn(`[SiteSettings] Exception saat membaca key "${key}":`, err instanceof Error ? err.message : String(err));
    if (!isMock) {
      const cached = siteSettingsMemoryCache.get(key);
      if (cached) return cached.value;
    }
    return null;
  }
}

/**
 * Menyimpan atau memperbarui nilai pengaturan situs (upsert) ke database Supabase.
 */
export async function setSiteSetting(key: string, value: string): Promise<void> {
  siteSettingsMemoryCache.set(key, { value, expiresAt: Date.now() + SITE_SETTINGS_MEMORY_TTL_MS });
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key,
        value,
        updated_at: now,
      },
      { onConflict: 'key' }
    );

  if (error) {
    throw new SiteSettingsError(`Gagal menyimpan pengaturan "${key}": ${error.message}`, error);
  }
}

/**
 * Memeriksa apakah Mode Minimal Pembelian 50k aktif.
 * Mengutamakan key 'min_order_50k_mode', fallback ke 'bundling_only_mode', lalu ke env var.
 */
export async function getMinOrder50kMode(): Promise<boolean> {
  const dbValNew = await getSiteSetting('min_order_50k_mode');
  if (dbValNew !== null) {
    return dbValNew.trim().toLowerCase() === 'true';
  }
  const dbValOld = await getSiteSetting('bundling_only_mode');
  if (dbValOld !== null) {
    return dbValOld.trim().toLowerCase() === 'true';
  }
  return isMinOrder50kMode();
}

/**
 * Mengubah status Mode Minimal Pembelian 50k di database.
 * Menyimpan ke kedua key ('min_order_50k_mode' & 'bundling_only_mode') agar backwards-compatible.
 */
export async function setMinOrder50kMode(enabled: boolean): Promise<boolean> {
  const strVal = enabled ? 'true' : 'false';
  await setSiteSetting('min_order_50k_mode', strVal);
  try {
    await setSiteSetting('bundling_only_mode', strVal);
  } catch {}
  return enabled;
}

// Aliases backwards-compatible
export const getBundlingOnlyMode = getMinOrder50kMode;
export const setBundlingOnlyMode = setMinOrder50kMode;

const VALID_OPERATIONAL_OVERRIDES: OperationalOverride[] = [
  'auto',
  'force_open',
  'force_closed',
  'temporary_break',
];

/**
 * Mengambil status kontrol manual buka/tutup (operational override) dari tabel site_settings.
 * Default bernilai 'auto'.
 */
export async function getOperationalOverride(): Promise<OperationalOverride> {
  const dbVal = await getSiteSetting('operational_override');
  if (dbVal) {
    const normalized = dbVal.trim().toLowerCase() as OperationalOverride;
    if (VALID_OPERATIONAL_OVERRIDES.includes(normalized)) {
      return normalized;
    }
  }
  return 'auto';
}

/**
 * Menyimpan nilai kontrol manual buka/tutup (operational override) ke tabel site_settings.
 */
export async function setOperationalOverride(value: OperationalOverride): Promise<OperationalOverride> {
  const normalized = (value || '').trim().toLowerCase() as OperationalOverride;
  if (!VALID_OPERATIONAL_OVERRIDES.includes(normalized)) {
    throw new SiteSettingsError(`Nilai operational_override tidak valid: "${value}". Pilihan: auto, force_open, force_closed, temporary_break.`);
  }
  await setSiteSetting('operational_override', normalized);
  return normalized;
}

export const MANAGED_BRAND_SLUGS = ['kopi-kenangan', 'fore', 'tomoro'] as const;
export type ManagedBrandSlug = (typeof MANAGED_BRAND_SLUGS)[number];

export function isManagedBrandSlug(slug: string): slug is ManagedBrandSlug {
  return (MANAGED_BRAND_SLUGS as readonly string[]).includes(slug);
}

/**
 * Memeriksa apakah brand tertentu aktif (bisa dipesan).
 * Default bernilai true untuk semua brand jika belum disetel di database.
 */
export async function getBrandActiveStatus(slug: string): Promise<boolean> {
  const dbVal = await getSiteSetting(`brand_active_${slug}`);
  if (dbVal !== null) {
    return dbVal.trim().toLowerCase() === 'true';
  }
  return true;
}

/**
 * Mengambil peta status aktif/nonaktif untuk seluruh brand yang dikelola.
 */
export async function getAllBrandActiveStatuses(): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  await Promise.all(
    MANAGED_BRAND_SLUGS.map(async (slug) => {
      result[slug] = await getBrandActiveStatus(slug);
    })
  );
  return result;
}

/**
 * Mengubah status aktif/nonaktif suatu brand di database site_settings.
 */
export async function setBrandActiveStatus(slug: string, active: boolean): Promise<boolean> {
  if (!isManagedBrandSlug(slug)) {
    throw new SiteSettingsError(`Brand "${slug}" tidak valid. Pilihan: ${MANAGED_BRAND_SLUGS.join(', ')}`);
  }
  await setSiteSetting(`brand_active_${slug}`, active ? 'true' : 'false');
  return active;
}

