import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';

// Baca data menu Fore dari fore-menu-data.ts
import { getForeMenuForOutlet } from '../src/lib/fore-menu-data.ts';

async function generateForeCustomizationExcel() {
  const menuGroups = getForeMenuForOutlet();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jasdor Kopi Cima';
  workbook.lastModifiedBy = 'Jasdor Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ───────────────────────────────────────────────────────────
  // SHEET 1: DAFTAR MENU & KUSTOMISASI
  // ───────────────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Daftar Menu & Kustomisasi', {
    views: [{ state: 'frozen', ySplit: 3, xSplit: 3 }],
    properties: { tabColor: { argb: 'FF00543C' } }
  });

  // Judul Header Dokumen
  sheet1.mergeCells('A1:O1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = 'TABEL KONTROL KUSTOMISASI MENU FORE COFFEE (JASDOR)';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(1).height = 36;

  sheet1.mergeCells('A2:O2');
  const subTitleCell = sheet1.getCell('A2');
  subTitleCell.value = 'Petunjuk: Kolom F sampai N memiliki pilihan dropdown "YA" atau "TIDAK". Silakan ubah jika ada menu yang opsi kustomisasinya perlu disesuaikan.';
  subTitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF2B1D12' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EDE2' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(2).height = 24;

  // Header Kolom Tabel (Baris 3)
  const headers = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'kategori', header: 'Kategori', width: 16 },
    { key: 'nama', header: 'Nama Menu', width: 32 },
    { key: 'hargaNormal', header: 'Harga Normal (Outlet)', width: 22 },
    { key: 'hargaPromo', header: 'Harga Promo (-25%)', width: 22 },
    { key: 'adaKustomisasi', header: 'Ada Kustomisasi?', width: 18 },
    { key: 'bisaIce', header: 'Bisa ICE?', width: 13 },
    { key: 'bisaHot', header: 'Bisa HOT?', width: 13 },
    { key: 'adaEspresso', header: 'Ada Espresso?', width: 16 },
    { key: 'adaDairy', header: 'Ada Opsi Susu?', width: 16 },
    { key: 'adaSweetness', header: 'Ada Sweetness?', width: 16 },
    { key: 'adaIceCube', header: 'Ada Ice Cube?', width: 15 },
    { key: 'adaSyrup', header: 'Ada Opsi Sirup?', width: 16 },
    { key: 'adaTopping', header: 'Ada Topping?', width: 15 },
    { key: 'catatan', header: 'Catatan / Keterangan', width: 34 },
  ];

  sheet1.columns = headers.map(h => ({ key: h.key, width: h.width }));

  const headerRow = sheet1.getRow(3);
  headerRow.height = 30;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h.header;
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

  // Isi Data Menu
  let itemCounter = 1;
  let currentRowIdx = 4;

  for (const group of menuGroups) {
    const catName = group.name;
    const isFood = catName === 'Fore Deli';
    const is1L = catName === 'FOREveryone 1L';
    const isTea = catName === 'Tea';
    const isIceBlended = catName === 'Ice Blended';
    const isCoffee = catName === 'Coffee';
    const isNonCoffee = catName === 'Non Coffee';

    for (const prod of group.products) {
      const row = sheet1.getRow(currentRowIdx);
      row.height = 22;

      // Logika default cerdas per jenis menu:
      const nameLower = prod.name.toLowerCase();
      const hasEspressoDefault = (isCoffee || isIceBlended || isNonCoffee) && !nameLower.includes('tea') && !nameLower.includes('matcha');
      const hasDairyDefault = !isFood && !is1L && !isTea && !nameLower.includes('americano') && !nameLower.includes('espresso') && !nameLower.includes('starrycano');
      const canHotDefault = !isFood && !is1L && !isIceBlended;
      const canIceDefault = !isFood;
      const hasCustomDefault = !isFood && !is1L;

      row.getCell(1).value = itemCounter++;
      row.getCell(2).value = catName;
      row.getCell(3).value = prod.name;
      
      // Harga Normal
      const normalCell = row.getCell(4);
      normalCell.value = prod.basePrice;
      normalCell.numFmt = '"Rp"#,##0';

      // Harga Promo (-25%)
      const promoCell = row.getCell(5);
      promoCell.value = { formula: `ROUND(D${currentRowIdx}*0.75, 0)` };
      promoCell.numFmt = '"Rp"#,##0';

      // Dropdown Flags
      row.getCell(6).value = hasCustomDefault ? 'YA' : 'TIDAK';
      row.getCell(7).value = canIceDefault ? 'YA' : 'TIDAK';
      row.getCell(8).value = canHotDefault ? 'YA' : 'TIDAK';
      row.getCell(9).value = hasEspressoDefault ? 'YA' : 'TIDAK';
      row.getCell(10).value = hasDairyDefault ? 'YA' : 'TIDAK';
      row.getCell(11).value = hasCustomDefault ? 'YA' : 'TIDAK';
      row.getCell(12).value = hasCustomDefault && !isIceBlended ? 'YA' : 'TIDAK';
      row.getCell(13).value = hasCustomDefault ? 'YA' : 'TIDAK';
      row.getCell(14).value = hasCustomDefault ? 'YA' : 'TIDAK';

      // Catatan
      let defaultNote = '';
      if (isFood) defaultNote = 'Pastry / Makanan (bisa dipanaskan/toast)';
      else if (is1L) defaultNote = 'Kemasan botol 1 liter siap saji';
      else if (isIceBlended) defaultNote = 'Hanya tersedia dingin (blended)';
      else if (nameLower.includes('americano')) defaultNote = 'Espresso hitam tanpa susu';
      row.getCell(15).value = defaultNote;

      // Styling baris
      const isEven = currentRowIdx % 2 === 0;
      const bgColor = isEven ? 'FFFFFFFF' : 'FFF9F6F0';

      for (let colIdx = 1; colIdx <= 15; colIdx++) {
        const c = row.getCell(colIdx);
        c.font = { name: 'Segoe UI', size: 9.5 };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        c.border = {
          top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
          bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
          left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
          right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        };

        if (colIdx === 1 || (colIdx >= 6 && colIdx <= 14)) {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colIdx === 4 || colIdx === 5) {
          c.alignment = { vertical: 'middle', horizontal: 'right' };
          c.font = { name: 'Segoe UI', size: 9.5, bold: colIdx === 5 };
        } else {
          c.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }

      // Validasi Dropdown (YA / TIDAK) pada kolom F sampai N
      for (let cIdx = 6; cIdx <= 14; cIdx++) {
        row.getCell(cIdx).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"YA, TIDAK"'],
          showErrorMessage: true,
          errorTitle: 'Input Tidak Valid',
          error: 'Pilih "YA" atau "TIDAK" dari daftar dropdown.'
        };
      }

      currentRowIdx++;
    }
  }

  // ───────────────────────────────────────────────────────────
  // SHEET 2: REFERENSI KUSTOMISASI FORE
  // ───────────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Referensi Kustomisasi Fore', {
    properties: { tabColor: { argb: 'FFC67D0A' } }
  });

  sheet2.columns = [
    { header: 'Tipe Suhu', width: 14 },
    { header: 'Kategori Kustomisasi', width: 24 },
    { header: 'Aturan Pilihan', width: 22 },
    { header: 'Opsi / Varian', width: 34 },
    { header: 'Tambahan Biaya', width: 18 },
    { header: 'Keterangan', width: 30 }
  ];

  // Header Sheet 2
  sheet2.mergeCells('A1:F1');
  const s2Title = sheet2.getCell('A1');
  s2Title.value = 'DAFTAR LENGKAP VARIAN & OPSI KUSTOMISASI FORE COFFEE';
  s2Title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00543C' } };
  s2Title.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet2.getRow(1).height = 32;

  const s2HeaderRow = sheet2.getRow(2);
  s2HeaderRow.height = 26;
  ['Tipe Suhu', 'Grup Opsi', 'Aturan Pilihan', 'Nama Varian / Addon', 'Tambahan Biaya', 'Keterangan'].forEach((h, idx) => {
    const cell = s2HeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B1D12' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const rawOptionsData = [
    // ICE OPTIONS
    { temp: 'ICE', group: 'Ukuran Cup', rule: 'Wajib, Pilih 1', name: 'Regular Ice', fee: 0, note: 'Ukuran standar' },
    { temp: 'ICE', group: 'Ukuran Cup', rule: 'Wajib, Pilih 1', name: 'Large Ice', fee: 7000, note: 'Ukuran besar' },

    { temp: 'ICE', group: 'Sweetness', rule: 'Wajib, Pilih 1', name: 'Normal Sweet', fee: 0, note: 'Tingkat manis 100%' },
    { temp: 'ICE', group: 'Sweetness', rule: 'Wajib, Pilih 1', name: 'Less Sweet', fee: 0, note: 'Tingkat manis 50%' },

    { temp: 'ICE', group: 'Ice Cube', rule: 'Wajib, Pilih 1', name: 'Normal Ice', fee: 0, note: 'Es batu standar' },
    { temp: 'ICE', group: 'Ice Cube', rule: 'Wajib, Pilih 1', name: 'Less Ice', fee: 0, note: 'Sedikit es batu' },
    { temp: 'ICE', group: 'Ice Cube', rule: 'Wajib, Pilih 1', name: 'More Ice', fee: 0, note: 'Ekstra es batu' },
    { temp: 'ICE', group: 'Ice Cube', rule: 'Wajib, Pilih 1', name: 'Ice Separately', fee: 0, note: 'Es dipisah (Konfirmasi Admin)' },
    { temp: 'ICE', group: 'Ice Cube', rule: 'Wajib, Pilih 1', name: 'No Ice', fee: 0, note: 'Tanpa es batu' },

    { temp: 'ICE', group: 'Espresso', rule: 'Wajib, Pilih 1', name: 'Normal Shot', fee: 0, note: 'Takaran standar' },
    { temp: 'ICE', group: 'Espresso', rule: 'Wajib, Pilih 1', name: 'No Coffee', fee: 0, note: 'Tanpa kopi' },
    { temp: 'ICE', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+1 Shot', fee: 7000, note: 'Ekstra 1 shot espresso' },
    { temp: 'ICE', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+2 Shot', fee: 14000, note: 'Ekstra 2 shot espresso' },
    { temp: 'ICE', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+3 Shot', fee: 21000, note: 'Ekstra 3 shot espresso' },

    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'No Milk', fee: 0, note: 'Tanpa susu' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Milk', fee: 0, note: 'Susu standar Fore' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Soy Multigrain', fee: 7000, note: 'Susu kedelai multigrain' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Fresh Milk', fee: 7000, note: 'Susu sapi segar' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'UHT Milk', fee: 7000, note: 'Susu UHT' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Oat Milk', fee: 15000, note: 'Susu gandum (ramah laktosa)' },
    { temp: 'ICE', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Almond Milk', fee: 15000, note: 'Susu almond gurih' },

    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Aren', fee: 7000, note: 'Sirup gula aren' },
    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Hazelnut', fee: 7000, note: 'Sirup hazelnut' },
    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Pandan', fee: 7000, note: 'Sirup pandan wangi' },
    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Manuka', fee: 7000, note: 'Madu manuka alami' },
    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Vanilla', fee: 7000, note: 'Sirup vanila' },
    { temp: 'ICE', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Salted Caramel', fee: 7000, note: 'Sirup salted caramel' },

    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Caramel Sauce', fee: 7000, note: 'Saus karamel legit' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Crumble', fee: 7000, note: 'Remahan renyah' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Milo Powder', fee: 7000, note: 'Bubuk milo cokelat' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Orange Cream', fee: 7000, note: 'Krim jeruk segar' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Oreo Crumbs', fee: 7000, note: 'Remahan biskuit oreo' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Sea Salt Cream', fee: 7000, note: 'Krim gurih sea salt' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Coffee Cream', fee: 7000, note: 'Krim kopi lembut' },
    { temp: 'ICE', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Tiramisu Cream', fee: 7000, note: 'Krim aroma tiramisu' },

    { temp: 'ICE', group: 'Seasonal Cup', rule: 'Wajib, Pilih 1', name: 'Seasonal Cup', fee: 0, note: 'Cup edisi spesial' },

    // HOT OPTIONS
    { temp: 'HOT', group: 'Ukuran Cup', rule: 'Wajib, Pilih 1', name: 'Regular Hot', fee: 0, note: 'Ukuran standar panas' },
    { temp: 'HOT', group: 'Ukuran Cup', rule: 'Wajib, Pilih 1', name: 'Large Hot', fee: 7000, note: 'Ukuran besar panas' },

    { temp: 'HOT', group: 'Temperature', rule: 'Wajib, Pilih 1', name: 'Hot', fee: 0, note: 'Suhu panas standar' },
    { temp: 'HOT', group: 'Temperature', rule: 'Wajib, Pilih 1', name: 'Extra Hot', fee: 0, note: 'Suhu lebih panas' },

    { temp: 'HOT', group: 'Sweetness', rule: 'Wajib, Pilih 1', name: 'Normal Sweet', fee: 0, note: 'Tingkat manis 100%' },
    { temp: 'HOT', group: 'Sweetness', rule: 'Wajib, Pilih 1', name: 'Less Sweet', fee: 0, note: 'Tingkat manis 50%' },

    { temp: 'HOT', group: 'Espresso', rule: 'Wajib, Pilih 1', name: 'Normal Shot', fee: 0, note: 'Takaran standar' },
    { temp: 'HOT', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+1 Shot', fee: 7000, note: 'Ekstra 1 shot espresso' },
    { temp: 'HOT', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+2 Shot', fee: 14000, note: 'Ekstra 2 shot espresso' },
    { temp: 'HOT', group: 'Espresso', rule: 'Wajib, Pilih 1', name: '+3 Shot', fee: 21000, note: 'Ekstra 3 shot espresso' },

    { temp: 'HOT', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Milk', fee: 0, note: 'Susu standar Fore' },
    { temp: 'HOT', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Soy Multigrain', fee: 7000, note: 'Susu kedelai multigrain' },
    { temp: 'HOT', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Oat Milk', fee: 15000, note: 'Susu gandum (ramah laktosa)' },
    { temp: 'HOT', group: 'Dairy (Susu)', rule: 'Wajib, Pilih 1', name: 'Almond Milk', fee: 15000, note: 'Susu almond gurih' },

    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Aren', fee: 7000, note: 'Sirup gula aren' },
    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Hazelnut', fee: 7000, note: 'Sirup hazelnut' },
    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Pandan', fee: 7000, note: 'Sirup pandan wangi' },
    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Manuka', fee: 7000, note: 'Madu manuka alami' },
    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Vanilla', fee: 7000, note: 'Sirup vanila' },
    { temp: 'HOT', group: 'Syrup (Sirup)', rule: 'Opsional, Maks 1', name: 'Salted Caramel', fee: 7000, note: 'Sirup salted caramel' },

    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Caramel Sauce', fee: 7000, note: 'Saus karamel legit' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Crumble', fee: 7000, note: 'Remahan renyah' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Milo Powder', fee: 7000, note: 'Bubuk milo cokelat' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Orange Cream', fee: 7000, note: 'Krim jeruk segar' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Oreo Crumbs', fee: 7000, note: 'Remahan biskuit oreo' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Sea Salt Cream', fee: 7000, note: 'Krim gurih sea salt' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Coffee Cream', fee: 7000, note: 'Krim kopi lembut' },
    { temp: 'HOT', group: 'Topping', rule: 'Opsional, Maks 2', name: 'Tiramisu Cream', fee: 7000, note: 'Krim aroma tiramisu' },
  ];

  let s2RowIdx = 3;
  for (const opt of rawOptionsData) {
    const row = sheet2.getRow(s2RowIdx);
    row.height = 20;

    row.getCell(1).value = opt.temp;
    row.getCell(2).value = opt.group;
    row.getCell(3).value = opt.rule;
    row.getCell(4).value = opt.name;
    const feeCell = row.getCell(5);
    feeCell.value = opt.fee;
    feeCell.numFmt = '"Rp"#,##0';
    row.getCell(6).value = opt.note;

    const isHot = opt.temp === 'HOT';
    const tagBg = isHot ? 'FFFFF1F0' : 'FFF0F7FF';

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tagBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        left: { style: 'thin', color: { argb: 'FFE0D6C8' } },
        right: { style: 'thin', color: { argb: 'FFE0D6C8' } },
      };
      if (c === 1 || c === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (opt.fee > 0) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }

    s2RowIdx++;
  }

  // Tulis file ke project root dan public folder
  const outputPath = path.resolve('Kustomisasi_Menu_Fore_Coffee.xlsx');
  const publicOutputPath = path.resolve('public/Kustomisasi_Menu_Fore_Coffee.xlsx');
  
  await workbook.xlsx.writeFile(outputPath);
  await workbook.xlsx.writeFile(publicOutputPath);
  console.log(`Excel file created successfully at: ${outputPath}`);
  console.log(`Public downloadable copy created at: ${publicOutputPath}`);
}

generateForeCustomizationExcel().catch(console.error);
