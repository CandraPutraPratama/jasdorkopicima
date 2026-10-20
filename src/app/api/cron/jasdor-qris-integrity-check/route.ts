import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

/**
 * Hash SHA-256 baseline dari file QRIS SVG resmi di /payment/qris-cima-group.svg.
 */
export const QRIS_STATIC_SVG_SHA256 =
  '9c7e09eb62ec7001de99f0594e97ea52af262bde4e5f35d10530454affd68fcd';

export async function GET(request: Request) {
  return handleIntegrityCheck(request);
}

export async function POST(request: Request) {
  return handleIntegrityCheck(request);
}

async function handleIntegrityCheck(request?: Request) {
  try {
    // Verifikasi File Fallback SVG di public/payment/qris-cima-group.svg
    let svgFileExists = false;
    let svgFileHash: string | null = null;
    let isSvgHashMatch = false;

    // Strategi A: Cek filesystem lokal (berlaku saat dijalankan di Node.js lokal/CI/dev)
    try {
      const svgPath = path.join(process.cwd(), 'public', 'payment', 'qris-cima-group.svg');
      if (fs.existsSync(svgPath)) {
        svgFileExists = true;
        const svgContent = fs.readFileSync(svgPath);
        svgFileHash = crypto.createHash('sha256').update(svgContent).digest('hex');
        isSvgHashMatch = svgFileHash === QRIS_STATIC_SVG_SHA256;
      }
    } catch {
      // Abaikan error fs pada runtime virtual
    }

    // Strategi B: Di Cloudflare Workers, cek binding ASSETS (direktori .open-next/assets)
    if (!svgFileExists) {
      try {
        let assets = (globalThis as any)[Symbol.for('__cloudflare-context__')]?.env?.ASSETS;
        if (!assets) {
          try {
            const { getCloudflareContext } = await import('@opennextjs/cloudflare');
            const cfContext = await getCloudflareContext({ async: true });
            assets = (cfContext?.env as any)?.ASSETS;
          } catch {
            // Abaikan jika tidak di environment Cloudflare / OpenNext
          }
        }

        if (assets && typeof assets.fetch === 'function') {
          const res = await assets.fetch(new URL('/payment/qris-cima-group.svg', 'https://assets.local'));
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 0) {
              svgFileExists = true;
              svgFileHash = crypto.createHash('sha256').update(buffer).digest('hex');
              isSvgHashMatch = svgFileHash === QRIS_STATIC_SVG_SHA256;
            }
          }
        }
      } catch (assetsErr) {
        console.warn('[QRIS Integrity] Gagal membaca dari ASSETS binding:', assetsErr);
      }
    }

    // Strategi C: Fetch via URL publik jika ASSETS binding atau fs belum mendeteksi
    if (!svgFileExists) {
      try {
        const origin = request ? new URL(request.url).origin : 'https://jasdor.cimagroup.my.id';
        const primaryUrl = `${origin}/payment/qris-cima-group.svg`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        let res = await fetch(primaryUrl, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        // Fallback ke domain produksi resmi jika origin lokal tidak mengembalikan status 200
        if (!res.ok && origin !== 'https://jasdor.cimagroup.my.id') {
          res = await fetch('https://jasdor.cimagroup.my.id/payment/qris-cima-group.svg', {
            cache: 'no-store',
          });
        }

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 0) {
            svgFileExists = true;
            svgFileHash = crypto.createHash('sha256').update(buffer).digest('hex');
            isSvgHashMatch = svgFileHash === QRIS_STATIC_SVG_SHA256;
          }
        }
      } catch (fetchErr) {
        console.warn('[QRIS Integrity] Gagal fetch fallback SVG via URL:', fetchErr);
      }
    }

    // Kesimpulan Integritas
    const isAllHealthy = svgFileExists && isSvgHashMatch;

    const responseBody = {
      status: isAllHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      monitors: {
        fallbackSvg: {
          exists: svgFileExists,
          hash: svgFileHash,
          expectedHash: QRIS_STATIC_SVG_SHA256,
          isMatch: isSvgHashMatch,
        },
      },
    };

    return Response.json(responseBody, { status: isAllHealthy ? 200 : 500 });
  } catch (err: any) {
    return Response.json(
      {
        status: 'error',
        error: err?.message || 'Gagal menjalankan monitoring integritas QRIS',
      },
      { status: 500 }
    );
  }
}
