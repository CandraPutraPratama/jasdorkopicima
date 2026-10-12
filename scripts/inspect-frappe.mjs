import { KkApiClient } from '../src/lib/kk-client.ts';

const client = new KkApiClient();

async function checkFrappe() {
  const storeRes = await client.queryStore({ pageSize: 5, deliverable: 2 });
  const store = storeRes.store[0];
  const menu = await client.queryProductMenu(store.code);
  const frappeGroup = menu.menu_groups.find(g => g.group_name.toLowerCase().includes('frappe'));
  if (!frappeGroup) {
    console.log('Tidak ada frappe group di store ini');
    return;
  }
  const frappeProd = frappeGroup.menu_products[0];
  console.log('Testing Frappe product:', frappeProd.name, frappeProd.bundle_code);
  const opts = await client.getProductOptions(store.id, store.code, frappeProd.bundle_code);
  console.log('--- Frappe Addon Wordings ---');
  console.log(JSON.stringify(opts.product_addon_wording, null, 2));
  console.log('--- Frappe Dimensions ---');
  console.log(JSON.stringify(opts.product_dimension_wording, null, 2));
  console.log('--- Frappe Notes ---');
  console.log(JSON.stringify(opts.notes, null, 2));
}

checkFrappe().catch(console.error);
