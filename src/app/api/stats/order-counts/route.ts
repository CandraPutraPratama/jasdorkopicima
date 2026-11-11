import { getSupabaseServerClient, isCustomSupabaseClientInstance } from '../../../../lib/supabase-server.ts';
import { TOTAL_ORDERS_BASELINE } from '../../../../lib/site-config.ts';
import { getStartOfTodayWIB } from '../../../../lib/order-stats.ts';

export const dynamic = 'force-dynamic';

interface CachedOrderCounts {
  today: number;
  total: number;
  expiresAt: number;
}

let memoryCachedCounts: CachedOrderCounts | null = null;
const COUNTS_MEMORY_TTL_MS = 60_000; // 60 detik cache di memori isolate Worker

export async function GET() {
  const isMock = isCustomSupabaseClientInstance();
  if (!isMock && memoryCachedCounts && Date.now() < memoryCachedCounts.expiresAt) {
    return Response.json(
      {
        today: memoryCachedCounts.today,
        total: memoryCachedCounts.total,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  }

  try {
    const supabase = getSupabaseServerClient();
    const startOfTodayWIB = getStartOfTodayWIB();

    // Query paralel dengan batas waktu timeout 5 detik
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase order-counts query timeout')), 5000)
    );

    const queryPromise = Promise.all([
      // 1. Orderan hari ini (created_at >= 00:00:00 WIB hari ini)
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfTodayWIB),
      // 2. Total orderan di database
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true }),
    ]);

    const [resToday, resTotal] = await Promise.race([queryPromise, timeoutPromise]);

    const todayCount = resToday.count ?? 0;
    const dbTotalCount = resTotal.count ?? 0;
    const total = TOTAL_ORDERS_BASELINE + dbTotalCount;

    memoryCachedCounts = {
      today: todayCount,
      total,
      expiresAt: Date.now() + COUNTS_MEMORY_TTL_MS,
    };

    return Response.json(
      {
        today: todayCount,
        total,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.warn('[Stats API] Menggunakan fallback baseline karena error:', error);
    if (memoryCachedCounts) {
      return Response.json(
        {
          today: memoryCachedCounts.today,
          total: memoryCachedCounts.total,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      );
    }
    return Response.json(
      {
        today: 0,
        total: TOTAL_ORDERS_BASELINE,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  }
}
