/**
 * Sesi admin berbasis token stateless yang ditandatangani HMAC-SHA256.
 *
 * Riwayat masalah yang diperbaiki:
 * 1. Awalnya cookie admin menyimpan PASSWORD apa adanya, jadi satu kebocoran
 *    cookie = kebocoran kredensial permanen.
 * 2. Lalu sesi disimpan di `Map` in-memory. Di Cloudflare Workers ada banyak
 *    isolate (terbukti: NRT dan SIN) sehingga login di satu isolate tidak
 *    dikenali isolate lain. Hasilnya panel admin berubah-ubah 401/200 dan
 *    praktis tidak bisa dipakai.
 *
 * Solusi sekarang: token membawa masa berlakunya sendiri dan ditandatangani
 * HMAC, sehingga SEMUA isolate bisa memvalidasinya tanpa perlu berbagi state.
 * Tidak ada I/O, tidak ada eventual consistency, hasilnya instan dan konsisten.
 *
 * Logout tetap bisa mencabut token lewat denylist di KV. Karena KV bersifat
 * eventually consistent, pencabutan bisa terlambat beberapa detik; signature
 * tetap membuat token tidak bisa dipalsukan.
 */

export const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

/** Versi format token, supaya bisa berubah tanpa menolak token lama secara buta. */
const TOKEN_VERSION = 'v1';

/** Panjang minimum secret yang dianggap layak. */
const MIN_SECRET_LENGTH = 16;

export interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Penyimpanan denylist (sesi yang sudah logout).
 *
 * Dipilih Supabase (Postgres) alih-alih Cloudflare KV karena logout harus
 * langsung berlaku. KV bersifat eventually consistent: catatan pencabutan bisa
 * terlambat beberapa detik di isolate lain, sehingga ada jendela kecil di mana
 * token yang sudah logout masih diterima.
 */
export interface RevocationStore {
  isRevoked(tokenHash: string): Promise<boolean>;
  revoke(tokenHash: string, expiresAtMs: number): Promise<void>;
  delete?(tokenHash: string): Promise<void>;
}

let storeOverride: RevocationStore | null | undefined;

/**
 * Menyuntikkan store untuk test.
 * `undefined` = pakai store default, `null` = paksa denylist in-memory.
 */
export function setSessionKVBindingForTests(
  binding: RevocationStore | null | undefined
): void {
  storeOverride = binding;
}

/** Denylist in-memory, dipakai saat store persisten tidak tersedia. */
const inMemoryDenylist = new Map<string, number>();

const REVOKED_TABLE = 'revoked_admin_sessions';

/**
 * Store default: tabel `revoked_admin_sessions` di Supabase.
 * Kegagalan apa pun dianggap "tidak bisa memastikan" dan dilempar ke pemanggil
 * supaya bisa memutuskan fallback.
 */
function createSupabaseRevocationStore(): RevocationStore | null {
  try {
    // Import dinamis agar modul ini tetap bisa dipakai di unit test tanpa env.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSupabaseServerClient } = require('./supabase-server.ts') as {
      getSupabaseServerClient: () => {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
            };
          };
          upsert: (
            row: Record<string, unknown>,
            options: { onConflict: string }
          ) => Promise<{ error: { message: string } | null }>;
          delete: () => {
            eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
    };

    return {
      async isRevoked(tokenHash) {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from(REVOKED_TABLE)
          .select('token_hash')
          .eq('token_hash', tokenHash)
          .maybeSingle();

        if (error) {
          throw new Error(`Gagal membaca denylist sesi: ${error.message}`);
        }
        return data !== null && data !== undefined;
      },

      async revoke(tokenHash, expiresAtMs) {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase.from(REVOKED_TABLE).upsert(
          {
            token_hash: tokenHash,
            revoked_at: new Date().toISOString(),
            expires_at: new Date(expiresAtMs).toISOString(),
          },
          { onConflict: 'token_hash' }
        );

        if (error) {
          throw new Error(`Gagal mencatat pencabutan sesi: ${error.message}`);
        }
      },

      async delete(tokenHash) {
        const supabase = getSupabaseServerClient();
        await supabase.from(REVOKED_TABLE).delete().eq('token_hash', tokenHash);
      },
    };
  } catch {
    return null;
  }
}

function resolveRevocationStore(): RevocationStore | null {
  if (storeOverride !== undefined) {
    return storeOverride;
  }
  return createSupabaseRevocationStore();
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

function toBase36(value: number): string {
  return Math.floor(value).toString(36);
}

function fromBase36(value: string): number {
  const parsed = parseInt(value, 36);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Secret untuk menandatangani token.
 *
 * Prioritas:
 * 1. `ADMIN_SESSION_SECRET` (disarankan, bisa dirotasi terpisah dari password).
 * 2. Turunan dari `ADMIN_PASSWORD` supaya tidak ada env var baru yang wajib.
 *
 * Keduanya adalah binding Worker yang sama di semua isolate, sehingga signature
 * konsisten. Jika tidak ada secret sama sekali, sesi dinonaktifkan (fail-closed)
 * alih-alih memakai secret default yang bisa ditebak.
 */
function resolveSigningSecret(): string | null {
  const explicit = readEnv('ADMIN_SESSION_SECRET');
  if (explicit && explicit.length >= MIN_SECRET_LENGTH) {
    return `session:${explicit}`;
  }

  const password = readEnv('ADMIN_PASSWORD');
  if (password && password.length > 0) {
    return `session-derived:${password}`;
  }

  return null;
}

function readEnv(key: string): string | undefined {
  try {
    const symbolKey = Symbol.for('__cloudflare-context__');
    const globalContext = (globalThis as Record<symbol, unknown>)[symbolKey] as
      | { env?: Record<string, unknown> }
      | undefined;
    const fromGlobal = globalContext?.env?.[key];
    if (typeof fromGlobal === 'string') return fromGlobal;
  } catch {
    // Bukan runtime Workers.
  }

  const fromProcess = process.env[key];
  return typeof fromProcess === 'string' ? fromProcess : undefined;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );
  return toHex(new Uint8Array(signature));
}

/** Perbandingan string constant-time untuk signature. */
function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const maxLength = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < maxLength; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/** Hash token (SHA-256 penuh) sebagai kunci denylist; token mentah tidak disimpan. */
async function denylistKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return toHex(new Uint8Array(digest));
}

