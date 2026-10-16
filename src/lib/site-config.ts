import { BUSINESS_CONFIG } from '../config/business.ts';

/**
 * Konfigurasi terpusat untuk profil situs, kontak admin, jadwal operasional,
 * dan metode pembayaran website Jasdor.
 * Digunakan oleh halaman FAQ, Syarat & Ketentuan, Kebijakan Privasi, Kontak, Footer, dan Header.
 *
 * ATURAN BISNIS:
 * - Brand: Jasa Order
 * - Hari Pasti Buka: Jumat, Sabtu, Minggu (08:00 – 23:20 WIB)
 * - Hari Tentatif: Selasa (konfirmasi admin via WhatsApp terlebih dahulu)
 * - Hari Libur: Senin, Rabu, Kamis
 * - Bank: Bank Jago dan Blu by BCA
 * - E-Wallet: GoPay, DANA, ShopeePay, SeaBank
 * - QRIS: Mendukung semua pembayaran
 */

export const NOMOR_WHATSAPP_ADMIN: string =
  BUSINESS_CONFIG.whatsappNumber || '6287793420768';

export const NOMOR_WHATSAPP_ADMIN_FORMATTED: string = '+62 877-9342-0768';

export const JAM_LAYANAN: string = `${BUSINESS_CONFIG.operational.openTime} – ${BUSINESS_CONFIG.operational.closeTime} WIB`;

export const HARI_LAYANAN_PASTI: string = 'Jumat, Sabtu, Minggu';

export const HARI_LAYANAN_TENTATIF: string = 'Selasa (tentatif)';

export const JADWAL_OPERASIONAL_LENGKAP: string =
  'Jumat–Minggu, 08:00–23:20 WIB • Selasa tentatif (hubungi admin dulu)';

export const JADWAL_OPERASIONAL_RINGKAS: string =
  'Jum–Min 08:00–23:20 • Sel tentatif';

export const NAMA_BRAND: string = 'Jasdor Kopi Cima';

export const NAMA_BRAND_SHORT: string = 'Jasdor';

export const TAGLINE: string = 'Jasa Order Kopi Kenangan Promo Setengah Harga';

export const DISCLAIMER_RESMI: string =
  'Jasdor adalah layanan jasa order independen • Bukan afiliasi resmi Kopi Kenangan.';

export interface MetodePembayaranItem {
  id: string;
  nama: string;
  keterangan: string;
  badge: string;
}

export const METODE_PEMBAYARAN: MetodePembayaranItem[] = [
  {
    id: 'qris',
    nama: 'QRIS (Semua Pembayaran)',
    keterangan: 'Scan instan via semua m-banking & e-wallet berstandar QRIS',
    badge: 'Instan & Bebas Biaya',
  },
  {
    id: 'transfer',
    nama: 'Transfer Bank Digital',
    keterangan: 'Bank Jago dan Blu by BCA',
    badge: 'Bank Transfer',
  },
  {
    id: 'ewallet',
    nama: 'E-Wallet Langsung',
    keterangan: 'GoPay, DANA, ShopeePay, dan SeaBank',
    badge: 'Praktis',
  },
];

export const DAFTAR_METODE_PEMBAYARAN_RINGKAS = [
  'QRIS',
  'Bank Jago',
  'Blu',
  'GoPay',
  'DANA',
  'ShopeePay',
  'SeaBank',
] as const;

export const RINGKASAN_METODE_PEMBAYARAN: string =
  DAFTAR_METODE_PEMBAYARAN_RINGKAS.join(' / ');

export const TEKS_INFO_PEMBAYARAN_CHECKOUT: string =
  'Pembayaran: QRIS langsung di website — scan QR, bayar sesuai nominal, lalu konfirmasi via WhatsApp.';

export const TEKS_PEMBAYARAN_LANGKAH_ORDER: string =
  'Bayar via QRIS langsung di website — scan QR, bayar sesuai nominal, lalu konfirmasi via WhatsApp.';

export function getAdminWhatsAppUrl(customMessage?: string): string {
  const defaultText = `Halo Admin ${NAMA_BRAND_SHORT}, saya ingin bertanya tentang layanan jasa order Kopi Kenangan promo 50%.`;
  const text = customMessage || defaultText;
  return `https://wa.me/${NOMOR_WHATSAPP_ADMIN}?text=${encodeURIComponent(text)}`;
}

// ==========================================
// KONFIGURASI PEMBAYARAN QRIS ON-SITE & ADMIN
// ==========================================

export const QRIS_CONFIG = {
  imagePath: '/payment/qris-cima-group.webp',
  merchantName: 'CIMATIX_ID',
  expiryDurationMinutes: 60,
} as const;

export const ADMIN_CONFIG = {
  cookieName: 'jasdor_admin_session',
} as const;

