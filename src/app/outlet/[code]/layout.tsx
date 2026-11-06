import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { safeNormalizeOutletCode } from '@/lib/sanitizer';

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

  const cleanCode = safeNormalizeOutletCode(code);

  try {
    const supabase = getSupabaseServerClient();
    let { data: outlet } = await supabase
      .from('outlets')
      .select('name, address, is_in_scope')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (!outlet && cleanCode.toLowerCase().startsWith('fore-')) {
      const sub = cleanCode.slice(5);
      const withSpaces = `fore-${sub.replace(/-/g, ' ')}`;
      const withHyphens = `fore-${sub.replace(/\s+/g, '-')}`;

      if (withSpaces !== cleanCode) {
        const res = await supabase
          .from('outlets')
          .select('name, address, is_in_scope')
          .ilike('code', withSpaces)
          .maybeSingle();
        if (res.data) outlet = res.data;
      }

      if (!outlet && withHyphens !== cleanCode) {
        const res = await supabase
          .from('outlets')
          .select('name, address, is_in_scope')
          .ilike('code', withHyphens)
          .maybeSingle();
        if (res.data) outlet = res.data;
      }
    }

    if (outlet && outlet.name) {
      const outletName = outlet.name.trim();
      const address = (outlet.address || '').trim();
      const isFore = cleanCode.toLowerCase().startsWith('fore-') || outletName.toLowerCase().includes('fore');
      const isTomoro = cleanCode.toLowerCase().startsWith('tomoro-') || outletName.toLowerCase().includes('tomoro');
      const brandName = isFore ? 'Fore Coffee' : isTomoro ? 'TOMORO Coffee' : 'Kopi Kenangan';
      const description = `Pesan ${brandName} di ${outletName}${
        address ? ` (${address})` : ''
      }. Layanan jasa order hemat, biaya jasa mulai Rp2.300/item, checkout otomatis via WhatsApp.`;

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
