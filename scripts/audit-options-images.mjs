import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROGRESS_FILE = path.resolve(__dirname, 'audit-tahap-7a-progress.json');
const MANIFEST_7B_FILE = path.resolve(__dirname, '../docs/images-manifest.json');
const OPTIONS_IMAGES_FILE = path.resolve(__dirname, 'options-images-inventory.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('=== LANGKAH 1: INVENTARIS GAMBAR ENDPOINT OPSI PRODUK ===\n');

  // 1. Muat progress 7-A
  console.log('1. Membaca data menu dari audit-tahap-7a-progress.json...');
  const rawProgress = await fs.readFile(PROGRESS_FILE, 'utf8');
  const progressData = JSON.parse(rawProgress);

  // Kumpulkan semua bundle unik beserta outlet yang menjualnya
  const bundleMap = new Map(); // bundleCode -> { bundleCode, name, outletCodes: [] }
  for (const [outletCode, outletInfo] of Object.entries(progressData)) {
    if (!outletInfo.products) continue;
    for (const p of outletInfo.products) {
      if (!bundleMap.has(p.bundleCode)) {
        bundleMap.set(p.bundleCode, {
          bundleCode: p.bundleCode,
          name: p.name,
          outletCodes: [],
        });
      }
      bundleMap.get(p.bundleCode).outletCodes.push(outletCode);
    }
  }

  console.log(`Ditemukan ${bundleMap.size} bundle produk unik di seluruh outlet in-scope.\n`);

  // 2. Siapkan pemetaan store_code -> outlet_id dari Supabase
  console.log('2. Mengambil ID outlet dari Supabase...');
  const supabase = getSupabaseServerClient();
  const { data: outletsDb, error: dbErr } = await supabase
    .from('outlets')
    .select('id, code, name')
    .eq('is_in_scope', true);

  if (dbErr || !outletsDb) {
    throw new Error(`Gagal membaca outlet dari DB: ${dbErr?.message}`);
  }

  const outletIdMap = new Map();
  for (const o of outletsDb) {
    outletIdMap.set(o.code, o.id);
  }

  // Muat progress inventory jika ada
  let cachedInventory = {
    scannedBundles: {}, // bundleCode -> data
    allProductImages: {},
    allAddonIcons: {},
    allDimensionIcons: {},
  };
  try {
    const rawInv = await fs.readFile(OPTIONS_IMAGES_FILE, 'utf8');
    cachedInventory = JSON.parse(rawInv);
    console.log(`Melanjutkan dari inventaris sebelumnya: ${Object.keys(cachedInventory.scannedBundles).length} bundle sudah tersimpan.`);
  } catch {
    // Belum ada cache
  }

  // 3. Iterasi tiap bundleCode dan panggil getProductOptions
  console.log('3. Mengambil options untuk semua bundle unik...');
  const bundles = Array.from(bundleMap.values());
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < bundles.length; i++) {
    const b = bundles[i];
    if (cachedInventory.scannedBundles[b.bundleCode]) {
      continue;
    }

    // Pilih outlet pertama yang valid ID-nya
    let targetCode = null;
    let targetId = null;
    for (const oc of b.outletCodes) {
      if (outletIdMap.has(oc)) {
        targetCode = oc;
        targetId = outletIdMap.get(oc);
        break;
      }
    }

    if (!targetCode || !targetId) {
      console.warn(`[Skip] Bundle ${b.bundleCode} (${b.name}) tidak punya outlet valid.`);
      failCount++;
      continue;
    }

    try {
      const rawOptions = await kkApiClient.getProductOptions(targetId, targetCode, b.bundleCode);
      const productImg = rawOptions.base_product?.image || '';
      
      const addonIcons = [];
      const addonGroups = Array.isArray(rawOptions.product_addon_wording)
        ? rawOptions.product_addon_wording
        : rawOptions.product_addon_wording?.addon_wordings || [];
      for (const g of addonGroups) {
        for (const item of g.dimension_value_wordings || []) {
          if (item.value_icon) addonIcons.push({ name: item.value_text, icon: item.value_icon });
        }
      }

      const dimIcons = [];
      const dimGroups = rawOptions.product_dimension_wording?.dimension_wordings || [];
      for (const d of dimGroups) {
        for (const v of d.dimension_value_wordings || []) {
          if (v.icon) dimIcons.push({ dimension: d.dimension_text, name: v.value_text, icon: v.icon });
        }
      }

      cachedInventory.scannedBundles[b.bundleCode] = {
        name: b.name,
        outletCode: targetCode,
        productImage: productImg,
        addonIcons,
        dimIcons,
      };

      if (productImg) cachedInventory.allProductImages[productImg] = b.name;
      for (const a of addonIcons) cachedInventory.allAddonIcons[a.icon] = a.name;
      for (const d of dimIcons) cachedInventory.allDimensionIcons[d.icon] = `${d.dimension}: ${d.name}`;

      successCount++;
      process.stdout.write(`\r   [${i + 1}/${bundles.length}] ${b.name} (${targetCode}) - OK`);

      // Jeda sopan 100ms
      await delay(100);

      // Simpan berkala setiap 20 item
      if (successCount % 20 === 0) {
        await fs.writeFile(OPTIONS_IMAGES_FILE, JSON.stringify(cachedInventory, null, 2), 'utf8');
      }
    } catch (err) {
      console.error(`\n   [Error] Bundle ${b.bundleCode} (${b.name}) pada ${targetCode}: ${err.message}`);
      failCount++;
      await delay(500);
    }
  }

  // Simpan akhir
  await fs.writeFile(OPTIONS_IMAGES_FILE, JSON.stringify(cachedInventory, null, 2), 'utf8');
  console.log(`\n\nSelesai pemindaian bundle: ${Object.keys(cachedInventory.scannedBundles).length} tersimpan.`);

  // 4. Kumpulkan & Deduplikasi semua URL
  const productImages = Object.keys(cachedInventory.allProductImages);
  const addonIcons = Object.keys(cachedInventory.allAddonIcons);
  const dimensionIcons = Object.keys(cachedInventory.allDimensionIcons);

  console.log('\n--- HASIL INVENTARIS AWAL ---');
  console.log(`Total URL product.image unik: ${productImages.length}`);
  console.log(`Total URL addons[].icon unik: ${addonIcons.length}`);
  console.log(`Total URL dimensions[].values[].icon unik: ${dimensionIcons.length}`);

  // 5. Muat manifest 7-B untuk perbandingan
  const manifest7bRaw = await fs.readFile(MANIFEST_7B_FILE, 'utf8');
  const manifest7b = JSON.parse(manifest7bRaw);
  const manifestUrls = new Set(manifest7b.items.map((it) => it.sourceUrl));
  const manifestUuids = new Set(manifest7b.items.map((it) => it.uuid));

  // Klasifikasi URL
  function classify(url) {
    const clean = url.trim();
    const uuidMatch = clean.match(/\/(?:product|public)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    const attrMatch = clean.match(/\/attribute(?:_image)?\/([^/?#]+)/i);

    if (uuidMatch) {
      return { type: 'uuid', key: uuidMatch[1].toLowerCase(), pattern: clean.includes('/public/') ? 'public-uuid' : 'product-uuid' };
    }
    if (attrMatch) {
      return { type: 'attribute', key: attrMatch[1], pattern: 'attribute-filename' };
    }
    return { type: 'other', key: clean, pattern: 'unknown' };
  }

  const allUrls = new Set([...productImages, ...addonIcons, ...dimensionIcons]);
  console.log(`\nTotal URL Gambar Opsi Gabungan (Dedupe): ${allUrls.size}`);

  const report = {
    productImages: { total: productImages.length, alreadyInR2: 0, notInR2: 0, items: [] },
    addonIcons: { total: addonIcons.length, alreadyInR2: 0, notInR2: 0, items: [] },
    dimensionIcons: { total: dimensionIcons.length, alreadyInR2: 0, notInR2: 0, items: [] },
    summary: {
      totalUniqueUrls: allUrls.size,
      alreadyInR2Count: 0,
      needsUploadCount: 0,
      byType: {
        uuid: 0,
        attribute: 0,
        other: 0,
      },
    },
  };

  for (const url of productImages) {
    const cls = classify(url);
    const inManifest = manifestUrls.has(url) || (cls.type === 'uuid' && manifestUuids.has(cls.key));
    if (inManifest) report.productImages.alreadyInR2++;
    else report.productImages.notInR2++;
    report.productImages.items.push({ url, inManifest, cls });
  }

  for (const url of addonIcons) {
    const cls = classify(url);
    const inManifest = manifestUrls.has(url) || (cls.type === 'uuid' && manifestUuids.has(cls.key));
    if (inManifest) report.addonIcons.alreadyInR2++;
    else report.addonIcons.notInR2++;
    report.addonIcons.items.push({ url, inManifest, cls });
  }

  for (const url of dimensionIcons) {
    const cls = classify(url);
    const inManifest = manifestUrls.has(url) || (cls.type === 'uuid' && manifestUuids.has(cls.key));
    if (inManifest) report.dimensionIcons.alreadyInR2++;
    else report.dimensionIcons.notInR2++;
    report.dimensionIcons.items.push({ url, inManifest, cls });
  }

  for (const url of allUrls) {
    const cls = classify(url);
    report.summary.byType[cls.type] = (report.summary.byType[cls.type] || 0) + 1;
    const inManifest = manifestUrls.has(url) || (cls.type === 'uuid' && manifestUuids.has(cls.key));
    if (inManifest) report.summary.alreadyInR2Count++;
    else report.summary.needsUploadCount++;
  }

  console.log('\n=== LAPORAN PER BANDINGAN DENGAN MANIFEST 7-B ===');
  console.log(`1. product.image: Total ${report.productImages.total} | Sudah di R2: ${report.productImages.alreadyInR2} | Belum: ${report.productImages.notInR2}`);
  console.log(`2. addons[].icon: Total ${report.addonIcons.total} | Sudah di R2: ${report.addonIcons.alreadyInR2} | Belum: ${report.addonIcons.notInR2}`);
  console.log(`3. dimensions[].values[].icon: Total ${report.dimensionIcons.total} | Sudah di R2: ${report.dimensionIcons.alreadyInR2} | Belum: ${report.dimensionIcons.notInR2}`);
  console.log(`\nRINGKASAN TOTAL DEDUPE:`);
  console.log(`- Total URL Unik Gabungan: ${report.summary.totalUniqueUrls}`);
  console.log(`- SUDAH ADA di R2: ${report.summary.alreadyInR2Count}`);
  console.log(`- BELUM ADA di R2 (Perlu Diunggah): ${report.summary.needsUploadCount}`);
  console.log(`- Klasifikasi: UUID=${report.summary.byType.uuid}, Attribute=${report.summary.byType.attribute}, Lainnya=${report.summary.byType.other}`);

  await fs.writeFile(
    path.resolve(__dirname, 'options-images-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(`\nLaporan detail disimpan di scripts/options-images-report.json`);
}

main().catch((e) => {
  console.error('Fatal error in audit options images:', e);
  process.exit(1);
});
