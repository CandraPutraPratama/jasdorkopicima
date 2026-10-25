import ExcelJS from 'exceljs';
import path from 'node:path';

async function applyForeApiToSuperDetailExcel() {
  console.log('Fetching live Fore menu API from jasdorcailey.developerngantuk.my.id...');
  const res = await fetch('https://jasdorcailey.developerngantuk.my.id/api/fore/menu');
  const apiData = await res.json();
  const apiItems = apiData.items;
  console.log(`Received ${apiItems.length} items from API.`);

  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const targetPath = path.resolve('Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');
  const publicPath = path.resolve('public/Kustomisasi_Menu_Fore_Coffee_Super_Detail.xlsx');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(targetPath);
  const sheet = wb.getWorksheet('Matriks Kustomisasi Detail');

  let updatedCount = 0;

  for (let r = 5; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = norm(row.getCell(3).value);
    const apiItem = apiItems.find((it) => norm(it.name) === name);

    if (!apiItem) {
      console.warn(`Item not matched in API: ${row.getCell(3).value}`);
      continue;
    }

    const opts = apiItem.options || {};
    const sizes = opts.sizes || [];
    const temps = opts.temps || [];
    const ices = opts.ices || [];
    const sugars = opts.sugars || [];
    const isFood = Boolean(apiItem.isFood);

    const nameLower = name;
    const catLower = String(row.getCell(2).value || '').toLowerCase();
    const is1L = catLower.includes('1l');
    const isTea = catLower === 'tea' || nameLower.includes('tea') || nameLower.includes('jasmine');
    const isIceBlended = catLower === 'ice blended';
    const isSignature = catLower === 'fore signature';
    const isAmericanoSeries = catLower === 'americano series' || nameLower.includes('americano');

    // 1. Status & Cup (Col 6 - 10)
    const canIce = temps.includes('Ice') && !isFood;
    const canHot = temps.includes('Hot') && !isFood;
    const hasReg = sizes.includes('Regular');
    const hasLarge = sizes.includes('Large');

    row.getCell(6).value = isFood ? 'TIDAK' : 'YA'; // Ada Kustomisasi?
    row.getCell(7).value = canIce ? 'YA' : 'TIDAK'; // Bisa ICE?
    row.getCell(8).value = canHot ? 'YA' : 'TIDAK'; // Bisa HOT?
    row.getCell(9).value = hasReg ? 'YA' : 'TIDAK'; // Cup Regular
    row.getCell(10).value = hasLarge ? 'YA' : 'TIDAK'; // Large (+7k)

    // 2. Ice Cube (Col 11 - 16)
    let modeIce = 'TIDAK';
    if (canIce) {
      if (
        nameLower.includes('buttercream') ||
        nameLower.includes('butterscotch sea salt') ||
        nameLower.includes('cloud') ||
        isIceBlended
      ) {
        modeIce = 'Terbatas (Normal & Less)';
      } else {
        modeIce = 'Lengkap';
      }
    }
    row.getCell(11).value = modeIce;
    row.getCell(12).value = modeIce !== 'TIDAK' ? 'YA' : 'TIDAK'; // Normal Ice
    row.getCell(13).value = modeIce !== 'TIDAK' ? 'YA' : 'TIDAK'; // Less Ice
    row.getCell(14).value = modeIce === 'Lengkap' ? 'YA' : 'TIDAK'; // More Ice
    row.getCell(15).value = modeIce === 'Lengkap' ? 'YA' : 'TIDAK'; // Es Pisah
    row.getCell(16).value = modeIce === 'Lengkap' ? 'YA' : 'TIDAK'; // No Ice

    // 3. Sweetness (Col 17 - 19)
    const hasSugar = sugars.length > 0 && !isFood;
    const modeSweet = hasSugar ? 'Lengkap' : 'TIDAK';
    row.getCell(17).value = modeSweet;
    row.getCell(18).value = hasSugar ? 'YA' : 'TIDAK'; // Normal Sweet
    row.getCell(19).value = hasSugar ? 'YA' : 'TIDAK'; // Less Sweet

    // 4. Espresso Shot (Col 20 - 25)
    let modeEsp = 'TIDAK';
    const isCoffeeDrink =
      !isFood &&
      (catLower.includes('coffee') ||
        catLower === 'americano series' ||
        catLower === 'fore signature' ||
        (is1L && !nameLower.includes('choco') && !nameLower.includes('matcha') && !nameLower.includes('peach')));

    if (isCoffeeDrink) {
      if (nameLower === 'americano' || nameLower === 'café latte' || nameLower === 'cappuccino') {
        modeEsp = 'Maks +3 Shot';
      } else if (
        isSignature ||
        nameLower.includes('buttercream') ||
        nameLower.includes('butterscotch sea salt') ||
        nameLower.includes('macchiato')
      ) {
        modeEsp = 'Maks +1 Shot';
      } else {
        modeEsp = 'Maks +2 Shot';
      }
    }
    row.getCell(20).value = modeEsp;
    row.getCell(21).value = modeEsp !== 'TIDAK' ? 'YA' : 'TIDAK'; // Normal Shot
    row.getCell(22).value = modeEsp !== 'TIDAK' ? 'YA' : 'TIDAK'; // No Coffee
    row.getCell(23).value = modeEsp !== 'TIDAK' ? 'YA' : 'TIDAK'; // +1 Shot
    row.getCell(24).value = modeEsp === 'Maks +2 Shot' || modeEsp === 'Maks +3 Shot' ? 'YA' : 'TIDAK'; // +2 Shot
    row.getCell(25).value = modeEsp === 'Maks +3 Shot' ? 'YA' : 'TIDAK'; // +3 Shot

    // 5. Dairy / Susu (Col 26 - 33)
    let modeDairy = 'TIDAK';
    const isDairyDrink =
      !isFood &&
      !is1L &&
      !isTea &&
      !nameLower.includes('americano') &&
      !nameLower.includes('espresso') &&
      !nameLower.includes('starrycano') &&
      !nameLower.includes('citrus') &&
      !nameLower.includes('lychee');

    if (isDairyDrink) {
      modeDairy = 'Lengkap';
    }
    row.getCell(26).value = modeDairy;
    row.getCell(27).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // No Milk
    row.getCell(28).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // Milk
    row.getCell(29).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // Soy
    row.getCell(30).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // Fresh Milk
    row.getCell(31).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // UHT Milk
    row.getCell(32).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // Oat Milk
    row.getCell(33).value = modeDairy !== 'TIDAK' ? 'YA' : 'TIDAK'; // Almond Milk

    // 6. Syrup (Col 34 - 40)
    const modeSyrup = isFood || is1L ? 'TIDAK' : 'Lengkap';
    row.getCell(34).value = modeSyrup;
    row.getCell(35).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Aren
    row.getCell(36).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Hazelnut
    row.getCell(37).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Pandan
    row.getCell(38).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Manuka
    row.getCell(39).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Vanilla
    row.getCell(40).value = modeSyrup !== 'TIDAK' ? 'YA' : 'TIDAK'; // Salted Caramel

    // 7. Topping (Col 41 - 49)
    const modeTopping = isFood || is1L ? 'TIDAK' : 'Lengkap';
    row.getCell(41).value = modeTopping;
    row.getCell(42).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Caramel Sauce
    row.getCell(43).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Crumble
    row.getCell(44).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Milo
    row.getCell(45).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Orange Cream
    row.getCell(46).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Oreo
    row.getCell(47).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Sea Salt Cream
    row.getCell(48).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Coffee Cream
    row.getCell(49).value = modeTopping !== 'TIDAK' ? 'YA' : 'TIDAK'; // Tiramisu Cream

    // 8. Seasonal Cup (Col 50)
    row.getCell(50).value = isFood || is1L ? 'TIDAK' : 'YA';

    updatedCount++;
  }

  await wb.xlsx.writeFile(targetPath);
  await wb.xlsx.writeFile(publicPath);

  console.log(`Success! Updated ${updatedCount} items using official Fore API data.`);
  console.log(`Saved to: ${targetPath}`);
  console.log(`Saved to: ${publicPath}`);
}

applyForeApiToSuperDetailExcel().catch(console.error);
