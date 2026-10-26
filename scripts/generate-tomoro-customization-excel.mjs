import ExcelJS from 'exceljs';
import path from 'node:path';
import { TOMORO_FINAL_PRODUCTS } from '../src/lib/tomoro-menu-data.ts';

async function generateTomoroCustomizationExcel() {
  const targetPath = path.resolve('Kustomisasi_Menu_Tomoro_Coffee_Detail.xlsx');
  const publicPath = path.resolve('public/Kustomisasi_Menu_Tomoro_Coffee_Detail.xlsx');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Jasdor Kopi Cima';
  wb.lastModifiedBy = 'Jasdor Admin';
  wb.created = new Date();
  wb.modified = new Date();

  // ───────────────────────────────────────────────────────────
  // SHEET 1: MATRIKS KUSTOMISASI TOMORO COFFEE (39 MENU)
  // ───────────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Matriks Kustomisasi TOMORO', {
    views: [{ state: 'frozen', ySplit: 4, xSplit: 3 }],
    properties: { tabColor: { argb: 'FFF97316' } }, // Brand Orange
  });

  // Judul Utama Baris 1
  s1.mergeCells('A1:Z1');
  const titleCell = s1.getCell('A1');
  titleCell.value = 'TABEL MATRIKS KUSTOMISASI MENU TOMORO COFFEE (JASDOR)';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2410C' } }; // Dark Orange
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(1).height = 36;

  // Subjudul Panduan Baris 2
  s1.mergeCells('A2:Z2');
  const subTitleCell = s1.getCell('A2');
  subTitleCell.value =
    'Petunjuk: Atur kustomisasi per menu (YA/TIDAK atau pilih MODE). Menu & Susu diskon 50%, sedangkan Topping berlaku flat normal tanpa diskon (Contoh: Menu 27k -> 13.5k + Topping 5k = Rp18.500).';
  subTitleCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF2B1D12' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } }; // Light Cream/Orange
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(2).height = 24;

  // ───────────────────────────────────────────────────────────
  // SUPER HEADERS (Baris 3) - Pengelompokan Kolom
  // ───────────────────────────────────────────────────────────
  const superHeaders = [
    { span: 'A3:F3', label: 'INFORMASI MENU', bg: 'FF7C2D12' },
    { span: 'G3:H3', label: 'CUP & SUHU', bg: 'FF0369A1' },
    { span: 'I3:K3', label: 'SWEETNESS (KEMANISAN)', bg: 'FFB45309' },
    { span: 'L3:O3', label: 'OPSI SUSU (MILK - DISKON 50%)', bg: 'FF047857' },
    { span: 'P3:S3', label: 'OPSI TOPPING (NORMAL RP5.000)', bg: 'FF6D28D9' },
    { span: 'T3:U3', label: 'ADD-ON', bg: 'FFE11D48' },
    { span: 'V3:Y3', label: 'SIMULASI TOTAL HARGA CHECKOUT', bg: 'FF15803D' },
    { span: 'Z3:Z3', label: 'CATATAN', bg: 'FF374151' },
  ];

  for (const sh of superHeaders) {
    if (sh.span.includes(':')) {
      s1.mergeCells(sh.span);
    }
    const cell = s1.getCell(sh.span.split(':')[0]);
    cell.value = sh.label;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sh.bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  s1.getRow(3).height = 26;

  // ───────────────────────────────────────────────────────────
  // SUB HEADERS (Baris 4) - 26 Kolom Spesifik
  // ───────────────────────────────────────────────────────────
  const subHeaders = [
    // Info Menu (A - F)
    { col: 1, key: 'no', label: 'No', width: 6, bg: 'FF9A3412' },
    { col: 2, key: 'kategori', label: 'Kategori', width: 22, bg: 'FF9A3412' },
    { col: 3, key: 'nama', label: 'Nama Menu', width: 34, bg: 'FF9A3412' },
    { col: 4, key: 'hargaNormal', label: 'Harga Normal', width: 15, bg: 'FF9A3412' },
    { col: 5, key: 'hargaPromo', label: 'Promo (-50%)', width: 16, bg: 'FF9A3412' },
    { col: 6, key: 'adaKustom', label: 'Ada Kustom?', width: 14, bg: 'FF9A3412' },

    // Cup & Suhu (G - H)
    { col: 7, key: 'cupSmall', label: 'Cupsize: Small', width: 15, bg: 'FF0284C7' },
    { col: 8, key: 'tempIced', label: 'Temp: Iced', width: 14, bg: 'FF0284C7' },

    // Sweetness (I - K)
    { col: 9, key: 'modeSweet', label: 'MODE SWEET', width: 16, bg: 'FFD97706' },
    { col: 10, key: 'sweetNormal', label: 'Normal Sweet', width: 14, bg: 'FFD97706' },
    { col: 11, key: 'sweetLess', label: 'Less Sweet', width: 13, bg: 'FFD97706' },

    // Milk (L - O)
    { col: 12, key: 'modeMilk', label: 'MODE SUSU', width: 16, bg: 'FF059669' },
    { col: 13, key: 'milkMaster', label: 'Master Milk (+0)', width: 16, bg: 'FF059669' },
    { col: 14, key: 'milkOat', label: 'Oat Milk (+5k)', width: 16, bg: 'FF059669' },
    { col: 15, key: 'milkCoconut', label: 'Coconut (+5k)', width: 16, bg: 'FF059669' },

    // Topping (P - S)
    { col: 16, key: 'modeTopping', label: 'MODE TOPPING', width: 16, bg: 'FF7C3AED' },
    { col: 17, key: 'topNo', label: 'No Topping (+0)', width: 16, bg: 'FF7C3AED' },
    { col: 18, key: 'topSeaSalt', label: 'Sea Salt Cloud (+5k)', width: 20, bg: 'FF7C3AED' },
    { col: 19, key: 'topCheese', label: 'Cheese Cloud (+5k)', width: 19, bg: 'FF7C3AED' },

    // Add on (T - U)
    { col: 20, key: 'modeAddon', label: 'MODE ADDON', width: 16, bg: 'FFE11D48' },
    { col: 21, key: 'addSugarSyrup', label: 'Sugar Syrup', width: 14, bg: 'FFE11D48' },

    // Simulasi Pricing (V - Y)
    { col: 22, key: 'simMenuOnly', label: 'Menu Saja (50%)', width: 17, bg: 'FF16A34A' },
    { col: 23, key: 'simWithOat', label: 'Menu + Oat Milk', width: 17, bg: 'FF16A34A' },
    { col: 24, key: 'simWithTopping', label: 'Menu + Sea Salt', width: 17, bg: 'FF16A34A' },
    { col: 25, key: 'simWithBoth', label: 'Menu + Oat + Topping', width: 21, bg: 'FF16A34A' },

    // Catatan (Z)
    { col: 26, key: 'catatan', label: 'Catatan Khusus Menu', width: 32, bg: 'FF4B5563' },
  ];

  s1.columns = subHeaders.map((h) => ({ key: h.key, width: h.width }));

  const hRow = s1.getRow(4);
  hRow.height = 30;
  for (const h of subHeaders) {
    const c = hRow.getCell(h.col);
    c.value = h.label;
    c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h.bg } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF2B1D12' } },
      bottom: { style: 'medium', color: { argb: 'FF2B1D12' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };
  }

  // ───────────────────────────────────────────────────────────
  // ISI DATA 39 MENU DENGAN PRE-SET CERDAS
  // ───────────────────────────────────────────────────────────
  let rIdx = 5;
  for (let i = 0; i < TOMORO_FINAL_PRODUCTS.length; i++) {
    const prod = TOMORO_FINAL_PRODUCTS[i];
    const row = s1.getRow(rIdx);
    row.height = 23;

    const nameLower = prod.name.toLowerCase();
    const catLower = prod.category.toLowerCase();
    const isRefreshing = catLower.includes('refreshing');
    const isTea = catLower.includes('tea') || nameLower.includes('tea');
    const isFrappe = nameLower.includes('frappe');
    const isAmericano = nameLower.includes('americano');

    // Penentuan pre-set cerdas
    // Susu: Minuman kopi berbasis susu & latte, matcha latte, cokelat -> Lengkap. Refresher/teh bening/americano -> TIDAK
    let modeMilkVal = 'Lengkap';
    if (isRefreshing || (isAmericano && !nameLower.includes('latte'))) {
      modeMilkVal = 'TIDAK';
    }

    // Sweetness: Hampir semua minuman bisa Normal / Less
    let modeSweetVal = 'Lengkap';

    // Topping: Topping awan (Sea Salt Cloud & Cheese Cloud)
    let modeToppingVal = 'Lengkap';
    if (isFrappe) {
      modeToppingVal = 'Kustomisasi';
    }

    // Add-on: Sugar Syrup
    let modeAddonVal = 'Lengkap';

    // Isi Nilai Sel
    row.getCell(1).value = i + 1;
    row.getCell(2).value = prod.category;
    row.getCell(3).value = prod.name;

    const norm = row.getCell(4);
    norm.value = prod.hargaNasional;
    norm.numFmt = '"Rp"#,##0';

    const promo = row.getCell(5);
    promo.value = { formula: `ROUND(D${rIdx}*0.5, 0)` };
    promo.numFmt = '"Rp"#,##0';

    row.getCell(6).value = 'YA'; // Ada Kustom

    // Cup & Suhu
    row.getCell(7).value = 'YA'; // Small
    row.getCell(8).value = 'YA'; // Iced

    // Sweetness
    row.getCell(9).value = modeSweetVal;
    row.getCell(10).value = modeSweetVal !== 'TIDAK' ? 'YA' : 'TIDAK';
    row.getCell(11).value = modeSweetVal !== 'TIDAK' ? 'YA' : 'TIDAK';

    // Milk
    row.getCell(12).value = modeMilkVal;
    row.getCell(13).value = modeMilkVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Master Milk
    row.getCell(14).value = modeMilkVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Oat Milk (+5k)
    row.getCell(15).value = modeMilkVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Coconut Milk (+5k)

    // Topping
    row.getCell(16).value = modeToppingVal;
    row.getCell(17).value = 'YA'; // No Topping
    row.getCell(18).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Sea Salt Cloud
    row.getCell(19).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Cheese Cloud

    // Addon
    row.getCell(20).value = modeAddonVal;
    row.getCell(21).value = modeAddonVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Sugar Syrup

    // Formula Simulasi Harga
    const sim1 = row.getCell(22);
    sim1.value = { formula: `E${rIdx}` };
    sim1.numFmt = '"Rp"#,##0';

    const sim2 = row.getCell(23);
    sim2.value = { formula: `E${rIdx}+5000` }; // Menu diskon 50% + Oat Milk diskon 50% (+5k)
    sim2.numFmt = '"Rp"#,##0';

    const sim3 = row.getCell(24);
    sim3.value = { formula: `E${rIdx}+5000` }; // Menu diskon 50% + Topping Sea Salt (flat 5k)
    sim3.numFmt = '"Rp"#,##0';

    const sim4 = row.getCell(25);
    sim4.value = { formula: `E${rIdx}+5000+5000` }; // Menu + Oat + Topping
    sim4.numFmt = '"Rp"#,##0';

    // Catatan
    let defaultNote = '';
    if (nameLower.includes('oat')) defaultNote = 'Varian bawaan susu Oat';
    else if (nameLower.includes('coconut')) defaultNote = 'Varian bawaan susu Kelapa';
    else if (nameLower.includes('cloud')) defaultNote = 'Varian bawaan foam Cloud';
    row.getCell(26).value = defaultNote;

    // Styling baris & Warna zebra neobrutalisme
    const isEven = rIdx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFFFF7ED'; // Orange-50 tint

    for (let c = 1; c <= 26; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFED7AA' } },
        bottom: { style: 'thin', color: { argb: 'FFFED7AA' } },
        left: { style: 'thin', color: { argb: 'FFFED7AA' } },
        right: { style: 'thin', color: { argb: 'FFFED7AA' } },
      };

      if (c === 1 || (c >= 6 && c <= 21)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c >= 4 && c <= 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 9, bold: c === 5 };
      } else if (c >= 22 && c <= 25) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }

    // ───────────────────────────────────────────────────────────
    // DATA VALIDATION (DROPDOWNS)
    // ───────────────────────────────────────────────────────────
    const yaTidakValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"YA, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Harap pilih YA atau TIDAK.',
    };

    const modeValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Lengkap, Kustomisasi, atau TIDAK.',
    };

    row.getCell(6).dataValidation = yaTidakValidation; // Ada Kustom
    row.getCell(7).dataValidation = yaTidakValidation; // Small
    row.getCell(8).dataValidation = yaTidakValidation; // Iced

    row.getCell(9).dataValidation = modeValidation; // Mode Sweet
    row.getCell(10).dataValidation = yaTidakValidation; // Normal Sweet
    row.getCell(11).dataValidation = yaTidakValidation; // Less Sweet

    row.getCell(12).dataValidation = modeValidation; // Mode Milk
    row.getCell(13).dataValidation = yaTidakValidation; // Master Milk
    row.getCell(14).dataValidation = yaTidakValidation; // Oat Milk
    row.getCell(15).dataValidation = yaTidakValidation; // Coconut Milk

    row.getCell(16).dataValidation = modeValidation; // Mode Topping
    row.getCell(17).dataValidation = yaTidakValidation; // No Topping
    row.getCell(18).dataValidation = yaTidakValidation; // Sea Salt Cloud
    row.getCell(19).dataValidation = yaTidakValidation; // Cheese Cloud

    row.getCell(20).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Lengkap atau TIDAK.',
    }; // Mode Addon
    row.getCell(21).dataValidation = yaTidakValidation; // Sugar Syrup

    rIdx++;
  }

  // ───────────────────────────────────────────────────────────
  // SHEET 2: PANDUAN LENGKAP & ATURAN PRICING TOMORO COFFEE
  // ───────────────────────────────────────────────────────────
  const s2 = wb.addWorksheet('Panduan & Aturan Pricing', {
    properties: { tabColor: { argb: 'FFC2410C' } },
  });

  s2.mergeCells('A1:G1');
  const hS2 = s2.getCell('A1');
  hS2.value = 'PANDUAN KUSTOMISASI & LOGIKA PERHITUNGAN HARGA TOMORO COFFEE';
  hS2.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  hS2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2410C' } };
  hS2.alignment = { vertical: 'middle', horizontal: 'center' };
  s2.getRow(1).height = 32;

  const guideRows = [
    ['', ''],
    ['1. DIMENSI KUSTOMISASI TOMORO RESMI', ''],
    ['Dimensi', 'Pilihan Opsi & Aturan'],
    ['Cupsize', 'Small (Default porsi standar TOMORO)'],
    ['Temperature', 'Iced (Dingin)'],
    ['Sweetness', 'Normal Sweet (100%), Less Sweet (70%)'],
    ['Pilihan Susu (Milk)', 'Master Milk (+Rp0), Oat Milk (Normal Rp10.000 -> Promo 50%: +Rp5.000), Coconut Milk (Normal Rp10.000 -> Promo 50%: +Rp5.000)'],
    ['Pilihan Topping', 'No Topping (+Rp0), Sea Salt Cloud (+Rp5.000 FLAT), Cheese Cloud (+Rp5.000 FLAT)'],
    ['Add on Tambahan', 'Sugar Syrup (+Rp0 / Opsi tambahan pemanis)'],
    ['', ''],
    ['2. PENJELASAN LOGIKA DISKON 50% & KASUS RP 18.500', ''],
    ['Studi Kasus User:', 'Menu Rp27.000 + Topping Sea Salt Cloud Rp5.000 -> Total Rp18.500 (Bukan Rp16.000)'],
    ['Mengapa Demikian?', 'Karena sistem resmi promo 50% TOMORO Coffee HANYA memotong 50% untuk Menu Minuman Dasar & Opsi Susu (Dairy).'],
    ['', 'Topping (Sea Salt Cloud / Cheese Cloud) TIDAK MENDAPATKAN DISKON dan dikenakan harga normal Rp5.000 flat!'],
    ['Rincian Perhitungan:', '- Harga Minuman Dasar (Matcha Latte): Rp27.000 x 50% = Rp13.500'],
    ['', '- Harga Topping (Sea Salt Cloud): Rp5.000 x 100% = Rp5.000 (Flat tanpa diskon)'],
    ['', '- TOTAL HARGA ITEM: Rp13.500 + Rp5.000 = Rp18.500 (Tepat 100% sesuai checkout aplikasi TOMORO)'],
    ['', ''],
    ['3. JIKA DITAMBAHKAN SUSU OAT MILK:', ''],
    ['Contoh Matcha Latte + Oat Milk:', '- Menu: Rp27.000 x 50% = Rp13.500'],
    ['', '- Oat Milk: Rp10.000 x 50% = Rp5.000 (Susu kena diskon 50%)'],
    ['', '- TOTAL: Rp13.500 + Rp5.000 = Rp18.500'],
    ['', ''],
    ['4. JIKA MENU + OAT MILK + TOPPING SEA SALT CLOUD:', ''],
    ['Contoh Lengkap:', '- Menu: Rp27.000 x 50% = Rp13.500'],
    ['', '- Oat Milk: Rp10.000 x 50% = Rp5.000'],
    ['', '- Sea Salt Cloud: Rp5.000 (Normal flat)'],
    ['', '- TOTAL: Rp13.500 + Rp5.000 + Rp5.000 = Rp23.500'],
    ['', ''],
    ['5. CARA MENGUBAH / MENGATUR DI EXCEL INI:', ''],
    ['Langkah 1', 'Buka Sheet "Matriks Kustomisasi TOMORO".'],
    ['Langkah 2', 'Untuk setiap menu, Anda bisa mengubah MODE (Lengkap / Kustomisasi / TIDAK) atau memilih YA/TIDAK pada kolom yang diinginkan.'],
    ['Langkah 3', 'Simpan file ini (Save As atau Replace).'],
    ['Langkah 4', 'Kirimkan kembali ke Antigravity / beri tahu agen untuk membaca file hasil editan Anda agar otomatis di-generate ke codebase.'],
  ];

  for (let r = 0; r < guideRows.length; r++) {
    const rowNum = r + 2;
    const row = s2.getRow(rowNum);
    row.getCell(1).value = guideRows[r][0];
    row.getCell(2).value = guideRows[r][1];

    if (guideRows[r][0].startsWith('1.') || guideRows[r][0].startsWith('2.') || guideRows[r][0].startsWith('3.') || guideRows[r][0].startsWith('4.') || guideRows[r][0].startsWith('5.')) {
      row.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFC2410C' } };
    } else if (guideRows[r][0] === 'Dimensi') {
      row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
      row.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true };
    } else {
      row.getCell(1).font = { name: 'Segoe UI', size: 9.5, bold: guideRows[r][0] !== '' };
      row.getCell(2).font = { name: 'Segoe UI', size: 9.5 };
    }
  }

  s2.getColumn(1).width = 30;
  s2.getColumn(2).width = 90;

  // Simpan file
  try {
    await wb.xlsx.writeFile(targetPath);
    console.log(`Sukses simpan: ${targetPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`[PERINGATAN] File ${targetPath} sedang dibuka di aplikasi Excel. Menulis ke file public saja.`);
    } else {
      throw err;
    }
  }

  try {
    await wb.xlsx.writeFile(publicPath);
    console.log(`Sukses simpan: ${publicPath}`);
  } catch (err) {
    console.error(`Gagal simpan ke ${publicPath}:`, err);
  }
}

generateTomoroCustomizationExcel().catch((err) => {
  console.error('Gagal generate Excel:', err);
  process.exit(1);
});
