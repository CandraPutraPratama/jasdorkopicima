import { getSupabaseServerClient } from '../src/lib/supabase-server.ts';
import { FORE_MENU_CACHE, getForeMenuForOutlet } from '../src/lib/fore-menu-data.ts';
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
const codes = rows.slice(1).map(r => r[headers.indexOf('code')]);

async function main() {
  console.log('Menghubungkan ke Supabase generic_cache...');
  const supabase = getSupabaseServerClient();

  // TTL 30 hari untuk cache menu Fore
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  console.log(`Memulai seeding menu cache untuk ${codes.length} outlet Fore...`);
  const chunkSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < codes.length; i += chunkSize) {
    const chunkCodes = codes.slice(i, i + chunkSize);
    const chunkRows = chunkCodes.map(code => ({
      key: `menu:${code}`,
      payload: getForeMenuForOutlet(code),
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('generic_cache')
      .upsert(chunkRows, { onConflict: 'key' });

    if (error) {
      console.error(`Gagal upsert cache batch ${i} - ${i + chunkCodes.length}:`, error.message);
    } else {
      totalInserted += chunkCodes.length;
      console.log(`Berhasil upsert cache ${totalInserted}/${codes.length} outlet`);
    }
  }

  console.log('Selesai seeding menu Fore ke generic_cache!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
