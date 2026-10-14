import { BUSINESS_CONFIG } from '@/config/business';

/**
 * Konfigurasi terpusat untuk profil situs, kontak admin, jadwal operasional,
 * dan metode pembayaran website Jasdor.
 * Digunakan oleh halaman FAQ, Syarat & Ketentuan, Kebijakan Privasi, Kontak, Footer, dan Header.
 *
 * ATURAN BISNIS:
 * - Brand: Jasa Order (bukan jastip)
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

export function getAdminWhatsAppUrl(customMessage?: string): string {
  const defaultText = `Halo Admin ${NAMA_BRAND_SHORT}, saya ingin bertanya tentang layanan jasa order Kopi Kenangan promo 50%.`;
  const text = customMessage || defaultText;
  return `https://wa.me/${NOMOR_WHATSAPP_ADMIN}?text=${encodeURIComponent(text)}`;
}

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
  navLinks: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
    { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    { label: 'Kontak', href: '/kontak' },
  ],
};
