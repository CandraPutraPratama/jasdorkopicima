import { KkApiClient } from '../src/lib/kk-client.ts';
import fs from 'node:fs/promises';

const client = new KkApiClient();

async function runSurvey() {
  console.log('--- Memulai Survey 30 Outlet KK ---');
  
  // 1. Ambil 30 outlet dari queryStore
  const storeRes = await client.queryStore({ pageSize: 35, deliverable: 2 });
  const outlets = (storeRes.store || []).slice(0, 30);
  console.log(`Berhasil mengambil ${outlets.length} outlet untuk survei.`);

  const menuGroupOccurrences = {};
  const outletsMenuGroups = [];
  const uniqueOptionDeltas = new Map(); // value_text -> Set of deltas observed
  const optionValuePricesByProduct = [];
  const uniqueAddons = new Map(); // addon_name -> { categoryName, prices: Set, sampleProduct }
  let productsCheckedCount = 0;
  let optionsRequestsCount = 0;

  // Konfigurasi flat harga revisi
  const flatPrices = {
    'Large': 5000,
    'Juwara Beans': 3000,
    'Oatside': 3000,
  };

  const largeJuwaraOatsideDeviations = [];
  const otherOptionsWithNonZeroDelta = new Map();

  for (let i = 0; i < outlets.length; i++) {
    const o = outlets[i];
    const storeCode = o.code || o.store_code;
    const storeName = o.name || o.alias || storeCode;
    console.log(`[${i + 1}/${outlets.length}] Memeriksa outlet ${storeCode} (${storeName})...`);

    try {
      const menu = await client.queryProductMenu(storeCode);
      const groups = menu.menu_groups || [];
      const groupNames = groups.map(g => (g.group_name || '').trim());
      outletsMenuGroups.push({ storeCode, storeName, groupNames });

      for (const gn of groupNames) {
        menuGroupOccurrences[gn] = (menuGroupOccurrences[gn] || 0) + 1;
      }

      // Ambil beberapa produk dari berbagai kelompok (terutama Coffee, Non Coffee, Frappe, Toast, dll)
      for (const g of groups) {
        const products = (g.menu_products || []).filter(p => !p.is_combo_v2);
        for (const p of products) {
          productsCheckedCount++;
          // Untuk menghemat request agar tidak terkena rate limit, ambil opsi untuk produk yang bervariasi
          // atau sampel 3 produk per grup
        }
      }
    } catch (err) {
      console.warn(`Gagal memuat menu outlet ${storeCode}:`, err.message);
    }
  }

  // Sekarang ambil detail opsi produk untuk 30+ produk dari berbagai kelompok di beberapa outlet representatif
  // (misal Surabaya MERR, CIMB Niaga, dll)
  const sampleOutlet = outlets[0];
  const sampleCode = sampleOutlet.code || sampleOutlet.store_code;
  const sampleMenu = await client.queryProductMenu(sampleCode);
  
  console.log('\n--- Mengambil Opsi Produk Sampel Lengkap ---');
  for (const g of sampleMenu.menu_groups || []) {
    const gName = (g.group_name || '').trim();
    const prods = (g.menu_products || []).filter(p => !p.is_combo_v2);
    // Ambil semua produk di grup ini
    for (const p of prods) {
      try {
        const opts = await client.getProductOptions(sampleOutlet.id, sampleCode, p.bundle_code);
        optionsRequestsCount++;
        const basePrice = opts.base_product?.price || 0;
        const prodName = opts.base_product?.name || p.name;

        // Analisis Dimensi & Option Product Map
        const dimWordings = opts.product_dimension_wording?.dimension_wordings || [];
        const optMap = opts.option_product_map || {};

        // Cek setiap SKU di optMap
        for (const [key, skuItem] of Object.entries(optMap)) {
          const skuPrice = skuItem.price || 0;
          const delta = skuPrice - basePrice;

          // Telusuri nilai opsi mana yang menyusun key ini
          // key biasanya kombinasi value ID misalnya "4064,4066,4069"
          const valIds = key.split(/[,_]/).map(s => s.trim());
          
          for (const valId of valIds) {
            // Cari nama nilai opsi
            for (const dim of dimWordings) {
              const matchedVal = (dim.dimension_value_wordings || []).find(v => String(v.value) === valId);
              if (matchedVal) {
                const valText = (matchedVal.value_text || '').trim();
                const dimName = (dim.dimension_text || '').trim();

                // Catat delta
                if (!uniqueOptionDeltas.has(valText)) {
                  uniqueOptionDeltas.set(valText, { dimName, deltas: new Set() });
                }
                uniqueOptionDeltas.get(valText).deltas.add(delta);

                // Cek apakah Large / Juwara / Oatside berbeda dari flat
                if (valText === 'Large') {
                  if (delta !== 5000 && delta > 0) {
                    largeJuwaraOatsideDeviations.push({ prodName, valText, delta, expected: 5000 });
                  }
                } else if (valText === 'Juwara Beans') {
                  if (delta !== 3000 && delta > 0) {
                    largeJuwaraOatsideDeviations.push({ prodName, valText, delta, expected: 3000 });
                  }
                } else if (valText.toLowerCase().includes('oatside')) {
                  if (delta !== 3000 && delta > 0) {
                    largeJuwaraOatsideDeviations.push({ prodName, valText, delta, expected: 3000 });
                  }
                } else {
                  // Opsi selain itu
                  if (delta > 0 && !valText.toLowerCase().includes('jumbo')) {
                    if (!otherOptionsWithNonZeroDelta.has(valText)) {
                      otherOptionsWithNonZeroDelta.set(valText, new Set());
                    }
                    otherOptionsWithNonZeroDelta.get(valText).add(`${prodName} (delta: ${delta})`);
                  }
                }
              }
            }
          }
        }

        // Analisis Addons
        const rawAddons = Array.isArray(opts.product_addon_wording)
          ? opts.product_addon_wording
          : opts.product_addon_wording?.addon_wordings || [];

        for (const ag of rawAddons) {
          const cat = (ag.dimension_text || '').trim();
          for (const item of ag.dimension_value_wordings || []) {
            const aName = (item.value_text || '').trim();
            if (!uniqueAddons.has(aName)) {
              uniqueAddons.set(aName, {
                categoryName: cat,
                prices: new Set(),
                sampleProduct: prodName,
              });
            }
            uniqueAddons.get(aName).prices.add(item.addon_price || 0);
          }
        }

        // Analisis Notes (apakah ada whipped cream di notes?)
        for (const n of opts.notes || []) {
          for (const g of n.groups || []) {
            const optName = (g.option_name || '').trim();
            for (const vt of g.value_texts || []) {
              if (vt.toLowerCase().includes('whip') || optName.toLowerCase().includes('whip')) {
                console.log(`[Whipped Cream di Notes] Produk "${prodName}", Group: "${optName}", Value: "${vt}"`);
              }
            }
          }
        }

      } catch (err) {
        // Abaikan error individual opsi
      }
    }
  }

  // Simpan hasil ke file laporan
  const summaryReport = {
    outletsSurveyedCount: outlets.length,
    menuGroupOccurrences,
    sampleOutletsMenuGroups: outletsMenuGroups.slice(0, 12),
    largeJuwaraOatsideDeviations,
    otherOptionsWithNonZeroDelta: Object.fromEntries(
      Array.from(otherOptionsWithNonZeroDelta.entries()).map(([k, v]) => [k, Array.from(v)])
    ),
    uniqueAddons: Object.fromEntries(
      Array.from(uniqueAddons.entries()).map(([k, v]) => [k, {
        categoryName: v.categoryName,
        prices: Array.from(v.prices),
        sampleProduct: v.sampleProduct
      }])
    ),
    uniqueOptionDeltas: Object.fromEntries(
      Array.from(uniqueOptionDeltas.entries()).map(([k, v]) => [k, {
        dimName: v.dimName,
        deltas: Array.from(v.deltas)
      }])
    )
  };

  await fs.writeFile('scripts/survey-results.json', JSON.stringify(summaryReport, null, 2), 'utf-8');
  console.log('\n--- Survey Selesai! Hasil disimpan di scripts/survey-results.json ---');
}

runSurvey().catch(err => {
  console.error('Survey gagal:', err);
  process.exit(1);
});
