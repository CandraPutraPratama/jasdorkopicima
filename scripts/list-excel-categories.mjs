import ExcelJS from 'exceljs';

async function list() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const ws = wb.worksheets[0];

  const catMap = {};
  for (let r = 5; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cat = String(row.getCell(2).value || '').trim();
    const name = String(row.getCell(3).value || '').trim();
    if (!name) continue;
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push({ row: r, name });
  }

  console.log('Categories and their products:');
  for (const [cat, items] of Object.entries(catMap)) {
    console.log(`\n=== Category: "${cat}" (${items.length} items) ===`);
    for (const it of items) {
      console.log(`  - [Row ${it.row}] ${it.name}`);
    }
  }
}

list().catch(console.error);
