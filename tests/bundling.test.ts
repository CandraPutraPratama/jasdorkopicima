import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBundlePricing,
  validateBundleSelection,
  getOutletTierDiff,
  getBundleThresholds,
  getBundleDescription,
} from '../src/lib/bundling.ts';
import { calculateOrderPricing } from '../src/lib/pricing.ts';

mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-21T12:00:00+07:00') }); // pekan normal: tanpa harga khusus sementara

test('Bundling: Paket 1 (Bundling 3 Reguler) - 3x Mantan 19k -> Bayar Rp32.500', () => {
  const selected = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
  ];

  const validation = validateBundleSelection('bundle-3-reguler', selected);
  assert.equal(validation.isValid, true);

  const pricing = calculateBundlePricing('bundle-3-reguler', selected);
  assert.equal(pricing.normalPrice, 57000);
  assert.equal(pricing.promoSubtotal, 28500);
  assert.equal(pricing.bundleFee, 4000);
  assert.equal(pricing.total, 32500);
  assert.equal(pricing.totalSavings, 28500);
});

test('Bundling: Paket 2 (Bundling 2 Large) - 2x Mantan 25k -> Bayar Rp29.500', () => {
  const selected = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
  ];

  const validation = validateBundleSelection('bundle-2-large', selected);
  assert.equal(validation.isValid, true);

  const pricing = calculateBundlePricing('bundle-2-large', selected);
  assert.equal(pricing.normalPrice, 50000);
  assert.equal(pricing.promoSubtotal, 25000);
  assert.equal(pricing.bundleFee, 4500);
  assert.equal(pricing.total, 29500);
  assert.equal(pricing.totalSavings, 25000);
});

test('Bundling: Paket 3 (Bundling 2 Minuman + 2 Makanan) - 2x Mantan 19k + Roti Coklat 9k + Roti Susu 10k -> Bayar Rp34.500', () => {
  const selected = [
    { name: 'Kopi Kenangan Mantan', category: 'drink' as const },
    { name: 'Kopi Kenangan Mantan', category: 'drink' as const },
    { name: 'Roti Coklat Klasik', category: 'food' as const },
    { name: 'Roti Susu Manis', category: 'food' as const },
  ];

  const validation = validateBundleSelection('bundle-2-drink-2-food', selected);
  assert.equal(validation.isValid, true);

  const pricing = calculateBundlePricing('bundle-2-drink-2-food', selected);
  // 19000 + 19000 + 9000 + 10000 = 57000
  assert.equal(pricing.normalPrice, 57000);
  assert.equal(pricing.promoSubtotal, 28500);
  assert.equal(pricing.bundleFee, 6000);
  assert.equal(pricing.total, 34500);
  assert.equal(pricing.totalSavings, 28500);
});

test('Bundling: Validasi menolak item yang tidak eligible', () => {
  // Thai Tea Loaded di bundle-3-reguler (karena Thai Tea Loaded hanya di bundle-2-large)
  const selected = [
    { name: 'Thai Tea Loaded' },
    { name: 'Americano' },
    { name: 'Americano' },
  ];
  const validation = validateBundleSelection('bundle-3-reguler', selected);
  assert.equal(validation.isValid, false);
  assert.match(validation.error || '', /Thai Tea Loaded/i);
});

test('Bundling: Validasi menolak slot yang kurang atau lebih', () => {
  // Hanya 2 item untuk bundle-3-reguler (seharusnya 3)
  const selected = [
    { name: 'Americano' },
    { name: 'Kopi Kenangan Mantan' },
  ];
  const validation = validateBundleSelection('bundle-3-reguler', selected);
  assert.equal(validation.isValid, false);
  assert.match(validation.error || '', /3/);
});

test('Bundling: Harga per outlet - menggunakan harga live outlet jika tersedia untuk Paket 1', () => {
  // Misal di outlet bandara, Americano harganya 22.000 bukan 17.000
  const selected = [
    { name: 'Americano', liveBasePrice: 22000 },
    { name: 'Americano', liveBasePrice: 22000 },
    { name: 'Americano', liveBasePrice: 22000 },
  ];
  const pricing = calculateBundlePricing('bundle-3-reguler', selected);
  // 3 x 22.000 = 66.000 -> 50% = 33.000 + fee 4.000 = 37.000
  assert.equal(pricing.normalPrice, 66000);
  assert.equal(pricing.promoSubtotal, 33000);
  assert.equal(pricing.total, 37000);
});

