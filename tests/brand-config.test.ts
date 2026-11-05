import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandConfig,
  getAllBrands,
  isBrandOrderable,
  isReservedSlug,
  resolveBrandSlugFromOutletCode,
} from '../src/lib/site-config.ts';

test('getBrandConfig returns full config for kopi-kenangan', () => {
  const brand = getBrandConfig('kopi-kenangan');
  assert.ok(brand !== null, 'brand kopi-kenangan harus terdaftar');
  assert.equal(brand?.slug, 'kopi-kenangan');
  assert.equal(brand?.name, 'Kopi Kenangan');
  assert.equal(brand?.status, 'active');
  assert.equal(brand?.promoBadge, 'Hemat 50%');
  assert.equal(brand?.logo, '/brand-logos/kopi-kenangan.webp');
  assert.equal(brand?.outletCountLabel, undefined, 'Tidak ada angka outlet di-hardcode di BrandConfig');
  assert.ok(brand?.accentColor);
});

test('getBrandConfig returns full config for tomoro', () => {
  const brand = getBrandConfig('tomoro');
  assert.ok(brand !== null, 'brand tomoro harus terdaftar');
  assert.equal(brand?.slug, 'tomoro');
  assert.equal(brand?.name, 'TOMORO Coffee');
  // Tomoro aktif
  assert.equal(brand?.status, 'active');
  assert.equal(brand?.promoBadge, 'DISKON 50% + B1G1');
  assert.equal(brand?.logo, '/brand-logos/tomoro-logo-baru.svg');
  assert.equal(brand?.outletCountLabel, undefined, 'Tidak ada angka outlet di-hardcode di BrandConfig');
});

test('getBrandConfig returns null for unknown brand slug', () => {
  const brand = getBrandConfig('starbucks-unknown');
  assert.equal(brand, null);
});

test('getBrandConfig returns full config for fore', () => {
  const brand = getBrandConfig('fore');
  assert.ok(brand !== null, 'brand fore harus terdaftar');
  assert.equal(brand?.slug, 'fore');
  assert.equal(brand?.name, 'Fore Coffee');
  assert.equal(brand?.status, 'active');
  assert.equal(brand?.tagline, 'Setiap Fore Punya Cerita');
  assert.equal(brand?.promoBadge, 'DISKON 25% • FREE FEE');
  assert.equal(brand?.logo, '/brand-logos/logo-fore-baru.webp');
  assert.equal(brand?.outletCountLabel, undefined, 'Tidak ada angka outlet di-hardcode di BrandConfig');
  assert.ok(brand?.accentColor);
});

test('promoTitle per-brand: Fore 25%, lainnya default 50%', () => {
  const fore = getBrandConfig('fore');
  const kenangan = getBrandConfig('kopi-kenangan');
  const tomoro = getBrandConfig('tomoro');
  assert.ok(fore && kenangan && tomoro);
  assert.equal(fore?.promoTitle, 'Promo Diskon 25%', 'Judul /fore harus klaim diskon 25%');
  assert.equal(kenangan?.promoTitle, undefined, 'Kopi Kenangan pakai default 50%');
  assert.equal(tomoro?.promoTitle, undefined, 'Tomoro pakai default 50%');
  assert.equal(fore?.promoDescription, 'dengan diskon 25%', 'Deskripsi /fore harus klaim diskon 25%');
  assert.equal(kenangan?.promoDescription, undefined, 'Kopi Kenangan pakai default');
  assert.equal(tomoro?.promoDescription, undefined, 'Tomoro pakai default');
});

test('getAllBrands returns registered brands list including fore', () => {
  const brands = getAllBrands();
  assert.ok(Array.isArray(brands));
  assert.ok(brands.length >= 3);
  const slugs = brands.map((b) => b.slug);
  assert.ok(slugs.includes('kopi-kenangan'));
  assert.ok(slugs.includes('fore'));
  assert.ok(slugs.includes('tomoro'));
});

test('isBrandOrderable: brand dengan status active bisa diorder', () => {
  const kenangan = getBrandConfig('kopi-kenangan');
  const fore = getBrandConfig('fore');
  const tomoro = getBrandConfig('tomoro');
  assert.ok(kenangan && fore && tomoro);
  assert.equal(isBrandOrderable(kenangan), true);
  assert.equal(isBrandOrderable(fore), true, 'Fore aktif untuk order');
  assert.equal(isBrandOrderable(tomoro), true, 'TOMORO aktif untuk order');
  assert.equal(getAllBrands().filter(isBrandOrderable).length, 3, 'Badge portal harus menghitung 3 brand aktif');
});

test('isReservedSlug blocks protected system routes', () => {
  assert.equal(isReservedSlug('faq'), true);
  assert.equal(isReservedSlug('syarat-ketentuan'), true);
  assert.equal(isReservedSlug('kebijakan-privasi'), true);
  assert.equal(isReservedSlug('kontak'), true);
  assert.equal(isReservedSlug('outlet'), true);
  assert.equal(isReservedSlug('api'), true);
  assert.equal(isReservedSlug('kopi-kenangan'), false);
  assert.equal(isReservedSlug('fore'), false);
  assert.equal(isReservedSlug('tomoro'), false);
});

