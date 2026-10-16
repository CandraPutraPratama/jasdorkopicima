import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase-server';

interface OutletLayoutProps {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  if (!code) {
    return {
      title: 'Outlet Kopi Kenangan',
    };
  }

  const cleanCode = decodeURIComponent(code).trim().toUpperCase();

  try {
    const supabase = getSupabaseServerClient();
    const { data: outlet } = await supabase
      .from('outlets')
      .select('name, address, is_in_scope')
      .eq('code', cleanCode)
      .maybeSingle();

    if (outlet && outlet.name) {
      const outletName = outlet.name.trim();
      const address = (outlet.address || '').trim();
      const description = `Pesan Kopi Kenangan di ${outletName}${
        address ? ` (${address})` : ''
      }. Jasa order promo hemat setengah harga (50%), biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.`;

      return {
        title: outletName,
        description,
        openGraph: {
          title: `${outletName} | Jasdor - Jasa Order Kopi Kenangan`,
          description,
          url: `https://jasdor.cimagroup.my.id/outlet/${encodeURIComponent(cleanCode)}`,
          images: [
            {
              url: '/og-image.png',
              width: 1200,
              height: 630,
              alt: `${outletName} - Jasdor Kopi Kenangan`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${outletName} | Jasdor - Jasa Order Kopi Kenangan`,
          description,
          images: ['/og-image.png'],
        },
      };
    }
  } catch {
    // Fallback bila database tidak merespons
  }

  return {
    title: `Outlet ${cleanCode}`,
    description: `Pesan Kopi Kenangan di outlet ${cleanCode}. Promo jasa order hemat setengah harga (50%) via Jasdor.`,
  };
}

export default function OutletLayout({ children }: OutletLayoutProps) {
  return children;
}
