import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('UI Audit Improvements verification', async (t) => {
  await t.test('CartDrawer only crosses out original price value, not the label', () => {
    const code = fs.readFileSync(path.resolve('src/components/CartDrawer.tsx'), 'utf-8');
    // Ensure parent div does not have line-through
    assert.ok(
      !code.includes('Total Harga Normal</span>\n                  <span>'),
      'Parent div must not have line-through affecting the label'
    );
    assert.ok(
      code.includes('<span>Total Harga Normal</span>\n                  <span className="line-through">'),
      'Only the price amount span should have line-through'
    );
  });

  await t.test('ProductCard and ProductBottomSheet provide graceful coffee fallback on error or missing image', () => {
    const cardCode = fs.readFileSync(path.resolve('src/components/ProductCard.tsx'), 'utf-8');
    const sheetCode = fs.readFileSync(path.resolve('src/components/ProductBottomSheet.tsx'), 'utf-8');

    assert.ok(cardCode.includes('imageFailed'), 'ProductCard must have imageFailed state');
    assert.ok(cardCode.includes('onError={() => setImageFailed(true)}'), 'ProductCard must catch image loading errors');
    assert.ok(cardCode.includes('Jasdor'), 'ProductCard fallback must include Jasdor badge/text');

    assert.ok(sheetCode.includes('imageFailed'), 'ProductBottomSheet must have imageFailed state');
    assert.ok(sheetCode.includes('onError={() => setImageFailed(true)}'), 'ProductBottomSheet must catch image loading errors');
  });

  await t.test('BrandCard balances layout: active brand spans 2 columns, coming soon brands span 1 column', () => {
    const code = fs.readFileSync(path.resolve('src/components/BrandCard.tsx'), 'utf-8');
    assert.ok(code.includes('col-span-2'), 'Active brand must span 2 columns as a hero card');
    assert.ok(code.includes('col-span-1'), 'Upcoming brands must span 1 column');
    assert.ok(code.includes('Pilih Outlet'), 'Hero active brand card must provide clear CTA button');
  });

  await t.test('Strict Invariant: zero em dashes in src', () => {
    const srcDir = path.resolve('src');
    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          assert.ok(
            !content.includes('\u2014'),
            `File ${fullPath} must not contain em dashes (\u2014)`
          );
        }
      }
    }
    scanDir(srcDir);
  });
});
