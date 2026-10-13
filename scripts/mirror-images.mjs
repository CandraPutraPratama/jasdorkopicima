import fs from 'node:fs/promises';
import { existsSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { normalizeMenu } from '../src/lib/adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_FILE = path.resolve(__dirname, '../docs/images-manifest.json');
const RUNTIME_MANIFEST_FILE = path.resolve(__dirname, '../src/lib/image-manifest.ts');
const PROGRESS_FILE = path.resolve(__dirname, 'audit-tahap-7a-progress.json');
const OPTIONS_INVENTORY_FILE = path.resolve(__dirname, 'options-images-inventory.json');
const WRANGLER_BIN = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');

const BUCKET_NAME = 'jasdorkopicima';
const R2_DOMAIN = 'https://gambar.cimagroup.my.id';

/**
 * Ekstraksi UUID dari URL foto produk atau ikon addon Kopi Kenangan.
 * Menangani pola:
 * 1. /ID/release/pub/kk-api-management/product/<uuid>
 * 2. /public/<uuid>
 */
export function extractProductImageUuid(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/(?:product|public)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Ekstraksi nama file ikon attribute (misal: Ice.png, Hot.png)
 */
export function extractAttributeFilename(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/attribute(?:_image)?\/([^/?#]+)/i);
  return match ? match[1] : null;
}

/**
 * Mendapatkan ekstensi file dari Content-Type HTTP
 */
function getExtensionFromContentType(contentType, defaultExt = 'jpg') {
  const ct = (contentType || '').toLowerCase().trim();
  if (ct.includes('image/png')) return 'png';
  if (ct.includes('image/webp')) return 'webp';
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpg';
  if (ct.includes('image/gif')) return 'gif';
  return defaultExt;
}

async function collectAllImageUrls() {
  const menuImages = new Set();
  const optionProductImages = new Set();
  const addonIcons = new Set();
  const dimensionIcons = new Set();

  // 1. Gambar dari menu outlet (Audit 7-A)
  if (existsSync(PROGRESS_FILE)) {
    const rawProgress = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const data = JSON.parse(rawProgress);
    for (const outlet of Object.values(data)) {
      if (outlet.products && Array.isArray(outlet.products)) {
        for (const p of outlet.products) {
          if (p.image && typeof p.image === 'string' && p.image.trim() !== '') {
            menuImages.add(p.image.trim());
          }
        }
      }
    }
  }

  // 2. Gambar dari options endpoint (Audit 7-C)
  if (existsSync(OPTIONS_INVENTORY_FILE)) {
    const rawInv = await fs.readFile(OPTIONS_INVENTORY_FILE, 'utf-8');
    const inv = JSON.parse(rawInv);
    if (inv.allProductImages) {
      for (const u of Object.keys(inv.allProductImages)) optionProductImages.add(u.trim());
    }
    if (inv.allAddonIcons) {
      for (const u of Object.keys(inv.allAddonIcons)) addonIcons.add(u.trim());
    }
    if (inv.allDimensionIcons) {
      for (const u of Object.keys(inv.allDimensionIcons)) dimensionIcons.add(u.trim());
    }
  }

  return {
    menuImages: Array.from(menuImages),
    optionProductImages: Array.from(optionProductImages),
    addonIcons: Array.from(addonIcons),
    dimensionIcons: Array.from(dimensionIcons),
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkObjectExistsInR2(targetKey) {
  const tmpCheck = path.resolve(__dirname, `.tmp-check-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  try {
    execFileSync(
      process.execPath,
      [WRANGLER_BIN, 'r2', 'object', 'get', `${BUCKET_NAME}/${targetKey}`, tmpCheck, '--remote'],
      { stdio: 'pipe' }
    );
    if (existsSync(tmpCheck)) {
      const stats = readFileSync(tmpCheck);
      unlinkSync(tmpCheck);
      return { exists: true, sizeBytes: stats.byteLength };
    }
  } catch {
    // Objek tidak ditemukan di R2
  } finally {
    if (existsSync(tmpCheck)) {
      try { unlinkSync(tmpCheck); } catch {}
    }
  }
  return { exists: false, sizeBytes: 0 };
}

async function main() {
  console.log('=====================================================');
  console.log('   TAHAP 7-C: SCRIPT MIRROR FOTO & IKON OPSI KE R2');
  console.log('=====================================================\n');

  // 1. Kumpulkan seluruh URL gambar dari menu & opsi
  console.log('▶ 1. Mengumpulkan seluruh URL gambar dari menu dan opsi produk...');
  const collections = await collectAllImageUrls();
  console.log(`   - Menu images: ${collections.menuImages.length}`);
  console.log(`   - Options product.image: ${collections.optionProductImages.length}`);
  console.log(`   - Options addons[].icon: ${collections.addonIcons.length}`);
  console.log(`   - Options dimensions[].values[].icon: ${collections.dimensionIcons.length}`);

  const combinedUrls = new Set([
    ...collections.menuImages,
    ...collections.optionProductImages,
    ...collections.addonIcons,
    ...collections.dimensionIcons,
  ]);
  console.log(`   Total URL unik gabungan: ${combinedUrls.size}\n`);

  // 2. Klasifikasikan tiap URL
  console.log('▶ 2. Mengklasifikasikan URL dan menentukan target key R2...');
  const parsedItems = [];
  const unmatchedUrls = [];

  for (const url of combinedUrls) {
    const uuid = extractProductImageUuid(url);
    const attrFilename = extractAttributeFilename(url);

    if (uuid) {
      parsedItems.push({
        sourceUrl: url,
        type: 'uuid',
        uuid,
        attrFilename: null,
      });
    } else if (attrFilename) {
      parsedItems.push({
        sourceUrl: url,
        type: 'attribute',
        uuid: null,
        attrFilename,
      });
    } else {
      unmatchedUrls.push(url);
    }
  }

  if (unmatchedUrls.length > 0) {
    console.warn(`   ⚠️ Ditemukan ${unmatchedUrls.length} URL yang tidak dikenali polanya:`);
    unmatchedUrls.forEach((u) => console.warn(`      - ${u}`));
  } else {
    console.log(`   ✅ 100% URL (${parsedItems.length}/${combinedUrls.size}) berhasil diklasifikasikan.\n`);
  }

  // 3. Muat manifest lama jika ada
  const existingManifestMap = new Map();
  if (existsSync(MANIFEST_FILE)) {
    try {
      const oldManifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'));
      if (Array.isArray(oldManifest.items)) {
        for (const it of oldManifest.items) {
          if (it.sourceUrl && it.mirrorUrl && it.sizeBytes > 0) {
            existingManifestMap.set(it.sourceUrl, it);
          }
        }
      }
      console.log(`   Memuat manifest lama: ${existingManifestMap.size} entri telah tercatat terunggah.\n`);
    } catch {
      // abaikan jika file manifest lama rusak
    }
  }

  // 4. Unduh & Unggah Idempotent
  console.log('▶ 3. Memulai proses mirror foto & ikon ke Cloudflare R2 (idempotent)...');
  const manifestItems = [];
  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < parsedItems.length; i++) {
    const item = parsedItems[i];
    const indexStr = `[${i + 1}/${parsedItems.length}]`;

    // Cek apakah sudah tercatat di manifest sebelumnya
    if (existingManifestMap.has(item.sourceUrl)) {
      const prev = existingManifestMap.get(item.sourceUrl);
      skippedCount++;
      console.log(`   ${indexStr} ⏭️ LEWATI (Manifest): ${prev.targetKey} (${prev.sizeBytes} bytes)`);
      manifestItems.push({
        sourceUrl: item.sourceUrl,
        mirrorUrl: prev.mirrorUrl,
        uuid: item.uuid,
        targetKey: prev.targetKey,
        contentType: prev.contentType || 'image/jpeg',
        sizeBytes: prev.sizeBytes,
        status: 'SKIPPED',
      });
      continue;
    }

    try {
      // a. Unduh dari CDN KK
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(item.sourceUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} saat mengunduh dari KK CDN`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const sizeBytes = buffer.byteLength;

      if (sizeBytes === 0) {
        throw new Error('Ukuran file 0 byte');
      }

      // b. Tentukan targetKey dan mirrorUrl berdasarkan tipe
      let ext = 'jpg';
      let targetKey = '';
      let mirrorUrl = '';

      if (item.type === 'uuid') {
        ext = getExtensionFromContentType(contentType, 'jpg');
        targetKey = `product/${item.uuid}.${ext}`;
        mirrorUrl = `${R2_DOMAIN}/product/${item.uuid}.${ext}`;
      } else if (item.type === 'attribute') {
        targetKey = `attribute/${item.attrFilename}`;
        mirrorUrl = `${R2_DOMAIN}/attribute/${item.attrFilename}`;
      }

      // c. Cek apakah objek sudah ada di R2 via wrangler object get (menghindari 404 cache edge)
      const r2Check = await checkObjectExistsInR2(targetKey);
      if (r2Check.exists && r2Check.sizeBytes === sizeBytes) {
        skippedCount++;
        console.log(`   ${indexStr} ⏭️ LEWATI (Ada di R2): ${targetKey} (${sizeBytes} bytes)`);
        manifestItems.push({
          sourceUrl: item.sourceUrl,
          mirrorUrl,
          uuid: item.uuid,
          targetKey,
          contentType,
          sizeBytes,
          status: 'SKIPPED',
        });
        continue;
      }

      // d. Tulis file sementara dan unggah via wrangler
      const tmpPath = path.resolve(__dirname, `.tmp-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
      writeFileSync(tmpPath, buffer);

      try {
        execFileSync(
          process.execPath,
          [
            WRANGLER_BIN,
            'r2',
            'object',
            'put',
            `${BUCKET_NAME}/${targetKey}`,
            '--file',
            tmpPath,
            '--content-type',
            contentType,
            '--cache-control',
            'public, max-age=31536000, immutable',
            '--remote',
          ],
          { stdio: 'pipe' }
        );
      } finally {
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath);
        }
      }

      // e. Verifikasi publik menggunakan cache buster ?v=...
      await sleep(150);
      const verifyRes = await fetch(`${mirrorUrl}?v=${Date.now()}`, { method: 'HEAD' });
      if (verifyRes.status !== 200) {
        throw new Error(`Verifikasi publik mengembalikan status ${verifyRes.status}`);
      }

      uploadedCount++;
      console.log(`   ${indexStr} ✅ UNGGAH: ${targetKey} (${sizeBytes} bytes, ${contentType}) -> 200 OK`);
      manifestItems.push({
        sourceUrl: item.sourceUrl,
        mirrorUrl,
        uuid: item.uuid,
        targetKey,
        contentType,
        sizeBytes,
        status: 'UPLOADED',
      });
    } catch (err) {
      failedCount++;
      console.error(`   ${indexStr} ❌ GAGAL: ${item.sourceUrl} - ${err.message}`);
      manifestItems.push({
        sourceUrl: item.sourceUrl,
        mirrorUrl: '',
        uuid: item.uuid,
        targetKey: '',
        contentType: '',
        sizeBytes: 0,
        status: 'FAILED',
        error: err.message,
      });
    }

    // Jeda sopan 100ms
    await sleep(100);
  }

  // 5. Tulis manifest docs/images-manifest.json
  const manifestData = {
    generatedAt: new Date().toISOString(),
    bucket: BUCKET_NAME,
    totalUnique: manifestItems.length,
    uploaded: uploadedCount,
    skipped: skippedCount,
    failed: failedCount,
    unmatchedCount: unmatchedUrls.length,
    unmatchedUrls,
    items: manifestItems,
  };

  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifestData, null, 2), 'utf-8');
  console.log(`\n▶ 4. Manifest tersimpan di ${MANIFEST_FILE}`);

  // 6. Tulis modul manifest runtime src/lib/image-manifest.ts
  const lookup = {};
  for (const it of manifestItems) {
    if (it.status !== 'FAILED' && it.mirrorUrl) {
      lookup[it.sourceUrl] = it.mirrorUrl;
      const trimmed = it.sourceUrl.trim();
      lookup[trimmed] = it.mirrorUrl;
      if (trimmed.endsWith('?')) {
        lookup[trimmed.slice(0, -1)] = it.mirrorUrl;
      } else {
        lookup[`${trimmed}?`] = it.mirrorUrl;
      }
    }
  }

  const tsContent = `// Auto-generated oleh scripts/mirror-images.mjs pada ${new Date().toISOString()}.
// Pemetaan URL sumber Kopi Kenangan -> Cloudflare R2 mirror untuk menu dan opsi produk.
export const IMAGE_MANIFEST: Record<string, string> = ${JSON.stringify(lookup, null, 2)};
`;

  await fs.writeFile(RUNTIME_MANIFEST_FILE, tsContent, 'utf-8');
  console.log(`▶ 5. Modul runtime tersimpan di ${RUNTIME_MANIFEST_FILE} (${Object.keys(lookup).length} kunci pemetaan).`);

  console.log('\n=====================================================');
  console.log(`RINGKASAN AKHIR:`);
  console.log(`- Total URL unik: ${manifestItems.length}`);
  console.log(`- Terunggah baru: ${uploadedCount}`);
  console.log(`- Dilewati (sudah ada): ${skippedCount}`);
  console.log(`- Gagal: ${failedCount}`);
  console.log('=====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal mirror error:', err);
  process.exit(1);
});
