/**
 * Pengujian komparatif parameter `deliverable` pada endpoint query_store Kopi Kenangan.
 * Menggunakan URL resmi dan tanpa nomor HP (phone: "").
 */

const BASE_URL = 'https://order.kopikenangan.com/web_order/api';

async function testDeliverable(deliverableValue, label) {
  const payload = {
    page: { page_index: 1, page_size: 20 },
    page_num: 1,
    page_size: 20,
    store_type: 0,
  };

  if (deliverableValue !== undefined) {
    payload.deliverable = deliverableValue;
  }

  const res = await fetch(`${BASE_URL}/store/query_store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'language': 'id',
      'time_zone': '7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const total = data.data?.total || 0;
  const sampleStores = (data.data?.store || []).slice(0, 3).map(s => ({
    code: s.code,
    name: s.name,
    isOpen: s.is_open,
  }));

  console.log(`[${label}] deliverable: ${deliverableValue !== undefined ? deliverableValue : 'NONE (tanpa parameter)'}`);
  console.log(`  -> Status: ${data.error_code === 0 ? 'SUCCESS' : 'FAILED'} (msg: ${data.msg})`);
  console.log(`  -> Total outlet ditemukan: ${total}`);
  console.log(`  -> Sampel 3 outlet:`, sampleStores.map(s => `[${s.code}] ${s.name}`).join(' | '));
  console.log('----------------------------------------------------');

  return { label, deliverableValue, total, stores: data.data?.store || [] };
}

async function run() {
  console.log('====================================================');
  console.log('  UJI KOMPARATIF PARAMETER DELIVERABLE QUERY_STORE');
  console.log('====================================================\n');

  const rNone = await testDeliverable(undefined, 'TANPA DELIVERABLE');
  const r0 = await testDeliverable(0, 'DELIVERABLE 0 (Pickup + Delivery)');
  const r1 = await testDeliverable(1, 'DELIVERABLE 1 (Delivery Only)');
  const r2 = await testDeliverable(2, 'DELIVERABLE 2 (Pickup Only / Pickup Capable)');

  // Analisis apakah outlet di deliverable 2 mencakup outlet pickup+delivery
  console.log('\n=== KESIMPULAN ANGKA TOTAL OUTLET ===');
  console.log(`1. Tanpa parameter deliverable : ${rNone.total} outlet`);
  console.log(`2. deliverable: 0             : ${r0.total} outlet`);
  console.log(`3. deliverable: 1             : ${r1.total} outlet`);
  console.log(`4. deliverable: 2             : ${r2.total} outlet`);
}

run().catch(console.error);
