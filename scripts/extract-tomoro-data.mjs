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
const tzIdx = headers.indexOf('timezone');
const codeIdx = headers.indexOf('code');
const tzMap = {};
const nonJakarta = {};

rows.slice(1).forEach(r => {
  if (!r[codeIdx]) return;
  const code = r[codeIdx].trim();
  const tz = r[tzIdx].trim();
  tzMap[tz] = (tzMap[tz] || 0) + 1;
  if (tz !== 'Asia/Jakarta') {
    nonJakarta[code] = tz;
  }
});

console.log('Total outlets in CSV:', rows.length - 1);
console.log('Timezones breakdown:', tzMap);
console.log('Non-Jakarta count:', Object.keys(nonJakarta).length);

fs.writeFileSync('src/lib/tomoro-timezone-data.json', JSON.stringify(nonJakarta, null, 2));
console.log('Saved src/lib/tomoro-timezone-data.json');
