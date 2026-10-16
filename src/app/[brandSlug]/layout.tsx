import type { Metadata } from 'next';
import { getBrandConfig, isReservedSlug } from '@/lib/site-config';

interface BrandLayoutProps {
  params: Promise<{ brandSlug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: BrandLayoutProps): Promise<Metadata> {
  const { brandSlug } = await params;
  if (isReservedSlug(brandSlug)) return {};
  const brand = getBrandConfig(brandSlug);
  if (!brand) return {};

  if (brand.status === 'coming_soon') {
    return {
      title: {
        absolute: `${brand.name} (Segera Hadir) | Cima Group`,
      },
      description: `Layanan jasa order hemat untuk ${brand.name} sedang kami persiapkan di Cima Group.`,
      openGraph: {
        title: `${brand.name} - Segera Hadir di Cima Group`,
        description: `Layanan jasa order hemat untuk ${brand.name} sedang kami persiapkan.`,
      },
    };
  }

  return {
    title: {
      absolute: `Jasa Order ${brand.name} Promo Diskon 50% | Cima Group`,
    },
    description: `Pesan ${brand.name} hemat setengah harga via WhatsApp. ${brand.tagline || ''}`,
    openGraph: {
      title: `Jasa Order ${brand.name} Promo Diskon 50% | Cima Group`,
      description: `Pesan ${brand.name} hemat setengah harga via WhatsApp.`,
    },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
