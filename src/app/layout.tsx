import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'jasdorkopicima - Jastip Kopi Kenangan',
  description:
    'Layanan jasa titip independen jasdorkopicima untuk Kopi Kenangan. Diskon 50% dari harga dasar menu. Tambahan varian, topping, dan biaya jasa dibayar normal.',
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
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="mt-auto py-4 px-4 text-center border-t border-stone-200/70 bg-stone-50">
            <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
              Layanan jasa titip independen, bukan afiliasi resmi Kopi Kenangan.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
