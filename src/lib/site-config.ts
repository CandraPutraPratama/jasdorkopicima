import { BUSINESS_CONFIG } from '@/config/business';

/**
 * Konfigurasi terpusat untuk profil situs, kontak admin, jam operasional,
 * dan metode pembayaran website Jasdor.
 * Digunakan oleh halaman FAQ, Syarat & Ketentuan, Kebijakan Privasi, Kontak, Footer, dan Header.
 */

export const NOMOR_WHATSAPP_ADMIN: string =
  BUSINESS_CONFIG.whatsappNumber || '6287793420768';

export const NOMOR_WHATSAPP_ADMIN_FORMATTED: string = '+62 877-9342-0768';

export const JAM_LAYANAN: string = `${BUSINESS_CONFIG.operational.openTime} – ${BUSINESS_CONFIG.operational.closeTime} WIB`;

export const NAMA_BRAND: string = 'Jasdor Kopi Cima';

export const NAMA_BRAND_SHORT: string = 'Jasdor';

export const TAGLINE: string = 'Jastip Kopi Kenangan Promo Setengah Harga';

export const DISCLAIMER_RESMI: string =
  'Jasdor adalah layanan jasa titip independen • Bukan afiliasi resmi Kopi Kenangan.';

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
    keterangan: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja',
    badge: 'Instan & Bebas Biaya',
  },
  {
    id: 'transfer',
    nama: 'Transfer Bank',
    keterangan: 'BCA, Mandiri, BRI, BNI (konfirmasi bukti transfer manual)',
    badge: 'Bank Transfer',
  },
  {
    id: 'ewallet',
    nama: 'E-Wallet Langsung',
    keterangan: 'GoPay, OVO, DANA, ShopeePay',
    badge: 'Praktis',
  },
];

export function getAdminWhatsAppUrl(customMessage?: string): string {
  const defaultText = `Halo Admin ${NAMA_BRAND_SHORT}, saya ingin bertanya tentang layanan jastip Kopi Kenangan promo 50%.`;
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
  operationalDays: 'Setiap Hari (Senin – Minggu)',
  disclaimer: DISCLAIMER_RESMI,
  paymentMethods: METODE_PEMBAYARAN,
  navLinks: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
    { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    { label: 'Kontak', href: '/kontak' },
  ],
};
