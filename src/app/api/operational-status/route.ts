import { NextRequest, NextResponse } from 'next/server';
import { getEffectiveJasdorOperationalStatus, resolveOperationalStatusWithSimulation } from '@/lib/operational';
import { getOperationalOverride } from '@/lib/site-settings';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit.ts';

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
        },
      }
    );
  }

  const override = await getOperationalOverride();
  const baseStatus = getEffectiveJasdorOperationalStatus(new Date(), override);
  const simulateParam = request.nextUrl.searchParams.get('simulate');
  const status = resolveOperationalStatusWithSimulation(baseStatus, simulateParam);

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
