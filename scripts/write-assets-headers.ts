import fs from 'node:fs';
import path from 'node:path';
import { buildSecurityHeaders } from '../src/lib/security-headers.ts';

/**
 * Menulis file `_headers` ke direktori static assets Cloudflare.
 *
 * Kenapa perlu: halaman info statis (/faq, /kontak, /syarat-ketentuan,
 * /kebijakan-privasi, /testimoni) disajikan langsung oleh Cloudflare Assets
 * tanpa melewati Worker, sehingga header dari `next.config.ts` tidak menempel.
 * Cloudflare Assets mendukung file `_headers` untuk kasus ini.
 *
 * Sumber kebijakan tetap satu: `src/lib/security-headers.ts`, supaya header
 * Worker dan header static tidak pernah berbeda.
 */

const projectRoot = process.cwd();
const assetsDir = path.join(projectRoot, '.open-next', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error(
    `[write-assets-headers] Direktori ${assetsDir} tidak ditemukan. Jalankan opennextjs-cloudflare build lebih dulu.`
  );
  process.exit(1);
}

const headers = buildSecurityHeaders({ isProduction: true });

const lines = [
  '# Dihasilkan otomatis oleh scripts/write-assets-headers.ts',
  '# Jangan diedit manual; ubah src/lib/security-headers.ts lalu build ulang.',
  '/*',
  ...headers.map((h) => `  ${h.key}: ${h.value}`),
  '',
];

const target = path.join(assetsDir, '_headers');
fs.writeFileSync(target, lines.join('\n'), 'utf8');

console.log(
  `[write-assets-headers] _headers ditulis dengan ${headers.length} header ke ${target}`
);
