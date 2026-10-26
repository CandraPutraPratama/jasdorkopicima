import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';

async function parseExcelAndGenerateTs() {
  const excelPath = path.resolve('Kustomisasi_Menu_Tomoro_Coffee_Detail.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(excelPath);
  const s1 = wb.getWorksheet('Matriks Kustomisasi TOMORO') || wb.worksheets[0];

  const items = [];
  for (let r = 5; r <= s1.rowCount; r++) {
    const row = s1.getRow(r);
    const no = row.getCell(1).value;
    const cat = row.getCell(2).value;
    const name = row.getCell(3).value;
    if (!name) continue;

    const cleanName = String(name).trim();
    const cleanCat = String(cat).trim();

    const rawNormal = row.getCell(4).value;
    const hargaNormal =
      typeof rawNormal === 'object' && rawNormal !== null && 'result' in rawNormal
        ? Number(rawNormal.result)
        : Number(rawNormal);

    const rawPromo = row.getCell(5).value;
    const hargaPromo =
      typeof rawPromo === 'object' && rawPromo !== null && 'result' in rawPromo
        ? Number(rawPromo.result)
        : Number(rawPromo) || Math.round(hargaNormal * 0.5);

    const adaKustom = String(row.getCell(6).value || 'YA').trim().toUpperCase() === 'YA';
    const canSmall = String(row.getCell(7).value || 'YA').trim().toUpperCase() === 'YA';
    const canIced = String(row.getCell(8).value || 'YA').trim().toUpperCase() === 'YA';

    const modeSweet = String(row.getCell(9).value || '').trim();
    const sweetNormal = String(row.getCell(10).value || '').trim().toUpperCase() === 'YA';
    const sweetLess = String(row.getCell(11).value || '').trim().toUpperCase() === 'YA';

    const modeMilk = String(row.getCell(12).value || '').trim();
    const milkMaster = String(row.getCell(13).value || '').trim().toUpperCase() === 'YA';
    const milkOat = String(row.getCell(14).value || '').trim().toUpperCase() === 'YA';
    const milkCoconut = String(row.getCell(15).value || '').trim().toUpperCase() === 'YA';

    const modeTopping = String(row.getCell(16).value || '').trim();
    const topNo = String(row.getCell(17).value || '').trim().toUpperCase() === 'YA';
    const topSeaSalt = String(row.getCell(18).value || '').trim().toUpperCase() === 'YA';
    const topCheese = String(row.getCell(19).value || '').trim().toUpperCase() === 'YA';

    const modeAddon = String(row.getCell(20).value || '').trim();
    const addSugarSyrup = String(row.getCell(21).value || '').trim().toUpperCase() === 'YA';

    const catatan = String(row.getCell(26).value || '').trim();

    items.push({
      no: Number(no) || items.length + 1,
      category: cleanCat,
      name: cleanName,
      hargaNormal,
      hargaPromo,
      adaKustom,
      canSmall,
      canIced,
      sweetness: {
        active: modeSweet !== 'TIDAK' && (sweetNormal || sweetLess),
        normal: sweetNormal,
        less: sweetLess,
      },
      milk: {
        active: modeMilk !== 'TIDAK' && (milkMaster || milkOat || milkCoconut),
        masterMilk: milkMaster,
        oatMilk: milkOat,
        coconutMilk: milkCoconut,
      },
      topping: {
        active: modeTopping !== 'TIDAK' && (topNo || topSeaSalt || topCheese),
        noTopping: topNo,
        seaSaltCloud: topSeaSalt,
        cheeseCloud: topCheese,
      },
      addon: {
        active: modeAddon !== 'TIDAK' && addSugarSyrup,
        sugarSyrup: addSugarSyrup,
      },
      catatan,
    });
  }

  console.log(`Parsed ${items.length} items from Excel.`);

  // Susun konten file TypeScript
  const tsContent = `/**
 * Konfigurasi Kustomisasi Menu TOMORO Coffee (Hasil Ekstraksi Excel Otoritatif User)
 * File: Kustomisasi_Menu_Tomoro_Coffee_Detail.xlsx
 * Tanggal Pembaruan: ${new Date().toISOString()}
 *
 * Logika Pricing:
 * - Menu Dasar: Diskon 50%
 * - Susu (Oat Milk / Coconut Milk): Diskon 50% (Normal +Rp10.000 -> Promo +Rp5.000)
 * - Topping (Sea Salt Cloud / Cheese Cloud): Normal Flat +Rp5.000 (TIDAK KENA DISKON)
 * - Cup: Small
 * - Temp: Iced
 */

export interface TomoroItemCustomizationConfig {
  no: number;
  category: string;
  name: string;
  hargaNormal: number;
  hargaPromo: number;
  adaKustom: boolean;
  canSmall: boolean;
  canIced: boolean;
  sweetness: {
    active: boolean;
    normal: boolean;
    less: boolean;
  };
  milk: {
    active: boolean;
    masterMilk: boolean;
    oatMilk: boolean;
    coconutMilk: boolean;
  };
  topping: {
    active: boolean;
    noTopping: boolean;
    seaSaltCloud: boolean;
    cheeseCloud: boolean;
  };
  addon: {
    active: boolean;
    sugarSyrup: boolean;
  };
  catatan?: string;
}

export const TOMORO_CUSTOMIZATION_CONFIGS: TomoroItemCustomizationConfig[] = ${JSON.stringify(items, null, 2)};

const TOMORO_CONFIG_MAP = new Map<string, TomoroItemCustomizationConfig>();

for (const item of TOMORO_CUSTOMIZATION_CONFIGS) {
  TOMORO_CONFIG_MAP.set(item.name.toLowerCase().trim(), item);
}

export function getTomoroItemConfig(name: string): TomoroItemCustomizationConfig | null {
  if (!name) return null;
  return TOMORO_CONFIG_MAP.get(name.toLowerCase().trim()) || null;
}
`;

  await fs.writeFile(path.resolve('src/lib/tomoro-customization-data.ts'), tsContent, 'utf-8');
  console.log('Sukses menulis src/lib/tomoro-customization-data.ts');
}

parseExcelAndGenerateTs().catch((err) => {
  console.error('Gagal parse Excel:', err);
  process.exit(1);
});