export const SITE_CONFIG = {
  brandName: NAMA_BRAND,
  brandShort: NAMA_BRAND_SHORT,
  tagline: TAGLINE,
  whatsappNumber: NOMOR_WHATSAPP_ADMIN,
  whatsappFormatted: NOMOR_WHATSAPP_ADMIN_FORMATTED,
  whatsappUrl: getAdminWhatsAppUrl(),
  operationalHours: JAM_LAYANAN,
  operationalSchedule: JADWAL_OPERASIONAL_LENGKAP,
  operationalScheduleShort: JADWAL_OPERASIONAL_RINGKAS,
  operationalDays: HARI_LAYANAN_PASTI,
  operationalTentativeDay: HARI_LAYANAN_TENTATIF,
  disclaimer: DISCLAIMER_RESMI,
  paymentMethods: METODE_PEMBAYARAN,
  paymentMethodsList: DAFTAR_METODE_PEMBAYARAN_RINGKAS,
  paymentMethodsSummary: RINGKASAN_METODE_PEMBAYARAN,
  paymentCheckoutNotice: TEKS_INFO_PEMBAYARAN_CHECKOUT,
  paymentStepNotice: TEKS_PEMBAYARAN_LANGKAH_ORDER,
  navLinks: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
    { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    { label: 'Kontak', href: '/kontak' },
  ],
};

// ==========================================
// ARSITEKTUR MULTI-BRAND (PORTAL CIMA GROUP)
// ==========================================

export interface BrandConfig {
  id?: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  promoBadge: string;
  description: string;
  accentColor: string;
  themeColor: string;
  bannerGradient: string;
  status: 'active' | 'coming_soon';
  logo?: string;
  outletCountLabel?: string;
  adminWhatsApp?: string;
  operatingHoursText?: string;
  feeConfig?: {
    singleItemFee: number;
    multiItemFee: number;
  };
}

export const RESERVED_SLUGS = [
  'faq',
  'syarat-ketentuan',
  'kebijakan-privasi',
  'kontak',
  'outlet',
  'api',
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as ReservedSlug);
}

export const BRANDS: Record<string, BrandConfig> = {
  'kopi-kenangan': {
    id: 'kopi-kenangan',
    slug: 'kopi-kenangan',
    name: 'Kopi Kenangan',
    shortName: 'Kopi Kenangan',
    tagline: 'Kopi Kenangan Favoritmu, Setengah Harga',
    promoBadge: 'Hemat 50%',
    description:
      'Diskon 50% menu dasar Kopi Kenangan. Biaya jasa order transparan Rp2.000/item (Rp4.000 untuk 1 item). Pesan praktis, checkout via WhatsApp!',
    accentColor: '#8B1E19',
    themeColor: '#A8201A',
    bannerGradient: 'from-[#8B1E19] to-[#450A0A]',
    status: 'active',
    logo: '/brand-logos/kopi-kenangan.webp',
    adminWhatsApp: NOMOR_WHATSAPP_ADMIN,
    operatingHoursText: JADWAL_OPERASIONAL_LENGKAP,
    feeConfig: {
      singleItemFee: BUSINESS_CONFIG.pricing.feeSingleItem,
      multiItemFee: BUSINESS_CONFIG.pricing.feeMultiItem,
    },
  },
  fore: {
    id: 'fore',
    slug: 'fore',
    name: 'Fore Coffee',
    shortName: 'Fore Coffee',
    tagline: 'Setiap Fore Punya Cerita',
    promoBadge: '',
    description:
      'Layanan jasa order Fore Coffee resmi. Pesan menu kopi, teh, dan Fore Deli favoritmu, checkout praktis via WhatsApp!',
    accentColor: '#00543C',
    themeColor: '#0E3E2C',
    bannerGradient: 'from-[#00543C] to-[#0A291E]',
    status: 'active',
    logo: '/brand-logos/logo-fore-baru.webp',
    adminWhatsApp: NOMOR_WHATSAPP_ADMIN,
    operatingHoursText: JADWAL_OPERASIONAL_LENGKAP,
    feeConfig: {
      singleItemFee: BUSINESS_CONFIG.pricing.feeSingleItem,
      multiItemFee: BUSINESS_CONFIG.pricing.feeMultiItem,
    },
  },
  tomoro: {
    id: 'tomoro',
    slug: 'tomoro',
    name: 'Tomoro Coffee',
    shortName: 'Tomoro',
    tagline: 'Tomoro Coffee Pilihanmu, Segera Hadir',
    promoBadge: 'Segera Hadir',
    description:
      'Layanan jasa order Tomoro Coffee dengan promo hemat segera hadir untuk area Jabodetabek. Nikmati kemudahan pesan tanpa antre.',
    accentColor: '#E11D48',
    themeColor: '#BE123C',
    bannerGradient: 'from-[#4B5563] to-[#1F2937]',
    status: 'coming_soon',
    // Catatan koreksi pengguna: Hapus teks "0 outlet" pada brand Segera Hadir
    outletCountLabel: undefined,
    adminWhatsApp: NOMOR_WHATSAPP_ADMIN,
    operatingHoursText: JADWAL_OPERASIONAL_LENGKAP,
    feeConfig: {
      singleItemFee: BUSINESS_CONFIG.pricing.feeSingleItem,
      multiItemFee: BUSINESS_CONFIG.pricing.feeMultiItem,
    },
  },
};

export function getBrandConfig(slug: string): BrandConfig | null {
  if (isReservedSlug(slug)) return null;
  return BRANDS[slug] || null;
}

export function getAllBrands(): BrandConfig[] {
  return Object.values(BRANDS);
}

/**
 * Memetakan kode outlet ke brandSlug yang sesuai.
 * Outlet dengan prefix 'fore-' memetakan ke 'fore'.
 * Outlet Kopi Kenangan memetakan ke 'kopi-kenangan'.
 */
export function resolveBrandSlugFromOutletCode(outletCode: string): string {
  if (outletCode && outletCode.trim().toLowerCase().startsWith('fore-')) {
    return 'fore';
  }
  return 'kopi-kenangan';
}

