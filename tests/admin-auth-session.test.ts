import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminAuth, getExpectedAdminPassword } from '../src/lib/admin-auth.ts';
import { resetAdminSessionStore, validateAdminSession } from '../src/lib/admin-session.ts';
import { POST, DELETE } from '../src/app/api/admin/auth/route.ts';
import { GET as GET_ADMIN_ORDERS } from '../src/app/api/admin/orders/route.ts';
import { resetRateLimitStore } from '../src/lib/rate-limit.ts';
import { ADMIN_CONFIG } from '../src/lib/site-config.ts';

const BASE = 'https://jasdor.test';
const PASSWORD = 'CorrectHorseBatteryStaple';

function buildRequest(
  url: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; cookie?: string } = {}
): Request {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.cookie) headers['cookie'] = options.cookie;
  return new Request(url, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

function extractSessionCookie(response: Response): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${ADMIN_CONFIG.cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

describe('Step B - Admin authentication uses revocable session tokens', () => {
  let originalPassword: string | undefined;

  beforeEach(() => {
    resetAdminSessionStore();
    resetRateLimitStore();
    originalPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = PASSWORD;
  });

  afterEach(() => {
    resetAdminSessionStore();
    if (originalPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
  });

  describe('getExpectedAdminPassword', () => {
    it('reads the password from the environment', () => {
      assert.equal(getExpectedAdminPassword(), PASSWORD);
    });
  });

  describe('POST /api/admin/auth', () => {
    it('rejects a wrong password with 401', async () => {
      const res = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: 'wrong-password' },
        }) as never
      );
      assert.equal(res.status, 401);
      assert.equal(extractSessionCookie(res), null);
    });

    it('rejects a missing password with 401', async () => {
      const res = await POST(
        buildRequest(`${BASE}/api/admin/auth`, { method: 'POST', body: {} }) as never
      );
      assert.equal(res.status, 401);
    });

    it('accepts the correct password and sets a session cookie', async () => {
      const res = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );

      assert.equal(res.status, 200);
      const cookie = extractSessionCookie(res);
      assert.ok(cookie, 'expected a session cookie');
      assert.match(cookie as string, /^v1\.[0-9a-z]+\.[0-9a-f]{16}\.[0-9a-f]{64}$/);
    });

    it('never puts the admin password in the cookie value', async () => {
      const res = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );

      const cookie = extractSessionCookie(res);
      assert.ok(cookie);
      assert.notEqual(cookie, PASSWORD);
      assert.equal((cookie as string).includes(PASSWORD), false);
    });

    it('marks the session cookie httpOnly and sameSite=lax', async () => {
      const res = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );

      const setCookie = res.headers.get('set-cookie') ?? '';
      assert.equal(setCookie.toLowerCase().includes('httponly'), true);
      assert.equal(setCookie.toLowerCase().includes('samesite=lax'), true);
    });

    it('issues a different session token on every login', async () => {
      const first = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );
      const second = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );

      assert.notEqual(extractSessionCookie(first), extractSessionCookie(second));
    });
  });

  describe('verifyAdminAuth', () => {
    it('accepts a valid session cookie', async () => {
      const login = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );
      const token = extractSessionCookie(login) as string;

      const request = buildRequest(`${BASE}/api/admin/orders`, {
        cookie: `${ADMIN_CONFIG.cookieName}=${token}`,
      });
      assert.equal(await verifyAdminAuth(request as never), true);
    });

    it('rejects a cookie that contains the raw admin password', async () => {
      const request = buildRequest(`${BASE}/api/admin/orders`, {
        cookie: `${ADMIN_CONFIG.cookieName}=${encodeURIComponent(PASSWORD)}`,
      });
      assert.equal(await verifyAdminAuth(request as never), false);
    });

    it('rejects a forged session token', async () => {
      const request = buildRequest(`${BASE}/api/admin/orders`, {
        cookie: `${ADMIN_CONFIG.cookieName}=${'a'.repeat(64)}`,
      });
      assert.equal(await verifyAdminAuth(request as never), false);
    });

    it('rejects when no cookie is present', async () => {
      assert.equal(await verifyAdminAuth(buildRequest(`${BASE}/api/admin/orders`) as never), false);
    });

    it('rejects the legacy x-admin-password header with the raw password', async () => {
      const request = buildRequest(`${BASE}/api/admin/orders`, {
        headers: { 'x-admin-password': PASSWORD },
      });
      assert.equal(await verifyAdminAuth(request as never), false);
    });

    it('rejects the legacy Authorization Bearer password header', async () => {
      const request = buildRequest(`${BASE}/api/admin/orders`, {
        headers: { authorization: `Bearer ${PASSWORD}` },
      });
      assert.equal(await verifyAdminAuth(request as never), false);
    });
  });

  describe('DELETE /api/admin/auth (logout)', () => {
    it('revokes the session so it cannot be reused', async () => {
      const login = await POST(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'POST',
          body: { password: PASSWORD },
        }) as never
      );
      const token = extractSessionCookie(login) as string;
      assert.equal(await validateAdminSession(token), true);

      await DELETE(
        buildRequest(`${BASE}/api/admin/auth`, {
          method: 'DELETE',
          cookie: `${ADMIN_CONFIG.cookieName}=${token}`,
        }) as never
      );

      assert.equal(await validateAdminSession(token), false);
    });
  });

  describe('protected route enforcement', () => {
    it('GET /api/admin/orders rejects an unauthenticated request', async () => {
      const res = await GET_ADMIN_ORDERS(buildRequest(`${BASE}/api/admin/orders`) as never);
      assert.equal(res.status, 401);
    });
  });
});