test('resolveBrandSlugFromOutletCode resolves to fore for fore-*, tomoro for tomoro-*, and kopi-kenangan by default', () => {
  assert.equal(resolveBrandSlugFromOutletCode('fore-t3inb'), 'fore');
  assert.equal(resolveBrandSlugFromOutletCode('fore-ahnas'), 'fore');
  assert.equal(resolveBrandSlugFromOutletCode('tomoro-plb03b-m'), 'tomoro');
  assert.equal(resolveBrandSlugFromOutletCode('LIPPO-PURI'), 'kopi-kenangan');
  assert.equal(resolveBrandSlugFromOutletCode('KALCIT'), 'kopi-kenangan');
});

test('Fore menu and airport pricing tier override verification', async () => {
  const { getForeMenuForOutlet } = await import('../src/lib/fore-menu-data.ts');

  // 1. Outlet bandara fore-t3inb menampilkan Aren Latte Rp33.000 (bukan Rp29.000)
  const airportMenu = getForeMenuForOutlet('fore-t3inb');
  const airportSignature = airportMenu.find((g) => g.code === 'fore-signature');
  assert.ok(airportSignature, 'Group fore-signature harus ada di menu bandara');
  const airportArenLatte = airportSignature.products.find((p) => p.name === 'Aren Latte');
  assert.ok(airportArenLatte, 'Aren Latte harus ada di menu bandara');
  assert.equal(airportArenLatte.basePrice, 33000, 'Harga Aren Latte di outlet bandara fore-t3inb harus Rp33.000');

  // 2. Outlet non-bandara fore-ahnas menampilkan Aren Latte harga nasional Rp29.000
  const nationalMenu = getForeMenuForOutlet('fore-ahnas');
  const nationalSignature = nationalMenu.find((g) => g.code === 'fore-signature');
  assert.ok(nationalSignature, 'Group fore-signature harus ada di menu nasional');
  const nationalArenLatte = nationalSignature.products.find((p) => p.name === 'Aren Latte');
  assert.ok(nationalArenLatte, 'Aren Latte harus ada di menu nasional');
  assert.equal(nationalArenLatte.basePrice, 29000, 'Harga Aren Latte di outlet nasional fore-ahnas harus Rp29.000');

  // 3. Total produk harus 74 item across 11 categories sesuai Excel
  const totalItems = nationalMenu.reduce((sum, g) => sum + g.products.length, 0);
  assert.equal(totalItems, 74, 'Total item menu Fore harus 74');
  assert.equal(nationalMenu.length, 11, 'Total kategori Fore harus 11 sesuai Excel');

  const expectedCategoryOrder = [
    'Favorit Choice',
    'Fore Signature',
    'Americano Series',
    'Coffee',
    'Non Coffee',
    'Fore Junior',
    'Refresher',
    'Tea',
    'Ice Blended',
    'FOREveryone 1L',
    'Fore Deli',
  ];
  assert.deepEqual(
    nationalMenu.map((g) => g.name),
    expectedCategoryOrder,
    'Urutan kategori menu Fore harus presisi sesuai permintaan'
  );

  // 4. Semua foto produk menggunakan URL R2 self-hosted cimagroup
  for (const group of nationalMenu) {
    for (const prod of group.products) {
      assert.ok(
        prod.image.startsWith('https://gambar.cimagroup.my.id/fore/fore-images-webp-v2/'),
        `Foto produk "${prod.name}" harus menggunakan URL self-hosted R2 cimagroup, got: ${prod.image}`
      );
      assert.equal(prod.isSoldOut, false, 'Semua produk Fore harus isSoldOut: false');
    }
  }
});

test('Kopi Kenangan hero displays Informasi Biaya Jasa box directly above KopiKenanganWifiBox', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const pageContent = fs.readFileSync(path.resolve('src/app/[brandSlug]/page.tsx'), 'utf-8');

  // Harus memuat judul dan isi persis seperti yang diminta user
  assert.ok(pageContent.includes('Informasi Biaya Jasa'));
  assert.ok(pageContent.includes('- Biaya Jasa jika order hanya 1 menu = 4.000/menu'));
  assert.ok(pageContent.includes('- Biaya Jasa jika order minimal 2 menu dst = 2.300/item'));

  // Posisi harus tepat DI ATAS KopiKenanganWifiBox
  const feeBoxIndex = pageContent.indexOf('Informasi Biaya Jasa');
  const wifiBoxIndex = pageContent.indexOf('<KopiKenanganWifiBox />');
  assert.ok(feeBoxIndex > 0, 'Info Biaya Jasa harus ada di file');
  assert.ok(wifiBoxIndex > 0, 'KopiKenanganWifiBox harus ada di file');
  assert.ok(feeBoxIndex < wifiBoxIndex, 'Info Biaya Jasa harus berada di atas KopiKenanganWifiBox');
});

