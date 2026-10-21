import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSecurityHeaders,
  CONTENT_SECURITY_POLICY,
} from '../src/lib/security-headers.ts';

function toMap(headers: Array<{ key: string; value: string }>): Map<string, string> {
  return new Map(headers.map((h) => [h.key.toLowerCase(), h.value]));
}

describe('Step D - Security headers', () => {
  describe('buildSecurityHeaders', () => {
    it('sets HSTS with a one-year max-age and includeSubDomains', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      const hsts = map.get('strict-transport-security');
      assert.ok(hsts, 'Strict-Transport-Security must be present');
      assert.match(hsts as string, /max-age=31536000/);
      assert.match(hsts as string, /includeSubDomains/);
    });

    it('blocks framing to prevent clickjacking', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      assert.equal(map.get('x-frame-options'), 'SAMEORIGIN');
      assert.match(map.get('content-security-policy') as string, /frame-ancestors 'self'/);
    });

    it('prevents MIME type sniffing', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      assert.equal(map.get('x-content-type-options'), 'nosniff');
    });

    it('limits referrer leakage to the origin only', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      assert.equal(map.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });

    it('disables powerful browser features the site does not use', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      const policy = map.get('permissions-policy') as string;
      assert.match(policy, /camera=\(\)/);
      assert.match(policy, /microphone=\(\)/);
      assert.match(policy, /geolocation=\(\)/);
    });

    it('always includes a Content-Security-Policy', () => {
      const map = toMap(buildSecurityHeaders({ isProduction: true }));
      const csp = map.get('content-security-policy');
      assert.ok(csp, 'CSP must be present');
      assert.match(csp as string, /default-src 'self'/);
    });

    it('allows only the third-party origins the site actually uses', () => {
      const csp = CONTENT_SECURITY_POLICY;

      // Cloudflare Web Analytics beacon
      assert.match(csp, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
      // Product images served from the image host
      assert.match(csp, /img-src[^;]*https:\/\/gambar\.cimagroup\.my\.id/);
      // Analytics beacon POST target
      assert.match(csp, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
    });

    it('does not allow arbitrary remote script origins', () => {
      const csp = CONTENT_SECURITY_POLICY;
      const scriptSrc = csp.match(/script-src([^;]*)/)?.[1] ?? '';
      const sources = scriptSrc.trim().split(/\s+/);
      assert.equal(sources.includes('*'), false, 'script-src must not allow wildcard');
      assert.equal(
        sources.includes('https:'),
        false,
        'script-src must not allow every https host via bare https: scheme'
      );
      // Setiap origin https yang diizinkan harus eksplisit dan dikenal.
      const allowedHttps = sources.filter((s) => s.startsWith('https://'));
      assert.deepEqual(allowedHttps, ['https://static.cloudflareinsights.com']);
    });

    it('prevents object/embed injection', () => {
      const csp = CONTENT_SECURITY_POLICY;
      assert.match(csp, /object-src 'none'/);
    });

    it('upgrades insecure requests in production only', () => {
      const prod = CONTENT_SECURITY_POLICY;
      assert.match(prod, /upgrade-insecure-requests/);

      const devMap = toMap(buildSecurityHeaders({ isProduction: false }));
      const devCsp = devMap.get('content-security-policy') as string;
      assert.equal(devCsp.includes('upgrade-insecure-requests'), false);
      // HSTS must never be sent in development (it would poison localhost).
      assert.equal(devMap.has('strict-transport-security'), false);
    });

    it('returns plain header pairs ready for Next.js config', () => {
      const headers = buildSecurityHeaders({ isProduction: true });
      assert.ok(Array.isArray(headers));
      for (const header of headers) {
        assert.equal(typeof header.key, 'string');
        assert.equal(typeof header.value, 'string');
        assert.ok(header.key.length > 0);
        assert.ok(header.value.length > 0);
      }
    });

    it('has no duplicate header keys', () => {
      const headers = buildSecurityHeaders({ isProduction: true });
      const keys = headers.map((h) => h.key.toLowerCase());
      assert.equal(new Set(keys).size, keys.length);
    });
  });
});
