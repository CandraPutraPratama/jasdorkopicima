import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GET as GET_ADMIN_ORDERS } from '../src/app/api/admin/orders/route.ts';
import { POST as ADMIN_LOGIN, DELETE as ADMIN_LOGOUT } from '../src/app/api/admin/auth/route.ts';
import { GET as GET_SITE_SETTINGS } from '../src/app/api/admin/site-settings/route.ts';
import { createAdminSession, resetAdminSessionStore, setSessionKVBindingForTests } from '../src/lib/admin-session.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { ADMIN_CONFIG } from '../src/lib/site-config.ts';

const BASE = 'https://jasdor.test';
const PASSWORD = 'CacheControlTestPassword';

function assertNoStore(response: Response, label: string) {
  const cacheControl = response.headers.get('cache-control');
  assert.ok(cacheControl, `${label}: Cache-Control harus ada`);
  const value = cacheControl.toLowerCase();
  assert.equal(
    value.includes('no-store'),
    true,
    `${label}: harus mengandung no-store, dapat "${cacheControl}"`
  );
  assert.equal(
    value.includes('s-maxage'),
    false,
    `${label}: tidak boleh punya s-maxage, dapat "${cacheControl}"`
  );
  assert.equal(
    value.includes('public'),
    false,
    `${label}: tidak boleh public, dapat "${cacheControl}"`
  );
}

describe('Step E - Admin responses are never cacheable', () => {
  let originalPassword: string | undefined;
  let cookie: string;

  beforeEach(async () => {
    resetAdminSessionStore();
    resetRateLimitStore();
    setSessionKVBindingForTests(null);
    setSupabaseServerClientInstance(null);

    originalPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = PASSWORD;

    const session = await createAdminSession();
    cookie = `${ADMIN_CONFIG.cookieName}=${session.token}`;
  });

  afterEach(() => {
    resetAdminSessionStore();
    setSupabaseServerClientInstance(null);
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  describe('GET /api/admin/orders', () => {
    it('sets no-store on the authenticated response', async () => {
      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      } as never);

      const res = await GET_ADMIN_ORDERS(
        new Request(`${BASE}/api/admin/orders`, { headers: { cookie } }) as never
      );
      assert.equal(res.status, 200);
      assertNoStore(res, 'GET /api/admin/orders (200)');
    });

    it('sets no-store on the 401 response too', async () => {
      const res = await GET_ADMIN_ORDERS(
        new Request(`${BASE}/api/admin/orders`) as never
      );
      assert.equal(res.status, 401);
      assertNoStore(res, 'GET /api/admin/orders (401)');
    });
  });

  describe('GET /api/admin/site-settings', () => {
    it('sets no-store', async () => {
      setSupabaseServerClientInstance({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const res = await GET_SITE_SETTINGS(
        new Request(`${BASE}/api/admin/site-settings`, { headers: { cookie } }) as never
      );
      assert.equal(res.status, 200);
      assertNoStore(res, 'GET /api/admin/site-settings');
    });
  });

  describe('POST /api/admin/auth (login)', () => {
    it('sets no-store so the session cookie is never cached', async () => {
      const res = await ADMIN_LOGIN(
        new Request(`${BASE}/api/admin/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: PASSWORD }),
        }) as never
      );
      assert.equal(res.status, 200);
      assertNoStore(res, 'POST /api/admin/auth');
    });

    it('sets no-store on failed login as well', async () => {
      const res = await ADMIN_LOGIN(
        new Request(`${BASE}/api/admin/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'wrong' }),
        }) as never
      );
      assert.equal(res.status, 401);
      assertNoStore(res, 'POST /api/admin/auth (401)');
    });
  });

  describe('DELETE /api/admin/auth (logout)', () => {
    it('sets no-store', async () => {
      const res = await ADMIN_LOGOUT(
        new Request(`${BASE}/api/admin/auth`, {
          method: 'DELETE',
          headers: { cookie },
        }) as never
      );
      assert.equal(res.status, 200);
      assertNoStore(res, 'DELETE /api/admin/auth');
    });
  });
});
