import type { Metadata, Viewport } from 'next';
import { Baloo_2, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const baloo2 = Baloo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-baloo',
  weight: ['500', '600', '700', '800'],
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
    default: 'Jasdor Kopi Cima - Jasa Order Kopi Kenangan, Fore & Tomoro Promo Hemat',
    template: '%s | Jasdor Kopi Cima',
  },
  description:
    'Jasdor Kopi Cima adalah layanan jasa order minuman dan kopi favorit (Kopi Kenangan, Fore Coffee, Tomoro Coffee) dengan promo hemat. Pesan mudah dari HP, biaya jasa hemat mulai Rp2.000/item, checkout otomatis via WhatsApp.',
  keywords: [
    'Jasdor Kopi Cima',
    'Jasdor Cima',
    'Jasdor',
    'Jasa Order Kopi Cima',
    'Jasa Order Minuman',
    'Promo Kopi Kenangan',
    'Promo Fore Coffee',
    'Promo Tomoro Coffee',
    'Cima Group',
  ],
  applicationName: 'Jasdor Kopi Cima',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jasdor Kopi Cima',
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
    title: 'Jasdor Kopi Cima - Jasa Order Kopi Kenangan, Fore & Tomoro Promo Hemat',
    description:
      'Layanan jasa order minuman dan kopi brand favorit (Kopi Kenangan, Fore Coffee, Tomoro Coffee) dengan promo hemat. Pesan mudah dari HP, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.',
    url: 'https://jasdor.cimagroup.my.id',
    siteName: 'Jasdor Kopi Cima',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jasdor Kopi Cima - Jasa Order Minuman & Kopi Favorit Promo Hemat',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jasdor Kopi Cima - Jasa Order Kopi Kenangan, Fore & Tomoro Promo Hemat',
    description:
      'Layanan jasa order minuman dan kopi brand favorit (Kopi Kenangan, Fore Coffee, Tomoro Coffee) dengan promo hemat. Pesan mudah dari HP, biaya jasa mulai Rp2.000/item, checkout otomatis via WhatsApp.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://jasdor.cimagroup.my.id/#website',
      url: 'https://jasdor.cimagroup.my.id',
      name: 'Jasdor Kopi Cima',
      alternateName: ['Jasdor Cima', 'Cima Group Jasdor'],
      description:
        'Layanan jasa order kopi dan minuman brand favorit (Kopi Kenangan, Fore Coffee, Tomoro Coffee) dengan promo hemat.',
      inLanguage: 'id-ID',
    },
    {
      '@type': 'Organization',
      '@id': 'https://jasdor.cimagroup.my.id/#organization',
      name: 'Jasdor Kopi Cima',
      url: 'https://jasdor.cimagroup.my.id',
      logo: 'https://jasdor.cimagroup.my.id/icons/icon-512x512.png',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cfAnalyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

  return (
    <html lang="id" className={`${baloo2.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#2B1D12" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#F3ECE0] text-[#2B1D12] font-sans antialiased selection:bg-amber-300 selection:text-amber-950">
        <div className="min-h-screen max-w-md mx-auto bg-[#FAF4E8] shadow-[0_0_40px_rgba(43,29,18,0.1)] flex flex-col relative overflow-x-clip border-x-2 border-[#2B1D12]">
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
