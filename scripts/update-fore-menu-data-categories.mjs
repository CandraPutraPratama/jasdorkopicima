import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { FORE_MENU_CACHE } from '../src/lib/fore-menu-data.ts';

async function update() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const ws = wb.worksheets[0];

  const categoryOrder = [];
  const productCategoryMap = new Map();

  for (let r = 5; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cat = String(row.getCell(2).value || '').trim();
    const name = String(row.getCell(3).value || '').trim();
    if (!name || !cat) continue;

    if (!categoryOrder.includes(cat)) {
      categoryOrder.push(cat);
    }
    productCategoryMap.set(name.toLowerCase(), cat);
  }

  // Kumpulkan seluruh produk
  const allProducts = [];
  for (const group of FORE_MENU_CACHE.menuGroups) {
    for (const prod of group.products) {
      allProducts.push(prod);
    }
  }

  const slugifyCategory = (cat) => {
    return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const newGroups = categoryOrder.map(cat => ({
    code: slugifyCategory(cat),
    name: cat,
    products: []
  }));

  const groupByName = new Map(newGroups.map(g => [g.name, g]));

  for (const prod of allProducts) {
    const cat = productCategoryMap.get(prod.name.toLowerCase());
    if (cat && groupByName.has(cat)) {
      groupByName.get(cat).products.push(prod);
    }
  }

  const newMenuCacheJson = JSON.stringify({ menuGroups: newGroups }, null, 2);

  const filePath = path.resolve('src/lib/fore-menu-data.ts');
  let originalCode = fs.readFileSync(filePath, 'utf8');
  const isCrlf = originalCode.includes('\r\n');
  const eol = isCrlf ? '\r\n' : '\n';

  const startMarker = 'export const FORE_MENU_CACHE: { menuGroups: MenuGroup[] } = ';
  const endMarker = 'export function getForeMenuForOutlet(';

  const startIndex = originalCode.indexOf(startMarker);
  const endIndex = originalCode.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find boundaries in fore-menu-data.ts');
  }

  // Cari '};' terakhir sebelum endIndex
  const lastSemi = originalCode.lastIndexOf('};', endIndex);
  if (lastSemi === -1 || lastSemi < startIndex) {
    throw new Error('Could not find closing }; of FORE_MENU_CACHE');
  }

  const updatedCode =
    originalCode.slice(0, startIndex + startMarker.length) +
    newMenuCacheJson +
    originalCode.slice(lastSemi + 1); // keep ';' and the rest

  const finalCode = updatedCode.replace(
    /Kategori: Coffee \(23\), Non Coffee \(10\), Tea \(6\), Fore Deli \(17\), Ice Blended \(4\), FOREveryone 1L \(14\)\./,
    'Kategori: Americano Series (4), Fore Signature (5), Coffee (12), Favorit Choice (2), Non Coffee (5), Fore Junior (4), Refresher (3), Tea (4), Fore Deli (17), Ice Blended (4), FOREveryone 1L (14).'
  );

  fs.writeFileSync(filePath, finalCode, 'utf8');
  console.log('Successfully updated src/lib/fore-menu-data.ts with 11 categories!');
}

update().catch(console.error);