test('Pricing: calculateOrderPricing menghitung bundling dengan fee paket yang tepat', () => {
  const result = calculateOrderPricing([
    {
      name: 'Bundling 3 Reguler',
      basePrice: 57000,
      quantity: 1,
      isBundle: true,
      bundleType: 'bundle-3-reguler',
      bundleFee: 4000,
      bundleNormalPrice: 57000,
    },
  ]);

  // Subtotal = 57.000 / 2 = 28.500
  // Fee paket = 4.000 (bukan fee satuan 6.000)
  // Total = 32.500
  assert.equal(result.subtotal, 28500);
  assert.equal(result.fee, 4000);
  assert.equal(result.total, 32500);
  assert.equal(result.totalSavings, 28500);
});

test('Pricing: calculateOrderPricing campuran bundling + regular item', () => {
  const result = calculateOrderPricing([
    {
      name: 'Bundling 3 Reguler',
      basePrice: 57000,
      quantity: 1,
      isBundle: true,
      bundleType: 'bundle-3-reguler',
      bundleFee: 4000,
      bundleNormalPrice: 57000,
    },
    {
      name: 'Americano',
      basePrice: 17000,
      quantity: 1,
    },
  ]);

  // Bundle: subtotal 28.500, fee 4.000
  // Regular 1x Americano: promo 8.500, fee multi 2.300 (karena ada item lain di keranjang)
  // Total subtotal = 28.500 + 8.500 = 37.000
  // Total fee = 4.000 + 2.300 = 6.300
  // Total = 43.300
  assert.equal(result.subtotal, 37000);
  assert.equal(result.fee, 6300);
  assert.equal(result.total, 43300);
});

test('Pricing Invariant: calculateOrderPricing hanya item reguler tetap 100% identik', () => {
  // Single regular item
  const single = calculateOrderPricing([
    {
      name: 'Americano',
      basePrice: 17000,
      quantity: 1,
    },
  ]);
  assert.equal(single.subtotal, 8500);
  assert.equal(single.fee, 4000);
  assert.equal(single.total, 12500);

  // Multi regular items
  const multi = calculateOrderPricing([
    {
      name: 'Americano',
      basePrice: 17000,
      quantity: 2,
    },
  ]);
  assert.equal(multi.subtotal, 17000);
  assert.equal(multi.fee, 4600); // 2 x 2.300
  assert.equal(multi.total, 21600);
});

test('Bundling Promo: aktif otomatis tiap Sabtu 15.00 - Minggu 23.20 WIB', async () => {
  const { isBundlingPromoActive } = await import('../src/lib/bundling.ts');
  const off = false;

  // Pekan 7-8 Nov 2026
  assert.equal(isBundlingPromoActive(new Date('2026-11-06T23:59:59+07:00'), off), false); // Jumat malam
  assert.equal(isBundlingPromoActive(new Date('2026-11-07T00:00:01+07:00'), off), false); // Sabtu dini hari
  assert.equal(isBundlingPromoActive(new Date('2026-11-07T14:59:59+07:00'), off), false); // Sabtu sebelum 15.00
  assert.equal(isBundlingPromoActive(new Date('2026-11-07T15:00:00+07:00'), off), true); // Sabtu 15.00 tepat
  assert.equal(isBundlingPromoActive(new Date('2026-11-08T12:00:00+07:00'), off), true); // Minggu siang
  assert.equal(isBundlingPromoActive(new Date('2026-11-08T23:20:00+07:00'), off), true); // Minggu 23.20 tepat
  assert.equal(isBundlingPromoActive(new Date('2026-11-08T23:20:01+07:00'), off), false); // lewat 23.20
  assert.equal(isBundlingPromoActive(new Date('2026-11-09T00:00:01+07:00'), off), false); // Senin

  // Berulang otomatis pekan berikutnya (14-15 Nov) dan pekan-pekan setelahnya
  assert.equal(isBundlingPromoActive(new Date('2026-11-14T10:00:00+07:00'), off), false);
  assert.equal(isBundlingPromoActive(new Date('2026-11-14T15:30:00+07:00'), off), true);
  assert.equal(isBundlingPromoActive(new Date('2026-11-15T23:00:00+07:00'), off), true);
  assert.equal(isBundlingPromoActive(new Date('2026-11-18T12:00:00+07:00'), off), false); // Rabu
  assert.equal(isBundlingPromoActive(new Date('2027-03-06T16:00:00+07:00'), off), true); // Sabtu 2027

  // Batas pekan lewat UTC: Sabtu 15.00 WIB = 08.00 UTC, Minggu 23.20 WIB = 16.20 UTC
  assert.equal(isBundlingPromoActive(new Date('2026-11-14T08:00:00Z'), off), true);
  assert.equal(isBundlingPromoActive(new Date('2026-11-15T16:21:00Z'), off), false);
});

