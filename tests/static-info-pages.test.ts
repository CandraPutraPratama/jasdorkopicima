import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Halaman Info Statis & Pengurangan Beban CPU Workers', () => {
  const projectRoot = process.cwd();

  const INFO_PAGES = [
    'src/app/faq/page.tsx',
    'src/app/syarat-ketentuan/page.tsx',
    'src/app/kebijakan-privasi/page.tsx',
    'src/app/kontak/page.tsx',
    'src/app/testimoni/page.tsx',
  ];

  test('semua 5 halaman info meng-export dynamic = force-static', () => {
    for (const pageRelPath of INFO_PAGES) {
      const fullPath = path.join(projectRoot, pageRelPath);
      assert.ok(fs.existsSync(fullPath), `File ${pageRelPath} harus ada`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.match(
        content,
        /export\s+const\s+dynamic\s*=\s*['"]force-static['"]/,
        `File ${pageRelPath} wajib memiliki export const dynamic = 'force-static'`
      );
    }
  });

  test('semua 5 halaman info meng-export metadata dengan title dan description', () => {
    for (const pageRelPath of INFO_PAGES) {
      const fullPath = path.join(projectRoot, pageRelPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.match(
        content,
        /export\s+const\s+metadata/,
        `File ${pageRelPath} wajib memiliki export const metadata`
      );
      assert.match(content, /title:/, `File ${pageRelPath} wajib memiliki field title pada metadata`);
      assert.match(content, /description:/, `File ${pageRelPath} wajib memiliki field description pada metadata`);
    }
  });

  test('testimoni/page.tsx adalah Server Component dan me-render TestimoniGalleryView', () => {
    const fullPath = path.join(projectRoot, 'src/app/testimoni/page.tsx');
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.doesNotMatch(content, /^\s*['"]use client['"]/, 'testimoni/page.tsx tidak boleh memiliki "use client"');
    assert.match(content, /TestimoniGalleryView/, 'testimoni/page.tsx harus me-render TestimoniGalleryView');

    const componentPath = path.join(projectRoot, 'src/components/TestimoniGalleryView.tsx');
    assert.ok(fs.existsSync(componentPath), 'TestimoniGalleryView.tsx harus ada');
    const compContent = fs.readFileSync(componentPath, 'utf-8');
    assert.match(compContent, /^\s*['"]use client['"]/, 'TestimoniGalleryView.tsx harus memiliki "use client"');
  });

  test('Footer.tsx mematikan prefetch untuk link info (prefetch={false})', () => {
    const footerPath = path.join(projectRoot, 'src/components/Footer.tsx');
    const content = fs.readFileSync(footerPath, 'utf-8');
    assert.match(
      content,
      /<Link[\s\S]*?prefetch=\{false\}[\s\S]*?>[\s\S]*?\{link\.label\}[\s\S]*?<\/Link>/,
      'Footer.tsx harus menggunakan prefetch={false} pada link info'
    );
  });

  test('TrustStrip.tsx mematikan prefetch untuk /testimoni (prefetch={false})', () => {
    const trustStripPath = path.join(projectRoot, 'src/components/TrustStrip.tsx');
    const content = fs.readFileSync(trustStripPath, 'utf-8');
    assert.match(
      content,
      /<Link[\s\S]*?href="\/testimoni"[\s\S]*?prefetch=\{false\}[\s\S]*?>/,
      'TrustStrip.tsx harus menggunakan prefetch={false} pada link /testimoni'
    );
  });

  test('wrangler.jsonc memuat konfigurasi observability logs', () => {
    const wranglerPath = path.join(projectRoot, 'wrangler.jsonc');
    const content = fs.readFileSync(wranglerPath, 'utf-8');
    assert.match(content, /"observability"\s*:\s*\{/, 'wrangler.jsonc harus memuat observability');
    assert.match(content, /"logs"\s*:\s*\{/, 'wrangler.jsonc observability harus memuat logs');
    assert.match(content, /"enabled"\s*:\s*true/, 'wrangler.jsonc logs harus enabled: true');
    assert.match(content, /"invocation_logs"\s*:\s*true/, 'wrangler.jsonc logs harus invocation_logs: true');
  });

  test('tidak ada em dash (— / U+2014) di TestimoniGalleryView dan script baru', () => {
    const filesToCheck = [
      'src/components/TestimoniGalleryView.tsx',
      'src/app/testimoni/page.tsx',
      'scripts/copy-static-info-assets.mjs',
    ];
    for (const f of filesToCheck) {
      const fullPath = path.join(projectRoot, f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.doesNotMatch(content, /\u2014/, `File ${f} tidak boleh memuat karakter em dash (U+2014)`);
    }
  });
});
