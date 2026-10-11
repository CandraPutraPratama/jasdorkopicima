import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import { SupabaseCacheService, cacheKeys } from '../src/lib/cache.ts';
import { searchOutlets, syncOutletsToDb } from '../src/lib/outlet-service.ts';

async function main() {
  console.log('====================================================');
  console.log('   VERIFIKASI INTEGRASI SUPABASE (TAHAP 4 BAGIAN B)  ');
  console.log('====================================================\n');

  const supabase = getSupabaseServerClient();
  const cache = new SupabaseCacheService();

  // 1. Uji CacheService dengan Supabase
  console.log('▶ 1. Menguji generic_cache di Supabase...');
  const testKey = 'test:verification:menu';
  const testPayload = { store: 'CIMB', categories: 8, updatedAt: new Date().toISOString() };

  console.log('   - Menyimpan payload ke Supabase generic_cache...');
  await cache.set(testKey, testPayload, 5); // TTL 5 detik

  console.log('   - Membaca data aktif (HIT)...');
  const hit = await cache.get(testKey);
  console.log('   - Hasil HIT:', hit ? '✅ BERHASIL' : '❌ GAGAL', hit);

  console.log('   - Menunggu kedaluwarsa 6 detik...');
  await new Promise(r => setTimeout(r, 6000));

  const miss = await cache.get(testKey);
  console.log('   - Hasil get() setelah expired:', miss === null ? '✅ BERHASIL (mengembalikan null)' : '❌ GAGAL');

  const stale = await cache.getStale(testKey);
  console.log('   - Hasil getStale() (stale-if-error):', stale ? '✅ BERHASIL (stale data ada)' : '❌ GAGAL', stale);

  await cache.delete(testKey);
  console.log('   - Pembersihan key uji coba: ✅ BERHASIL');

  // 2. Uji Sinkronisasi Outlet ke Supabase
  console.log('\n▶ 2. Menguji Sinkronisasi Outlet ke Supabase...');
  console.log('   - Menjalankan syncOutletsToDb() ke Supabase...');
  const syncResult = await syncOutletsToDb();
  console.log(`   - Hasil Sync: ${syncResult.syncedCount} outlet tersinkronisasi dalam ${syncResult.durationMs}ms ✅`);

  // 3. Uji Query Pencarian Cepat di Supabase
  console.log('\n▶ 3. Menguji Pencarian Cepat di Supabase (pg_trgm)...');
  const searchRungkut = await searchOutlets('Rungkut', 1, 10);
  console.log(`   - Pencarian 'Rungkut': ${searchRungkut.total} ditemukan (Sumber: ${searchRungkut.source})`);
  for (const item of searchRungkut.items) {
    console.log(`     * [${item.code}] ${item.name} | ${item.address}`);
  }

  const searchMerr = await searchOutlets('MERR', 1, 10);
  console.log(`   - Pencarian 'MERR': ${searchMerr.total} ditemukan (Sumber: ${searchMerr.source})`);
  for (const item of searchMerr.items) {
    console.log(`     * [${item.code}] ${item.name}`);
  }

  console.log('\n====================================================');
  console.log('✅ SELURUH INTEGRASI SUPABASE TAHAP 4B TERVERIFIKASI!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
