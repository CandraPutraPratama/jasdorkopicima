import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Membaca environment variable / secret secara universal.
 * Prioritas:
 * 1. Cloudflare Workers context binding (`getCloudflareContext().env[key]`)
 * 2. Node.js `process.env[key]` (untuk environment lokal / skrip CLI)
 */
export function getEnvVar(key: string): string | undefined {
  try {
    const cf = getCloudflareContext({ async: false });
    if (cf?.env && typeof (cf.env as any)[key] === 'string') {
      return (cf.env as any)[key];
    }
  } catch {
    // Berjalan di luar Cloudflare Workers runtime (Node.js lokal / unit test)
  }

  return process.env[key];
}
