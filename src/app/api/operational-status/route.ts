import { NextRequest, NextResponse } from 'next/server.js';
import { getEffectiveJasdorOperationalStatus, resolveOperationalStatusWithSimulation } from '../../../lib/operational.ts';
import { getOperationalOverride } from '../../../lib/site-settings.ts';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit.ts';
import { applyCachePolicy, CACHE_POLICY } from '../../../lib/cache-headers.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`operational:${clientIp}`, {
    maxRequests: 120,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const override = await getOperationalOverride();
  const baseStatus = getEffectiveJasdorOperationalStatus(new Date(), override);
  const simulateParam = request.nextUrl.searchParams.get('simulate');
  const status = resolveOperationalStatusWithSimulation(baseStatus, simulateParam);

  const response = NextResponse.json(status);

  // Jika sedang mode simulasi (?simulate=...), jangan di-cache agar testing/preview tidak terdistorsi
  if (simulateParam) {
    return applyCachePolicy(response, CACHE_POLICY.noStore);
  }

  return applyCachePolicy(response, CACHE_POLICY.operationalStatus);
}
