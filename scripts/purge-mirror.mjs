import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_FILE = path.resolve(__dirname, '../docs/images-manifest.json');
const WRANGLER_BIN = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');
const BUCKET_NAME = 'jasdorkopicima';
const ALLOWED_PREFIX = 'product/';

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const isDryRun = !isConfirm;

  console.log('=====================================================');
  console.log('   TAHAP 7-B: SCRIPT HAPUS DARURAT (PURGE MIRROR)');
  console.log('=====================================================\n');

  if (!existsSync(MANIFEST_FILE)) {
    throw new Error(`File manifest tidak ditemukan di: ${MANIFEST_FILE}. Jalankan script mirror terlebih dahulu.`);
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf-8'));
  const candidateKeys = [];

  for (const item of manifest.items || []) {
    const key = item.targetKey;
    // PENGAMAN KETAT: Hanya boleh menghapus dengan prefix "product/" di bucket jasdorkopicima
    if (key && typeof key === 'string' && key.startsWith(ALLOWED_PREFIX) && !key.includes('..')) {
      candidateKeys.push(key);
    }
  }

  console.log(`Ditemukan ${candidateKeys.length} objek mirror dengan prefix "${ALLOWED_PREFIX}".`);

  if (isDryRun) {
    console.log('\n[MODE DRY-RUN] Berjalan tanpa mengubah apa pun.');
    console.log('Daftar objek yang AKAN dihapus jika menggunakan --confirm:');
    candidateKeys.slice(0, 10).forEach((k) => console.log(`   - ${BUCKET_NAME}/${k}`));
    if (candidateKeys.length > 10) {
      console.log(`   ... dan ${candidateKeys.length - 10} objek lainnya.`);
    }
    console.log('\nUntuk mengeksekusi penghapusan sungguhan, jalankan:');
    console.log('👉 node scripts/purge-mirror.mjs --confirm\n');
    return;
  }

  console.log('\n⚠️ PERINGATAN: Flag --confirm terdeteksi. Memulai penghapusan objek dari Cloudflare R2...');
  let deletedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < candidateKeys.length; i++) {
    const key = candidateKeys[i];
    const indexStr = `[${i + 1}/${candidateKeys.length}]`;

    // Validasi ulang mutlak
    if (!key.startsWith(ALLOWED_PREFIX)) {
      console.warn(`   ${indexStr} 🛑 DITOLAK: Key "${key}" tidak memiliki prefix yang diizinkan.`);
      continue;
    }

    try {
      execFileSync(
        process.execPath,
        [
          WRANGLER_BIN,
          'r2',
          'object',
          'delete',
          `${BUCKET_NAME}/${key}`,
          '--remote',
          '-y',
        ],
        { stdio: 'pipe' }
      );
      deletedCount++;
      console.log(`   ${indexStr} 🗑️ Terhapus: ${key}`);
    } catch (err) {
      failedCount++;
      console.error(`   ${indexStr} ❌ Gagal menghapus: ${key} - ${err.message}`);
    }
  }

  console.log('\n=====================================================');
  console.log('📊 RINGKASAN PENGHAPUSAN DARURAT:');
  console.log(`   - Berhasil Dihapus: ${deletedCount}`);
  console.log(`   - Gagal Dihapus   : ${failedCount}`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
