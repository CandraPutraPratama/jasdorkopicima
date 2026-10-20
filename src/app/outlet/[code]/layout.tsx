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
      const isFore = cleanCode.startsWith('FORE-') || outletName.toLowerCase().includes('fore');
      const brandName = isFore ? 'Fore Coffee' : 'Kopi Kenangan';
      const description = `Pesan ${brandName} di ${outletName}${
        address ? ` (${address})` : ''
      }. Layanan jasa order hemat, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.`;

      return {
        title: outletName,
        description,
        openGraph: {
          title: `${outletName} | Jasdor - Jasa Order`,
          description,
          url: `https://jasdor.cimagroup.my.id/outlet/${encodeURIComponent(cleanCode)}`,
          images: [
            {
              url: '/og-image.png',
              width: 1200,
              height: 630,
              alt: `${outletName} - Jasdor`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${outletName} | Jasdor - Jasa Order`,
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
    description: `Pesan menu favorit di outlet ${cleanCode}. Promo jasa order hemat via Jasdor.`,
  };
}

export default function OutletLayout({ children }: OutletLayoutProps) {
  return children;
}
