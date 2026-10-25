import {
  getMinOrder50kMode,
  getOperationalOverride,
  getAllBrandActiveStatuses,
} from '../../../lib/site-settings.ts';
import { isMinOrder50kMode } from '../../../lib/feature-flags.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [minOrder50k, operationalOverride, brandStatus] = await Promise.all([
      getMinOrder50kMode(),
      getOperationalOverride(),
      getAllBrandActiveStatuses(),
    ]);

    return Response.json(
      {
        min_order_50k_mode: minOrder50k,
        bundling_only_mode: minOrder50k,
        operational_override: operationalOverride,
        brand_status: brandStatus,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: unknown) {
    console.error('[API site-settings] Gagal membaca pengaturan situs:', err);
    const fallback = isMinOrder50kMode();
    return Response.json(
      {
        min_order_50k_mode: fallback,
        bundling_only_mode: fallback,
        operational_override: 'auto',
        brand_status: {
          'kopi-kenangan': true,
          'fore': true,
          'tomoro': true,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