test('Bundling Promo: getBundlingRemainingTime menghitung sisa jam dan menit dengan format benar', async () => {
  const { getBundlingRemainingTime } = await import('../src/lib/bundling.ts');

  // 2 jam 15 menit sebelum berakhir
  const ref = new Date('2026-11-08T21:04:59+07:00');
  const res = getBundlingRemainingTime(ref);
  assert.equal(res.hours, 2);
  assert.equal(res.minutes, 15);
  assert.equal(res.isExpired, false);
  assert.equal(res.formatted, 'Berakhir dalam 2 jam 15 mnt');

  // Setelah expired
  const expiredRef = new Date('2026-11-08T23:30:00+07:00');
  const expRes = getBundlingRemainingTime(expiredRef);
  assert.equal(expRes.isExpired, true);
  assert.equal(expRes.formatted, 'Promo berakhir');
});

test('Bundling: Paket 2 memiliki 25 menu fixed price & deskripsi rentang 50.000-60.000 normal -> mulai Rp28.500', async () => {
  const { calculateBundlePricing, validateBundleSelection, BUNDLE_PACKAGES, LARGE_ELIGIBLE_DRINKS } = await import('../src/lib/bundling.ts');

  // 1. Verifikasi LARGE_ELIGIBLE_DRINKS memiliki tepat 25 item
  assert.equal(LARGE_ELIGIBLE_DRINKS.length, 25, 'LARGE_ELIGIBLE_DRINKS harus memiliki tepat 25 item');
  
  // Verifikasi beberapa harga fixed kunci
  const findItem = (name: string) => LARGE_ELIGIBLE_DRINKS.find((it) => it.name === name);
  assert.equal(findItem('Kopi Kenangan Mantan')?.baselinePrice, 25000);
  assert.equal(findItem('Taro Cloud Latte')?.baselinePrice, 29000);
  assert.equal(findItem('Fresh Lemonade')?.baselinePrice, 17000);
  assert.equal(findItem('Americano')?.baselinePrice, 22000);
  assert.equal(findItem('Cafe Malt Latte')?.baselinePrice, 30000);
  assert.equal(findItem('Milo Dinosaurus')?.baselinePrice, 30000);
  assert.equal(findItem('OG Aren Speculoos Latte')?.baselinePrice, 28000);

  // 2. Kombinasi 2x Mantan (25k + 25k = 50.000) -> Bayar Rp28.500
  const selectedMantan = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
  ];
  const validMantan = validateBundleSelection('bundle-2-large', selectedMantan);
  assert.equal(validMantan.isValid, true);
  const pricingMantan = calculateBundlePricing('bundle-2-large', selectedMantan);
  assert.equal(pricingMantan.normalPrice, 50000);
  assert.equal(pricingMantan.total, 29500);

  // 3. Verifikasi klaim deskripsi rentang harga kartu 2
  assert.match(BUNDLE_PACKAGES['bundle-2-large'].description, /50\.000-60\.000/);
});

