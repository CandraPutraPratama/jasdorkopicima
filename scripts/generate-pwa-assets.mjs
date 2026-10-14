import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const ICONS_DIR = path.resolve(PUBLIC_DIR, 'icons');
const SOURCE_LOGO = path.resolve(PUBLIC_DIR, 'brand/logo-cima.webp');

async function main() {
  console.log('=== MEMBUAT ASET PWA & OG IMAGE (TAHAP 9) ===\n');

  await fs.mkdir(ICONS_DIR, { recursive: true });

  // 1. Icon 192x192 (any)
  console.log('1. Membuat icon-192x192.png...');
  await sharp(SOURCE_LOGO)
    .resize(192, 192, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .png()
    .toFile(path.resolve(ICONS_DIR, 'icon-192x192.png'));

  // 2. Icon 512x512 (any)
  console.log('2. Membuat icon-512x512.png...');
  await sharp(SOURCE_LOGO)
    .resize(512, 512, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .png()
    .toFile(path.resolve(ICONS_DIR, 'icon-512x512.png'));

  // 3. Apple Touch Icon 180x180
  console.log('3. Membuat apple-touch-icon.png (180x180)...');
  await sharp(SOURCE_LOGO)
    .resize(180, 180, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .png()
    .toFile(path.resolve(ICONS_DIR, 'apple-touch-icon.png'));

  // 4. Maskable Icons (dengan safe-zone padding 15% agar logo tidak terpotong saat dipotong bulat/squircle)
  console.log('4. Membuat maskable icons (192x192 dan 512x512)...');
  const logo192Inner = await sharp(SOURCE_LOGO)
    .resize(150, 150, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 17, g: 17, b: 17, alpha: 1 },
    },
  })
    .composite([{ input: logo192Inner, gravity: 'center' }])
    .png()
    .toFile(path.resolve(ICONS_DIR, 'icon-maskable-192x192.png'));

  const logo512Inner = await sharp(SOURCE_LOGO)
    .resize(400, 400, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 17, g: 17, b: 17, alpha: 1 },
    },
  })
    .composite([{ input: logo512Inner, gravity: 'center' }])
    .png()
    .toFile(path.resolve(ICONS_DIR, 'icon-maskable-512x512.png'));

  // 5. Open Graph Image (1200x630)
  console.log('5. Membuat og-image.png (1200x630)...');
  // Resize logo brand untuk diletakkan di sisi kanan
  const logoForOg = await sharp(SOURCE_LOGO)
    .resize(280, 280, { fit: 'contain' })
    .toBuffer();

  // SVG overlay teks beresolusi tinggi dengan tipografi jelas & palet brand (#111111, #D4AF37, amber-400, putih)
  const svgOverlay = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141414" />
          <stop offset="60%" stop-color="#1a1815" />
          <stop offset="100%" stop-color="#2a2216" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="50%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#FDE68A" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGrad)" />

      <!-- Border frame aksen halus -->
      <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-opacity="0.3" />

      <!-- Tag Badge -->
      <rect x="80" y="80" width="310" height="42" rx="21" fill="#292524" stroke="#D4AF37" stroke-width="1" />
      <text x="100" y="107" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#D4AF37" letter-spacing="1.5">JASA ORDER KOPI KENANGAN</text>

      <!-- Nama Brand Utama -->
      <text x="80" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
        Jasdor <tspan fill="url(#goldGrad)">Kopi Cima</tspan>
      </text>

      <!-- Tagline Besar -->
      <text x="80" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#FBBF24" letter-spacing="-0.5">
        Semua Menu Kopi Kenangan
      </text>
      <text x="80" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">
        Setengah Harga (Diskon 50%)
      </text>

      <!-- Keterangan Layanan -->
      <text x="80" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#D6D3D1">
        • Pesan mudah langsung dari web browser HP
      </text>
      <text x="80" y="458" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#D6D3D1">
        • Biaya jasa hemat mulai Rp2.000 / item
      </text>
      <text x="80" y="496" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#D6D3D1">
        • Checkout dan konfirmasi otomatis via WhatsApp
      </text>

      <!-- Footer Domain URL -->
      <rect x="80" y="535" width="280" height="36" rx="8" fill="#FBBF24" />
      <text x="100" y="559" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#111111" letter-spacing="0.5">
        jasdor.cimagroup.my.id
      </text>
    </svg>
  `);

  await sharp(svgOverlay)
    .composite([
      {
        input: logoForOg,
        top: 175,
        left: 830,
      },
    ])
    .png()
    .toFile(path.resolve(PUBLIC_DIR, 'og-image.png'));

  console.log('\n✅ Seluruh aset berhasil dibuat:');
  console.log(' - public/icons/icon-192x192.png');
  console.log(' - public/icons/icon-512x512.png');
  console.log(' - public/icons/icon-maskable-192x192.png');
  console.log(' - public/icons/icon-maskable-512x512.png');
  console.log(' - public/icons/apple-touch-icon.png');
  console.log(' - public/og-image.png');
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
