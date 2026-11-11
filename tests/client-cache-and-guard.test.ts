import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  getClientSessionCache,
  setClientSessionCache,
  removeClientSessionCache,
} from '../src/lib/client-cache.ts';
import { GET as getBootstrapRoute } from '../src/app/api/bootstrap/route.ts';
import { NextRequest } from 'next/server.js';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';

describe('Nomor 2, 3, 4: Client Storage Cache, Bootstrap API, dan Tab Inactive Guard', () => {
  describe('Nomor 2: Client Storage Cache (src/lib/client-cache.ts)', () => {
    it('menyimpan dan membaca data dari cache dengan envelope timestamp', () => {
      setClientSessionCache('test_key', { foo: 'bar' });
      const cached = getClientSessionCache<{ foo: string }>('test_key', 10_000);
      assert.deepStrictEqual(cached, { foo: 'bar' });
    });

    it('mengembalikan null jika data cache sudah melewati TTL maxAgeMs', async () => {
      setClientSessionCache('expired_key', { secret: 123 });
      // Menunggu 15ms lalu uji dengan TTL 10ms
      await new Promise((resolve) => setTimeout(resolve, 20));
      const cached = getClientSessionCache('expired_key', 10);
      assert.strictEqual(cached, null);
    });

    it('berhasil menghapus cache secara manual dengan removeClientSessionCache', () => {
      setClientSessionCache('delete_key', 'hello');
      removeClientSessionCache('delete_key');
      const cached = getClientSessionCache('delete_key', 10_000);
      assert.strictEqual(cached, null);
    });
  });

  describe('Nomor 3: Bootstrap API (/api/bootstrap)', () => {
    it('mengembalikan status 200 dengan payload operational, siteSettings, dan orderCounts lengkap', async () => {
      const mockSupabase: any = {
        from: (table: string) => ({
          select: (_cols: string, opts?: any) => {
            const chain: any = {
              gte: () => Promise.resolve({ count: 5, error: null }),
              then: (resolve: any) => Promise.resolve({ count: 100, error: null }).then(resolve),
            };
            return chain;
          },
        }),
      };
      setSupabaseServerClientInstance(mockSupabase);

      try {
        const req = new NextRequest('http://localhost:3000/api/bootstrap');
        const res = await getBootstrapRoute(req);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.ok(data.operational, 'Harus memuat operational status');
        assert.ok(data.siteSettings, 'Harus memuat siteSettings');
        assert.ok(typeof data.siteSettings.min_order_50k_mode === 'boolean', 'Harus ada min_order_50k_mode');
        assert.ok(data.siteSettings.brand_status, 'Harus ada brand_status');
        assert.ok(data.orderCounts, 'Harus ada orderCounts');
        assert.ok(typeof data.orderCounts.total === 'number', 'Harus ada total order count');

        const cacheControl = res.headers.get('Cache-Control');
        assert.ok(cacheControl?.includes('s-maxage=30'), 'Cache-Control harus menyertakan s-maxage=30');
      } finally {
        setSupabaseServerClientInstance(null);
      }
    });
  });

  describe('Nomor 4: Tab Inactive Guard pada Polling & Hooks', () => {
    it('src/hooks/useOperationalStatus.ts memiliki penjaga document.visibilityState', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'src/hooks/useOperationalStatus.ts'),
        'utf8'
      );
      assert.match(
        content,
        /document\.visibilityState/,
        'useOperationalStatus harus mengecek document.visibilityState'
      );
      assert.match(
        content,
        /visibilitychange/,
        'useOperationalStatus harus mendengar event visibilitychange'
      );
    });

    it('src/lib/use-my-orders.ts memiliki penjaga document.visibilityState pada polling order', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'src/lib/use-my-orders.ts'),
        'utf8'
      );
      assert.match(
        content,
        /document\.visibilityState/,
        'use-my-orders harus mengecek document.visibilityState'
      );
      assert.match(
        content,
        /visibilitychange/,
        'use-my-orders harus mendengar event visibilitychange'
      );
    });

    it('src/components/AutoCheck.tsx memiliki penjaga document.visibilityState pada countdown pembayaran', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'src/components/AutoCheck.tsx'),
        'utf8'
      );
      assert.match(
        content,
        /document\.visibilityState/,
        'AutoCheck harus mengecek document.visibilityState'
      );
      assert.match(
        content,
        /visibilitychange/,
        'AutoCheck harus mendengar event visibilitychange'
      );
    });

    it('src/app/outlet/[code]/page.tsx mengimplementasikan Client Storage Cache', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'src/app/outlet/[code]/page.tsx'),
        'utf8'
      );
      assert.match(
        content,
        /getClientSessionCache/,
        'halaman outlet harus memeriksa getClientSessionCache sebelum fetch network'
      );
      assert.match(
        content,
        /setClientSessionCache/,
        'halaman outlet harus menyimpan data menu ke setClientSessionCache'
      );
    });
  });

  describe('Integritas & Anti-Slop Check', () => {
    it('tidak mengandung em dash (— / U+2014) di file implementasi baru', () => {
      const filesToCheck = [
        'src/lib/client-cache.ts',
        'src/lib/client-bootstrap.ts',
        'src/app/api/bootstrap/route.ts',
        'src/hooks/useOperationalStatus.ts',
        'src/components/TrustStrip.tsx',
      ];
      for (const file of filesToCheck) {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.strictEqual(
            content.includes('\u2014'),
            false,
            `File ${file} tidak boleh mengandung em dash`
          );
        }
      }
    });

    it('mematuhi batasan terminologi "jasa order" dan tidak memakai "jastip"', () => {
      const filesToCheck = [
        'src/lib/client-cache.ts',
        'src/lib/client-bootstrap.ts',
        'src/app/api/bootstrap/route.ts',
      ];
      for (const file of filesToCheck) {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.doesNotMatch(content, /jastip/i, `File ${file} tidak boleh mengandung kata jastip`);
        }
      }
    });
  });
});