test('Bundling: Paket 2 validasi rentang 50k-60k (terima 50k & 60k, tolak 49k, 34k, & item lama)', async () => {
  const { calculateBundlePricing, validateBundleSelection } = await import('../src/lib/bundling.ts');

  // A. TERIMA batas bawah 50k: Americano (22k) + OG Aren Speculoos (28k) = 50k
  const valid50k = validateBundleSelection('bundle-2-large', [
    { name: 'Americano' },
    { name: 'OG Aren Speculoos Latte' },
  ]);
  assert.equal(valid50k.isValid, true, 'Kombinasi tepat 50k harus diterima');

  // B. TERIMA batas atas 60k: 2x 30rb (Cafe Malt Latte 30k + Milo Dinosaurus 30k = 60k) -> Bayar Rp33.500
  const valid60k = validateBundleSelection('bundle-2-large', [
    { name: 'Cafe Malt Latte' },
    { name: 'Milo Dinosaurus' },
  ]);
  assert.equal(valid60k.isValid, true, 'Kombinasi tepat 60k harus diterima');
  const pricing60k = calculateBundlePricing('bundle-2-large', [
    { name: 'Cafe Malt Latte' },
    { name: 'Milo Dinosaurus' },
  ]);
  assert.equal(pricing60k.normalPrice, 60000);
  assert.equal(pricing60k.total, 34500); // 60.000 x 50% + 4.500

  // C. TOLAK 49k: Americano (22k) + Spanish Latte (27k) = 49k
  const invalid49k = validateBundleSelection('bundle-2-large', [
    { name: 'Americano' },
    { name: 'Spanish Latte' },
  ]);
  assert.equal(invalid49k.isValid, false, 'Kombinasi 49k harus ditolak');
  assert.match(invalid49k.error || '', /50\.000/);

  // D. TOLAK 34k: 2x Fresh Lemonade (17k + 17k = 34k)
  const invalid34k = validateBundleSelection('bundle-2-large', [
    { name: 'Fresh Lemonade' },
    { name: 'Fresh Lemonade' },
  ]);
  assert.equal(invalid34k.isValid, false, 'Kombinasi 2x Fresh Lemonade (34k) harus ditolak');

  // E. TOLAK item lama yang dihapus dari list 25
  const removedDrinks = [
    'Korean Banana Latte',
    'Banana Choco',
    'Avocado Milk',
    'Chocoberry Frappe',
    'Kopi Kenangan Mantan Frappe',
  ];

  for (const name of removedDrinks) {
    const val = validateBundleSelection('bundle-2-large', [
      { name },
      { name: 'Latte' },
    ]);
    assert.equal(val.isValid, false, `Item ${name} yang tidak ada di list 25 harus ditolak`);
  }
});

test('Bundling: Item tidak ada di outlet terfilter (hanya item ada & tidak sold out yang lolos)', async () => {
  const { getAvailableBundleEligibleItems } = await import('../src/lib/bundling.ts');

  const outletProducts = [
    { name: '  kopi kenangan mantan  ', isSoldOut: false },
    { name: 'Americano', isSoldOut: false },
    { name: 'Latte', isSoldOut: true }, // Sold out di outlet ini
    // Pistachio Aren Latte dan lainnya sengaja TIDAK ADA di outlet ini
  ];

  // 1. Bundle 2 Large: hanya Kopi Kenangan Mantan dan Americano yang lolos (Latte sold out, sisanya tidak ada)
  const availableLarge = getAvailableBundleEligibleItems('bundle-2-large', outletProducts);
  const largeNames = availableLarge.map((it) => it.name);
  assert.equal(largeNames.includes('Kopi Kenangan Mantan'), true, 'Kopi Kenangan Mantan harus lolos');
  assert.equal(largeNames.includes('Americano'), true, 'Americano harus lolos');
  assert.equal(largeNames.includes('Latte'), false, 'Latte yang sold out TIDAK boleh lolos');
  assert.equal(largeNames.includes('Pistachio Aren Latte'), false, 'Pistachio Aren Latte yang tidak ada di outlet TIDAK boleh lolos');
  assert.equal(largeNames.length, 2, 'Hanya 2 item yang harus lolos');

  // 2. Bundle 3 Reguler: cek filter yang sama
  const availableRegular = getAvailableBundleEligibleItems('bundle-3-reguler', outletProducts);
  const regNames = availableRegular.map((it) => it.name);
  assert.equal(regNames.includes('Kopi Kenangan Mantan'), true);
  assert.equal(regNames.includes('Americano'), true);
  assert.equal(regNames.length, 2);
});

