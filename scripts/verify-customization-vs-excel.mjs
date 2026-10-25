import ExcelJS from 'exceljs';
import { FORE_CUSTOMIZATION_MAP, normalizeForeMenuKey } from '../src/lib/fore-customization-data.ts';

async function verify() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const ws = wb.worksheets[0];

  // Header row 4
  const headers = [];
  ws.getRow(4).eachCell((cell, col) => {
    headers[col] = String(cell.value || '').trim();
  });

  console.log(`Found ${headers.filter(Boolean).length} columns in Row 4.`);
  console.log('Columns:');
  headers.forEach((h, idx) => {
    if (h) console.log(`  Col ${idx}: ${h}`);
  });

  let mismatches = 0;
  let verifiedCount = 0;

  for (let r = 5; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cat = String(row.getCell(2).value || '').trim();
    const name = String(row.getCell(3).value || '').trim();
    if (!name) continue;

    const key = normalizeForeMenuKey(name);
    const config = FORE_CUSTOMIZATION_MAP[key];

    if (!config) {
      console.error(`[Row ${r}] Product "${name}" NOT found in FORE_CUSTOMIZATION_MAP!`);
      mismatches++;
      continue;
    }

    verifiedCount++;

    // Check hasCustomization
    const adaKustom = String(row.getCell(6).value || '').trim().toUpperCase() === 'YA';
    if (config.hasCustomization !== adaKustom) {
      console.log(`[Row ${r}] ${name} hasCustomization mismatch: Excel=${adaKustom}, Map=${config.hasCustomization}`);
      mismatches++;
    }

    // Check canIce & canHot
    const canIce = String(row.getCell(7).value || '').trim().toUpperCase() === 'YA';
    const canHot = String(row.getCell(8).value || '').trim().toUpperCase() === 'YA';
    if (config.canIce !== canIce) {
      console.log(`[Row ${r}] ${name} canIce mismatch: Excel=${canIce}, Map=${config.canIce}`);
      mismatches++;
    }
    if (config.canHot !== canHot) {
      console.log(`[Row ${r}] ${name} canHot mismatch: Excel=${canHot}, Map=${config.canHot}`);
      mismatches++;
    }

    // Check sizes
    const regCup = String(row.getCell(9).value || '').trim().toUpperCase() === 'YA';
    const lrgCup = String(row.getCell(10).value || '').trim().toUpperCase() === 'YA';
    if (config.sizes.regular !== regCup || config.sizes.large !== lrgCup) {
      console.log(`[Row ${r}] ${name} sizes mismatch: Excel=(${regCup}, ${lrgCup}), Map=(${config.sizes.regular}, ${config.sizes.large})`);
      mismatches++;
    }

    // Check category in config
    if (config.kategori !== cat) {
      console.log(`[Row ${r}] ${name} category mismatch: Excel="${cat}", Map="${config.kategori}"`);
      mismatches++;
    }
  }

  console.log(`\nVerification finished: ${verifiedCount} products checked, ${mismatches} mismatches found.`);
}

verify().catch(console.error);
