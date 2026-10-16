import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getOrderById, OrderNotFoundError } from '@/lib/order-service';
import { PaymentView } from '@/components/PaymentView';
import { SITE_CONFIG } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Pembayaran Pesanan #${orderId} — ${SITE_CONFIG.brandShort}`,
    description: `Halaman pembayaran QRIS resmi jasa order ${SITE_CONFIG.brandName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BayarPage({ params }: PageProps) {
  const { orderId } = await params;

  if (!orderId) {
    notFound();
  }

  let order;
  try {
    order = await getOrderById(orderId);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number };
    if (err instanceof OrderNotFoundError || errorWithStatus?.statusCode === 404) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-4 text-center">
        <div className="max-w-sm bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-sm space-y-3">
          <h2 className="font-display font-bold text-base text-[#26150B]">Gagal Memuat Pesanan</h2>
          <p className="text-xs text-[#735F52] leading-relaxed">
            Terjadi kendala saat membaca data pesanan dari database. Silakan muat ulang halaman atau hubungi admin.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-2.5 px-4 bg-[#26150B] text-[#FBBF24] font-bold text-xs rounded-xl shadow-xs"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return <PaymentView initialOrder={order} />;
}
