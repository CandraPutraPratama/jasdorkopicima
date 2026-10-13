import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import { kkApiClient } from '../src/lib/kk-client.ts';
import { normalizeMenu } from '../src/lib/adapter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_FILE = path.resolve(__dirname, 'audit-tahap-7a-results.json');
const PROGRESS_FILE = path.resolve(__dirname, 'audit-tahap-7a-progress.json');

async function main() {
  console.log('=====================================================');
  console.log('   TAHAP 7-A: AUDIT SALINAN DATA & FOTO (AUDIT SAJA)');
  console.log('=====================================================\n');

  const supabase = getSupabaseServerClient();

  // 1. Ambil seluruh outlet in-scope dari Supabase (dengan paginasi agar melewati batas 1000 baris PostgREST)
  console.log('▶ 1. Mengambil daftar outlet in-scope dari Supabase...');
  const outlets = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data: pageData, error } = await supabase
      .from('outlets')
      .select('id, code, name')
      .eq('is_in_scope', true)
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      throw new Error(`Gagal mengambil outlet dari Supabase: ${error.message}`);
    }
    if (!pageData || pageData.length === 0) break;
    outlets.push(...pageData);
    if (pageData.length < pageSize) break;
    page++;
  }

  console.log(`   Ditemukan ${outlets.length} outlet in-scope di database.\n`);

  // Muat progress lama jika ada
  let processedOutlets = {};
  try {
    const rawProgress = await fs.readFile(PROGRESS_FILE, 'utf-8');
    processedOutlets = JSON.parse(rawProgress);
    console.log(`   Melanjutkan dari progress sebelumnya: ${Object.keys(processedOutlets).length} outlet telah tersimpan.`);
  } catch {
    // Tidak ada file progress, mulai baru
  }

  // 2. Iterasi setiap outlet untuk mengambil menu
  console.log('\n▶ 2. Memindai menu di seluruh outlet in-scope...');
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < outlets.length; i++) {
    const outlet = outlets[i];
    const code = outlet.code;

    if (processedOutlets[code]) {
      skippedCount++;
      continue;
    }

    try {
      const rawMenu = await kkApiClient.queryProductMenu(code);
      const normalizedGroups = normalizeMenu(rawMenu, true);

      // Simpan hanya data ringkas produk yang lolos filter
      const products = [];
      for (const group of normalizedGroups) {
        for (const p of group.products) {
          products.push({
            id: p.id,
            bundleCode: p.bundleCode,
            productCode: p.productCode,
            name: p.name,
            groupName: group.name,
            image: p.image || '',
            basePrice: p.basePrice,
            origPrice: p.originalPrice,
            isSoldOut: p.isSoldOut,
          });
        }
      }

      processedOutlets[code] = {
        name: outlet.name,
        productCount: products.length,
        products,
      };
      successCount++;
    } catch (err) {
      failCount++;
      processedOutlets[code] = {
        name: outlet.name,
        error: err.message,
        productCount: 0,
        products: [],
      };
    }

    // Tampilkan log progress setiap 50 outlet atau outlet terakhir
    const currentTotal = Object.keys(processedOutlets).length;
    if (currentTotal % 50 === 0 || i === outlets.length - 1) {
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);
      console.log(`   [Progress ${currentTotal}/${outlets.length}] Sukses: ${successCount}, Gagal: ${failCount}, Lewati: ${skippedCount} (${elapsedSec}s)`);
      // Simpan checkpoint progress
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(processedOutlets), 'utf-8');
    }
  }

  // Simpan checkpoint akhir
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(processedOutlets), 'utf-8');
  console.log(`\n   Pemindaian selesai dalam ${Math.round((Date.now() - startTime) / 1000)}s.`);

  // 3. Analisis Inventaris Foto & Variasi Produk
  console.log('\n▶ 3. Menganalisis inventaris foto & variasi produk...');

  // Map untuk inventaris foto
  const imageToProducts = new Map(); // image -> Set of product names / codes
  const productToImages = new Map(); // productCode -> { name, images: Set }
  const productPrices = new Map();   // productCode -> { name, prices: Set, outlets: Set, priceOccurrences: Map }
  const productsWithoutImage = new Set();
  const allUniqueImages = new Set();
  const allUniqueProducts = new Map(); // productCode -> name

  for (const [outletCode, outletData] of Object.entries(processedOutlets)) {
    if (outletData.error || !outletData.products) continue;

    for (const p of outletData.products) {
      const key = p.productCode || p.name;
      allUniqueProducts.set(key, p.name);

      // Gambar
      const img = (p.image || '').trim();
      if (!img) {
        productsWithoutImage.add(key);
      } else {
        allUniqueImages.add(img);

        // image -> products
        if (!imageToProducts.has(img)) {
          imageToProducts.set(img, new Set());
        }
        imageToProducts.get(img).add(`${p.name} [${key}]`);

        // product -> images
        if (!productToImages.has(key)) {
          productToImages.set(key, { name: p.name, images: new Set() });
        }
        productToImages.get(key).images.add(img);
      }

      // Harga
      if (!productPrices.has(key)) {
        productPrices.set(key, {
          name: p.name,
          prices: new Set(),
          outlets: new Set(),
          priceOccurrences: new Map(),
        });
      }
      const pEntry = productPrices.get(key);
      pEntry.prices.add(p.basePrice);
      pEntry.outlets.add(outletCode);
      const count = pEntry.priceOccurrences.get(p.basePrice) || 0;
      pEntry.priceOccurrences.set(p.basePrice, count + 1);
    }
  }

  // Analisis 1: Inventaris Foto
  const imagesSharedByMultipleProducts = [];
  for (const [img, prodSet] of imageToProducts.entries()) {
    if (prodSet.size > 1) {
      imagesSharedByMultipleProducts.push({
        image: img,
        products: Array.from(prodSet),
        count: prodSet.size,
      });
    }
  }

  const productsWithDifferentImagesAcrossOutlets = [];
  for (const [prodCode, entry] of productToImages.entries()) {
    if (entry.images.size > 1) {
      productsWithDifferentImagesAcrossOutlets.push({
        productCode: prodCode,
        name: entry.name,
        images: Array.from(entry.images),
        count: entry.images.size,
      });
    }
  }

  // Analisis 3: Variasi Harga
  const multiOutletProducts = [];
  const variablePriceProducts = [];
  let maxPriceDiff = 0;
  let maxPriceDiffProduct = null;

  for (const [prodCode, entry] of productPrices.entries()) {
    if (entry.outlets.size > 1) {
      multiOutletProducts.push(prodCode);
      const priceArray = Array.from(entry.prices).sort((a, b) => a - b);
      if (priceArray.length > 1) {
        const diff = priceArray[priceArray.length - 1] - priceArray[0];
        if (diff > maxPriceDiff) {
          maxPriceDiff = diff;
          maxPriceDiffProduct = {
            productCode: prodCode,
            name: entry.name,
            minPrice: priceArray[0],
            maxPrice: priceArray[priceArray.length - 1],
            diff,
            distribution: Object.fromEntries(entry.priceOccurrences),
          };
        }
        variablePriceProducts.push({
          productCode: prodCode,
          name: entry.name,
          minPrice: priceArray[0],
          maxPrice: priceArray[priceArray.length - 1],
          diff,
          prices: priceArray,
          outletsCount: entry.outlets.size,
          distribution: Object.fromEntries(entry.priceOccurrences),
        });
      }
    }
  }

  const variablePricePercentage = multiOutletProducts.length > 0
    ? (variablePriceProducts.length / multiOutletProducts.length) * 100
    : 0;

  // 4. Sampling Ukuran Foto (maksimal 30 foto)
  console.log('\n▶ 4. Melakukan sampling ukuran file (maksimal 30 foto via HTTP HEAD)...');
  const sampleImageList = Array.from(allUniqueImages).slice(0, 30);
  const sampleResults = [];

  for (const imgUrl of sampleImageList) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(imgUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || 'unknown';
      const contentLength = Number(res.headers.get('content-length')) || 0;

      sampleResults.push({
        url: imgUrl,
        status: res.status,
        contentType,
        contentLength,
        sizeKb: (contentLength / 1024).toFixed(2),
      });
    } catch (err) {
      sampleResults.push({
        url: imgUrl,
        error: err.message,
      });
    }
  }

  const validSampleSizes = sampleResults
    .filter((s) => s.contentLength && s.contentLength > 0)
    .map((s) => s.contentLength);

  let minSize = 0;
  let maxSize = 0;
  let avgSize = 0;

  if (validSampleSizes.length > 0) {
    minSize = Math.min(...validSampleSizes);
    maxSize = Math.max(...validSampleSizes);
    avgSize = validSampleSizes.reduce((a, b) => a + b, 0) / validSampleSizes.length;
  }

  const estimatedTotalSize = allUniqueImages.size * avgSize;

  // 5. Susun Hasil Lengkap
  const finalReport = {
    generatedAt: new Date().toISOString(),
    outletSummary: {
      totalInScopeOutlets: outlets.length,
      successfullyScanned: Object.values(processedOutlets).filter((o) => !o.error).length,
      failedScan: Object.values(processedOutlets).filter((o) => o.error).length,
    },
    photoInventory: {
      totalUniqueImages: allUniqueImages.size,
      sharedImagesCount: imagesSharedByMultipleProducts.length,
      sharedImages: imagesSharedByMultipleProducts,
      differentImagesAcrossOutletsCount: productsWithDifferentImagesAcrossOutlets.length,
      differentImagesAcrossOutlets: productsWithDifferentImagesAcrossOutlets,
      productsWithoutImageCount: productsWithoutImage.size,
      productsWithoutImage: Array.from(productsWithoutImage),
    },
    storageEstimation: {
      sampleCount: sampleResults.length,
      validSampleCount: validSampleSizes.length,
      minSizeBytes: minSize,
      minSizeKb: (minSize / 1024).toFixed(2),
      maxSizeBytes: maxSize,
      maxSizeKb: (maxSize / 1024).toFixed(2),
      avgSizeBytes: Math.round(avgSize),
      avgSizeKb: (avgSize / 1024).toFixed(2),
      estimatedTotalBytes: Math.round(estimatedTotalSize),
      estimatedTotalMb: (estimatedTotalSize / (1024 * 1024)).toFixed(2),
      samples: sampleResults,
    },
    priceVariation: {
      totalUniqueProducts: allUniqueProducts.size,
      multiOutletProductsCount: multiOutletProducts.length,
      variablePriceProductsCount: variablePriceProducts.length,
      variablePricePercentage: Number(variablePricePercentage.toFixed(2)),
      maxPriceDiffRupiah: maxPriceDiff,
      maxPriceDiffProduct,
      topVariableProducts: variablePriceProducts
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 15),
    },
  };

  await fs.writeFile(RESULTS_FILE, JSON.stringify(finalReport, null, 2), 'utf-8');
  console.log(`\n=====================================================`);
  console.log('✅ AUDIT SELESAI & LAPORAN TERSIMPAN KE:');
  console.log(`   ${RESULTS_FILE}`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