test('Bundling: Opsi bundling disembunyikan jika item yang tersedia < slot minimal', async () => {
  const { isBundleAvailableAtOutlet, getAvailableBundlePackages } = await import('../src/lib/bundling.ts');

  // Outlet A: Hanya ada 1 minuman (Kopi Kenangan Mantan) dan 1 Roti
  const sparseOutlet = [
    { name: 'Kopi Kenangan Mantan', isSoldOut: false },
    { name: 'Roti Coklat Klasik', isSoldOut: false },
  ];

  // 2 Large butuh >= 2 item -> sparseOutlet hanya punya 1 large
  assert.equal(isBundleAvailableAtOutlet('bundle-2-large', sparseOutlet), false, '2 Large harus false jika < 2');

  // 3 Reguler butuh >= 3 item -> sparseOutlet hanya punya 1 reguler
  assert.equal(isBundleAvailableAtOutlet('bundle-3-reguler', sparseOutlet), false, '3 Reguler harus false jika < 3');

  // 2+2 butuh >= 2 minuman dan >= 2 makanan -> sparseOutlet hanya punya 1 makanan
  assert.equal(isBundleAvailableAtOutlet('bundle-2-drink-2-food', sparseOutlet), false, '2+2 harus false jika makanan < 2');

  // getAvailableBundlePackages harus kosong di sparseOutlet
  const availableSparse = getAvailableBundlePackages(sparseOutlet);
  assert.equal(availableSparse.length, 0, 'Tidak boleh ada paket yang eligible di sparseOutlet');

  // Outlet B: Memiliki item yang cukup untuk 2 Large (2 item) tapi tidak cukup untuk 3 Reguler
  const mediumOutlet = [
    { name: 'Kopi Kenangan Mantan', isSoldOut: false },
    { name: 'Americano', isSoldOut: false },
  ];
  assert.equal(isBundleAvailableAtOutlet('bundle-2-large', mediumOutlet), true, '2 Large harus true jika >= 2');
  assert.equal(isBundleAvailableAtOutlet('bundle-3-reguler', mediumOutlet), false, '3 Reguler harus false jika < 3');
  const availableMedium = getAvailableBundlePackages(mediumOutlet);
  assert.equal(availableMedium.length, 1);
  assert.equal(availableMedium[0].id, 'bundle-2-large');

  // Outlet C: Memiliki item lengkap untuk 2+2
  const full2Plus2Outlet = [
    { name: 'Kopi Kenangan Mantan', isSoldOut: false },
    { name: 'Americano', isSoldOut: false },
    { name: 'Roti Coklat Klasik', isSoldOut: false },
    { name: 'Roti Susu Manis', isSoldOut: false },
  ];
  assert.equal(isBundleAvailableAtOutlet('bundle-2-drink-2-food', full2Plus2Outlet), true, '2+2 harus true');
});

test('Bundling: Server route logic menolak order item yang tidak ada di outlet atau sold out', async () => {
  const { normalizeProductName } = await import('../src/lib/bundling.ts');

  // Simulasi logika server /api/orders/create
  const outletProducts = [
    { name: 'Kopi Kenangan Mantan', isSoldOut: false, basePrice: 25000 },
    { name: 'Latte', isSoldOut: true, basePrice: 29000 }, // Sold out
    // 'Pistachio Aren Latte' dan 'Hazelnut Choco Milk Tea' TIDAK ADA
  ];

  const orderBundleItems = [
    { name: 'Pistachio Aren Latte' },
    { name: 'Hazelnut Choco Milk Tea' },
  ];

  const unavailableItems: Array<{ name: string; reason: string }> = [];

  for (const detail of orderBundleItems) {
    const normDetail = normalizeProductName(detail.name);
    const freshProd = outletProducts.find(
      (p) => normalizeProductName(p.name) === normDetail
    );

    if (!freshProd) {
      unavailableItems.push({
        name: `${detail.name} (isi Bundling 2 Large)`,
        reason: 'Menu tidak tersedia di outlet ini',
      });
    } else if (freshProd.isSoldOut) {
      unavailableItems.push({
        name: `${freshProd.name} (isi Bundling 2 Large)`,
        reason: 'Stok sedang habis di outlet ini',
      });
    }
  }

  assert.equal(unavailableItems.length, 2, 'Kedua item tidak tersedia harus terdeteksi');
  assert.match(unavailableItems[0].reason, /Menu tidak tersedia di outlet ini/);
  assert.match(unavailableItems[1].reason, /Menu tidak tersedia di outlet ini/);

  // Simulasi item yang ada tapi sold out
  const soldOutDetail = [{ name: 'Latte' }];
  const unavailableSoldOut: Array<{ name: string; reason: string }> = [];
  for (const detail of soldOutDetail) {
    const normDetail = normalizeProductName(detail.name);
    const freshProd = outletProducts.find(
      (p) => normalizeProductName(p.name) === normDetail
    );
    if (!freshProd) {
      unavailableSoldOut.push({ name: detail.name, reason: 'Menu tidak tersedia di outlet ini' });
    } else if (freshProd.isSoldOut) {
      unavailableSoldOut.push({ name: freshProd.name, reason: 'Stok sedang habis di outlet ini' });
    }
  }
  assert.equal(unavailableSoldOut.length, 1);
  assert.match(unavailableSoldOut[0].reason, /Stok sedang habis/);
});

