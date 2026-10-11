/**
 * Smoke test untuk deployment live di Cloudflare: https://jasdor.cimagroup.my.id
 */
const BASE_URL = 'https://jasdor.cimagroup.my.id';

async function fetchJson(url) {
  console.log(`\nTesting GET ${url}...`);
  const start = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmokeTester/1.0',
    },
  });
  const elapsed = Date.now() - start;
  console.log(`Status: ${res.status} ${res.statusText} (${elapsed}ms)`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Response error body:`, text.slice(0, 300));
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  const data = await res.json();
  return { data, elapsed };
}

async function main() {
  console.log(`=== CLOUDFLARE LIVE SMOKE TEST: ${BASE_URL} ===\n`);
  
  // 1. /api/operational-status
  console.log('--- 1. Testing /api/operational-status ---');
  const opStatus = await fetchJson(`${BASE_URL}/api/operational-status`);
  console.log(`Result:`, JSON.stringify(opStatus.data, null, 2));

  // 2. /api/outlets?q=Rungkut
  console.log('\n--- 2. Testing /api/outlets?q=Rungkut ---');
  const outlets = await fetchJson(`${BASE_URL}/api/outlets?q=Rungkut`);
  console.log(`Found ${outlets.data.total} total outlets matching 'Rungkut'`);
  console.log(`Returned items: ${outlets.data.items.length}`);
  for (const item of outlets.data.items) {
    console.log(`- [${item.code}] ${item.name} | isOpen: ${item.isOpen} | addr: ${item.address}`);
  }

  // Cari outlet DT Rungkut
  const dtOutlet = outlets.data.items.find(o => 
    o.name.toLowerCase().includes('rungkut') && (o.name.includes('DT') || o.name.toLowerCase().includes('merr'))
  ) || outlets.data.items[0];

  if (!dtOutlet) {
    throw new Error('Tidak ditemukan outlet Rungkut!');
  }

  console.log(`\nTarget outlet terpilih: [${dtOutlet.code}] ${dtOutlet.name}`);

  // 3. /api/outlets/<kode>/menu
  console.log(`\n--- 3. Testing /api/outlets/${dtOutlet.code}/menu ---`);
  const menuRes = await fetchJson(`${BASE_URL}/api/outlets/${dtOutlet.code}/menu`);
  const groups = menuRes.data.menuGroups || [];
  console.log(`Outlet menu loaded: ${groups.length} menu groups.`);
  for (const g of groups.slice(0, 5)) {
    console.log(`- Kategori [${g.name}]: ${g.products?.length || 0} produk`);
  }
  
  // Cari 1 produk yang memiliki options
  let sampleProduct = null;
  for (const group of groups) {
    for (const prod of group.products || []) {
      if (prod.bundleCode) {
        sampleProduct = prod;
        break;
      }
    }
    if (sampleProduct) break;
  }

  if (!sampleProduct) {
    throw new Error('Tidak ditemukan produk dengan bundleCode di menu!');
  }

  console.log(`\nSample product terpilih: [${sampleProduct.bundleCode}] "${sampleProduct.name}" - Base Price: Rp${sampleProduct.basePrice.toLocaleString('id-ID')}`);

  // 4. /api/outlets/<kode>/products/<bundleCode>/options
  console.log(`\n--- 4. Testing /api/outlets/${dtOutlet.code}/products/${sampleProduct.bundleCode}/options ---`);
  const optionsRes = await fetchJson(`${BASE_URL}/api/outlets/${dtOutlet.code}/products/${sampleProduct.bundleCode}/options`);
  const opt = optionsRes.data.options;
  
  console.log(`Product Name: ${opt.product.name}`);
  console.log(`Dimensions (ukuran, suhu, gula, dll): ${opt.dimensions?.length || 0} dimensi`);
  for (const dim of opt.dimensions || []) {
    console.log(`  - Dimensi: ${dim.name} (${dim.values.map(v => v.name).join(', ')})`);
  }
  console.log(`Variant SKUs combinations: ${opt.skus?.length || 0} kombinasi harga`);
  for (const sku of (opt.skus || []).slice(0, 3)) {
    console.log(`  - SKU: ${sku.sku} | ${sku.description} -> Rp${sku.price.toLocaleString('id-ID')} (Delta: +Rp${sku.variantAddition.toLocaleString('id-ID')})`);
  }
  console.log(`Toppings / Addons: ${opt.addons?.length || 0} item`);
  for (const add of (opt.addons || []).slice(0, 3)) {
    console.log(`  - Addon: ${add.name} (+Rp${add.price.toLocaleString('id-ID')})`);
  }
  console.log(`Notes (ice dsb): ${opt.notes?.length || 0} kelompok catatan`);

  console.log(`\n================================================================`);
  console.log(`✅ SEMUA 4 ENDPOINT BERHASIL DIAKSES DAN MEMANGGIL API KOPI KENANGAN DARI CLOUDFLARE WORKERS!`);
  console.log(`================================================================`);
}

main().catch(err => {
  console.error('\nSmoke test FAILED:', err);
  process.exit(1);
});
