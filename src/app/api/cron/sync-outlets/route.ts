import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { syncOutletsToDb } from '@/lib/outlet-service';
import { cacheService } from '@/lib/cache';
import { getEnvVar } from '@/lib/env';

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

/**
 * Perbandingan string waktu-konstan untuk mencegah timing attack pada pengecekan secret.
 */
function timingSafeCompare(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, 'utf-8');
  const expectedBuf = Buffer.from(expected, 'utf-8');

  if (providedBuf.length !== expectedBuf.length) {
    // Jalankan dummy timingSafeEqual agar waktu eksekusi tetap konstan
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

async function handleSync(request: NextRequest) {
  const rawSecret = getEnvVar('SYNC_SECRET') || getEnvVar('CRON_SECRET') || '';
  const syncSecret = rawSecret.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');

  if (!syncSecret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: SYNC_SECRET belum dikonfigurasi di environment.' },
      { status: 500 }
    );
  }

  // Wajib dan HANYA melalui HTTP Header: Authorization Bearer atau x-sync-secret.
  // Query string ?secret= TIDAK didukung demi keamanan.
  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-sync-secret');

  let providedToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (customHeader) {
    providedToken = customHeader.trim();
  }

  if (!providedToken || !timingSafeCompare(providedToken, syncSecret)) {
    return NextResponse.json(
      { error: 'Unauthorized: Akses ditolak. Secret tidak valid atau tidak disertakan dalam header.' },
      { status: 401 }
    );
  }

  try {
    console.log('[Sync Outlets] Memulai sinkronisasi seluruh outlet dari KK ke Supabase...');
    const result = await syncOutletsToDb();

    console.log('[Sync Outlets] Membersihkan generic_cache yang kedaluwarsa > 7 hari...');
    const purgedCacheCount = await cacheService.cleanExpiredEntries(7);

    console.log(
      `[Sync Outlets] Selesai: ${result.syncedCount} outlet tersinkronisasi, ${purgedCacheCount} cache usang dibersihkan dalam ${result.durationMs}ms.`
    );

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi daftar outlet dan pembersihan cache usang berhasil.',
      syncedCount: result.syncedCount,
      purgedCacheCount,
      durationMs: result.durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[Sync Outlets] Gagal sinkronisasi: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'Gagal melakukan sinkronisasi outlet' },
      { status: 500 }
    );
  }
}
