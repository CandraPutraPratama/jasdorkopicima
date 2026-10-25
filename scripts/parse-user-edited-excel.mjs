import ExcelJS from 'exceljs';
import fs from 'node:fs';

async function parseUserEditedExcel() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Kustomisasi_Menu_Fore_Coffee_Super_Detail.USER_EDITED.xlsx');

  console.log('Worksheets:', wb.worksheets.map((w) => w.name));
  const s1 = wb.getWorksheet('Matriks Kustomisasi Detail');
  console.log(`Sheet 1 rows: ${s1.rowCount}, cols: ${s1.columnCount}`);

  // Ambil headers dari row 4
  const r4 = s1.getRow(4);
  const headers = [];
  r4.eachCell((c, i) => headers.push({ col: i, label: String(c.value) }));
  console.log(`Extracted ${headers.length} headers from row 4.`);

  // Baca 74 menu (baris 5 s/d rowCount)
  const menus = [];
  for (let r = 5; r <= s1.rowCount; r++) {
    const row = s1.getRow(r);
    const no = row.getCell(1).value;
    const kategori = row.getCell(2).value;
    const nama = row.getCell(3).value;
    const hargaNormal = row.getCell(4).value;
    const hargaPromo = row.getCell(5).value;

    if (!nama) continue;

    const rowObj = {
      row: r,
      no,
      kategori: String(kategori || ''),
      nama: String(nama || ''),
      hargaNormal: typeof hargaNormal === 'object' && hargaNormal ? hargaNormal.result : hargaNormal,
      hargaPromo: typeof hargaPromo === 'object' && hargaPromo ? hargaPromo.result : hargaPromo,
      // Status & Cup
      adaKustomisasi: row.getCell(6).value,
      bisaIce: row.getCell(7).value,
      bisaHot: row.getCell(8).value,
      cupRegular: row.getCell(9).value,
      cupLarge: row.getCell(10).value,
      // Ice Cube
      modeIceCube: row.getCell(11).value,
      normalIce: row.getCell(12).value,
      lessIce: row.getCell(13).value,
      moreIce: row.getCell(14).value,
      esPisah: row.getCell(15).value,
      noIce: row.getCell(16).value,
      // Sweetness
      modeSweetness: row.getCell(17).value,
      normalSweet: row.getCell(18).value,
      lessSweet: row.getCell(19).value,
      // Espresso
      modeEspresso: row.getCell(20).value,
      normalShot: row.getCell(21).value,
      noCoffee: row.getCell(22).value,
      plus1Shot: row.getCell(23).value,
      plus2Shot: row.getCell(24).value,
      plus3Shot: row.getCell(25).value,
      // Dairy / Susu
      modeDairy: row.getCell(26).value,
      noMilk: row.getCell(27).value,
      milk: row.getCell(28).value,
      soy: row.getCell(29).value,
      freshMilk: row.getCell(30).value,
      uhtMilk: row.getCell(31).value,
      oatMilk: row.getCell(32).value,
      almondMilk: row.getCell(33).value,
      // Syrup
      modeSyrup: row.getCell(34).value,
      aren: row.getCell(35).value,
      hazelnut: row.getCell(36).value,
      pandan: row.getCell(37).value,
      manuka: row.getCell(38).value,
      vanilla: row.getCell(39).value,
      saltedCaramel: row.getCell(40).value,
      // Topping
      modeTopping: row.getCell(41).value,
      caramelSauce: row.getCell(42).value,
      crumble: row.getCell(43).value,
      miloPowder: row.getCell(44).value,
      orangeCream: row.getCell(45).value,
      oreoCrumbs: row.getCell(46).value,
      seaSaltCream: row.getCell(47).value,
      coffeeCream: row.getCell(48).value,
      tiramisuCream: row.getCell(49).value,
      // Seasonal & Catatan
      seasonalCup: row.getCell(50).value,
      catatan: row.getCell(51).value || '',
    };

    menus.push(rowObj);
  }

  console.log(`Total parsed menus: ${menus.length}`);
  fs.writeFileSync('scripts/parsed-fore-customizations.json', JSON.stringify(menus, null, 2), 'utf8');
  console.log('Saved to scripts/parsed-fore-customizations.json');

  // Cetak ringkasan kustomisasi
  const countWithCustom = menus.filter((m) => m.adaKustomisasi === 'YA').length;
  const countWithoutCustom = menus.filter((m) => m.adaKustomisasi !== 'YA').length;
  console.log(`Menu dengan Kustomisasi (YA): ${countWithCustom}`);
  console.log(`Menu tanpa Kustomisasi (TIDAK): ${countWithoutCustom}`);

  // Periksa beberapa menu khusus
  const samples = ['Americano', 'Aren Latte', 'Buttercream Latte', 'Espresso', 'Dark Chocolate', 'English Breakfast'];
  for (const s of samples) {
    const found = menus.find((m) => m.nama.toLowerCase() === s.toLowerCase());
    if (found) {
      console.log(`\nSample [${found.nama}] (${found.kategori}):`);
      console.log(`  Suhu: Ice=${found.bisaIce}, Hot=${found.bisaHot}`);
      console.log(`  Cup: Reg=${found.cupRegular}, Large=${found.cupLarge}`);
      console.log(
        `  Ice: Mode=${found.modeIceCube} [Normal:${found.normalIce}, Less:${found.lessIce}, More:${found.moreIce}, Pisah:${found.esPisah}, None:${found.noIce}]`
      );
      console.log(`  Sweetness: Mode=${found.modeSweetness} [Normal:${found.normalSweet}, Less:${found.lessSweet}]`);
      console.log(
        `  Espresso: Mode=${found.modeEspresso} [Norm:${found.normalShot}, NoCof:${found.noCoffee}, +1:${found.plus1Shot}, +2:${found.plus2Shot}, +3:${found.plus3Shot}]`
      );
      console.log(
        `  Dairy: Mode=${found.modeDairy} [NoMilk:${found.noMilk}, Milk:${found.milk}, Soy:${found.soy}, Fresh:${found.freshMilk}, UHT:${found.uhtMilk}, Oat:${found.oatMilk}, Almond:${found.almondMilk}]`
      );
      console.log(
        `  Syrup: Mode=${found.modeSyrup} [Aren:${found.aren}, Haz:${found.hazelnut}, Pan:${found.pandan}, Man:${found.manuka}, Van:${found.vanilla}, Salt:${found.saltedCaramel}]`
      );
      console.log(`  Topping: Mode=${found.modeTopping}`);
    }
  }
}

parseUserEditedExcel().catch(console.error);
