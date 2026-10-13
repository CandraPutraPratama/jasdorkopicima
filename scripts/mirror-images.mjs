import fs from 'node:fs/promises';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { normalizeMenu } from '../src/lib/adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_FILE = path.resolve(__dirname, '../docs/images-manifest.json');
const PROGRESS_FILE = path.resolve(__dirname, 'audit-tahap-7a-progress.json');
const WRANGLER_BIN = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');

const BUCKET_NAME = 'jasdorkopicima';
const MIRROR_BASE_URL = 'https://gambar.cimagroup.my.id/product';

/**
 * Ekstraksi UUID dari URL foto produk Kopi Kenangan.
 * Menangani 2 pola path yang sah:
 * 1. /ID/release/pub/kk-api-management/product/<uuid>
 * 2. /public/<uuid>
 * Mengembalikan UUID huruf kecil atau null jika tidak cocok.
 */
export function extractProductImageUuid(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/(?:product|public)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1].toLowerCase() : null;
}

async function collectUniqueImageUrls() {
  const images = new Set();

  // 1. Prioritaskan audit cache jika tersedia (mencakup 1.338 outlet)
  if (existsSync(PROGRESS_FILE)) {
    console.log('   Membaca daftar gambar dari cache pemindaian 1.338 outlet...');
    const rawProgress = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const data = JSON.parse(rawProgress);
    for (const outlet of Object.values(data)) {
      if (outlet.products && Array.isArray(outlet.products)) {
        for (const p of outlet.products) {
          if (p.image && typeof p.image === 'string' && p.image.trim() !== '') {
            images.add(p.image.trim());
          }
        }
      }
    }
    return Array.from(images);
  }

  // 2. Fallback: pemindaian langsung via Supabase + KK API
  console.log('   Cache pemindaian tidak ditemukan, memindai langsung outlet in-scope via Supabase...');
  const supabase = getSupabaseServerClient();
  const outlets = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data: pageData, error } = await supabase
      .from('outlets')
      .select('code')
      .eq('is_in_scope', true)
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw new Error(`Gagal membaca outlet: ${error.message}`);
    if (!pageData || pageData.length === 0) break;
    outlets.push(...pageData);
    if (pageData.length < pageSize) break;
    page++;
  }

  for (const outlet of outlets) {
    try {
      const rawMenu = await kkApiClient.queryProductMenu(outlet.code);
      const groups = normalizeMenu(rawMenu, true);
      for (const g of groups) {
        for (const p of g.products) {
          if (p.image) images.add(p.image.trim());
        }
      }
    } catch {
      // lanjutkan outlet berikutnya
    }
  }

  return Array.from(images);
}