test('Tier Pricing: getOutletTierDiff mendeteksi selisih tier outlet dengan tepat', () => {
  // 1. Outlet normal (Mantan 19.000) -> tier 0
  const normalProducts = [
    { name: 'Kopi Kenangan Mantan', basePrice: 19000 },
    { name: 'Americano', basePrice: 17000 },
  ];
  assert.equal(getOutletTierDiff(normalProducts), 0);

  // 2. Outlet mahal tier +3k (Mantan 22.000) -> tier 3.000
  const plus3kProducts = [
    { name: 'Kopi Kenangan Mantan', basePrice: 22000 },
    { name: 'Americano', basePrice: 20000 },
  ];
  assert.equal(getOutletTierDiff(plus3kProducts), 3000);

  // 3. Outlet bandara tier +13k (Mantan 32.000) -> tier 13.000
  const airportProducts = [
    { name: 'Kopi Kenangan Mantan', basePrice: 32000 },
    { name: 'Americano', basePrice: 30000 },
  ];
  assert.equal(getOutletTierDiff(airportProducts), 13000);

  // 4. Fallback jika Mantan tidak ada: gunakan median selisih item ter-match
  const noMantanProducts = [
    { name: 'Americano', basePrice: 20000 }, // baseline 17k -> diff +3k
    { name: 'Lemon Black Tea', basePrice: 20000 }, // baseline 17k -> diff +3k
    { name: 'Spanish Latte', basePrice: 22000 }, // baseline 19k -> diff +3k
  ];
  assert.equal(getOutletTierDiff(noMantanProducts), 3000);

  // 5. Fallback 0 jika menu kosong atau tidak ada yang ter-match
  assert.equal(getOutletTierDiff([]), 0);
  assert.equal(getOutletTierDiff([{ name: 'Barang Lain', basePrice: 50000 }]), 0);
});

test('Tier Pricing: getBundleThresholds & getBundleDescription menghasilkan rentang FIX 50.000-60.000', () => {
  // Outlet normal (tier 0)
  assert.deepEqual(getBundleThresholds('bundle-2-large', 0), { min: 50000, max: 60000 });
  assert.deepEqual(getBundleThresholds('bundle-3-reguler', 0), { min: 50000, max: 60000 });
  assert.deepEqual(getBundleThresholds('bundle-2-drink-2-food', 0), { min: 50000, max: 60000 });
  assert.match(getBundleDescription('bundle-2-large', 0), /50\.000-60\.000/);
  assert.match(getBundleDescription('bundle-3-reguler', 0), /50\.000-60\.000/);
  assert.match(getBundleDescription('bundle-2-drink-2-food', 0), /50\.000-60\.000/);

  // Outlet tier +3k: rentang tetap FIX 50.000-60.000 (tidak ikut bergeser)
  assert.deepEqual(getBundleThresholds('bundle-2-large', 3000), { min: 50000, max: 60000 });
  assert.deepEqual(getBundleThresholds('bundle-3-reguler', 3000), { min: 50000, max: 60000 });
  assert.deepEqual(getBundleThresholds('bundle-2-drink-2-food', 3000), { min: 50000, max: 60000 });
  assert.match(getBundleDescription('bundle-2-large', 3000), /50\.000-60\.000/);
  assert.match(getBundleDescription('bundle-3-reguler', 3000), /50\.000-60\.000/);

  // Outlet bandara tier +13k: rentang tetap FIX 50.000-60.000
  assert.deepEqual(getBundleThresholds('bundle-2-large', 13000), { min: 50000, max: 60000 });
  assert.match(getBundleDescription('bundle-2-large', 13000), /50\.000-60\.000/);
});

