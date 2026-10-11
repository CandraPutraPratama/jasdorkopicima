import { KkApiClient } from '../src/lib/kk-client.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new KkApiClient();

async function runVerification() {
  console.log('====================================================');
  console.log('   VERIFIKASI TAHAP 3: LAPORAN LENGKAP POIN 7a - 7d');
  console.log('====================================================\n');

  const report = {};

  // -----------------------------------------------------------------
  // 7a. Verifikasi token dengan phone kosong ("")
  // -----------------------------------------------------------------
  console.log('▶ [7a] Menguji /create_web_token dengan phone kosong ("")...');
  try {
    const rawRes = await fetch('https://order.kopikenangan.com/web_order/api/create_web_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'language': 'id',
        'time_zone': '7',
      },
      body: JSON.stringify({ phone: '' }),
    });
    const tokenData = await rawRes.json();
    const emptyPhoneToken = tokenData.data?.web_order_session_token;

    console.log(`   - Token berhasil dibuat? ${tokenData.error_code === 0 ? 'YA (Kode: 0)' : 'TIDAK'}`);
    console.log(`   - Customer name pada token kosong: "${tokenData.data?.customer_name || ''}"`);

    if (emptyPhoneToken) {
      console.log('   - Menguji pemanggilan query_web_order_product_menu dengan token phone kosong...');
      const menuRes = await fetch('https://order.kopikenangan.com/web_order/api/product/query_web_order_product_menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'language': 'id',
          'time_zone': '7',
          'authorization': emptyPhoneToken,
        },
        body: JSON.stringify({ store_code: 'CIMB', sales_type: 10402 }),
      });
      const menuData = await menuRes.json();
      const groupsCount = menuData.data?.menu_groups?.length || 0;
      console.log(`   - Hasil query menu: error_code: ${menuData.error_code}, groups: ${groupsCount}`);

      report.test_7a = {
        tokenSuccess: tokenData.error_code === 0,
        tokenCustomerName: tokenData.data?.customer_name || '',
        menuSuccess: menuData.error_code === 0,
        menuGroupsCount: groupsCount,
        conclusion: menuData.error_code === 0
          ? 'Token dengan nomor HP kosong BERHASIL 100% digunakan untuk mengambil menu tanpa kendala.'
          : 'Token dengan phone kosong GAGAL mengambil menu.',
      };
    }
  } catch (err) {
    console.error('   Error 7a:', err.message);
    report.test_7a = { error: err.message };
  }

  // -----------------------------------------------------------------
  // Menyiapkan 3 outlet dari 3 kota berbeda (Jakarta, Surabaya, Bandung)
  // -----------------------------------------------------------------
  console.log('\n▶ Menyiapkan 3 outlet dari 3 kota berbeda...');
  const sbySearch = await client.queryStore({ keyword: 'Surabaya', pageSize: 1 });
  const bdgSearch = await client.queryStore({ keyword: 'Bandung', pageSize: 1 });
  const jktStore = await client.getStore('CIMB');
  const sbyStore = sbySearch.store[0];
  const bdgStore = bdgSearch.store[0];

  const targetOutlets = [
    { city: 'Jakarta', store: jktStore },
    { city: 'Surabaya', store: sbyStore },
    { city: 'Bandung', store: bdgStore },
  ];

  for (const o of targetOutlets) {
    console.log(`   - [${o.city}] ${o.store.code} - ${o.store.name} (id: ${o.store.id}) | Jam: ${o.store.open} - ${o.store.close}`);
  }

  // -----------------------------------------------------------------
  // 7b. Berapa banyak item yang price-nya berbeda dari orig_price
  // -----------------------------------------------------------------
  console.log('\n▶ [7b] Menganalisis perbedaan price vs orig_price di beberapa outlet...');
  report.test_7b = {};

  const outletMenus = {};

  for (const o of targetOutlets) {
    const rawMenu = await client.queryProductMenu(o.store.code);
    outletMenus[o.city] = rawMenu;

    let totalProducts = 0;
    let differentPriceCount = 0;
    const diffSamples = [];

    for (const group of rawMenu.menu_groups || []) {
      for (const prod of group.menu_products || []) {
        totalProducts++;
        if (prod.price !== prod.orig_price) {
          differentPriceCount++;
          if (diffSamples.length < 5) {
            diffSamples.push({
              group: group.group_name,
              name: prod.name,
              price: prod.price,
              origPrice: prod.orig_price,
              discountAmount: prod.orig_price - prod.price,
              isCombo: prod.is_combo_v2,
            });
          }
        }
      }
    }

    report.test_7b[o.city] = {
      storeCode: o.store.code,
      storeName: o.store.name,
      totalProducts,
      differentPriceCount,
      percentage: `${((differentPriceCount / totalProducts) * 100).toFixed(1)}%`,
      diffSamples,
    };

    console.log(`   [${o.city}] Total item menu: ${totalProducts}, item dengan price != orig_price: ${differentPriceCount} (${report.test_7b[o.city].percentage})`);
    if (diffSamples.length > 0) {
      console.log(`       Contoh: "${diffSamples[0].name}" (Kategori: ${diffSamples[0].group}) -> price: Rp${diffSamples[0].price.toLocaleString('id-ID')} vs orig_price: Rp${diffSamples[0].origPrice.toLocaleString('id-ID')}`);
    }
  }

  // -----------------------------------------------------------------
  // 7c. Apakah menu dan harga berbeda antar outlet (3 kota berbeda)
  // -----------------------------------------------------------------
  console.log('\n▶ [7c] Membandingkan menu dan harga antar 3 kota berbeda (Jakarta, Surabaya, Bandung)...');

  const commonItemNames = [
    'Kopi Kenangan Mantan',
    'Americano',
    'Avocado Coffee',
    'Caramel Macchiato',
    'Kenangan Milk Tea',
    'Matcha Latte',
  ];
  const comparisonTable = [];

  for (const itemName of commonItemNames) {
    const row = { name: itemName, prices: {} };
    for (const o of targetOutlets) {
      let found = null;
      for (const g of outletMenus[o.city]?.menu_groups || []) {
        for (const p of g.menu_products || []) {
          if (p.name.toLowerCase() === itemName.toLowerCase()) {
            found = p;
            break;
          }
        }
        if (found) break;
      }
      row.prices[o.city] = found
        ? { price: found.price, origPrice: found.orig_price, isSoldOut: found.is_sold_out }
        : 'TIDAK TERSEDIA';
    }
    comparisonTable.push(row);
  }

  report.test_7c = {
    targetOutlets: targetOutlets.map(t => ({ city: t.city, code: t.store.code, name: t.store.name })),
    comparisonTable,
  };

  console.log('   Hasil perbandingan harga beberapa menu populer:');
  for (const row of comparisonTable) {
    console.log(`   - ${row.name}:`);
    for (const [city, val] of Object.entries(row.prices)) {
      if (typeof val === 'string') {
        console.log(`       ${city}: ${val}`);
      } else {
        console.log(`       ${city}: Rp${val.price.toLocaleString('id-ID')} (orig: Rp${val.origPrice.toLocaleString('id-ID')}) | Status: ${val.isSoldOut ? 'Habis' : 'Tersedia'}`);
      }
    }
  }

  // -----------------------------------------------------------------
  // 7d. Apakah total harga SKU selalu = harga dasar + delta yang konsisten
  // -----------------------------------------------------------------
  console.log('\n▶ [7d] Menganalisis konsistensi total harga SKU vs harga dasar di options...');

  const testProducts = [
    { name: 'Taro Cloud Latte', bundleCode: '7245645' },
    { name: 'Kopi Kenangan Mantan', bundleCode: '7833007' },
    { name: 'Avocado Coffee', bundleCode: '2895061' },
  ];

  report.test_7d = {};

  for (const item of testProducts) {
    try {
      const rawOptions = await client.getProductOptions(jktStore.id, jktStore.code, item.bundleCode);
      const basePrice = rawOptions.base_product.price;
      const skuMap = rawOptions.option_product_map || {};

      const skuAnalysis = [];
      let isStrictlyConsistent = true;
      let minDelta = Infinity;
      let maxDelta = -Infinity;

      for (const sku of Object.values(skuMap)) {
        const delta = sku.price - basePrice;
        if (delta < 0) isStrictlyConsistent = false;
        if (delta < minDelta) minDelta = delta;
        if (delta > maxDelta) maxDelta = delta;

        skuAnalysis.push({
          sku: sku.product_code,
          description: sku.display_description,
          price: sku.price,
          delta,
        });
      }

      report.test_7d[item.name] = {
        basePrice,
        skuCount: skuAnalysis.length,
        isConsistent: isStrictlyConsistent,
        minDelta,
        maxDelta,
        sampleDeltas: skuAnalysis.slice(0, 6),
      };

      console.log(`   [${item.name}] Base Price: Rp${basePrice.toLocaleString('id-ID')}, Kombinasi SKU: ${skuAnalysis.length}, Rentang Delta: +Rp${minDelta.toLocaleString('id-ID')} s/d +Rp${maxDelta.toLocaleString('id-ID')}`);
      console.log('   Sampel Delta Kombinasi:');
      for (const s of skuAnalysis.slice(0, 4)) {
        console.log(`     - [${s.description}] -> Rp${s.price.toLocaleString('id-ID')} (Delta: +Rp${s.delta.toLocaleString('id-ID')})`);
      }
    } catch (err) {
      console.log(`   Catatan ${item.name}: ${err.message}`);
    }
  }

  // Simpan hasil verifikasi mentah
  const resultPath = path.resolve(__dirname, '../docs/verification-tahap3-results.json');
  await fs.writeFile(resultPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✅ Hasil verifikasi lengkap tersimpan di: ${resultPath}`);

  return report;
}

runVerification().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
