import { NextRequest, NextResponse } from 'next/server';
import { syncOutletsToDb } from '@/lib/outlet-service';

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET || process.env.CRON_SECRET;

  if (!syncSecret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: SYNC_SECRET belum dikonfigurasi di environment.' },
      { status: 500 }
    );
  }

  // Verifikasi otorisasi lewat Bearer token, header x-sync-secret, atau query parameter ?secret=
  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-sync-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');

  let providedToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (customHeader) {
    providedToken = customHeader.trim();
  } else if (querySecret) {
    providedToken = querySecret.trim();
  }

  if (!providedToken || providedToken !== syncSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: Akses ditolak. Secret tidak valid atau tidak disertakan.' },
      { status: 401 }
    );
  }

  try {
    console.log('[Sync Outlets] Memulai sinkronisasi seluruh outlet dari KK ke Supabase...');
    const result = await syncOutletsToDb();
    console.log(`[Sync Outlets] Selesai sinkronisasi: ${result.syncedCount} outlet dalam ${result.durationMs}ms.`);

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi daftar outlet berhasil.',
      syncedCount: result.syncedCount,
      durationMs: result.durationMs,
    });
  } catch (error: any) {
    console.error(`[Sync Outlets] Gagal sinkronisasi: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'Gagal melakukan sinkronisasi outlet' },
      { status: 500 }
    );
  }
}
