import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';

const PROD_URL = 'https://jasdor.cimagroup.my.id/api/cron/sync-outlets';
const syncSecret = process.env.SYNC_SECRET;

if (!syncSecret) {
  console.error('SYNC_SECRET tidak ditemukan di environment!');
  process.exit(1);
}

async function run() {
  console.log(`Mengambil waktu updated_at awal sebelum sync...`);
  const supabase = getSupabaseServerClient();
  const { data: initialOutlet } = await supabase
    .from('outlets')
    .select('code, name, updated_at')
    .eq('code', 'KK.SBY.MERRNGKTDT')
    .single();

  console.log(`Outlet MERR sebelum sync: updated_at = ${initialOutlet?.updated_at}`);

  console.log(`\nMemanggil POST ${PROD_URL} dengan Header Authorization: Bearer <SECRET>...`);
  const start = Date.now();
  const res = await fetch(PROD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${syncSecret}`,
      'Content-Type': 'application/json',
    },
  });

  const duration = Date.now() - start;
  console.log(`Status HTTP: ${res.status} ${res.statusText} (${duration}ms)`);
  const body = await res.json();
  console.log(`Response Body:`, JSON.stringify(body, null, 2));

  if (!res.ok) {
    throw new Error(`Gagal sync di production: ${JSON.stringify(body)}`);
  }

  console.log(`\nMemeriksa updated_at di tabel outlets setelah sync production...`);
  const { data: updatedOutlet } = await supabase
    .from('outlets')
    .select('code, name, updated_at')
    .eq('code', 'KK.SBY.MERRNGKTDT')
    .single();

  console.log(`Outlet MERR sesudah sync: updated_at = ${updatedOutlet?.updated_at}`);

  const { count: totalOutlets } = await supabase
    .from('outlets')
    .select('*', { count: 'exact', head: true });

  console.log(`Total baris outlet di Supabase sekarang: ${totalOutlets} outlet`);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
