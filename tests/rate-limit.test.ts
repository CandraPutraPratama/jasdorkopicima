import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, resetRateLimitStore, getClientIp } from '../src/lib/rate-limit.ts';

describe('Rate Limiter Helper', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('allows requests within limit and returns correct remaining', () => {
    const res1 = checkRateLimit('test-ip-1', { maxRequests: 3, windowSeconds: 60 });
    assert.equal(res1.success, true);
    assert.equal(res1.remaining, 2);

    const res2 = checkRateLimit('test-ip-1', { maxRequests: 3, windowSeconds: 60 });
    assert.equal(res2.success, true);
    assert.equal(res2.remaining, 1);

    const res3 = checkRateLimit('test-ip-1', { maxRequests: 3, windowSeconds: 60 });
    assert.equal(res3.success, true);
    assert.equal(res3.remaining, 0);
  });

  it('blocks request when limit exceeded and returns success false', () => {
    checkRateLimit('test-ip-2', { maxRequests: 2, windowSeconds: 60 });
    checkRateLimit('test-ip-2', { maxRequests: 2, windowSeconds: 60 });

    const blocked = checkRateLimit('test-ip-2', { maxRequests: 2, windowSeconds: 60 });
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetInSeconds > 0);
  });

  it('tracks different IP keys separately', () => {
    checkRateLimit('ip-a', { maxRequests: 1, windowSeconds: 60 });
    const blockedA = checkRateLimit('ip-a', { maxRequests: 1, windowSeconds: 60 });
    assert.equal(blockedA.success, false);

    const allowedB = checkRateLimit('ip-b', { maxRequests: 1, windowSeconds: 60 });
    assert.equal(allowedB.success, true);
  });

  it('extracts client IP from Cloudflare or forward headers correctly', () => {
    const cfHeaders = new Headers({ 'cf-connecting-ip': '203.0.113.195' });
    assert.equal(getClientIp(cfHeaders), '203.0.113.195');

    const fwdHeaders = new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' });
    assert.equal(getClientIp(fwdHeaders), '198.51.100.1');

    const fallbackHeaders = new Headers();
    assert.equal(getClientIp(fallbackHeaders), '127.0.0.1');
  });
});
