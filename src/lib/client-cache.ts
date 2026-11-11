/**
 * Client-Side Storage Cache (sessionStorage + In-Memory Fallback)
 * Mengurangi pemanggilan network & CPU Worker Cloudflare dengan menyimpan
 * data statis/semi-statis (menu outlet, opsi varian, bootstrap) di perangkat pelanggan.
 */

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

const memoryFallback = new Map<string, CacheEnvelope<unknown>>();

export function getClientSessionCache<T>(key: string, maxAgeMs: number = 300_000): T | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`jasdor_${key}`);
      if (raw) {
        const envelope: CacheEnvelope<T> = JSON.parse(raw);
        if (Date.now() - envelope.timestamp < maxAgeMs) {
          return envelope.data;
        }
        sessionStorage.removeItem(`jasdor_${key}`);
      }
    } catch {
      // Lanjut ke in-memory fallback jika sessionStorage tidak dapat diakses
    }
  }

  // In-memory fallback (untuk lingkungan Node.js testing atau private browsing)
  const env = memoryFallback.get(key) as CacheEnvelope<T> | undefined;
  if (env && Date.now() - env.timestamp < maxAgeMs) {
    return env.data;
  }

  return null;
}

export function setClientSessionCache<T>(key: string, data: T): void {
  const envelope: CacheEnvelope<T> = {
    data,
    timestamp: Date.now(),
  };

  // Selalu catat di in-memory fallback
  memoryFallback.set(key, envelope as CacheEnvelope<unknown>);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`jasdor_${key}`, JSON.stringify(envelope));
    } catch {
      // Abaikan jika quota storage penuh
    }
  }
}

export function removeClientSessionCache(key: string): void {
  memoryFallback.delete(key);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`jasdor_${key}`);
    } catch {}
  }
}
