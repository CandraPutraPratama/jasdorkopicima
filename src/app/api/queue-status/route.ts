import { getSupabaseServerClient } from '../../../lib/supabase-server.ts';
import { getStartOfTodayWIB } from '../../../lib/order-stats.ts';
import { QUEUE_ACTIVE_STATUSES, computeQueueStats } from '../../../lib/queue.ts';

export const dynamic = 'force-dynamic';

/**
 * Status antrean pemrosesan order untuk ditampilkan ke pelanggan.
 * Hanya mengembalikan angka agregat (jumlah order aktif, total item,
 * estimasi) - tidak ada data pelanggan apa pun.
 * Order yang dihitung: HANYA status diproses (yang benar-benar sedang
 * dibuat admin), dibuat hari ini (WIB). Order yang sudah ditandai selesai,
 * kedaluwarsa/dibatalkan, dan order kemarin tidak dihitung.
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const startOfTodayWIB = getStartOfTodayWIB();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase queue-status query timeout')), 5000)
    );

    const queryPromise = supabase
      .from('orders')
      .select('items')
      .in('status', [...QUEUE_ACTIVE_STATUSES])
      .gte('created_at', startOfTodayWIB);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      throw new Error(error.message);
    }

    const stats = computeQueueStats(data ?? []);

    return Response.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    // Gagal membaca antrean: jangan tampilkan angka karangan ke pelanggan.
    console.warn('[QueueStatus API] Gagal memuat status antrean:', error);
    return Response.json(
      { error: 'queue_unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
