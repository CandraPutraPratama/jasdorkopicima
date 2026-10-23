import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const rawCsv = fs.readFileSync('docs/tomoro-outlets-seed.csv', 'utf-8');
const rows = parseCSV(rawCsv);
const headers = rows[0];

const codeIdx = headers.indexOf('code');
const nameIdx = headers.indexOf('name');
const addrIdx = headers.indexOf('address');
const latIdx = headers.indexOf('latitude');
const lngIdx = headers.indexOf('longitude');
const isOpenIdx = headers.indexOf('isOpen');

const nowIso = new Date().toISOString();

const outlets = rows.slice(1).filter(r => r[codeIdx]).map(r => {
  const isOpenVal = r[isOpenIdx];
  const isActive = isOpenVal === 'true' || isOpenVal === 'TRUE' || isOpenVal === true;
  return {
    code: r[codeIdx].trim(),
    name: r[nameIdx].trim(),
    address: (r[addrIdx] || '').trim(),
    latitude: r[latIdx] ? parseFloat(r[latIdx]) : null,
    longitude: r[lngIdx] ? parseFloat(r[lngIdx]) : null,
    open_time: null,
    close_time: null,
    is_active: isActive,
    brand: 'TOMORO Coffee',
    is_in_scope: true,
    updated_at: nowIso,
  };
});

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Konfigurasi Supabase tidak lengkap (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log(`Memulai seeding ${outlets.length} outlet TOMORO Coffee ke Supabase...`);
  const chunkSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < outlets.length; i += chunkSize) {
    const chunk = outlets.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('outlets')
      .upsert(chunk, { onConflict: 'code' });

    if (error) {
      console.error(`Gagal upsert batch ${i} - ${i + chunk.length}:`, error.message);
      throw error;
    } else {
      totalInserted += chunk.length;
      console.log(`Berhasil upsert ${totalInserted}/${outlets.length} outlet`);
    }
  }

  // Verifikasi total Tomoro Coffee di DB
  const { count, error: countErr } = await supabase
    .from('outlets')
    .select('*', { count: 'exact', head: true })
    .eq('brand', 'TOMORO Coffee');

  if (countErr) {
    console.error('Gagal hitung outlet:', countErr.message);
  } else {
    console.log(`Total outlet TOMORO Coffee terverifikasi di database: ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
