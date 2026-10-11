import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../docs/api-samples');
const BASE_URL = process.env.KOPI_KENANGAN_API_BASE || 'https://order.kopikenangan.com/web_order/api';
const PHONE = process.env.KOPI_KENANGAN_PHONE || '6281234567890';

async function postKK(endpoint, body, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'language': 'id',
    'time_zone': '7',
  };
  if (token) {
    headers['authorization'] = token;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

async function run() {
  console.log('🚀 Starting Kopi Kenangan API test suite...');
  await fs.mkdir(SAMPLES_DIR, { recursive: true });

  // 1. create_web_token
  console.log('1. Testing /create_web_token...');
  const tokenRes = await postKK('/create_web_token', { phone: PHONE });
  const rawToken = tokenRes.data?.web_order_session_token;
  console.log('   Result:', tokenRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED', tokenRes.msg);

  // Sanitize token response
  const sanitizedTokenRes = JSON.parse(JSON.stringify(tokenRes));
  if (sanitizedTokenRes.data) {
    sanitizedTokenRes.data.web_order_session_token = 'REDACTED_WEB_ORDER_SESSION_TOKEN';
    sanitizedTokenRes.data.customer_name = 'REDACTED_CUSTOMER_NAME';
  }
  await fs.writeFile(
    path.join(SAMPLES_DIR, 'create_web_token.sample.json'),
    JSON.stringify(sanitizedTokenRes, null, 2),
    'utf-8'
  );

  // 2. store/query_store
  console.log('2. Testing /store/query_store...');
  const queryStoreRes = await postKK('/store/query_store', {
    page_num: 1,
    page_size: 5,
    keyword: '',
    store_type: 0,
  });
  console.log('   Result:', queryStoreRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED', `Found ${queryStoreRes.data?.total || 0} total stores`);

  await fs.writeFile(
    path.join(SAMPLES_DIR, 'query_store.sample.json'),
    JSON.stringify(queryStoreRes, null, 2),
    'utf-8'
  );

  // Pick target store
  const targetStoreCode = 'CIMB'; // Graha CIMB Niaga

  // 3. store/get_store
  console.log(`3. Testing /store/get_store for store: ${targetStoreCode}...`);
  const getStoreRes = await postKK('/store/get_store', {
    store_code: targetStoreCode,
  });
  console.log('   Result:', getStoreRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED', `is_open: ${getStoreRes.data?.is_open}, open: ${getStoreRes.data?.open}, close: ${getStoreRes.data?.close}`);

  await fs.writeFile(
    path.join(SAMPLES_DIR, 'get_store.sample.json'),
    JSON.stringify(getStoreRes, null, 2),
    'utf-8'
  );

  const outletId = getStoreRes.data?.id;

  // 4. product/query_web_order_product_menu
  console.log(`4. Testing /product/query_web_order_product_menu for store: ${targetStoreCode}...`);
  const menuRes = await postKK(
    '/product/query_web_order_product_menu',
    {
      store_code: targetStoreCode,
      sales_type: 10402,
    },
    rawToken
  );
  console.log('   Result:', menuRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED', `Groups: ${menuRes.data?.menu_groups?.length || 0}`);

  await fs.writeFile(
    path.join(SAMPLES_DIR, 'query_web_order_product_menu.sample.json'),
    JSON.stringify(menuRes, null, 2),
    'utf-8'
  );

  // Find a coffee product and a combo product for detailed option testing
  let coffeeProduct = null;
  let comboProduct = null;

  for (const group of menuRes.data?.menu_groups || []) {
    if (group.group_name === 'Coffee' && !coffeeProduct) {
      coffeeProduct = group.menu_products?.[0];
    }
    if (group.group_name === 'Promo & Combo' && !comboProduct) {
      comboProduct = group.menu_products?.find(p => p.is_combo_v2);
    }
  }

  // Fallback defaults if not found
  const bundleCode = coffeeProduct?.bundle_code || '7245645';
  const comboBundleCode = comboProduct?.bundle_code || '1762943';

  // 5. product/get_web_order_product_options
  console.log(`5. Testing /product/get_web_order_product_options (bundle_code: ${bundleCode})...`);
  const optionsRes = await postKK(
    '/product/get_web_order_product_options',
    {
      outlet_id: outletId,
      store_code: targetStoreCode,
      bundle_code: bundleCode,
      sales_type_code: 10402,
    },
    rawToken
  );
  console.log(
    '   Result:',
    optionsRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED',
    `SKU combos: ${Object.keys(optionsRes.data?.option_product_map || {}).length}, Addons: ${optionsRes.data?.product_addon_wording?.[0]?.dimension_value_wordings?.length || 0}`
  );

  await fs.writeFile(
    path.join(SAMPLES_DIR, 'get_web_order_product_options.sample.json'),
    JSON.stringify(optionsRes, null, 2),
    'utf-8'
  );

  // 6. product/get_web_order_combo_items
  console.log(`6. Testing /product/get_web_order_combo_items (combo_code: ${comboBundleCode})...`);
  const comboRes = await postKK(
    '/product/get_web_order_combo_items',
    {
      OutletId: outletId,
      StoreCode: targetStoreCode,
      ComboBundleCode: comboBundleCode,
      sales_type_code: 10402,
      DefaultSelections: [],
    },
    rawToken
  );
  console.log('   Result:', comboRes.error_code === 0 ? '✅ SUCCESS' : '❌ FAILED', `Combo name: ${comboRes.data?.Combo?.combo_name}`);

  await fs.writeFile(
    path.join(SAMPLES_DIR, 'get_web_order_combo_items.sample.json'),
    JSON.stringify(comboRes, null, 2),
    'utf-8'
  );

  console.log(`\n🎉 All tests completed successfully! Samples saved to ${SAMPLES_DIR}`);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
