import ExcelJS from 'exceljs';
import path from 'node:path';

async function updateForeExcelDetail() {
  const sourcePath = path.resolve('Kustomisasi_Menu_Fore_Coffee.backup.xlsx');
  const targetPath = path.resolve('Kustomisasi_Menu_Fore_Coffee.xlsx');
  const publicPath = path.resolve('public/Kustomisasi_Menu_Fore_Coffee.xlsx');

  const sourceWb = new ExcelJS.Workbook();
  await sourceWb.xlsx.readFile(sourcePath);
  const srcSheet1 = sourceWb.getWorksheet('Daftar Menu & Kustomisasi');

  // Ekstrak 74 menu dan seluruh modifikasi dari user
  const menuData = [];
  for (let r = 4; r <= srcSheet1.rowCount; r++) {
    const row = srcSheet1.getRow(r);
    const no = row.getCell(1).value;
    const kategori = row.getCell(2).value;
    const nama = row.getCell(3).value;
    const hargaNormal = row.getCell(4).value;
    const adaKustomisasi = row.getCell(6).value;
    const bisaIce = row.getCell(7).value;
    const bisaHot = row.getCell(8).value;
    const adaEspresso = row.getCell(9).value;
    const adaDairy = row.getCell(10).value;
    const adaSweetness = row.getCell(11).value;
    const adaIceCube = row.getCell(12).value;
    const adaSyrup = row.getCell(13).value;
    const adaTopping = row.getCell(14).value;
    const catatan = row.getCell(15).value || '';

    // Hitung default detail cerdas berdasarkan tanda user
    const nameLower = String(nama || '').toLowerCase();
    const catLower = String(kategori || '').toLowerCase();

    // 1. Ukuran Cup
    let ukuranCup = 'Regular & Large';
    if (nameLower === 'espresso') {
      ukuranCup = 'Regular Saja';
    } else if (catLower === 'fore deli' || catLower.includes('1l') || adaKustomisasi === 'TIDAK') {
      ukuranCup = 'TIDAK';
    }

    // 2. Varian Espresso
    let varianEspresso = 'TIDAK';
    if (adaEspresso === 'YA') {
      if (nameLower === 'americano' || nameLower === 'café latte' || nameLower === 'cappuccino') {
        varianEspresso = 'Maks +3 Shot';
      } else if (
        nameLower.includes('buttercream') ||
        nameLower.includes('butterscotch sea salt') ||
        nameLower.includes('macchiato') ||
        catLower === 'fore signature'
      ) {
        varianEspresso = 'Maks +1 Shot';
      } else if (catLower === 'americano series' || catLower.includes('1l')) {
        varianEspresso = 'Maks +2 Shot';
      } else {
        varianEspresso = 'Maks +2 Shot';
      }
    }

    // 3. Varian Ice Cube
    let varianIceCube = 'TIDAK';
    if (adaIceCube === 'YA') {
      if (
        nameLower.includes('buttercream') ||
        nameLower.includes('butterscotch sea salt') ||
        nameLower.includes('cloud') ||
        nameLower.includes('macchiato') ||
        catLower === 'ice blended'
      ) {
        varianIceCube = 'Terbatas (Normal & Less)';
      } else {
        varianIceCube = 'Lengkap (5 Opsi)';
      }
    }

    menuData.push({
      no,
      kategori,
      nama,
      hargaNormal,
      adaKustomisasi,
      bisaIce,
      bisaHot,
      ukuranCup,
      varianEspresso,
      adaDairy,
      adaSweetness,
      varianIceCube,
      adaSyrup,
      adaTopping,
      catatan,
    });
  }

  // Buat Workbook Baru yang Rapi & Fresh
  const newWb = new ExcelJS.Workbook();
  newWb.creator = 'Jasdor Kopi Cima';
  newWb.lastModifiedBy = 'Jasdor Admin';
  newWb.created = new Date();
  newWb.modified = new Date();

  // ───────────────────────────────────────────────────────────
  // SHEET 1: DAFTAR MENU & KUSTOMISASI DETAIL
  // ───────────────────────────────────────────────────────────
  const s1 = newWb.addWorksheet('Daftar Menu & Kustomisasi', {
    views: [{ state: 'frozen', ySplit: 3, xSplit: 3 }],
    properties: { tabColor: { argb: 'FF00543C' } },
  });

  // Judul Header
  s1.mergeCells('A1:P1');
  const title = s1.getCell('A1');
  title.value = 'TABEL KONTROL KUSTOMISASI DETAIL MENU FORE COFFEE (JASDOR)';
  title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(1).height = 36;

  s1.mergeCells('A2:P2');
  const subTitle = s1.getCell('A2');
  subTitle.value =
    'Petunjuk: Kolom F s/d O memiliki pilihan dropdown interaktif. Kolom Ukuran Cup, Varian Espresso, dan Varian Ice Cube dapat disesuaikan per menu.';
  subTitle.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF2B1D12' } };
  subTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EDE2' } };
  subTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  s1.getRow(2).height = 24;

  const colDefinitions = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'kategori', header: 'Kategori', width: 18 },
    { key: 'nama', header: 'Nama Menu', width: 32 },
    { key: 'hargaNormal', header: 'Harga Normal (Outlet)', width: 22 },
    { key: 'hargaPromo', header: 'Harga Promo (-25%)', width: 22 },
    { key: 'adaKustomisasi', header: 'Ada Kustomisasi?', width: 17 },
    { key: 'bisaIce', header: 'Bisa ICE?', width: 12 },
    { key: 'bisaHot', header: 'Bisa HOT?', width: 12 },
    { key: 'ukuranCup', header: 'Ukuran Cup', width: 20 },
    { key: 'varianEspresso', header: 'Varian Espresso', width: 24 },
    { key: 'adaDairy', header: 'Ada Opsi Susu?', width: 15 },
    { key: 'adaSweetness', header: 'Ada Sweetness?', width: 16 },
    { key: 'varianIceCube', header: 'Varian Ice Cube', width: 26 },
    { key: 'adaSyrup', header: 'Ada Opsi Sirup?', width: 15 },
    { key: 'adaTopping', header: 'Ada Topping?', width: 15 },
    { key: 'catatan', header: 'Catatan / Keterangan', width: 36 },
  ];

  s1.columns = colDefinitions.map((c) => ({ key: c.key, width: c.width }));

  const hRow = s1.getRow(3);
  hRow.height = 32;
  colDefinitions.forEach((col, idx) => {
    const cell = hRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E3E2C' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF2B1D12' } },
      bottom: { style: 'medium', color: { argb: 'FF2B1D12' } },
      left: { style: 'thin', color: { argb: 'FF3E6554' } },
      right: { style: 'thin', color: { argb: 'FF3E6554' } },
    };
  });

  let rowIdx = 4;
  for (const item of menuData) {
    const row = s1.getRow(rowIdx);
    row.height = 22;

    row.getCell(1).value = item.no;
    row.getCell(2).value = item.kategori;
    row.getCell(3).value = item.nama;

    // Harga Normal
    const normCell = row.getCell(4);
    normCell.value = item.hargaNormal;
    normCell.numFmt = '"Rp"#,##0';

    // Harga Promo Formula
    const promoCell = row.getCell(5);
    promoCell.value = { formula: `ROUND(D${rowIdx}*0.75, 0)` };
    promoCell.numFmt = '"Rp"#,##0';

    // Dropdown Values
    row.getCell(6).value = item.adaKustomisasi;
    row.getCell(7).value = item.bisaIce;
    row.getCell(8).value = item.bisaHot;
    row.getCell(9).value = item.ukuranCup;
    row.getCell(10).value = item.varianEspresso;
    row.getCell(11).value = item.adaDairy;
    row.getCell(12).value = item.adaSweetness;
    row.getCell(13).value = item.varianIceCube;
    row.getCell(14).value = item.adaSyrup;
    row.getCell(15).value = item.adaTopping;
    row.getCell(16).value = item.catatan;

    // Styling
    const isEven = rowIdx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF9F6F0';

    for (let c = 1; c <= 16; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
      };

      if (c === 1 || (c >= 6 && c <= 15)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 4 || c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: c === 5 };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }

    // ───────────────────────────────────────────────────────────
    // DATA VALIDATION (DROPDOWNS)
    // ───────────────────────────────────────────────────────────
    // F, G, H: YA/TIDAK
    for (const c of [6, 7, 8, 11, 12, 14, 15]) {
      row.getCell(c).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"YA, TIDAK"'],
        showErrorMessage: true,
        errorTitle: 'Input Tidak Valid',
        error: 'Pilih "YA" atau "TIDAK".',
      };
    }

    // I: Ukuran Cup
    row.getCell(9).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Regular & Large, Regular Saja, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih dari opsi Ukuran Cup yang tersedia.',
    };

    // J: Varian Espresso
    row.getCell(10).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Maks +3 Shot, Maks +2 Shot, Maks +1 Shot, Normal Shot Saja, TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih varian Espresso dari dropdown.',
    };

    // M: Varian Ice Cube
    row.getCell(13).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Lengkap (5 Opsi), Terbatas (Normal & Less), TIDAK"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Pilih varian Ice Cube dari dropdown.',
    };

    rowIdx++;
  }

  // ───────────────────────────────────────────────────────────
  // SHEET 2: REFERENSI KUSTOMISASI FORE (UPGRADED DENGAN DETAIL LEVEL)
  // ───────────────────────────────────────────────────────────
  const s2 = newWb.addWorksheet('Referensi Kustomisasi Fore', {
    properties: { tabColor: { argb: 'FFC67D0A' } },
  });

  s2.columns = [
    { header: 'Tipe Suhu / Kategori', width: 22 },
    { header: 'Grup Kustomisasi', width: 24 },
    { header: 'Level / Batasan', width: 26 },
    { header: 'Nama Varian / Addon', width: 34 },
    { header: 'Tambahan Biaya', width: 18 },
    { header: 'Keterangan Detail', width: 44 },
  ];

  s2.mergeCells('A1:F1');
  const s2Title = s2.getCell('A1');
  s2Title.value = 'PANDUAN REFERENSI & LEVEL KUSTOMISASI FORE COFFEE';
  s2Title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  s2Title.alignment = { vertical: 'middle', horizontal: 'center' };
  s2.getRow(1).height = 32;

  const s2HeaderRow = s2.getRow(2);
  s2HeaderRow.height = 26;
  [
    'Tipe Suhu / Kategori',
    'Grup Kustomisasi',
    'Level / Batasan',
    'Nama Varian / Addon',
    'Tambahan Biaya',
    'Keterangan Detail',
  ].forEach((h, idx) => {
    const cell = s2HeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B1D12' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const referenceRows = [
    // PANDUAN LEVEL ICE CUBE
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Lengkap (5 Opsi)',
      name: 'Normal Ice',
      fee: 0,
      note: 'Es batu standar (100%)',
    },
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Lengkap (5 Opsi)',
      name: 'Less Ice',
      fee: 0,
      note: 'Sedikit es batu (50%)',
    },
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Lengkap (5 Opsi)',
      name: 'More Ice',
      fee: 0,
      note: 'Ekstra es batu (120%)',
    },
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Lengkap (5 Opsi)',
      name: 'Ice Separately',
      fee: 0,
      note: 'Es dipisah (Konfirmasi Admin)',
    },
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Lengkap (5 Opsi)',
      name: 'No Ice',
      fee: 0,
      note: 'Tanpa es batu',
    },
    {
      cat: 'PANDUAN ICE CUBE',
      group: 'Varian Ice Cube',
      level: 'Terbatas (Normal & Less)',
      name: 'Normal Ice, Less Ice',
      fee: 0,
      note: 'Hanya 2 opsi ini. Cocok untuk minuman cloud/cream agar struktur tidak amblas.',
    },

    // PANDUAN LEVEL ESPRESSO
    {
      cat: 'PANDUAN ESPRESSO',
      group: 'Varian Espresso',
      level: 'Maks +3 Shot',
      name: 'Normal Shot, No Coffee, +1, +2, +3 Shot',
      fee: 7000,
      note: 'Pilihan lengkap hingga +3 Shot (+Rp21.000). Cocok untuk Americano/Latte polos.',
    },
    {
      cat: 'PANDUAN ESPRESSO',
      group: 'Varian Espresso',
      level: 'Maks +2 Shot',
      name: 'Normal Shot, No Coffee, +1, +2 Shot',
      fee: 7000,
      note: 'Pilihan hingga +2 Shot (+Rp14.000). Cocok untuk Flavored Coffee & Botol 1L.',
    },
    {
      cat: 'PANDUAN ESPRESSO',
      group: 'Varian Espresso',
      level: 'Maks +1 Shot',
      name: 'Normal Shot, No Coffee, +1 Shot',
      fee: 7000,
      note: 'Hanya bisa tambah 1 shot (+Rp7.000). Cocok untuk Fore Signature agar rasa seimbang.',
    },
    {
      cat: 'PANDUAN ESPRESSO',
      group: 'Varian Espresso',
      level: 'Normal Shot Saja',
      name: 'Normal Shot',
      fee: 0,
      note: 'Takaran standar resep, tanpa penambahan shot.',
    },

    // PANDUAN UKURAN CUP
    {
      cat: 'PANDUAN CUP',
      group: 'Ukuran Cup',
      level: 'Regular & Large',
      name: 'Regular Ice/Hot, Large Ice/Hot (+Rp7.000)',
      fee: 7000,
      note: 'Ukuran reguler standar dan large (+Rp7.000).',
    },
    {
      cat: 'PANDUAN CUP',
      group: 'Ukuran Cup',
      level: 'Regular Saja',
      name: 'Regular',
      fee: 0,
      note: 'Hanya tersedia ukuran reguler (contoh: Espresso Hot solo).',
    },

    // KATALOG LENGKAP VARIAN ICE
    {
      cat: 'ICE DRINKS',
      group: 'Ukuran Cup',
      level: 'Wajib, Pilih 1',
      name: 'Regular Ice',
      fee: 0,
      note: 'Ukuran standar',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Ukuran Cup',
      level: 'Wajib, Pilih 1',
      name: 'Large Ice',
      fee: 7000,
      note: 'Ukuran besar (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Sweetness',
      level: 'Wajib, Pilih 1',
      name: 'Normal Sweet',
      fee: 0,
      note: 'Tingkat manis 100%',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Sweetness',
      level: 'Wajib, Pilih 1',
      name: 'Less Sweet',
      fee: 0,
      note: 'Tingkat manis 50%',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'No Milk',
      fee: 0,
      note: 'Tanpa susu',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Milk',
      fee: 0,
      note: 'Susu standar Fore',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Soy Multigrain',
      fee: 7000,
      note: 'Susu kedelai multigrain (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Fresh Milk',
      fee: 7000,
      note: 'Susu sapi segar (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'UHT Milk',
      fee: 7000,
      note: 'Susu UHT (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Oat Milk',
      fee: 15000,
      note: 'Susu gandum ramah laktosa (+Rp15.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Almond Milk',
      fee: 15000,
      note: 'Susu almond gurih (+Rp15.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Syrup (Sirup)',
      level: 'Opsional, Maks 1',
      name: 'Aren, Hazelnut, Pandan, Manuka, Vanilla, Salted Caramel',
      fee: 7000,
      note: 'Tambahan per rasa (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Topping',
      level: 'Opsional, Maks 2',
      name: 'Caramel Sauce, Crumble, Milo Powder, Orange Cream, Oreo Crumbs, Sea Salt Cream, Coffee Cream, Tiramisu Cream',
      fee: 7000,
      note: 'Tambahan per topping (+Rp7.000)',
    },
    {
      cat: 'ICE DRINKS',
      group: 'Seasonal Cup',
      level: 'Wajib, Pilih 1',
      name: 'Seasonal Cup',
      fee: 0,
      note: 'Cup edisi spesial',
    },

    // KATALOG LENGKAP VARIAN HOT
    {
      cat: 'HOT DRINKS',
      group: 'Ukuran Cup',
      level: 'Wajib, Pilih 1',
      name: 'Regular Hot',
      fee: 0,
      note: 'Ukuran standar panas',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Ukuran Cup',
      level: 'Wajib, Pilih 1',
      name: 'Large Hot',
      fee: 7000,
      note: 'Ukuran besar panas (+Rp7.000)',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Temperature',
      level: 'Wajib, Pilih 1',
      name: 'Hot',
      fee: 0,
      note: 'Suhu panas standar',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Temperature',
      level: 'Wajib, Pilih 1',
      name: 'Extra Hot',
      fee: 0,
      note: 'Suhu ekstra panas',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Sweetness',
      level: 'Wajib, Pilih 1',
      name: 'Normal Sweet',
      fee: 0,
      note: 'Tingkat manis 100%',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Sweetness',
      level: 'Wajib, Pilih 1',
      name: 'Less Sweet',
      fee: 0,
      note: 'Tingkat manis 50%',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Milk',
      fee: 0,
      note: 'Susu standar Fore',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Dairy (Susu)',
      level: 'Wajib, Pilih 1',
      name: 'Soy Multigrain (+Rp7k), Oat Milk (+Rp15k), Almond Milk (+Rp15k)',
      fee: 7000,
      note: 'Opsi susu nabati untuk minuman panas',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Syrup (Sirup)',
      level: 'Opsional, Maks 1',
      name: 'Aren, Hazelnut, Pandan, Manuka, Vanilla, Salted Caramel',
      fee: 7000,
      note: 'Tambahan per rasa (+Rp7.000)',
    },
    {
      cat: 'HOT DRINKS',
      group: 'Topping',
      level: 'Opsional, Maks 2',
      name: 'Caramel Sauce, Crumble, Milo Powder, Orange Cream, Oreo Crumbs, Sea Salt Cream, Coffee Cream, Tiramisu Cream',
      fee: 7000,
      note: 'Tambahan per topping (+Rp7.000)',
    },
  ];

  let s2RowIdx = 3;
  for (const ref of referenceRows) {
    const row = s2.getRow(s2RowIdx);
    row.height = 21;

    row.getCell(1).value = ref.cat;
    row.getCell(2).value = ref.group;
    row.getCell(3).value = ref.level;
    row.getCell(4).value = ref.name;
    const feeCell = row.getCell(5);
    feeCell.value = ref.fee;
    feeCell.numFmt = '"Rp"#,##0';
    row.getCell(6).value = ref.note;

    const isGuide = ref.cat.startsWith('PANDUAN');
    const isHot = ref.cat === 'HOT DRINKS';
    const bg = isGuide ? 'FFF4FBF7' : isHot ? 'FFFFF1F0' : 'FFF0F7FF';

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
      };

      if (c === 1 || c === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (isGuide) cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      } else if (c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (ref.fee > 0)
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }

    s2RowIdx++;
  }

  // Tulis file
  const detailPath = path.resolve('Kustomisasi_Menu_Fore_Coffee_Detail.xlsx');
  const publicDetailPath = path.resolve('public/Kustomisasi_Menu_Fore_Coffee_Detail.xlsx');
  await newWb.xlsx.writeFile(detailPath);
  await newWb.xlsx.writeFile(publicDetailPath);
  console.log(`Success! Detail Excel created at: ${detailPath}`);
  console.log(`Public downloadable file created at: ${publicDetailPath}`);

  // Coba tulis juga ke file utama jika tidak sedang dibuka oleh Excel user
  try {
    await newWb.xlsx.writeFile(targetPath);
    await newWb.xlsx.writeFile(publicPath);
    console.log(`Also updated original file at: ${targetPath}`);
  } catch (err) {
    console.log(`Note: Original file ${targetPath} is currently locked by Excel (in use). User can open the updated file: Kustomisasi_Menu_Fore_Coffee_Detail.xlsx`);
  }
}

updateForeExcelDetail().catch(console.error);
