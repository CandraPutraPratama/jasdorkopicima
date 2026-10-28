import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import robots from '../src/app/robots.ts';

describe('SEO & Metadata: Jasdor Kopi Cima', () => {
  const layoutPath = path.resolve('src/app/layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  describe('Metadata Titles & Descriptions', () => {
    it('memuat kata kunci "Jasdor Kopi Cima" pada default title', () => {
      assert.match(
        layoutContent,
        /default:\s*['"][^'"]*Jasdor Kopi Cima[^'"]*['"]/,
        'Default title pada layout.tsx harus memuat "Jasdor Kopi Cima"'
      );
    });

    it('memuat terminologi resmi "jasa order" dan bukan "jastip"', () => {
      assert.match(
        layoutContent,
        /description:\s*['"][^'"]*jasa order[^'"]*['"]/i,
        'Description harus memuat "jasa order"'
      );
      assert.doesNotMatch(
        layoutContent,
        /jastip/i,
        'Description dilarang memuat kata "jastip"'
      );
    });

    it('Open Graph siteName dan title memuat "Jasdor Kopi Cima"', () => {
      assert.match(
        layoutContent,
        /siteName:\s*['"][^'"]*Jasdor Kopi Cima[^'"]*['"]/,
        'OG siteName harus memuat "Jasdor Kopi Cima"'
      );
      assert.match(
        layoutContent,
        /title:\s*['"][^'"]*Jasdor Kopi Cima[^'"]*['"]/,
        'OG title harus memuat "Jasdor Kopi Cima"'
      );
    });

    it('memuat Schema.org JSON-LD terstruktur untuk Googlebot', () => {
      assert.match(
        layoutContent,
        /application\/ld\+json/,
        'Layout harus menyertakan script application/ld+json'
      );
      assert.match(
        layoutContent,
        /https:\/\/schema\.org/,
        'Script JSON-LD harus menggunakan context schema.org'
      );
    });
  });

  describe('Robots.txt & Sitemap', () => {
    it('melindungi direktori /api/ dari crawler Google', () => {
      const config = robots();
      assert.ok(config.rules, 'Rules robots wajib ada');
      const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
      const disallowed = rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : [r.disallow]));

      assert.ok(disallowed.includes('/api/'), 'Disallow harus memuat /api/');
    });

    it('mengarahkan sitemap ke URL absolut yang benar', () => {
      const config = robots();
      assert.equal(config.sitemap, 'https://jasdor.cimagroup.my.id/sitemap.xml');
    });
  });
});
