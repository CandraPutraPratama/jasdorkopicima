import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const brandPageCode = fs.readFileSync(
  path.resolve('src/app/[brandSlug]/page.tsx'),
  'utf-8'
);

test('BrandPage: mengintegrasikan fitur anti-typo / fuzzy search suggestion', () => {
  // 1. Memeriksa state fuzzySuggestion
  assert.ok(
    brandPageCode.includes('fuzzySuggestion'),
    'BrandPage harus memiliki state fuzzySuggestion'
  );

  // 2. Memeriksa penangkapan suggestion dari respon pencarian
  assert.ok(
    brandPageCode.includes('setFuzzySuggestion((items as any).suggestion || null)'),
    'BrandPage harus menangkap suggestion dari provider pencarian'
  );

  // 3. Memeriksa banner visual tip kemiripan typo
  assert.ok(
    brandPageCode.includes('Menampilkan hasil yang mirip dengan:'),
    'BrandPage harus menampilkan banner hasil yang mirip saat ada typo'
  );

  // 4. Memeriksa tidak ada em dash (U+2014)
  assert.ok(
    !brandPageCode.includes('—'),
    'BrandPage tidak boleh memuat em dash'
  );
});

