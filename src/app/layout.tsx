import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://jasdor.cimagroup.my.id'),
  title: 'jasdorkopicima - Jastip Kopi Kenangan',
  description:
    'Layanan jasa titip independen jasdorkopicima untuk Kopi Kenangan. Harga promo 50% dari harga menu. Upsize Large +Rp5.000, Juwara Beans +Rp3.000, Oatside +Rp3.000, Syrup dan Topping +Rp6.000, dan biaya jasa Rp2.000 per item (Rp4.000 untuk 1 item).',
  icons: {
    icon: '/brand/logo-cima.webp',
    shortcut: '/brand/logo-cima.webp',
    apple: '/brand/logo-cima.webp',
  },
  openGraph: {
    title: 'jasdorkopicima - Jastip Kopi Kenangan Promo 50%',
    description:
      'Pesan Kopi Kenangan hemat promo 50%. Biaya jasa mulai Rp2.000/item. Cek menu dan kirim pesanan otomatis via WhatsApp!',
    url: 'https://jasdor.cimagroup.my.id',
    siteName: 'jasdorkopicima',
    images: [
      {
        url: '/brand/logo-cima.webp',
        width: 512,
        height: 512,
        alt: 'Logo Resmi Jasdor Kopi Cima',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'jasdorkopicima - Jastip Kopi Kenangan Promo 50%',
    description:
      'Pesan Kopi Kenangan hemat promo 50%. Biaya jasa mulai Rp2.000/item. Cek menu dan kirim pesanan otomatis via WhatsApp!',
    images: ['/brand/logo-cima.webp'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-stone-100 text-stone-800 antialiased selection:bg-amber-400 selection:text-black">
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-2xl flex flex-col relative overflow-x-hidden">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="mt-auto py-4 px-4 text-center border-t border-stone-200/70 bg-stone-50">
            <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
              Layanan jasa titip independen, bukan afiliasi resmi Kopi Kenangan.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
