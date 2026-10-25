import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';

async function generateForeCustomizationDataTs() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.USER_EDITED.xlsx');
  const s1 = wb.getWorksheet('Matriks Kustomisasi Detail');

  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Baca 74 menu dari Excel
  const items = [];
  for (let r = 5; r <= s1.rowCount; r++) {
    const row = s1.getRow(r);
    const no = row.getCell(1).value;
    const kategori = String(row.getCell(2).value || '').trim();
    const nama = String(row.getCell(3).value || '').trim();
    const hargaNormal = Number(row.getCell(4).value) || 0;

    if (!nama) continue;

    // Checkbox values
    const adaKustom = row.getCell(6).value === 'YA';
    const canIce = row.getCell(7).value === 'YA';
    const canHot = row.getCell(8).value === 'YA';
    const regCup = row.getCell(9).value === 'YA';
    const largeCup = row.getCell(10).value === 'YA';

    // Ice options
    const iceOpts = [];
    if (canIce) {
      if (row.getCell(12).value === 'YA') iceOpts.push('Normal Ice');
      if (row.getCell(13).value === 'YA') iceOpts.push('Less Ice');
      if (row.getCell(14).value === 'YA') iceOpts.push('More Ice');
      if (row.getCell(15).value === 'YA') iceOpts.push('Ice Separately (Konfirmasi Admin)');
      if (row.getCell(16).value === 'YA') iceOpts.push('No Ice');
    }

    // Sweetness options
    const sweetOpts = [];
    if (row.getCell(18).value === 'YA') sweetOpts.push('Normal Sweet');
    if (row.getCell(19).value === 'YA') sweetOpts.push('Less Sweet');

    // Espresso options
    const espOpts = [];
    if (row.getCell(21).value === 'YA') espOpts.push({ name: 'Normal Shot', price: 0 });
    if (row.getCell(22).value === 'YA') espOpts.push({ name: 'No Coffee', price: 0 });
    if (row.getCell(23).value === 'YA') espOpts.push({ name: '+1 Shot', price: 7000 });
    if (row.getCell(24).value === 'YA') espOpts.push({ name: '+2 Shot', price: 14000 });
    if (row.getCell(25).value === 'YA') espOpts.push({ name: '+3 Shot', price: 21000 });

    // Dairy options
    const dairyOpts = [];
    if (row.getCell(27).value === 'YA') dairyOpts.push({ name: 'No Milk', price: 0 });
    if (row.getCell(28).value === 'YA') dairyOpts.push({ name: 'Milk', price: 0 });
    if (row.getCell(29).value === 'YA') dairyOpts.push({ name: 'Soy Multigrain', price: 7000 });
    if (row.getCell(30).value === 'YA') dairyOpts.push({ name: 'Fresh Milk', price: 7000 });
    if (row.getCell(31).value === 'YA') dairyOpts.push({ name: 'UHT Milk', price: 7000 });
    if (row.getCell(32).value === 'YA') dairyOpts.push({ name: 'Oat Milk', price: 15000 });
    if (row.getCell(33).value === 'YA') dairyOpts.push({ name: 'Almond Milk', price: 15000 });

    // Syrup options
    const syrupOpts = [];
    if (row.getCell(35).value === 'YA') syrupOpts.push({ name: 'Aren', price: 7000 });
    if (row.getCell(36).value === 'YA') syrupOpts.push({ name: 'Hazelnut', price: 7000 });
    if (row.getCell(37).value === 'YA') syrupOpts.push({ name: 'Pandan', price: 7000 });
    if (row.getCell(38).value === 'YA') syrupOpts.push({ name: 'Manuka', price: 7000 });
    if (row.getCell(39).value === 'YA') syrupOpts.push({ name: 'Vanilla', price: 7000 });
    if (row.getCell(40).value === 'YA') syrupOpts.push({ name: 'Salted Caramel', price: 7000 });
    if (row.getCell(41).value === 'YA') syrupOpts.push({ name: 'Pecan Praline', price: 7000 });

    // Topping options
    const toppingOpts = [];
    if (row.getCell(43).value === 'YA') toppingOpts.push({ name: 'Caramel Sauce', price: 7000 });
    if (row.getCell(44).value === 'YA') toppingOpts.push({ name: 'Crumble', price: 7000 });
    if (row.getCell(45).value === 'YA') toppingOpts.push({ name: 'Milo Powder', price: 7000 });
    if (row.getCell(46).value === 'YA') toppingOpts.push({ name: 'Orange Cream', price: 7000 });
    if (row.getCell(47).value === 'YA') toppingOpts.push({ name: 'Oreo Crumbs', price: 7000 });
    if (row.getCell(48).value === 'YA') toppingOpts.push({ name: 'Sea Salt Cream', price: 7000 });
    if (row.getCell(49).value === 'YA') toppingOpts.push({ name: 'Coffee Cream', price: 7000 });
    if (row.getCell(50).value === 'YA') toppingOpts.push({ name: 'Tiramisu Cream', price: 7000 });

    // Seasonal Cup
    const hasSeasonalCup = row.getCell(51).value === 'YA';
    const catatan = String(row.getCell(52).value || '').trim();

    items.push({
      nama,
      kategori,
      hargaNormal,
      hasCustomization: adaKustom,
      canIce,
      canHot,
      sizes: {
        regular: regCup,
        large: largeCup,
      },
      iceOptions: iceOpts,
      sweetnessOptions: sweetOpts,
      espressoOptions: espOpts,
      dairyOptions: dairyOpts,
      syrupOptions: syrupOpts,
      toppingOptions: toppingOpts,
      seasonalCup: hasSeasonalCup,
      catatan,
    });
  }

  console.log(`Extracted ${items.length} items.`);

  // Generate TypeScript file
  const tsContent = `// File ini di-generate otomatis dari Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx
// Memuat 100% aturan kustomisasi resmi Fore Coffee per menu sesuai konfigurasi admin.

export interface ForeCustomOptionItem {
  name: string;
  price: number;
}

export interface ForeItemConfig {
  nama: string;
  kategori: string;
  hargaNormal: number;
  hasCustomization: boolean;
  canIce: boolean;
  canHot: boolean;
  sizes: {
    regular: boolean;
    large: boolean;
  };
  iceOptions: string[];
  sweetnessOptions: string[];
  espressoOptions: ForeCustomOptionItem[];
  dairyOptions: ForeCustomOptionItem[];
  syrupOptions: ForeCustomOptionItem[];
  toppingOptions: ForeCustomOptionItem[];
  seasonalCup: boolean;
  catatan: string;
}

export const FORE_CUSTOMIZATION_MAP: Record<string, ForeItemConfig> = ${JSON.stringify(
    Object.fromEntries(items.map((it) => [norm(it.nama), it])),
    null,
    2
  )};

/**
 * Normalisasi nama produk untuk pencarian kustomisasi Fore.
 */
export function normalizeForeMenuKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\\s+/g, ' ')
    .trim();
}

/**
 * Mengambil konfigurasi kustomisasi untuk nama produk Fore tertentu.
 */
export function getForeItemConfig(productName: string): ForeItemConfig | null {
  const key = normalizeForeMenuKey(productName);
  return FORE_CUSTOMIZATION_MAP[key] || null;
}
`;

  const outputPath = path.resolve('src/lib/fore-customization-data.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf8');
  console.log(`Saved generated TypeScript file to: ${outputPath}`);
}

generateForeCustomizationDataTs().catch(console.error);
