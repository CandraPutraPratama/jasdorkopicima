import { verifyAdminAuth } from '../../../../lib/admin-auth.ts';
import { adminJson } from '../../../../lib/admin-response.ts';
import {
  getMinOrder50kMode,
  setMinOrder50kMode,
  getOperationalOverride,
  setOperationalOverride,
  getAllBrandActiveStatuses,
  setBrandActiveStatus,
  setSiteSetting,
  SiteSettingsError,
  type OperationalOverride,
} from '../../../../lib/site-settings.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await verifyAdminAuth(request))) {
    return adminJson(
      { error: 'Akses ditolak: otorisasi admin diperlukan' },
      { status: 401 }
    );
  }

  try {
    const [minOrder50k, operationalOverride, brandStatus] = await Promise.all([
      getMinOrder50kMode(),
      getOperationalOverride(),
      getAllBrandActiveStatuses(),
    ]);

    return adminJson(
      {
        success: true,
        settings: {
          min_order_50k_mode: minOrder50k,
          bundling_only_mode: minOrder50k,
          operational_override: operationalOverride,
          brand_status: brandStatus,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan';
    return adminJson({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminAuth(request))) {
    return adminJson(
      { error: 'Akses ditolak: otorisasi admin diperlukan' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  try {
    let modeUpdated: boolean | null = null;
    let overrideUpdated: OperationalOverride | null = null;
    let brandUpdated = false;

    if (typeof body.operational_override === 'string') {
      overrideUpdated = await setOperationalOverride(body.operational_override as OperationalOverride);
    }

    if (typeof body.min_order_50k_mode === 'boolean') {
      modeUpdated = await setMinOrder50kMode(body.min_order_50k_mode);
    } else if (typeof body.bundling_only_mode === 'boolean') {
      modeUpdated = await setMinOrder50kMode(body.bundling_only_mode);
    }

    if (typeof body.brand_slug === 'string' && typeof body.is_active === 'boolean') {
      await setBrandActiveStatus(body.brand_slug, body.is_active);
      brandUpdated = true;
    } else if (body.brand_status && typeof body.brand_status === 'object') {
      await Promise.all(
        Object.entries(body.brand_status as Record<string, unknown>).map(([slug, active]) =>
          setBrandActiveStatus(slug, Boolean(active))
        )
      );
      brandUpdated = true;
    }

    if (typeof body.key === 'string' && typeof body.value === 'string') {
      if (body.key === 'operational_override') {
        overrideUpdated = await setOperationalOverride(body.value as OperationalOverride);
      } else {
        await setSiteSetting(body.key, body.value);
        if (body.key === 'min_order_50k_mode' || body.key === 'bundling_only_mode') {
          modeUpdated = body.value.trim().toLowerCase() === 'true';
        }
      }
    } else if (overrideUpdated === null && modeUpdated === null && !brandUpdated) {
      return adminJson(
        { error: 'Parameter operational_override, min_order_50k_mode, brand_slug/is_active, atau key/value wajib disertakan' },
        { status: 400 }
      );
    }

    const [currentMode, currentOverride, currentBrandStatus] = await Promise.all([
      modeUpdated !== null ? Promise.resolve(modeUpdated) : getMinOrder50kMode(),
      overrideUpdated !== null ? Promise.resolve(overrideUpdated) : getOperationalOverride(),
      getAllBrandActiveStatuses(),
    ]);

    return adminJson({
      success: true,
      message: 'Pengaturan situs berhasil diperbarui',
      settings: {
        min_order_50k_mode: currentMode,
        bundling_only_mode: currentMode,
        operational_override: currentOverride,
        brand_status: currentBrandStatus,
      },
    });
  } catch (err: unknown) {
    console.error('[AdminSiteSettings] Gagal menyimpan pengaturan:', err);
    if (err instanceof SiteSettingsError) {
      return adminJson({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return adminJson({ error: message }, { status: 500 });
  }
}