/**
 * Membuat token sesi baru yang sudah membawa masa berlaku dan signature.
 */
export async function createAdminSession(options: {
  now?: number;
} = {}): Promise<AdminSession> {
  const now = options.now ?? Date.now();
  const expiresAt = now + ADMIN_SESSION_TTL_MS;

  const secret = resolveSigningSecret();
  if (!secret) {
    throw new Error(
      'Tidak bisa membuat sesi admin: ADMIN_SESSION_SECRET atau ADMIN_PASSWORD belum diset.'
    );
  }

  const payload = `${TOKEN_VERSION}.${toBase36(expiresAt)}.${randomNonce()}`;
  const signature = await hmacHex(secret, payload);
  const token = `${payload}.${signature}`;

  return { token, createdAt: now, expiresAt };
}

/**
 * Nonce acak agar dua sesi yang dibuat pada milidetik yang sama tetap berbeda.
 * Tanpa ini, token stateless akan identik untuk waktu yang sama.
 */
function randomNonce(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

interface ParsedToken {
  expiresAt: number;
  valid: boolean;
}

async function parseAndVerify(
  token: string,
  now: number
): Promise<ParsedToken | null> {
  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [version, expiresPart, nonce, signature] = parts;
  if (version !== TOKEN_VERSION) return null;
  if (!nonce || nonce.length === 0) return null;

  const expiresAt = fromBase36(expiresPart);
  if (!Number.isFinite(expiresAt)) return null;

  const secret = resolveSigningSecret();
  if (!secret) return null;

  const expectedSignature = await hmacHex(
    secret,
    `${version}.${expiresPart}.${nonce}`
  );
  const valid = constantTimeEqual(expectedSignature, signature);

  return { expiresAt, valid: valid && now < expiresAt };
}

/**
 * Memvalidasi token sesi: signature sah, belum kedaluwarsa, dan tidak dicabut.
 * Token kosong / rusak / kedaluwarsa selalu ditolak (fail-closed).
 */
export async function validateAdminSession(
  token: string | null | undefined,
  options: { now?: number } = {}
): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0) {
    return false;
  }

  const now = options.now ?? Date.now();
  const parsed = await parseAndVerify(token, now);
  if (!parsed || !parsed.valid) {
    return false;
  }

  // Cek denylist (logout). Signature sudah menjamin keaslian token, jadi
  // denylist hanya menambah kemampuan mencabut lebih awal.
  const key = await denylistKey(token);

  // Lapisan lokal selalu dicek lebih dulu: menangkap pencabutan yang gagal
  // tercatat ke store persisten, dan konsisten dalam satu isolate.
  const revokedUntilLocal = inMemoryDenylist.get(key);
  if (revokedUntilLocal !== undefined) {
    if (now < revokedUntilLocal) return false;
    inMemoryDenylist.delete(key);
  }

  const store = resolveRevocationStore();
  if (!store) {
    return true;
  }

  try {
    return !(await store.isRevoked(key));
  } catch {
    // Store tidak bisa dibaca. Token tetap sah secara signature, dan cookie
    // tetap dihapus saat logout di sisi klien, jadi terima tokennya.
    console.warn('[AdminSession] Gagal membaca denylist sesi; token diterima berdasarkan signature.');
    return true;
  }
}

/**
 * Mencabut satu sesi (logout). Aman dipanggil untuk token yang tidak dikenal.
 */
export async function invalidateAdminSession(
  token: string | null | undefined
): Promise<void> {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }

  const now = Date.now();
  const parsed = await parseAndVerify(token, now);
  // Hanya token yang sah yang perlu dicatat; token sampah tidak berguna.
  if (!parsed || !parsed.valid) {
    return;
  }

  const key = await denylistKey(token);
  const store = resolveRevocationStore();

  if (!store) {
    inMemoryDenylist.set(key, parsed.expiresAt);
    return;
  }

  try {
    await store.revoke(key, parsed.expiresAt);
  } catch (err) {
    // Pencabutan gagal dicatat. Ini penting untuk diketahui: token masih sah
    // sampai kedaluwarsa sendiri, jadi dicatat sebagai error (bukan warning).
    console.error(
      '[AdminSession] Gagal mencatat pencabutan sesi:',
      err instanceof Error ? err.message : String(err)
    );
    // Simpan juga di memori isolate ini sebagai jaring pengaman terakhir.
    inMemoryDenylist.set(key, parsed.expiresAt);
  }
}

/**
 * Mengosongkan state in-memory. Dipakai oleh unit test.
 */
export function resetAdminSessionStore(): void {
  inMemoryDenylist.clear();
}
