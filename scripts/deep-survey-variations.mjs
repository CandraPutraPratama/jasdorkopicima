import { KkApiClient } from '../src/lib/kk-client.ts';
import fs from 'node:fs/promises';

const client = new KkApiClient();

const ALLOWLIST_GROUPS = [
  'baru!',
  'coffee',
  'non coffee',
  'kenangan frappe',
  'kenangan toast',
  'food',
];

function isAllowedGroup(name) {
  if (!name) return false;
  return ALLOWLIST_GROUPS.includes(name.trim().toLowerCase());
}

async function runDeepSurvey() {
  console.log('=== MEMULAI SURVEI LENGKAP VARIASI HARGA KK (MINIMAL 30 OUTLET) ===');

  // Ambil outlet beragam
  const storeRes = await client.queryStore({ pageSize: 45, deliverable: 2 });
  const allOutlets = storeRes.store || [];
  
  const cimbRes = await client.queryStore({ storeName: 'CIMB', pageSize: 5 });
  const cimbStores = cimbRes.store || [];

  const outletMap = new Map();
  for (const s of [...cimbStores, ...allOutlets]) {
    const code = s.code || s.store_code;
    if (code && !outletMap.has(code)) {
      outletMap.set(code, s);
    }
  }

  const outlets = Array.from(outletMap.values()).slice(0, 35);
  console.log(`Terpilih ${outlets.length} outlet untuk survei.`);

  // Kumpulkan menu dari semua 35 outlet
  // Kita ingin melacak:
  // 1. Semua produk unik di allowlist
  // 2. Di outlet mana saja setiap produk muncul
  const productsByBundle = new Map(); // bundleCode -> { bundleCode, name, groupName, outlets: [{ storeCode, storeName, storeId, price }] }

  let totalProductOccurrences = 0;

  for (let i = 0; i < outlets.length; i++) {
    const o = outlets[i];
    const storeCode = o.code || o.store_code;
    const storeName = o.name || o.alias || storeCode;

    try {
      const menu = await client.queryProductMenu(storeCode);
      const groups = menu.menu_groups || [];

      for (const g of groups) {
        const gName = (g.group_name || '').trim();
        if (!isAllowedGroup(gName)) continue;

        const prods = (g.menu_products || []).filter(p => !p.is_combo_v2);
        for (const p of prods) {
          totalProductOccurrences++;
          if (!productsByBundle.has(p.bundle_code)) {
            productsByBundle.set(p.bundle_code, {
              bundleCode: p.bundle_code,
              name: p.name,
              groupName: gName,
              outlets: [],
            });
          }
          productsByBundle.get(p.bundle_code).outlets.push({
            storeCode,
            storeName,
            storeId: o.id,
            price: p.price,
          });
        }
      }
      console.log(`[${i + 1}/${outlets.length}] ${storeCode} (${storeName}) dimuat.`);
    } catch (err) {
      console.warn(`Gagal memuat menu ${storeCode}: ${err.message}`);
    }
  }

  console.log(`\nCakupan Menu:`);
  console.log(`- Jumlah outlet: ${outlets.length}`);
  console.log(`- Jumlah produk unik di 6 kelompok allowlist: ${productsByBundle.size}`);

  const productsList = Array.from(productsByBundle.values());
  let optionsFetchedCount = 0;
  let optionsFailedCount = 0;

  const largeDeviations = []; // { name, groupName, regPrice, lrgPrice, delta, storeCode, storeName }
  const juwaraDeviations = []; // { name, groupName, blendPrice, juwaraPrice, delta, storeCode, storeName }
  const oatsideDeviations = []; // { name, groupName, milkPrice, oatsidePrice, delta, storeCode, storeName }
  const tempDeviations = []; // { name, groupName, hotPrice, icePrice, delta, storeCode, storeName }
  const otherDimensionDeviations = [];

  console.log('\n--- Mengambil Opsi dan Menganalisis Seluruh Produk ---');

  for (let i = 0; i < productsList.length; i++) {
    const p = productsList[i];
    const sampleOutlet = p.outlets[0];

    try {
      const opts = await client.getProductOptions(sampleOutlet.storeId, sampleOutlet.storeCode, p.bundleCode);
      optionsFetchedCount++;

      const skus = Object.values(opts.option_product_map || {});
      if (skus.length === 0) continue;

      // 1. Cek Size Large vs Regular
      const regSku = skus.find(s => s.display_description && /\bregular\b/i.test(s.display_description));
      if (regSku) {
        const targetLargeDesc = regSku.display_description.replace(/\bregular\b/i, 'Large');
        // Cari SKU yang memiliki deskripsi persis sama selain Regular -> Large
        const lrgSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === targetLargeDesc.toLowerCase());
        if (lrgSku) {
          const delta = lrgSku.price - regSku.price;
          if (delta !== 5000) {
            largeDeviations.push({
              name: p.name,
              groupName: p.groupName,
              regPrice: regSku.price,
              lrgPrice: lrgSku.price,
              delta,
              storeCode: sampleOutlet.storeCode,
              storeName: sampleOutlet.storeName,
            });
          }
        }
      }

      // 2. Cek Juwara Beans vs Kenangan Blend
      const blendSku = skus.find(s => s.display_description && /\bkenangan blend\b/i.test(s.display_description));
      if (blendSku) {
        const targetJuwaraDesc = blendSku.display_description.replace(/\bkenangan blend\b/i, 'Juwara Beans');
        const juwaraSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === targetJuwaraDesc.toLowerCase());
        if (juwaraSku) {
          const delta = juwaraSku.price - blendSku.price;
          if (delta !== 3000) {
            juwaraDeviations.push({
              name: p.name,
              groupName: p.groupName,
              blendPrice: blendSku.price,
              juwaraPrice: juwaraSku.price,
              delta,
              storeCode: sampleOutlet.storeCode,
              storeName: sampleOutlet.storeName,
            });
          }
        }
      }

      // 3. Cek Oatside vs Milk
      const milkSku = skus.find(s => s.display_description && /\bmilk\b/i.test(s.display_description) && !/oatside/i.test(s.display_description));
      if (milkSku) {
        const targetOatsideDesc = milkSku.display_description.replace(/\bmilk\b/i, 'Oatside');
        const oatsideSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === targetOatsideDesc.toLowerCase());
        if (oatsideSku) {
          const delta = oatsideSku.price - milkSku.price;
          if (delta !== 3000) {
            oatsideDeviations.push({
              name: p.name,
              groupName: p.groupName,
              milkPrice: milkSku.price,
              oatsidePrice: oatsideSku.price,
              delta,
              storeCode: sampleOutlet.storeCode,
              storeName: sampleOutlet.storeName,
            });
          }
        }
      }

      // 4. Cek Temperature Hot vs Ice
      const hotSku = skus.find(s => s.display_description && /\bhot\b/i.test(s.display_description));
      if (hotSku) {
        const targetIceDesc = hotSku.display_description.replace(/\bhot\b/i, 'Ice');
        const iceSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === targetIceDesc.toLowerCase());
        if (iceSku) {
          const delta = iceSku.price - hotSku.price;
          if (delta !== 0) {
            tempDeviations.push({
              name: p.name,
              groupName: p.groupName,
              hotPrice: hotSku.price,
              icePrice: iceSku.price,
              delta,
              storeCode: sampleOutlet.storeCode,
              storeName: sampleOutlet.storeName,
            });
          }
        }
      }

      // 5. Cek variasi lain seperti Sugar Level / Ice Level
      const normalSugarSku = skus.find(s => s.display_description && /\bnormal sugar\b/i.test(s.display_description));
      if (normalSugarSku) {
        const lessSugarDesc = normalSugarSku.display_description.replace(/\bnormal sugar\b/i, 'Less Sugar');
        const lessSugarSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === lessSugarDesc.toLowerCase());
        if (lessSugarSku && lessSugarSku.price !== normalSugarSku.price) {
          otherDimensionDeviations.push({
            name: p.name,
            dim: 'Sugar Level',
            val1: 'Normal Sugar',
            val2: 'Less Sugar',
            delta: lessSugarSku.price - normalSugarSku.price,
            storeCode: sampleOutlet.storeCode,
          });
        }
      }

      if ((i + 1) % 20 === 0 || i === productsList.length - 1) {
        console.log(`Progress analisis: ${i + 1}/${productsList.length} produk selesai.`);
      }
    } catch (err) {
      optionsFailedCount++;
      console.warn(`Gagal ambil opsi ${p.bundleCode} (${p.name}): ${err.message}`);
    }
  }

  // Cek khusus Taro Cloud Latte di 10 outlet berbeda
  console.log('\n--- Pengecekan Khusus: Taro Cloud Latte & Varian Serupa di Multi-Outlet ---');
  const specialCheckProducts = ['Taro Cloud', 'Matcha', 'Chocolate', 'Blewah', 'Frappe'];
  const specialChecks = [];

  for (const o of outlets.slice(0, 10)) {
    const storeCode = o.code || o.store_code;
    const storeName = o.name || o.alias || storeCode;

    try {
      const menu = await client.queryProductMenu(storeCode);
      const allProds = (menu.menu_groups || []).flatMap(g => (g.menu_products || []).map(p => ({ ...p, group_name: g.group_name })));

      for (const kw of specialCheckProducts) {
        const matched = allProds.find(p => p.name && p.name.toLowerCase().includes(kw.toLowerCase()) && !p.is_combo_v2);
        if (matched) {
          const opts = await client.getProductOptions(o.id, storeCode, matched.bundle_code);
          const skus = Object.values(opts.option_product_map || {});
          const regSku = skus.find(s => s.display_description && /\bregular\b/i.test(s.display_description));
          if (regSku) {
            const lrgDesc = regSku.display_description.replace(/\bregular\b/i, 'Large');
            const lrgSku = skus.find(s => s.display_description && s.display_description.toLowerCase() === lrgDesc.toLowerCase());
            if (lrgSku) {
              const delta = lrgSku.price - regSku.price;
              specialChecks.push({
                product: matched.name,
                group: matched.group_name,
                storeCode,
                storeName,
                regPrice: regSku.price,
                lrgPrice: lrgSku.price,
                delta,
              });
            }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  // Simpan hasil ke file json lokal
  const outputData = {
    summary: {
      outletsCount: outlets.length,
      totalUniqueProducts: productsList.length,
      optionsFetchedCount,
      optionsFailedCount,
      largeDeviationsCount: largeDeviations.length,
      juwaraDeviationsCount: juwaraDeviations.length,
      oatsideDeviationsCount: oatsideDeviations.length,
      tempDeviationsCount: tempDeviations.length,
      otherDimensionDeviationsCount: otherDimensionDeviations.length,
    },
    largeDeviations,
    juwaraDeviations,
    oatsideDeviations,
    tempDeviations,
    otherDimensionDeviations,
    specialChecks,
  };

  await fs.writeFile('scripts/deep-survey-results.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log('\n======================================================');
  console.log('HASIL SURVEI MENDALAM DI 35 OUTLET & 160 PRODUK UNIK');
  console.log('======================================================');
  console.log(JSON.stringify(outputData.summary, null, 2));

  console.log('\n--- DAFTAR PRODUK DENGAN SELISIH LARGE != Rp5.000 ---');
  if (largeDeviations.length > 0) {
    console.table(largeDeviations);
  } else {
    console.log('Nihil (semua Rp5.000).');
  }

  console.log('\n--- DAFTAR PRODUK DENGAN SELISIH JUWARA BEANS != Rp3.000 ---');
  if (juwaraDeviations.length > 0) {
    console.table(juwaraDeviations);
  } else {
    console.log('Nihil (semua Rp3.000).');
  }

  console.log('\n--- DAFTAR PRODUK DENGAN SELISIH OATSIDE != Rp3.000 ---');
  if (oatsideDeviations.length > 0) {
    console.table(oatsideDeviations);
  } else {
    console.log('Nihil (semua Rp3.000).');
  }

  console.log('\n--- DAFTAR PRODUK DENGAN SELISIH TEMPERATURE HOT VS ICED != Rp0 ---');
  if (tempDeviations.length > 0) {
    console.table(tempDeviations);
  } else {
    console.log('Nihil (semua Rp0).');
  }

  console.log('\n--- HASIL PENGECEKAN KHUSUS TARO / MATCHA / NON-COFFEE / FRAPPE ---');
  console.table(specialChecks.slice(0, 25));
}

runDeepSurvey().catch(err => {
  console.error('Error saat deep survey:', err);
});
