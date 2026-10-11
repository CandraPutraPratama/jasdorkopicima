import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'jasdorkopicima - Jastip Kopi Kenangan Diskon 50%',
  description:
    'Layanan jastip resmi jasdorkopicima untuk Kopi Kenangan dengan diskon 50% harga dasar menu dan fee hemat mulai Rp2.000.',
  icons: {
    icon: '/brand/logo-cima.webp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          {children}
        </div>
      </body>
    </html>
  );
}
