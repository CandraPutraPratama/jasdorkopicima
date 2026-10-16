import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import fs from 'fs';

const rawCsv = fs.readFileSync('docs/fore-outlets-seed.csv', 'utf-8');

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }
  return lines;
}

const rows = parseCSV(rawCsv);
const headers = rows[0];
const outlets = rows.slice(1).map(r => {
  const obj = {};
  headers.forEach((h, idx) => {
    obj[h] = r[idx];
  });
  return {
    code: obj.code,
    name: obj.name,
    address: obj.address || '',
    latitude: obj.latitude ? parseFloat(obj.latitude) : null,
    longitude: obj.longitude ? parseFloat(obj.longitude) : null,
    open_time: obj.open_time || '07:00:00',
    close_time: obj.close_time || '22:00:00',
    is_active: true,
    brand: 'Fore Coffee',
    is_in_scope: true,
    timezone: obj.timezone || 'Asia/Jakarta',
  };
});

async function main() {
  console.log('Menghubungkan ke Supabase...');
  const supabase = getSupabaseServerClient();

  // Test apakah kolom timezone ada
  console.log('Memeriksa ketersediaan kolom timezone...');
  const { error: testColErr } = await supabase.from('outlets').select('timezone').limit(1);
  let hasTimezoneColumn = !testColErr;

  if (!hasTimezoneColumn) {
    console.warn('Perhatian: Kolom timezone belum ada di tabel outlets Supabase.');
    console.warn('Outlet akan di-seed dengan kolom standar (code, name, address, lat, lng, open_time, close_time, is_active, brand, is_in_scope).');
  } else {
    console.log('Kolom timezone tersedia!');
  }

  console.log(`Memulai seeding ${outlets.length} outlet Fore Coffee...`);
  const chunkSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < outlets.length; i += chunkSize) {
    const chunk = outlets.slice(i, i + chunkSize).map(o => {
      if (!hasTimezoneColumn) {
        const { timezone, ...rest } = o;
        return rest;
      }
      return o;
    });

    const { error } = await supabase
      .from('outlets')
      .upsert(chunk, { onConflict: 'code' });

    if (error) {
      console.error(`Gagal upsert batch ${i} - ${i + chunk.length}:`, error.message);
    } else {
      totalInserted += chunk.length;
      console.log(`Berhasil upsert ${totalInserted}/${outlets.length} outlet`);
    }
  }

  // Verifikasi total Fore Coffee di DB
  const { count, error: countErr } = await supabase
    .from('outlets')
    .select('*', { count: 'exact', head: true })
    .eq('brand', 'Fore Coffee');

  console.log(`Total outlet Fore Coffee di database: ${count}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