async function checkRemoteExists(mirrorUrl, expectedSize) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(mirrorUrl, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const contentLength = Number(res.headers.get('content-length')) || 0;
      if (contentLength > 0 && Math.abs(contentLength - expectedSize) <= 10) {
        return { exists: true, size: contentLength };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('=====================================================');
  console.log('   TAHAP 7-B: SCRIPT MIRROR FOTO PRODUK KE R2');
  console.log('=====================================================\n');

  // 1. Kumpulkan URL foto unik
  console.log('▶ 1. Mengumpulkan seluruh URL foto unik dari menu in-scope...');
  const rawUrls = await collectUniqueImageUrls();
  console.log(`   Ditemukan ${rawUrls.length} URL foto unik.\n`);

  // 2. Filter & Ekstraksi UUID
  console.log('▶ 2. Memeriksa format dan ekstraksi UUID...');
  const validItems = [];
  const unmatchedUrls = [];

  for (const url of rawUrls) {
    const uuid = extractProductImageUuid(url);
    if (!uuid) {
      unmatchedUrls.push(url);
    } else {
      validItems.push({
        sourceUrl: url,
        uuid,
        targetKey: `product/${uuid}.jpg`,
        mirrorUrl: `${MIRROR_BASE_URL}/${uuid}.jpg`,
      });
    }
  }

  if (unmatchedUrls.length > 0) {
    console.warn(`   ⚠️ Ditemukan ${unmatchedUrls.length} URL tanpa format UUID yang dikenali:`);
    unmatchedUrls.forEach((u) => console.warn(`      - ${u}`));
  } else {
    console.log(`   ✅ 100% URL (${validItems.length}/${rawUrls.length}) memiliki format UUID yang valid.\n`);
  }

  // 3. Proses Unduh & Unggah Idempotent
  console.log('▶ 3. Memulai proses mirror foto ke Cloudflare R2 (idempotent)...');
  const manifestItems = [];
  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    const indexStr = `[${i + 1}/${validItems.length}]`;

    try {
      // a. Unduh foto dari CDN KK
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(item.sourceUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} saat mengunduh dari KK CDN`);
      }

      const contentType = res.headers.get('content-type') || '';
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const sizeBytes = buffer.byteLength;

      if (sizeBytes === 0) {
        throw new Error('Ukuran file foto 0 byte (kosong)');
      }

      // b. Cek Idempotency: apakah sudah ada di R2 dengan ukuran yang sama?
      const check = await checkRemoteExists(item.mirrorUrl, sizeBytes);
      if (check.exists) {
        skippedCount++;
        console.log(`   ${indexStr} ⏭️ LEWATI: ${item.uuid}.jpg (${sizeBytes} bytes, sudah ada di R2)`);
        manifestItems.push({
          sourceUrl: item.sourceUrl,
          mirrorUrl: item.mirrorUrl,
          uuid: item.uuid,
          targetKey: item.targetKey,
          sizeBytes,
          status: 'SKIPPED',
        });
        continue;
      }

      // c. Tulis file sementara untuk diunggah via wrangler
      const tmpPath = path.resolve(__dirname, `.tmp-${item.uuid}.jpg`);
      writeFileSync(tmpPath, buffer);

      try {
        execFileSync(
          process.execPath,
          [
            WRANGLER_BIN,
            'r2',
            'object',
            'put',
            `${BUCKET_NAME}/${item.targetKey}`,
            '--file',
            tmpPath,
            '--content-type',
            'image/jpeg',
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

      // d. Verifikasi ulang via custom domain
      await sleep(150);
      const verifyRes = await fetch(item.mirrorUrl, { method: 'HEAD' });
      if (verifyRes.status !== 200) {
        throw new Error(`Verifikasi HTTP HEAD mirror mengembalikan status ${verifyRes.status}`);
      }

      uploadedCount++;
      console.log(`   ${indexStr} ✅ UNGGAH: ${item.uuid}.jpg (${sizeBytes} bytes) -> 200 OK`);
      manifestItems.push({
        sourceUrl: item.sourceUrl,
        mirrorUrl: item.mirrorUrl,
        uuid: item.uuid,
        targetKey: item.targetKey,
        sizeBytes,
        status: 'UPLOADED',
      });
    } catch (err) {
      failedCount++;
      console.error(`   ${indexStr} ❌ GAGAL: ${item.uuid} - ${err.message}`);
      manifestItems.push({
        sourceUrl: item.sourceUrl,
        mirrorUrl: item.mirrorUrl,
        uuid: item.uuid,
        targetKey: item.targetKey,
        sizeBytes: 0,
        status: 'FAILED',
        error: err.message,
      });
    }

    // Jeda sopan antar unggahan
    await sleep(150);
  }

  // 4. Tulis Manifest
  console.log('\n▶ 4. Menulis manifest gambar...');
  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: BUCKET_NAME,
    mirrorBaseUrl: MIRROR_BASE_URL,
    totalUnique: rawUrls.length,
    uploaded: uploadedCount,
    skipped: skippedCount,
    failed: failedCount,
    unmatchedCount: unmatchedUrls.length,
    unmatchedUrls,
    items: manifestItems,
  };

  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`   Manifest tersimpan di: ${MANIFEST_FILE}\n`);

  // 5. Ringkasan
  console.log('=====================================================');
  console.log('📊 RINGKASAN SCRIPT MIRROR FOTO:');
  console.log(`   - Total URL Unik  : ${rawUrls.length}`);
  console.log(`   - Berhasil Diunggah: ${uploadedCount}`);
  console.log(`   - Dilewati (Idempotent): ${skippedCount}`);
  console.log(`   - Gagal           : ${failedCount}`);
  console.log(`   - Tanpa UUID Sah  : ${unmatchedUrls.length}`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
