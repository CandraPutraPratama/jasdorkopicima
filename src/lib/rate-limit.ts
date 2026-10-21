/**
 * In-Worker Rate Limiting untuk proteksi API publik jasdorkopicima.
 * Bekerja pada level edge/runtime Cloudflare Workers dan Node.js lokal.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  /** Batas maksimum request dalam window */
  maxRequests: number;
  /** Durasi window dalam detik */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Mendapatkan IP klien dari header Cloudflare atau proxy standar.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0];
    if (firstIp) return firstIp.trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Memeriksa apakah request dari IP tertentu masih dalam batas rate limit.
 *
 * `now` opsional disediakan agar pemanggil (dan unit test) dapat menguji
 * pergeseran window secara deterministik tanpa bergantung jam dinding.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxRequests: 60, windowSeconds: 60 },
  now: number = Date.now()
): RateLimitResult {
  const windowMs = options.windowSeconds * 1000;

  // Bersihkan key kadaluwarsa sesekali jika ukuran Map membesar
  if (rateLimitStore.size > 2000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetAt) {
        rateLimitStore.delete(k);
      }
    }
  }

  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetAt) {
    // Window baru
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      resetInSeconds: options.windowSeconds,
    };
  }

  // Window masih berjalan
  record.count += 1;
  const remaining = Math.max(0, options.maxRequests - record.count);
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  if (record.count > options.maxRequests) {
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    success: true,
    limit: options.maxRequests,
    remaining,
    resetInSeconds,
  };
}

/**
 * Helper untuk mereset rate limit (berguna untuk testing).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
