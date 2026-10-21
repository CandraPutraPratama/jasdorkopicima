import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { autoCancelEodOrders } from '@/lib/order-service';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnvVar } from '@/lib/env';

/**
 * Perbandingan string waktu-konstan untuk mencegah timing attack.
 */
function timingSafeCompare(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, 'utf-8');
  const expectedBuf = Buffer.from(expected, 'utf-8');

  if (providedBuf.length !== expectedBuf.length) {
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await verifyAdminAuth(request)) {
    return true;
  }

  const rawSecret = getEnvVar('SYNC_SECRET') || getEnvVar('CRON_SECRET') || '';
  const syncSecret = rawSecret.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');

  if (!syncSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-sync-secret');

  let providedToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (customHeader) {
    providedToken = customHeader.trim();
  }

  if (!providedToken) {
    return false;
  }

  return timingSafeCompare(providedToken, syncSecret);
}

async function handleAutoCancel(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { error: 'Unauthorized: Akses ditolak. Token otorisasi tidak valid.' },
      { status: 401 }
    );
  }

  try {
    const result = await autoCancelEodOrders();
    return NextResponse.json({
      success: true,
      message: `Berhasil membatalkan otomatis ${result.updatedCount} pesanan non-final melewati batas hari operasional.`,
      updatedCount: result.updatedCount,
      orderIds: result.orderIds,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[CronAutoCancel] Gagal membatalkan pesanan otomatis:', err);
    return NextResponse.json(
      { error: 'Gagal menjalankan auto-cancel pesanan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleAutoCancel(request);
}
