import { NextRequest, NextResponse } from 'next/server';
import { getJasdorOperationalStatus, resolveOperationalStatusWithSimulation } from '@/lib/operational';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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

  const baseStatus = getJasdorOperationalStatus();
  const simulateParam = request.nextUrl.searchParams.get('simulate');
  const status = resolveOperationalStatusWithSimulation(baseStatus, simulateParam);

  return NextResponse.json(status);
}
