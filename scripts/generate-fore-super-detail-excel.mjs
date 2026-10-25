import ExcelJS from 'exceljs';
import path from 'node:path';

async function generateSuperDetailExcel() {
  const sourcePath = path.resolve('Kustomisasi_Menu_Fore_Coffee.backup.xlsx');
  const targetPath = path.resolve('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const publicPath = path.resolve('public/Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');

  const sourceWb = new ExcelJS.Workbook();
  await sourceWb.xlsx.readFile(sourcePath);
  const srcSheet1 = sourceWb.getWorksheet('Daftar Menu & Kustomisasi');

  // Baca 74 menu dan data yang sudah dirapikan user
  const menuList = [];
  for (let r = 4; r <= srcSheet1.rowCount; r++) {
    const row = srcSheet1.getRow(r);
    const no = row.getCell(1).value;
    const kategori = String(row.getCell(2).value || '');
    const nama = String(row.getCell(3).value || '');
    const hargaNormal = row.getCell(4).value;
    const adaKustomisasi = String(row.getCell(6).value || 'YA');
    const bisaIce = String(row.getCell(7).value || 'YA');
    const bisaHot = String(row.getCell(8).value || 'YA');
    const adaEspresso = String(row.getCell(9).value || 'YA');
    const adaDairy = String(row.getCell(10).value || 'YA');
    const adaSweetness = String(row.getCell(11).value || 'YA');
    const adaIceCube = String(row.getCell(12).value || 'YA');
    const adaSyrup = String(row.getCell(13).value || 'YA');
    const adaTopping = String(row.getCell(14).value || 'YA');
    const catatan = String(row.getCell(15).value || '');

    menuList.push({
      no,
      kategori,
      nama,
      hargaNormal,
      adaKustomisasi,
      bisaIce,
      bisaHot,
      adaEspresso,
      adaDairy,
      adaSweetness,
      adaIceCube,
      adaSyrup,
      adaTopping,
      catatan,
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Jasdor Kopi Cima';
  wb.lastModifiedBy = 'Jasdor Admin';
  wb.created = new Date();
  wb.modified = new Date();

  // ───────────────────────────────────────────────────────────
  // SHEET 1: MATRIKS KUSTOMISASI SUPER DETAIL (74 MENU)
  // ───────────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Matriks Kustomisasi Detail', {
    views: [{ state: 'frozen', ySplit: 4, xSplit: 3 }],
    properties: { tabColor: { argb: 'FF00543C' } },
  });

  // Judul Utama Baris 1
  s1.mergeCells('A1:AY1');
  const titleCell = s1.getCell('A1');
  titleCell.value = 'TABEL MATRIKS LENGKAP KUSTOMISASI MENU FORE COFFEE (JASDOR)';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(1).height = 36;

  // Subjudul Panduan Baris 2
  s1.mergeCells('A2:AY2');
  const subTitleCell = s1.getCell('A2');
  subTitleCell.value =
    'Petunjuk: Setiap kategori memiliki kolom "MODE" (Lengkap / Kustomisasi / TIDAK). Jika Mode = "Lengkap", maka seluruh opsi di grup tersebut aktif. Jika Mode = "Kustomisasi", silakan pilih YA/TIDAK pada masing-masing varian susu, sirup, topping, dll.';
  subTitleCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF2B1D12' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EDE2' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(2).height = 24;

  // ───────────────────────────────────────────────────────────
  // SUPER HEADERS (Baris 3) - Kelompok Bagian dengan Warna Berbeda
  // ───────────────────────────────────────────────────────────
  const superHeaders = [
    { span: 'A3:E3', label: 'INFORMASI MENU', bg: 'FF0E3E2C' },
    { span: 'F3:J3', label: 'STATUS & CUP', bg: 'FF1E3A8A' },
    { span: 'K3:P3', label: 'VARIAN ICE CUBE', bg: 'FF0369A1' },
    { span: 'Q3:S3', label: 'TINGKAT KEMANISAN (SWEETNESS)', bg: 'FFB45309' },
    { span: 'T3:Y3', label: 'ESPRESSO SHOT', bg: 'FF451A03' },
    { span: 'Z3:AG3', label: 'OPSI SUSU (DAIRY)', bg: 'FF047857' },
    { span: 'AH3:AN3', label: 'OPSI SIRUP (SYRUP)', bg: 'FFC2410C' },
    { span: 'AO3:AW3', label: 'OPSI TOPPING', bg: 'FF6D28D9' },
    { span: 'AX3:AX3', label: 'CUP', bg: 'FF0E3E2C' },
    { span: 'AY3:AY3', label: 'CATATAN', bg: 'FF374151' },
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
  // SUB HEADERS (Baris 4) - 51 Kolom Spesifik
  // ───────────────────────────────────────────────────────────
  const subHeaders = [
    // Info Menu (A - E)
    { col: 1, key: 'no', label: 'No', width: 6, bg: 'FF165B42' },
    { col: 2, key: 'kategori', label: 'Kategori', width: 18, bg: 'FF165B42' },
    { col: 3, key: 'nama', label: 'Nama Menu', width: 32, bg: 'FF165B42' },
    { col: 4, key: 'hargaNormal', label: 'Harga Normal', width: 16, bg: 'FF165B42' },
    { col: 5, key: 'hargaPromo', label: 'Promo (-25%)', width: 16, bg: 'FF165B42' },

    // Status & Cup (F - J)
    { col: 6, key: 'adaKustomisasi', label: 'Ada Kustom?', width: 14, bg: 'FF2563EB' },
    { col: 7, key: 'bisaIce', label: 'Bisa ICE?', width: 12, bg: 'FF2563EB' },
    { col: 8, key: 'bisaHot', label: 'Bisa HOT?', width: 12, bg: 'FF2563EB' },
    { col: 9, key: 'cupReg', label: 'Cup Regular', width: 13, bg: 'FF2563EB' },
    { col: 10, key: 'cupLarge', label: 'Large (+7k)', width: 13, bg: 'FF2563EB' },

    // Ice Cube (K - P)
    { col: 11, key: 'modeIce', label: 'MODE ICE CUBE', width: 22, bg: 'FF0284C7' },
    { col: 12, key: 'iceNormal', label: 'Normal Ice', width: 13, bg: 'FF0284C7' },
    { col: 13, key: 'iceLess', label: 'Less Ice', width: 12, bg: 'FF0284C7' },
    { col: 14, key: 'iceMore', label: 'More Ice', width: 12, bg: 'FF0284C7' },
    { col: 15, key: 'iceSeparately', label: 'Es Pisah', width: 13, bg: 'FF0284C7' },
    { col: 16, key: 'iceNone', label: 'No Ice', width: 12, bg: 'FF0284C7' },

    // Sweetness (Q - S)
    { col: 17, key: 'modeSweet', label: 'MODE SWEETNESS', width: 20, bg: 'FFD97706' },
    { col: 18, key: 'sweetNormal', label: 'Normal Sweet', width: 14, bg: 'FFD97706' },
    { col: 19, key: 'sweetLess', label: 'Less Sweet', width: 13, bg: 'FFD97706' },

    // Espresso Shot (T - Y)
    { col: 20, key: 'modeEspresso', label: 'MODE ESPRESSO', width: 20, bg: 'FF78350F' },
    { col: 21, key: 'espNormal', label: 'Normal Shot', width: 13, bg: 'FF78350F' },
    { col: 22, key: 'espNoCoffee', label: 'No Coffee', width: 13, bg: 'FF78350F' },
    { col: 23, key: 'espPlus1', label: '+1 Shot (+7k)', width: 15, bg: 'FF78350F' },
    { col: 24, key: 'espPlus2', label: '+2 Shot (+14k)', width: 15, bg: 'FF78350F' },
    { col: 25, key: 'espPlus3', label: '+3 Shot (+21k)', width: 15, bg: 'FF78350F' },

    // Dairy / Susu (Z - AG)
    { col: 26, key: 'modeDairy', label: 'MODE SUSU', width: 20, bg: 'FF059669' },
    { col: 27, key: 'dairyNone', label: 'No Milk', width: 12, bg: 'FF059669' },
    { col: 28, key: 'dairyMilk', label: 'Milk', width: 12, bg: 'FF059669' },
    { col: 29, key: 'dairySoy', label: 'Soy (+7k)', width: 14, bg: 'FF059669' },
    { col: 30, key: 'dairyFresh', label: 'Fresh (+7k)', width: 14, bg: 'FF059669' },
    { col: 31, key: 'dairyUHT', label: 'UHT (+7k)', width: 14, bg: 'FF059669' },
    { col: 32, key: 'dairyOat', label: 'Oat (+15k)', width: 14, bg: 'FF059669' },
    { col: 33, key: 'dairyAlmond', label: 'Almond (+15k)', width: 15, bg: 'FF059669' },

    // Syrup / Sirup (AH - AN)
    { col: 34, key: 'modeSyrup', label: 'MODE SIRUP', width: 20, bg: 'FFE11D48' },
    { col: 35, key: 'syrAren', label: 'Aren (+7k)', width: 14, bg: 'FFE11D48' },
    { col: 36, key: 'syrHazelnut', label: 'Hazelnut (+7k)', width: 15, bg: 'FFE11D48' },
    { col: 37, key: 'syrPandan', label: 'Pandan (+7k)', width: 14, bg: 'FFE11D48' },
    { col: 38, key: 'syrManuka', label: 'Manuka (+7k)', width: 14, bg: 'FFE11D48' },
    { col: 39, key: 'syrVanilla', label: 'Vanilla (+7k)', width: 14, bg: 'FFE11D48' },
    { col: 40, key: 'syrSalted', label: 'Salted Car (+7k)', width: 16, bg: 'FFE11D48' },

    // Topping (AO - AW)
    { col: 41, key: 'modeTopping', label: 'MODE TOPPING', width: 20, bg: 'FF7C3AED' },
    { col: 42, key: 'topCaramel', label: 'Caramel S (+7k)', width: 16, bg: 'FF7C3AED' },
    { col: 43, key: 'topCrumble', label: 'Crumble (+7k)', width: 15, bg: 'FF7C3AED' },
    { col: 44, key: 'topMilo', label: 'Milo Pwd (+7k)', width: 15, bg: 'FF7C3AED' },
    { col: 45, key: 'topOrange', label: 'Orange C (+7k)', width: 15, bg: 'FF7C3AED' },
    { col: 46, key: 'topOreo', label: 'Oreo Crumb (+7k)', width: 16, bg: 'FF7C3AED' },
    { col: 47, key: 'topSeaSalt', label: 'Sea Salt C (+7k)', width: 16, bg: 'FF7C3AED' },
    { col: 48, key: 'topCoffeeCream', label: 'Coffee C (+7k)', width: 15, bg: 'FF7C3AED' },
    { col: 49, key: 'topTiramisu', label: 'Tiramisu C (+7k)', width: 16, bg: 'FF7C3AED' },

    // Seasonal Cup & Catatan (AX - AY)
    { col: 50, key: 'cupSeasonal', label: 'Seasonal Cup', width: 14, bg: 'FF165B42' },
    { col: 51, key: 'catatan', label: 'Catatan / Keterangan', width: 36, bg: 'FF4B5563' },
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
      left: { style: 'thin', color: { argb: 'FF3E6554' } },
      right: { style: 'thin', color: { argb: 'FF3E6554' } },
    };
  }

  // ───────────────────────────────────────────────────────────
  // ISI DATA 74 MENU DENGAN PRE-SET CERDAS
  // ───────────────────────────────────────────────────────────
  let rIdx = 5;
  for (const m of menuList) {
    const row = s1.getRow(rIdx);
    row.height = 22;

    const nameLower = m.nama.toLowerCase();
    const catLower = m.kategori.toLowerCase();
    const isFood = catLower === 'fore deli';
    const is1L = catLower.includes('1l');
    const isTea = catLower === 'tea';
    const isIceBlended = catLower === 'ice blended';
    const isAmericanoSeries = catLower === 'americano series';
    const isSignature = catLower === 'fore signature';

    // Nilai Mode Awal Cerdas
    let modeIceVal = 'Lengkap';
    if (isFood || is1L || m.bisaIce === 'TIDAK') modeIceVal = 'TIDAK';
    else if (
      nameLower.includes('buttercream') ||
      nameLower.includes('butterscotch sea salt') ||
      nameLower.includes('cloud') ||
      isIceBlended
    )
      modeIceVal = 'Terbatas (Normal & Less)';

    let modeSweetVal = isFood ? 'TIDAK' : 'Lengkap';
    if (m.adaSweetness === 'TIDAK') modeSweetVal = 'TIDAK';

    let modeEspVal = 'TIDAK';
    if (m.adaEspresso === 'YA') {
      if (nameLower === 'americano' || nameLower === 'café latte' || nameLower === 'cappuccino')
        modeEspVal = 'Maks +3 Shot';
      else if (isSignature || nameLower.includes('buttercream')) modeEspVal = 'Maks +1 Shot';
      else modeEspVal = 'Maks +2 Shot';
    }

    let modeDairyVal = 'Lengkap';
    if (isFood || is1L || isTea || m.adaDairy === 'TIDAK') modeDairyVal = 'TIDAK';

    let modeSyrupVal = isFood || is1L ? 'TIDAK' : 'Lengkap';
    let modeToppingVal = isFood || is1L || m.adaTopping === 'TIDAK' ? 'TIDAK' : 'Lengkap';

    // Kolom 1 - 5 (Info Menu)
    row.getCell(1).value = m.no;
    row.getCell(2).value = m.kategori;
    row.getCell(3).value = m.nama;
    const norm = row.getCell(4);
    norm.value = m.hargaNormal;
    norm.numFmt = '"Rp"#,##0';
    const promo = row.getCell(5);
    promo.value = { formula: `ROUND(D${rIdx}*0.75, 0)` };
    promo.numFmt = '"Rp"#,##0';

    // Kolom 6 - 10 (Status & Cup)
    row.getCell(6).value = isFood ? 'TIDAK' : m.adaKustomisasi;
    row.getCell(7).value = isFood || is1L ? 'TIDAK' : m.bisaIce;
    row.getCell(8).value = isFood || is1L || isIceBlended ? 'TIDAK' : m.bisaHot;
    row.getCell(9).value = isFood || is1L ? 'TIDAK' : 'YA'; // Cup Regular
    row.getCell(10).value = isFood || is1L || nameLower === 'espresso' ? 'TIDAK' : 'YA'; // Large (+7k)

    // Kolom 11 - 16 (Ice Cube)
    row.getCell(11).value = modeIceVal;
    row.getCell(12).value = modeIceVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Normal Ice
    row.getCell(13).value = modeIceVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Less Ice
    row.getCell(14).value = modeIceVal === 'Lengkap' ? 'YA' : 'TIDAK'; // More Ice
    row.getCell(15).value = modeIceVal === 'Lengkap' ? 'YA' : 'TIDAK'; // Es Pisah
    row.getCell(16).value = modeIceVal === 'Lengkap' ? 'YA' : 'TIDAK'; // No Ice

    // Kolom 17 - 19 (Sweetness)
    row.getCell(17).value = modeSweetVal;
    row.getCell(18).value = modeSweetVal === 'Lengkap' ? 'YA' : 'TIDAK';
    row.getCell(19).value = modeSweetVal === 'Lengkap' ? 'YA' : 'TIDAK';

    // Kolom 20 - 25 (Espresso)
    row.getCell(20).value = modeEspVal;
    row.getCell(21).value = modeEspVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Normal Shot
    row.getCell(22).value = modeEspVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // No Coffee
    row.getCell(23).value = modeEspVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // +1 Shot
    row.getCell(24).value =
      modeEspVal === 'Maks +2 Shot' || modeEspVal === 'Maks +3 Shot' ? 'YA' : 'TIDAK'; // +2 Shot
    row.getCell(25).value = modeEspVal === 'Maks +3 Shot' ? 'YA' : 'TIDAK'; // +3 Shot

    // Kolom 26 - 33 (Dairy / Susu)
    row.getCell(26).value = modeDairyVal;
    row.getCell(27).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // No Milk
    row.getCell(28).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Milk
    row.getCell(29).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Soy
    row.getCell(30).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Fresh Milk
    row.getCell(31).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // UHT Milk
    row.getCell(32).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Oat Milk
    row.getCell(33).value = modeDairyVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Almond Milk

    // Kolom 34 - 40 (Syrup / Sirup)
    row.getCell(34).value = modeSyrupVal;
    row.getCell(35).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Aren
    row.getCell(36).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Hazelnut
    row.getCell(37).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Pandan
    row.getCell(38).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Manuka
    row.getCell(39).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Vanilla
    row.getCell(40).value = modeSyrupVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Salted Caramel

    // Kolom 41 - 49 (Topping)
    row.getCell(41).value = modeToppingVal;
    row.getCell(42).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Caramel Sauce
    row.getCell(43).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Crumble
    row.getCell(44).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Milo
    row.getCell(45).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Orange Cream
    row.getCell(46).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Oreo Crumbs
    row.getCell(47).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Sea Salt Cream
    row.getCell(48).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Coffee Cream
    row.getCell(49).value = modeToppingVal !== 'TIDAK' ? 'YA' : 'TIDAK'; // Tiramisu Cream

    // Kolom 50 - 51 (Seasonal Cup & Catatan)
    row.getCell(50).value = isFood || is1L ? 'TIDAK' : 'YA';
    row.getCell(51).value = m.catatan;

    // Styling baris & Warna zebra
    const isEven = rIdx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF9F6F0';

    for (let c = 1; c <= 51; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
      };

      if (c === 1 || (c >= 6 && c <= 50)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 4 || c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 9, bold: c === 5 };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }

    // ───────────────────────────────────────────────────────────
    // DATA VALIDATION (DROPDOWNS)
    // ───────────────────────────────────────────────────────────
    // Mode Ice Cube (Col 11)
    row.getCell(11).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, Terbatas (Normal & Less), Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Ice Cube dari opsi.',
    };

    // Mode Sweetness (Col 17)
    row.getCell(17).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Sweetness.',
    };

    // Mode Espresso (Col 20)
    row.getCell(20).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Maks +3 Shot, Maks +2 Shot, Maks +1 Shot, Normal Saja, Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Espresso.',
    };

    // Mode Susu (Col 26)
    row.getCell(26).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Susu.',
    };

    // Mode Sirup (Col 34)
    row.getCell(34).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Sirup.',
    };

    // Mode Topping (Col 41)
    row.getCell(41).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap, Kustomisasi, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih Mode Topping.',
    };

    // Seluruh Kolom Pilihan Spesifik (YA / TIDAK)
    const yaTidakCols = [
      6,
      7,
      8,
      9,
      10, // Status & Cup
      12,
      13,
      14,
      15,
      16, // Ice items
      18,
      19, // Sweetness items
      21,
      22,
      23,
      24,
      25, // Espresso items
      27,
      28,
      29,
      30,
      31,
      32,
      33, // Dairy items
      35,
      36,
      37,
      38,
      39,
      40, // Syrup items
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49, // Topping items
      50, // Seasonal Cup
    ];

    for (const c of yaTidakCols) {
      row.getCell(c).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"YA, TIDAK"'],
        showErrorMessage: true,
        errorTitle: 'Input Tidak Valid',
        error: 'Pilih "YA" atau "TIDAK".',
      };
    }

    rIdx++;
  }

  // ───────────────────────────────────────────────────────────
  // SHEET 2: REFERENSI HARGA & ATURAN ADDON
  // ───────────────────────────────────────────────────────────
  const s2 = wb.addWorksheet('Referensi Harga & Aturan', {
    properties: { tabColor: { argb: 'FFC67D0A' } },
  });

  s2.columns = [
    { header: 'Kategori Addon', width: 22 },
    { header: 'Nama Addon / Varian', width: 34 },
    { header: 'Aturan Pilihan', width: 20 },
    { header: 'Biaya Tambahan', width: 18 },
    { header: 'Keterangan Penting', width: 44 },
  ];

  s2.mergeCells('A1:E1');
  const s2Title = s2.getCell('A1');
  s2Title.value = 'KATALOG RESMI ATURAN & HARGA ADDON KUSTOMISASI FORE COFFEE';
  s2Title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  s2Title.alignment = { vertical: 'middle', horizontal: 'center' };
  s2.getRow(1).height = 32;

  const s2Head = s2.getRow(2);
  s2Head.height = 26;
  [
    'Kategori Addon',
    'Nama Addon / Varian',
    'Aturan Pilihan',
    'Biaya Tambahan',
    'Keterangan Penting',
  ].forEach((h, i) => {
    const c = s2Head.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B1D12' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const catalog = [
    // CUP
    { cat: 'UKURAN CUP', name: 'Regular Cup', rule: 'Wajib, Pilih 1', fee: 0, note: 'Ukuran standar' },
    {
      cat: 'UKURAN CUP',
      name: 'Large Cup',
      rule: 'Wajib, Pilih 1',
      fee: 7000,
      note: 'Ukuran besar (+Rp7.000)',
    },

    // SUHU
    {
      cat: 'TEMPERATURE',
      name: 'Hot / Extra Hot',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Hanya jika menu disajikan HOT',
    },
    {
      cat: 'TEMPERATURE',
      name: 'Normal / Less / More / Pisah / No Ice',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Hanya jika menu disajikan ICE',
    },

    // SWEETNESS
    {
      cat: 'SWEETNESS',
      name: 'Normal Sweet / Less Sweet',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Tingkat kemanisan sirup/gula',
    },

    // ESPRESSO
    {
      cat: 'ESPRESSO',
      name: 'Normal Shot / No Coffee',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Takaran standar atau tanpa kopi',
    },
    {
      cat: 'ESPRESSO',
      name: '+1 Shot Espresso',
      rule: 'Wajib, Pilih 1',
      fee: 7000,
      note: 'Ekstra 1 shot (+Rp7.000)',
    },
    {
      cat: 'ESPRESSO',
      name: '+2 Shot Espresso',
      rule: 'Wajib, Pilih 1',
      fee: 14000,
      note: 'Ekstra 2 shot (+Rp14.000)',
    },
    {
      cat: 'ESPRESSO',
      name: '+3 Shot Espresso',
      rule: 'Wajib, Pilih 1',
      fee: 21000,
      note: 'Ekstra 3 shot (+Rp21.000)',
    },

    // DAIRY / SUSU
    {
      cat: 'DAIRY (SUSU)',
      name: 'Milk / No Milk',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Susu standar Fore atau tanpa susu',
    },
    {
      cat: 'DAIRY (SUSU)',
      name: 'Soy Multigrain Milk',
      rule: 'Wajib, Pilih 1',
      fee: 7000,
      note: 'Susu kedelai bergizi (+Rp7.000)',
    },
    {
      cat: 'DAIRY (SUSU)',
      name: 'Fresh Milk',
      rule: 'Wajib, Pilih 1',
      fee: 7000,
      note: 'Susu sapi murni segar (+Rp7.000)',
    },
    {
      cat: 'DAIRY (SUSU)',
      name: 'UHT Milk',
      rule: 'Wajib, Pilih 1',
      fee: 7000,
      note: 'Susu sapi UHT (+Rp7.000)',
    },
    {
      cat: 'DAIRY (SUSU)',
      name: 'Oat Milk',
      rule: 'Wajib, Pilih 1',
      fee: 15000,
      note: 'Susu gandum premium nabati (+Rp15.000)',
    },
    {
      cat: 'DAIRY (SUSU)',
      name: 'Almond Milk',
      rule: 'Wajib, Pilih 1',
      fee: 15000,
      note: 'Susu almond gurih nabati (+Rp15.000)',
    },

    // SIRUP
    {
      cat: 'SIRUP (SYRUP)',
      name: 'Aren / Hazelnut / Pandan / Manuka / Vanilla / Salted Caramel',
      rule: 'Opsional, Maks 1',
      fee: 7000,
      note: 'Pilihan rasa sirup (+Rp7.000 per rasa)',
    },

    // TOPPING
    {
      cat: 'TOPPING',
      name: 'Caramel Sauce / Crumble / Milo / Orange / Oreo / Sea Salt / Coffee / Tiramisu Cream',
      rule: 'Opsional, Maks 2',
      fee: 7000,
      note: 'Pilihan topping lezat (+Rp7.000 per topping)',
    },

    // SEASONAL CUP
    {
      cat: 'SEASONAL CUP',
      name: 'Seasonal Cup',
      rule: 'Wajib, Pilih 1',
      fee: 0,
      note: 'Kemasan edisi spesial',
    },
  ];

  let s2Idx = 3;
  for (const item of catalog) {
    const row = s2.getRow(s2Idx);
    row.height = 20;

    row.getCell(1).value = item.cat;
    row.getCell(2).value = item.name;
    row.getCell(3).value = item.rule;
    const fCell = row.getCell(4);
    fCell.value = item.fee;
    fCell.numFmt = '"Rp"#,##0';
    row.getCell(5).value = item.note;

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F6F0' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
      };
      if (c === 1 || c === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (c === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (item.fee > 0)
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
      } else cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
    s2Idx++;
  }

  // Tulis file ke target dan public
  await wb.xlsx.writeFile(targetPath);
  await wb.xlsx.writeFile(publicPath);

  console.log(`Success! Super Detail Excel created at: ${targetPath}`);
  console.log(`Public downloadable copy created at: ${publicPath}`);

  // Coba update juga ke file utama jika tidak terkunci
  try {
    const mainPath = path.resolve('Kustomisasi_Menu_Fore_Coffee.xlsx');
    await wb.xlsx.writeFile(mainPath);
    console.log(`Also updated main file at: ${mainPath}`);
  } catch (err) {
    console.log('Note: Main file is currently open in Excel. User can use the Super Detail file.');
  }
}

generateSuperDetailExcel().catch(console.error);
