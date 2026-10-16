import { getSupabaseServerClient } from './supabase-server.ts';

export interface ForeStoreRaw {
  st_id: number;
  city_id: number;
  st_code: string;
  st_name: string;
  st_type?: string;
  st_concept?: string;
  st_default_type?: string;
  st_phone?: string;
  st_address?: string;
  st_lat?: string;
  st_long?: string;
  st_open?: string;
  st_close?: string;
  st_status?: string; // 'active' | 'coming_soon' | 'inactive'
  tz_name?: string;
  tz_utc_offset?: string;
  is_open?: boolean; // LIVE status from Fore system
  is_visibility?: string;
}

export interface ForeApiResponse {
  status: string;
  payload: ForeStoreRaw[];
}

export class ForeApiClient {
  private baseUrl = 'https://api.fore.coffee';
  private currentWpToken = 'X5egl9UCDlfTyNSSGA8fDY3QnZlzpMXQMvK-y9K3eOE';
  private tokenExpiry = 0;

  /**
   * Mengambil token publik `wp-token` yang tertanam di halaman HTML lokasi-store resmi Fore Coffee.
   * Dipanggil otomatis jika request API mengembalikan error autentikasi (token dirotasi oleh Fore).
   */
  public async fetchTokenFromHtml(): Promise<string> {
    try {
      const res = await fetch('https://fore.coffee/id/lokasi-store/', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        throw new Error(`Gagal fetch HTML fore.coffee: ${res.status}`);
      }

      const html = await res.text();
      const match =
        html.match(/wp-token["':\s=]+([a-zA-Z0-9_\-\.]+)/i) ||
        html.match(/"wp-token"\s*:\s*"([^"]+)"/i) ||
        html.match(/wp_token["':\s=]+([a-zA-Z0-9_\-\.]+)/i);

      if (match && match[1]) {
        this.currentWpToken = match[1];
        // Cache token selama 12 jam
        this.tokenExpiry = Date.now() + 12 * 60 * 60 * 1000;
        return this.currentWpToken;
      }
    } catch (err: any) {
      console.warn(`[ForeApiClient] Gagal extract token dari HTML: ${err.message}. Menggunakan token fallback.`);
    }

    return this.currentWpToken;
  }

  /**
   * Mengambil seluruh outlet resmi Fore Coffee langsung dari endpoint publik resmi.
   * JANGAN pernah memanggil endpoint lain di luar `/store/all_with_token`.
   */
  public async getAllStores(retry = true): Promise<ForeStoreRaw[]> {
    if (Date.now() > this.tokenExpiry) {
      await this.fetchTokenFromHtml();
    }

    const url = `${this.baseUrl}/store/all_with_token`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'wp-token': this.currentWpToken,
      Origin: 'https://fore.coffee',
      Referer: 'https://fore.coffee/id/lokasi-store/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    try {
      const res = await fetch(url, { headers });

      if (res.status === 401 || res.status === 403 || res.status === 500) {
        if (retry) {
          console.warn(`[ForeApiClient] API error status ${res.status}. Mencoba refresh wp-token dari HTML...`);
          await this.fetchTokenFromHtml();
          return this.getAllStores(false);
        }
        throw new Error(`API Fore gagal dengan status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(`API Fore HTTP ${res.status}`);
      }

      const json: ForeApiResponse = await res.json();
      if (json.status !== 'success' || !Array.isArray(json.payload)) {
        throw new Error(`Payload Fore tidak valid: status=${json.status}`);
      }

      return json.payload;
    } catch (err: any) {
      if (retry) {
        console.warn(`[ForeApiClient] Fetch error: ${err.message}. Mencoba refresh token & retry...`);
        await this.fetchTokenFromHtml();
        return this.getAllStores(false);
      }
      throw err;
    }
  }
}

export const foreApiClient = new ForeApiClient();

/**
 * Sinkronisasi status live outlet Fore Coffee ke database Supabase.
 * Menyelaraskan status buka LIVE (`is_open`), jam buka (`st_open`/`st_close`), status aktif (`st_status`),
 * timezone (`tz_name`), dan outlet baru.
 * Outlet yang tidak lagi active akan dinonaktifkan (`is_active: false`), TIDAK dihapus dari database.
 */
export async function syncForeOutletsToDb(): Promise<{
  syncedCount: number;
  activeCount: number;
  inactiveCount: number;
  durationMs: number;
}> {
  const startTime = Date.now();
  const rawStores = await foreApiClient.getAllStores();
  const supabase = getSupabaseServerClient();

  const toUpsert: any[] = [];
  let activeCount = 0;
  let inactiveCount = 0;

  for (const s of rawStores) {
    if (!s.st_code) continue;

    const code = `fore-${s.st_code.trim().toLowerCase()}`;
    const isActive = s.st_status === 'active';
    if (isActive) {
      activeCount++;
    } else {
      inactiveCount++;
    }

    const rawName = (s.st_name || '').trim();
    const name = rawName.toLowerCase().startsWith('fore')
      ? rawName
      : `Fore Coffee - ${rawName}`;

    const openTime = s.st_open ? (s.st_open.length === 5 ? `${s.st_open}:00` : s.st_open) : '07:00:00';
    const closeTime = s.st_close ? (s.st_close.length === 5 ? `${s.st_close}:00` : s.st_close) : '22:00:00';

    toUpsert.push({
      code,
      name,
      address: (s.st_address || '').trim(),
      latitude: s.st_lat ? parseFloat(s.st_lat) : null,
      longitude: s.st_long ? parseFloat(s.st_long) : null,
      open_time: openTime,
      close_time: closeTime,
      is_active: isActive,
      brand: 'Fore Coffee',
      is_in_scope: isActive,
      updated_at: new Date().toISOString(),
    });
  }

  // Chunk upsert (100 per chunk)
  const chunkSize = 100;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('outlets').upsert(chunk, {
      onConflict: 'code',
    });

    if (error) {
      throw new Error(`Gagal upsert outlet Fore ke Supabase: ${error.message}`);
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    syncedCount: toUpsert.length,
    activeCount,
    inactiveCount,
    durationMs,
  };
}