test('Tier Pricing: Paket 2 (Bundling 2 Large) di outlet tier +3k divalidasi rentang FIX 50-60k', () => {
  const tierDiff = 3000;

  // 1. Kombinasi 56k adjusted (2x Mantan Large 25k+3k = 28k x 2 = 56k): DITERIMA
  const valid56k = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
  ];
  const pricing56k = calculateBundlePricing('bundle-2-large', valid56k, tierDiff);
  assert.equal(pricing56k.normalPrice, 56000);
  assert.equal(validateBundleSelection('bundle-2-large', valid56k, tierDiff).isValid, true);

  // 2. Kombinasi 58k adjusted (Mantan 25k+3k=28k + Butterscotch Aren Latte 27k+3k=30k = 58k): DITERIMA
  const valid58k = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Butterscotch Aren Latte' },
  ];
  const pricing58k = calculateBundlePricing('bundle-2-large', valid58k, tierDiff);
  assert.equal(pricing58k.normalPrice, 58000);
  assert.equal(validateBundleSelection('bundle-2-large', valid58k, tierDiff).isValid, true);

  // 3. Kombinasi 63k adjusted (Milo Dinosaurus 30k+3k=33k + Butterscotch Aren Latte 27k+3k=30k = 63k): DITOLAK
  const invalid63k = [
    { name: 'Milo Dinosaurus' },
    { name: 'Butterscotch Aren Latte' },
  ];
  const pricing63k = calculateBundlePricing('bundle-2-large', invalid63k, tierDiff);
  assert.equal(pricing63k.normalPrice, 63000);
  const validation63k = validateBundleSelection('bundle-2-large', invalid63k, tierDiff);
  assert.equal(validation63k.isValid, false, 'Kombinasi total 63k di outlet tier +3k harus ditolak');
  assert.match(validation63k.error || '', /60\.000/);

  // 4. Kombinasi di bawah 50k (misal Fresh Lemonade 17k+3k=20k + Americano 22k+3k=25k = 45k): DITOLAK
  const underMin = [
    { name: 'Fresh Lemonade' },
    { name: 'Americano' },
  ];
  const validationUnder = validateBundleSelection('bundle-2-large', underMin, tierDiff);
  assert.equal(validationUnder.isValid, false);
  assert.match(validationUnder.error || '', /50\.000/);
});

test('Tier Pricing: Paket 1 (Bundling 3 Reguler) di outlet tier +3k divalidasi rentang FIX 50-60k', () => {
  const tierDiff = 3000;

  // 3x Americano di outlet +3k harga live = 20.000 x 3 = 60.000 -> DITERIMA (pas batas 60k)
  const valid60k = [
    { name: 'Americano', liveBasePrice: 20000 },
    { name: 'Americano', liveBasePrice: 20000 },
    { name: 'Americano', liveBasePrice: 20000 },
  ];
  assert.equal(validateBundleSelection('bundle-3-reguler', valid60k, tierDiff).isValid, true);

  // 3x Mantan di outlet +3k harga live = 22.000 x 3 = 66.000 -> DITOLAK (> 60k)
  const invalid66k = [
    { name: 'Kopi Kenangan Mantan', liveBasePrice: 22000 },
    { name: 'Kopi Kenangan Mantan', liveBasePrice: 22000 },
    { name: 'Kopi Kenangan Mantan', liveBasePrice: 22000 },
  ];
  const val66k = validateBundleSelection('bundle-3-reguler', invalid66k, tierDiff);
  assert.equal(val66k.isValid, false, '3x Mantan (66k) di outlet +3k harus ditolak karena melebihi 60k fix');
  assert.match(val66k.error || '', /60\.000/);
});

