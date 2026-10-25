import ExcelJS from 'exceljs';

async function compare() {
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const ws1 = wb1.worksheets[0];

  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.USER_EDITED.xlsx');
  const ws2 = wb2.worksheets[0];

  let diffs = 0;
  for (let r = 1; r <= Math.max(ws1.rowCount, ws2.rowCount); r++) {
    const row1 = ws1.getRow(r);
    const row2 = ws2.getRow(r);
    for (let c = 1; c <= Math.max(row1.cellCount, row2.cellCount); c++) {
      const v1 = row1.getCell(c).value;
      const v2 = row2.getCell(c).value;
      const s1 = typeof v1 === 'object' && v1 ? (v1.result ?? v1.text ?? JSON.stringify(v1)) : String(v1 ?? '');
      const s2 = typeof v2 === 'object' && v2 ? (v2.result ?? v2.text ?? JSON.stringify(v2)) : String(v2 ?? '');
      if (s1 !== s2) {
        diffs++;
        if (diffs <= 30) {
          const colHeader = ws1.getRow(4).getCell(c).value;
          const prodName = ws1.getRow(r).getCell(3).value;
          console.log(`Diff at row ${r}, col ${c} [${colHeader}] (Product: ${prodName}):`);
          console.log(`  Latest Super_Detail.xlsx: "${s1}"`);
          console.log(`  USER_EDITED.xlsx:        "${s2}"`);
        }
      }
    }
  }
  console.log('\nTotal cell diffs between Latest and USER_EDITED:', diffs);
}

compare().catch(console.error);
