import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Test arsitektur: memastikan hanya endpoint sensitif yang menulis counter ke
 * Cloudflare KV.
 *
 * Alasan: kuota gratis KV hanya 1.000 writes/hari. Endpoint publik yang
 * dipanggil berkali-kali per kunjungan (polling status, daftar outlet, menu)
 * akan menghabiskan kuota itu hanya dengan trafik normal.
 *
 * Perlindungan abuse untuk endpoint publik dipindahkan ke Cloudflare edge rule,
 * yang tidak memakan kuota KV sama sekali.
 */

const ROUTES = {
  // Wajib memakai KV: brute force dan pembuatan pesanan harus lintas isolate.
  kv: [
    'src/app/api/admin/auth/route.ts',
    'src/app/api/orders/create/route.ts',
    'src/app/api/orders/[id]/confirm-payment/route.ts',
  ],
  // Wajib in-memory saja: trafik tinggi, perlindungan abuse dari edge rule.
  inMemory: [
    'src/app/api/operational-status/route.ts',
    'src/app/api/outlets/route.ts',
    'src/app/api/outlets/[code]/route.ts',
    'src/app/api/outlets/[code]/menu/route.ts',
    'src/app/api/outlets/[code]/products/[bundleCode]/options/route.ts',
    'src/app/api/outlets/[code]/validate-cart/route.ts',
    'src/app/api/orders/[id]/route.ts',
  ],
};

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(relativePath), 'utf-8');
}

function importsKVLimiter(source: string): boolean {
  return /import\s*\{[^}]*checkRateLimitKV[^}]*\}/.test(source);
}

function importsInMemoryLimiter(source: string): boolean {
  // checkRateLimit dari modul rate-limit (bukan rate-limit-kv)
  return /import\s*\{[^}]*\bcheckRateLimit\b[^}]*\}\s*from\s*'[^']*rate-limit\.ts'/.test(source);
}

describe('Nomor 4 - Kuota KV: hanya endpoint sensitif yang menulis counter', () => {
  describe('endpoint sensitif wajib memakai KV', () => {
    for (const route of ROUTES.kv) {
      it(`${route} memakai checkRateLimitKV`, () => {
        const source = read(route);
        assert.equal(
          importsKVLimiter(source),
          true,
          `${route} harus memakai checkRateLimitKV agar batas berlaku lintas isolate`
        );
        assert.equal(
          importsInMemoryLimiter(source),
          false,
          `${route} tidak boleh memakai limiter in-memory saja`
        );
      });
    }
  });

  describe('endpoint publik wajib memakai in-memory saja', () => {
    for (const route of ROUTES.inMemory) {
      it(`${route} TIDAK memakai checkRateLimitKV`, () => {
        const source = read(route);
        assert.equal(
          importsKVLimiter(source),
          false,
          `${route} tidak boleh menulis counter ke KV (kuota 1.000 writes/hari)`
        );
        assert.equal(
          importsInMemoryLimiter(source),
          true,
          `${route} harus memakai limiter in-memory`
        );
      });

      it(`${route} tidak memakai await pada limiter`, () => {
        const source = read(route);
        assert.equal(
          /await\s+checkRateLimit\s*\(/.test(source),
          false,
          `${route}: limiter in-memory bersifat sinkron, tidak perlu await`
        );
      });
    }
  });

  describe('modul limiter', () => {
    it('rate-limit.ts tetap menyediakan limiter in-memory sinkron', () => {
      const source = read('src/lib/rate-limit.ts');
      assert.match(source, /export function checkRateLimit\(/);
      assert.match(source, /export function getClientIp\(/);
    });

    it('rate-limit-kv.ts tetap menyediakan limiter KV untuk endpoint sensitif', () => {
      const source = read('src/lib/rate-limit-kv.ts');
      assert.match(source, /export async function checkRateLimitKV\(/);
    });

    it('tidak ada modul lain di src yang memanggil checkRateLimitKV', () => {
      const offenders: string[] = [];

      function scan(dir: string): void {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(full);
            continue;
          }
          if (!/\.(ts|tsx)$/.test(entry.name)) continue;

          const relative = full.replace(/\\/g, '/').split('src/').pop() ?? full;
          if (relative === 'lib/rate-limit-kv.ts') continue;

          const source = fs.readFileSync(full, 'utf-8');
          if (!/checkRateLimitKV/.test(source)) continue;

          const allowed = [...ROUTES.kv, ...ROUTES.inMemory].some((route) =>
            full.replace(/\\/g, '/').endsWith(route.replace(/^src\//, ''))
          );
          if (!allowed) offenders.push(relative);
        }
      }

      scan(path.resolve('src'));
      assert.deepEqual(offenders, [], `Modul tak terdaftar memakai KV: ${offenders.join(', ')}`);
    });
  });
});