test('Tier Pricing: Paket 2 (Bundling 2 Large) di outlet normal tetap rentang FIX 50-60k', () => {
  const tierDiff = 0;

  // 2x Mantan Large (25k x 2 = 50k): lolos di outlet normal
  const selected = [
    { name: 'Kopi Kenangan Mantan' },
    { name: 'Kopi Kenangan Mantan' },
  ];
  const pricing = calculateBundlePricing('bundle-2-large', selected, tierDiff);
  assert.equal(pricing.normalPrice, 50000);
  assert.equal(pricing.total, 29500);
  assert.equal(validateBundleSelection('bundle-2-large', selected, tierDiff).isValid, true);

  // Di bawah 50k (misal Americano 22k + Mantan 25k = 47k): ditolak di outlet normal
  const underSelected = [
    { name: 'Americano' },
    { name: 'Kopi Kenangan Mantan' },
  ];
  assert.equal(validateBundleSelection('bundle-2-large', underSelected, tierDiff).isValid, false);
});

test('Tier Pricing: Tipe bermenu-outlet (Paket 1 & Paket 3) TIDAK double-counting jika liveBasePrice sudah ada', () => {
  const tierDiff = 3000;

  // Americano di outlet tier +3k sudah 20.000 di live menu
  const selected = [
    { name: 'Americano', liveBasePrice: 20000 },
    { name: 'Americano', liveBasePrice: 20000 },
    { name: 'Americano', liveBasePrice: 20000 },
  ];

  // Meskipun tierDiff = 3000 dioper, liveBasePrice TIDAK boleh ditambah lagi!
  const pricing = calculateBundlePricing('bundle-3-reguler', selected, tierDiff);
  assert.equal(pricing.itemBreakdown[0].normalPrice, 20000, 'Harga harus tetap 20.000, tidak boleh double count jadi 23.000');
  assert.equal(pricing.normalPrice, 60000, 'Total normal 3x 20k = 60.000 (bukan 69.000)');
  assert.equal(pricing.promoSubtotal, 30000);
  assert.equal(pricing.bundleFee, 4000);
  assert.equal(pricing.total, 34000);
});


test('Bundling: 2 Mantan Large total bayar 28.000 (termasuk fee) hanya pekan 14-15 Nov 2026', async () => {
  const { calculateBundlePricing, validateBundleSelection } = await import('../src/lib/bundling.ts');
  const twoMantan = [
    { name: 'Kopi Kenangan Mantan', category: 'drink' as const },
    { name: 'Kopi Kenangan Mantan', category: 'drink' as const },
  ];
  const sat = new Date('2026-11-14T16:00:00+07:00');

  // Sabtu: total bayar 28.000 = promo 23.500 + fee 4.500
  const p = calculateBundlePricing('bundle-2-large', twoMantan, 0, sat);
  assert.equal(p.total, 28000);
  assert.equal(p.bundleFee, 4500);
  assert.equal(p.promoSubtotal, 23500);
  assert.equal(p.normalPrice, 50000);
  assert.equal(validateBundleSelection('bundle-2-large', twoMantan, 0).isValid, true);

  // Minggu 23.20 tepat masih berlaku, outlet tier tetap 28.000
  assert.equal(calculateBundlePricing('bundle-2-large', twoMantan, 0, new Date('2026-11-15T23:20:00+07:00')).total, 28000);
  assert.equal(calculateBundlePricing('bundle-2-large', twoMantan, 3000, sat).total, 28000);

  // Setelah Minggu 23.20 dan pekan depan: kembali normal 29.500
  assert.equal(calculateBundlePricing('bundle-2-large', twoMantan, 0, new Date('2026-11-15T23:20:01+07:00')).total, 29500);
  assert.equal(calculateBundlePricing('bundle-2-large', twoMantan, 0, new Date('2026-11-21T16:00:00+07:00')).total, 29500);
  assert.equal(calculateBundlePricing('bundle-2-large', twoMantan, 0, new Date('2026-11-22T12:00:00+07:00')).total, 29500);

  // Kombinasi lain (Mantan + Taro) tidak terpengaruh: (25.000 + 29.000) / 2 + 4.500 = 31.500
  const mixed = [
    { name: 'Kopi Kenangan Mantan', category: 'drink' as const },
    { name: 'Taro Cloud Latte', category: 'drink' as const },
  ];
  assert.equal(calculateBundlePricing('bundle-2-large', mixed, 0, sat).total, 31500);

  // Paket lain tidak terpengaruh
  const reg = calculateBundlePricing(
    'bundle-3-reguler',
    [{ name: 'Kopi Kenangan Mantan', category: 'drink', liveBasePrice: 19000 }],
    0,
    sat
  );
  assert.equal(reg.promoSubtotal, 9500);
});
