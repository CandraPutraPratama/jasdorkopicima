import { verifyAdminAuth } from '../../../../lib/admin-auth.ts';
import {
  getMinOrder50kMode,
  setMinOrder50kMode,
  getOperationalOverride,
  setOperationalOverride,
  setSiteSetting,
  SiteSettingsError,
  type OperationalOverride,
} from '../../../../lib/site-settings.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return Response.json(
      { error: 'Akses ditolak: otorisasi admin diperlukan' },
      { status: 401 }
    );
  }

  try {
    const [minOrder50k, operationalOverride] = await Promise.all([
      getMinOrder50kMode(),
      getOperationalOverride(),
    ]);

    return Response.json(
      {
        success: true,
        settings: {
          min_order_50k_mode: minOrder50k,
          bundling_only_mode: minOrder50k,
          operational_override: operationalOverride,
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
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return Response.json(
      { error: 'Akses ditolak: otorisasi admin diperlukan' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  try {
    let modeUpdated: boolean | null = null;
    let overrideUpdated: OperationalOverride | null = null;

    if (typeof body.operational_override === 'string') {
      overrideUpdated = await setOperationalOverride(body.operational_override as OperationalOverride);
    }

    if (typeof body.min_order_50k_mode === 'boolean') {
      modeUpdated = await setMinOrder50kMode(body.min_order_50k_mode);
    } else if (typeof body.bundling_only_mode === 'boolean') {
      modeUpdated = await setMinOrder50kMode(body.bundling_only_mode);
    } else if (typeof body.key === 'string' && typeof body.value === 'string') {
      if (body.key === 'operational_override') {
        overrideUpdated = await setOperationalOverride(body.value as OperationalOverride);
      } else {
        await setSiteSetting(body.key, body.value);
        if (body.key === 'min_order_50k_mode' || body.key === 'bundling_only_mode') {
          modeUpdated = body.value.trim().toLowerCase() === 'true';
        }
      }
    } else if (overrideUpdated === null) {
      return Response.json(
        { error: 'Parameter operational_override, min_order_50k_mode / bundling_only_mode, atau key/value wajib disertakan' },
        { status: 400 }
      );
    }

    const [currentMode, currentOverride] = await Promise.all([
      modeUpdated !== null ? Promise.resolve(modeUpdated) : getMinOrder50kMode(),
      overrideUpdated !== null ? Promise.resolve(overrideUpdated) : getOperationalOverride(),
    ]);

    return Response.json({
      success: true,
      message: 'Pengaturan situs berhasil diperbarui',
      settings: {
        min_order_50k_mode: currentMode,
        bundling_only_mode: currentMode,
        operational_override: currentOverride,
      },
    });
  } catch (err: unknown) {
    console.error('[AdminSiteSettings] Gagal menyimpan pengaturan:', err);
    if (err instanceof SiteSettingsError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return Response.json({ error: message }, { status: 500 });
  }
}

