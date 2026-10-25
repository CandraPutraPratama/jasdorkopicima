import ExcelJS from 'exceljs';
import { FORE_MENU_CACHE } from '../src/lib/fore-menu-data.ts';

async function testReorganize() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const ws = wb.worksheets[0];

  // Kumpulkan urutan kategori unik dari Excel
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

  console.log('Category order in Excel:', categoryOrder);

  // Kumpulkan seluruh 74 produk dari FORE_MENU_CACHE
  const allProducts = [];
  for (const group of FORE_MENU_CACHE.menuGroups) {
    for (const prod of group.products) {
      allProducts.push(prod);
    }
  }

  console.log('Total products in FORE_MENU_CACHE:', allProducts.length);

  // Slug generator untuk code kategori
  const slugifyCategory = (cat) => {
    return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const newGroups = categoryOrder.map(cat => ({
    code: slugifyCategory(cat),
    name: cat,
    products: []
  }));

  const groupByName = new Map(newGroups.map(g => [g.name, g]));

  let matchedCount = 0;
  for (const prod of allProducts) {
    const cat = productCategoryMap.get(prod.name.toLowerCase());
    if (cat && groupByName.has(cat)) {
      groupByName.get(cat).products.push(prod);
      matchedCount++;
    } else {
      console.error(`Product "${prod.name}" has no category in Excel!`);
    }
  }

  console.log(`Matched ${matchedCount} / ${allProducts.length} products into ${newGroups.length} categories.`);
  for (const g of newGroups) {
    console.log(`  - Category "${g.name}" (${g.code}): ${g.products.length} products`);
  }
}

testReorganize().catch(console.error);
