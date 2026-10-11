import { NextRequest, NextResponse } from 'next/server';
import { getJasdorOperationalStatus } from '@/lib/operational';

export async function GET(request: NextRequest) {
  const status = getJasdorOperationalStatus();
  const simulate = request.nextUrl.searchParams.get('simulate');

  if (simulate === 'open') {
    return NextResponse.json({
      ...status,
      isOpen: true,
      message: `${status.message} (Simulasi Buka Aktif)`,
    });
  }

  if (simulate === 'closed') {
    return NextResponse.json({
      ...status,
      isOpen: false,
      message: `${status.message} (Simulasi Tutup Aktif)`,
    });
  }

  return NextResponse.json(status);
}
