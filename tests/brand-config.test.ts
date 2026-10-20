import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandConfig,
  getAllBrands,
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

test('getBrandConfig returns coming_soon status for tomoro', () => {
  const brand = getBrandConfig('tomoro');
  assert.ok(brand !== null, 'brand tomoro harus terdaftar');
  assert.equal(brand?.slug, 'tomoro');
  assert.equal(brand?.name, 'Tomoro Coffee');
  assert.equal(brand?.status, 'coming_soon');
  assert.equal(brand?.promoBadge, 'Segera Hadir');
  assert.equal(brand?.logo, '/brand-logos/tomoro-coffee-logo.webp');
  // Aturan koreksi user: jangan tampilkan teks "0 outlet" untuk brand segera hadir
  assert.equal(brand?.outletCountLabel, undefined);
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
  assert.equal(brand?.promoBadge, '', 'Badge promo Fore dikosongkan');
  assert.equal(brand?.logo, '/brand-logos/logo-fore-baru.webp');
  assert.equal(brand?.outletCountLabel, undefined, 'Tidak ada angka outlet di-hardcode di BrandConfig');
  assert.ok(brand?.accentColor);
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

test('resolveBrandSlugFromOutletCode resolves to fore for fore-* outlets and kopi-kenangan by default', () => {
  assert.equal(resolveBrandSlugFromOutletCode('fore-t3inb'), 'fore');
  assert.equal(resolveBrandSlugFromOutletCode('fore-ahnas'), 'fore');
  assert.equal(resolveBrandSlugFromOutletCode('LIPPO-PURI'), 'kopi-kenangan');
  assert.equal(resolveBrandSlugFromOutletCode('KALCIT'), 'kopi-kenangan');
});

test('Fore menu and airport pricing tier override verification', async () => {
  const { getForeMenuForOutlet } = await import('../src/lib/fore-menu-data.ts');

  // 1. Outlet bandara fore-t3inb menampilkan Aren Latte Rp33.000 (bukan Rp29.000)
  const airportMenu = getForeMenuForOutlet('fore-t3inb');
  const airportCoffee = airportMenu.find((g) => g.code === 'coffee');
  assert.ok(airportCoffee, 'Group coffee harus ada di menu bandara');
  const airportArenLatte = airportCoffee.products.find((p) => p.name === 'Aren Latte');
  assert.ok(airportArenLatte, 'Aren Latte harus ada di menu bandara');
  assert.equal(airportArenLatte.basePrice, 33000, 'Harga Aren Latte di outlet bandara fore-t3inb harus Rp33.000');

  // 2. Outlet non-bandara fore-ahnas menampilkan Aren Latte harga nasional Rp29.000
  const nationalMenu = getForeMenuForOutlet('fore-ahnas');
  const nationalCoffee = nationalMenu.find((g) => g.code === 'coffee');
  assert.ok(nationalCoffee, 'Group coffee harus ada di menu nasional');
  const nationalArenLatte = nationalCoffee.products.find((p) => p.name === 'Aren Latte');
  assert.ok(nationalArenLatte, 'Aren Latte harus ada di menu nasional');
  assert.equal(nationalArenLatte.basePrice, 29000, 'Harga Aren Latte di outlet nasional fore-ahnas harus Rp29.000');

  // 3. Total produk harus 74 item across 6 categories
  const totalItems = nationalMenu.reduce((sum, g) => sum + g.products.length, 0);
  assert.equal(totalItems, 74, 'Total item menu Fore harus 74');
  assert.equal(nationalMenu.length, 6, 'Total kategori Fore harus 6');

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
  assert.ok(pageContent.includes('- Biaya Jasa jika order minimal 2 menu dst = 2.000/item'));

  // Posisi harus tepat DI ATAS KopiKenanganWifiBox
  const feeBoxIndex = pageContent.indexOf('Informasi Biaya Jasa');
  const wifiBoxIndex = pageContent.indexOf('<KopiKenanganWifiBox />');
  assert.ok(feeBoxIndex > 0, 'Info Biaya Jasa harus ada di file');
  assert.ok(wifiBoxIndex > 0, 'KopiKenanganWifiBox harus ada di file');
  assert.ok(feeBoxIndex < wifiBoxIndex, 'Info Biaya Jasa harus berada di atas KopiKenanganWifiBox');
});

