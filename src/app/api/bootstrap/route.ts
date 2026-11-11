import { NextRequest, NextResponse } from 'next/server.js';
import {
  getEffectiveJasdorOperationalStatus,
  resolveOperationalStatusWithSimulation,
} from '../../../lib/operational.ts';
import {
  getMinOrder50kMode,
  getOperationalOverride,
  getAllBrandActiveStatuses,
  type OperationalOverride,
} from '../../../lib/site-settings.ts';
import { isMinOrder50kMode } from '../../../lib/feature-flags.ts';
import { TOTAL_ORDERS_BASELINE } from '../../../lib/site-config.ts';
import { getStartOfTodayWIB } from '../../../lib/order-stats.ts';
import {
  getSupabaseServerClient,
  isCustomSupabaseClientInstance,
} from '../../../lib/supabase-server.ts';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit.ts';

export const dynamic = 'force-dynamic';

interface CachedCounts {
  today: number;
  total: number;
  expiresAt: number;
}

let memoryCachedCounts: CachedCounts | null = null;
const COUNTS_MEMORY_TTL_MS = 60_000;

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`bootstrap:${clientIp}`, {
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

  const simulateParam = request.nextUrl.searchParams.get('simulate');

  // 1. Ambil Pengaturan Situs & Override (dengan in-memory cache isolate Worker)
  let minOrder50k = false;
  let operationalOverride: OperationalOverride = 'auto';
  let brandStatus: Record<string, boolean> = {
    'kopi-kenangan': true,
    fore: true,
    tomoro: true,
  };

  try {
    const [mMode, opOver, bStatus] = await Promise.all([
      getMinOrder50kMode(),
      getOperationalOverride(),
      getAllBrandActiveStatuses(),
    ]);
    minOrder50k = mMode;
    operationalOverride = opOver;
    brandStatus = bStatus;
  } catch (err) {
    console.warn('[Bootstrap API] Menggunakan fallback pengaturan situs:', err);
    minOrder50k = isMinOrder50kMode();
  }

  // 2. Kalkulasi Status Operasional Jasdor
  const baseStatus = getEffectiveJasdorOperationalStatus(new Date(), operationalOverride);
  const operational = resolveOperationalStatusWithSimulation(baseStatus, simulateParam);

  // 3. Ambil Statistik Order (dengan in-memory cache isolate Worker)
  let counts = { today: 0, total: TOTAL_ORDERS_BASELINE };
  const isMock = isCustomSupabaseClientInstance();

  if (!isMock && memoryCachedCounts && Date.now() < memoryCachedCounts.expiresAt) {
    counts = { today: memoryCachedCounts.today, total: memoryCachedCounts.total };
  } else {
    try {
      const supabase = getSupabaseServerClient();
      const startOfTodayWIB = getStartOfTodayWIB();

      const [resToday, resTotal] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfTodayWIB),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true }),
      ]);

      const todayCount = resToday.count ?? 0;
      const dbTotalCount = resTotal.count ?? 0;
      const total = TOTAL_ORDERS_BASELINE + dbTotalCount;

      counts = { today: todayCount, total };

      if (!isMock) {
        memoryCachedCounts = {
          today: todayCount,
          total,
          expiresAt: Date.now() + COUNTS_MEMORY_TTL_MS,
        };
      }
    } catch {
      if (memoryCachedCounts) {
        counts = { today: memoryCachedCounts.today, total: memoryCachedCounts.total };
      }
    }
  }

  return NextResponse.json(
    {
      operational,
      siteSettings: {
        min_order_50k_mode: minOrder50k,
        bundling_only_mode: minOrder50k,
        operational_override: operationalOverride,
        brand_status: brandStatus,
      },
      orderCounts: counts,
    },
    {
      headers: {
        'Cache-Control': simulateParam
          ? 'no-store'
          : 'public, s-maxage=30, stale-while-revalidate=60',
      },
    }
  );
}
