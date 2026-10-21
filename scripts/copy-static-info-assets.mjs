import fs from 'node:fs';
import path from 'node:path';

/**
 * Script untuk menyalin file HTML dan RSC hasil prerender SSG halaman info
 * (.next/server/app/) ke direktori static assets Cloudflare (.open-next/assets/)
 * sehingga disajikan langsung oleh CDN Cloudflare Assets tanpa invoke Cloudflare Worker.
 *
 * Halaman info statis yang disalin:
 * - /faq
 * - /syarat-ketentuan
 * - /kebijakan-privasi
 * - /kontak
 * - /testimoni
 *
 * Sesuai aturan: halaman lain (/, /[brandSlug], /outlet/[code], /bayar, /pesanan-saya, /admin)
 * TIDAK disentuh.
 */

const STATIC_INFO_ROUTES = [
  'faq',
  'syarat-ketentuan',
  'kebijakan-privasi',
  'kontak',
  'testimoni',
];

const projectRoot = process.cwd();
const serverAppDir = path.join(projectRoot, '.next', 'server', 'app');
const assetsDir = path.join(projectRoot, '.open-next', 'assets');

if (!fs.existsSync(serverAppDir)) {
  console.error(`[copy-static-info-assets] Error: Direktori ${serverAppDir} tidak ditemukan!`);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('[copy-static-info-assets] Menyalin file prerender SSG halaman info ke .open-next/assets...');

let copiedCount = 0;

for (const route of STATIC_INFO_ROUTES) {
  const htmlSrc = path.join(serverAppDir, `${route}.html`);
  const rscSrc = path.join(serverAppDir, `${route}.rsc`);

  if (!fs.existsSync(htmlSrc)) {
    console.warn(`[copy-static-info-assets] Peringatan: ${htmlSrc} tidak ditemukan!`);
    continue;
  }

  // 1. Salin ke .open-next/assets/<route>.html
  const htmlDest = path.join(assetsDir, `${route}.html`);
  fs.copyFileSync(htmlSrc, htmlDest);
  copiedCount++;

  // 2. Salin ke .open-next/assets/<route>/index.html untuk direktori clean URL
  const routeDir = path.join(assetsDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  const indexHtmlDest = path.join(routeDir, 'index.html');
  fs.copyFileSync(htmlSrc, indexHtmlDest);
  copiedCount++;

  // 3. Salin .rsc jika ada untuk RSC payload request
  if (fs.existsSync(rscSrc)) {
    const rscDest = path.join(assetsDir, `${route}.rsc`);
    fs.copyFileSync(rscSrc, rscDest);
    
    // Juga salin ke <route>/index.txt atau <route>.txt jika diperlukan oleh Next.js client router
    const rscInDir = path.join(routeDir, 'index.rsc');
    fs.copyFileSync(rscSrc, rscInDir);
    copiedCount += 2;
  }

  console.log(`[copy-static-info-assets] ✓ Berhasil menyalin asset SSG untuk /${route}`);
}

console.log(`[copy-static-info-assets] Selesai. Total ${copiedCount} file asset berhasil disalin ke .open-next/assets.`);
