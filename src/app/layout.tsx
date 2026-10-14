import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['500', '600', '700', '800', '900'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
});

import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://jasdor.cimagroup.my.id'),
  title: {
    default: 'Jasdor — Jasa Order Kopi Kenangan Promo Setengah Harga',
    template: '%s | Jasdor — Jasa Order Kopi Kenangan',
  },
  description:
    'Jasa order Kopi Kenangan hemat promo setengah harga (diskon 50%). Pesan mudah langsung dari HP, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.',
  applicationName: 'Jasdor',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jasdor',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Jasdor — Jasa Order Kopi Kenangan Promo Setengah Harga',
    description:
      'Jasa order Kopi Kenangan hemat promo setengah harga (diskon 50%). Pesan mudah langsung dari HP, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.',
    url: 'https://jasdor.cimagroup.my.id',
    siteName: 'Jasdor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jasdor — Jasa Order Kopi Kenangan Promo Setengah Harga',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jasdor — Jasa Order Kopi Kenangan Promo Setengah Harga',
    description:
      'Jasa order Kopi Kenangan hemat promo setengah harga (diskon 50%). Pesan mudah langsung dari HP, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.',
    images: ['/og-image.png'],
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
  const cfAnalyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

  return (
    <html lang="id" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#26150B" />
      </head>
      <body className="bg-[#F5EFEB] text-[#26150B] font-sans antialiased selection:bg-amber-300 selection:text-amber-950">
        <div className="min-h-screen max-w-md mx-auto bg-[#FBF8F4] shadow-2xl flex flex-col relative overflow-x-clip border-x border-[#EDE3D6]/70">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </div>

        {/* Minimal PWA Service Worker Registration (Installability Only) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />

        {/* Cloudflare Web Analytics (HANYA bila token terisi di env) */}
        {cfAnalyticsToken ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfAnalyticsToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
