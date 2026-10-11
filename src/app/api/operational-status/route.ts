import { NextRequest, NextResponse } from 'next/server';
import { getJasdorOperationalStatus } from '@/lib/operational';

export async function GET(request: NextRequest) {
  const status = getJasdorOperationalStatus();

  // Mode simulasi HANYA aktif jika variabel lingkungan ALLOW_SIMULATE === "true"
  // Di production Cloudflare, variabel ini TIDAK diset sehingga URL parameter diabaikan sepenuhnya.
  const allowSimulate = process.env.ALLOW_SIMULATE === 'true';

  if (allowSimulate) {
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
  }

  return NextResponse.json(status);
}
