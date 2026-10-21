/**
 * Rate limiting terdistribusi untuk Cloudflare Workers.
 *
 * Masalah yang diperbaiki: implementasi lama (`rate-limit.ts`) memakai
 * `new Map()` in-memory. Di Workers setiap isolate punya Map sendiri dan
 * isolate bisa banyak + ephemeral, sehingga batas seperti "5 percobaan login
 * admin per menit" praktis bisa dilewati hanya dengan mengulang request.
 *
 * Solusi: simpan counter di Cloudflare KV (`RATE_LIMIT_KV`) sehingga semua
 * isolate berbagi satu counter. KV dipilih karena tidak butuh kelas Durable
 * Object terpisah dan cukup untuk proteksi kasar berbasis IP.
 *
 * Catatan jujur soal batasan KV: operasi KV bukan transaksional (read lalu
 * write bisa balapan), jadi di bawah trafik sangat bersamaan counter bisa
 * "bocor" sedikit (beberapa request ekstra lolos). Untuk proteksi brute-force
 * password admin ini tetap jauh lebih baik daripada per-isolate Map. Kalau butuh
 * akurasi ketat, ganti backend ke Durable Object dengan satu titik serialisasi.
 *
 * Jika KV tidak tersedia (dev lokal, unit test, atau KV error), modul ini
 * otomatis jatuh ke limiter in-memory lama agar aplikasi tidak gagal terbuka
 * maupun gagal total.
 */

import {
  checkRateLimit as checkRateLimitInMemory,
  type RateLimitResult,
} from './rate-limit.ts';

export { getClientIp } from './rate-limit.ts';
export type { RateLimitResult } from './rate-limit.ts';

export interface RateLimitOptions {
  /** Batas maksimum request dalam satu window. */
  maxRequests: number;
  /** Panjang window dalam detik. */
  windowSeconds: number;
}

/**
 * Subset API Cloudflare KV yang dipakai modul ini. Dibuat minimal agar mudah
 * di-fake di unit test dan tidak mengikat ke tipe Workers.
 */
export interface RateLimitKVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

interface CounterRecord {
  count: number;
  resetAt: number;
}

const KEY_PREFIX = 'rl:';
const MAX_KEY_LENGTH = 400;

let kvBindingOverride: RateLimitKVLike | null | undefined;

/**
 * Menyuntikkan binding KV untuk unit test.
 * - `undefined` = belum di-override, coba baca dari Cloudflare context.
 * - `null` = paksa mode in-memory (mensimulasikan dev lokal tanpa KV).
 */
export function setRateLimitKVBindingForTests(binding: RateLimitKVLike | null | undefined): void {
  kvBindingOverride = binding;
}

/**
 * Mengambil binding KV dari Cloudflare context bila tersedia.
 * Tidak pernah melempar error: kembalikan null jika tidak ada.
 */
async function resolveKVBinding(): Promise<RateLimitKVLike | null> {
  if (kvBindingOverride !== undefined) {
    return kvBindingOverride;
  }

  try {
    const symbolKey = Symbol.for('__cloudflare-context__');
    const globalContext = (globalThis as Record<symbol, unknown>)[symbolKey] as
      | { env?: Record<string, unknown> }
      | undefined;
    const fromGlobal = globalContext?.env?.RATE_LIMIT_KV;
    if (isKVLike(fromGlobal)) {
      return fromGlobal;
    }

    const mod = await import('@opennextjs/cloudflare');
    const context = await mod.getCloudflareContext({ async: true });
    const fromContext = (context?.env as Record<string, unknown> | undefined)?.RATE_LIMIT_KV;
    if (isKVLike(fromContext)) {
      return fromContext;
    }
  } catch {
    // Berjalan di luar Workers (Node lokal / unit test): pakai in-memory.
  }

  return null;
}

function isKVLike(value: unknown): value is RateLimitKVLike {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RateLimitKVLike>;
  return typeof candidate.get === 'function' && typeof candidate.put === 'function';
}

function normalizeKey(key: string): string {
  const safe = key.length > MAX_KEY_LENGTH ? key.slice(0, MAX_KEY_LENGTH) : key;
  return KEY_PREFIX + safe;
}

function parseCounter(raw: string | null): CounterRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CounterRecord>;
    if (typeof parsed.count !== 'number' || typeof parsed.resetAt !== 'number') {
      return null;
    }
    if (!Number.isFinite(parsed.count) || !Number.isFinite(parsed.resetAt)) {
      return null;
    }
    return { count: parsed.count, resetAt: parsed.resetAt };
  } catch {
    return null;
  }
}

/**
 * Memeriksa dan menaikkan counter rate limit.
 *
 * Pertahanan berlapis (keduanya HARUS lolos):
 * 1. Limiter in-memory: menangkap burst paralel di isolate yang sama. Ini
 *    penting karena operasi KV tidak transaksional, sehingga N request paralel
 *    bisa membaca counter yang sama lalu saling menimpa (last write wins).
 * 2. Cloudflare KV: menangkap akumulasi lintas isolate yang tidak terlihat
 *    oleh memori proses tunggal.
 *
 * Keputusan menolak jika salah satu lapisan menolak. Ini fail-closed: lebih baik
 * memblokir lebih agresif daripada membiarkan brute force lolos.
 */
export async function checkRateLimitKV(
  key: string,
  options: RateLimitOptions = { maxRequests: 60, windowSeconds: 60 },
  now: number = Date.now()
): Promise<RateLimitResult> {
  // Lapisan 1: selalu evaluasi in-memory lebih dulu (sinkron, tanpa I/O).
  const inMemory = checkRateLimitInMemory(key, options, now);

  const kv = await resolveKVBinding();
  if (!kv) {
    return inMemory;
  }

  // Jika lapisan in-memory sudah menolak, tidak perlu menyentuh KV sama sekali.
  if (!inMemory.success) {
    return inMemory;
  }

  const storageKey = normalizeKey(key);
  const windowMs = options.windowSeconds * 1000;

  try {
    const existing = parseCounter(await kv.get(storageKey));

    // Window baru, atau record rusak / sudah lewat.
    if (!existing || now >= existing.resetAt) {
      const fresh: CounterRecord = { count: 1, resetAt: now + windowMs };
      await kv.put(storageKey, JSON.stringify(fresh), {
        // TTL sedikit lebih panjang dari window agar clock skew tidak
        // menghapus counter yang masih relevan.
        expirationTtl: Math.max(options.windowSeconds + 30, 60),
      });

      return inMemory;
    }

    const nextCount = existing.count + 1;
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    const kvSuccess = nextCount <= options.maxRequests;

    await kv.put(
      storageKey,
      JSON.stringify({ count: nextCount, resetAt: existing.resetAt }),
      { expirationTtl: Math.max(resetInSeconds + 30, 60) }
    );

    // Tolak jika lapisan KV menolak, meskipun in-memory masih mengizinkan.
    if (!kvSuccess) {
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
      remaining: Math.min(inMemory.remaining, Math.max(0, options.maxRequests - nextCount)),
      resetInSeconds,
    };
  } catch {
    // KV error tidak boleh membuat API terbuka sepenuhnya; lapisan in-memory
    // sudah dievaluasi di atas dan tetap menegakkan batas di level isolate.
    return inMemory;
  }
}
