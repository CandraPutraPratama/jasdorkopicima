import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Regresi Error 1102 (CPU 10 ms di Workers Free).
 * Dari Observability: favicon.ico, manifest.webmanifest, prefetch ?_rsc= dan
 * polling site-settings ikut memakan CPU Worker padahal bisa dilayani gratis
 * sebagai aset statis atau tidak perlu dipanggil sama sekali.
 */

const root = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(root, rel));

describe("aset statis tidak lewat Worker", () => {
  it("favicon.ico tersedia sebagai file statis di public/", () => {
    assert.ok(exists("public/favicon.ico"));
  });

  it("manifest.webmanifest statis valid dan route dinamis dihapus", () => {
    assert.ok(exists("public/manifest.webmanifest"));
    assert.equal(exists("src/app/manifest.ts"), false);

    const manifest = JSON.parse(read("public/manifest.webmanifest"));
    assert.equal(manifest.short_name, "Jasdor");
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.display, "standalone");
    const purposes = manifest.icons.map(
      (i: { purpose?: string }) => i.purpose ?? "any",
    );
    assert.ok(purposes.includes("maskable"));
    for (const icon of manifest.icons) {
      assert.ok(exists(`public${icon.src}`), `ikon hilang: ${icon.src}`);
    }
  });
});

describe("prefetch Link dimatikan di alur publik", () => {
  const FILES = [
    "src/components/OutletSearchCard.tsx",
    "src/components/BrandCard.tsx",
    "src/components/Header.tsx",
    "src/components/ActiveOrderBanner.tsx",
    "src/components/TrustStrip.tsx",
    "src/components/MyOrdersView.tsx",
    "src/app/[brandSlug]/page.tsx",
    "src/app/outlet/[code]/page.tsx",
  ];

  for (const file of FILES) {
    it(`setiap <Link> di ${file} memakai prefetch={false}`, () => {
      const src = read(file);
      const links = (src.match(/<Link\b/g) ?? []).length;
      const off = (src.match(/<Link\b[^]*?prefetch=\{false\}/g) ?? []).length;
      assert.ok(links > 0);
      const count = (src.match(/prefetch=\{false\}/g) ?? []).length;
      assert.equal(
        count,
        links,
        `${file}: ${links} Link, ${count} prefetch={false} (${off})`,
      );
    });
  }
});

describe("polling site-settings tidak lebih sering dari 3 menit", () => {
  for (const file of [
    "src/hooks/useBrandStatus.ts",
    "src/hooks/useBundlingOnlyMode.ts",
  ]) {
    it(`${file} memakai interval >= 180000 ms dan berhenti saat tab tersembunyi`, () => {
      const src = read(file);
      const m = src.match(/setInterval\([^,]+,\s*(\d+)\)/);
      assert.ok(m, "setInterval tidak ditemukan");
      assert.ok(Number(m[1]) >= 180000, `interval terlalu pendek: ${m[1]}`);
      assert.match(src, /visibilityState\s*!==\s*['"]visible['"]\)\s*return/);
    });
  }
});
