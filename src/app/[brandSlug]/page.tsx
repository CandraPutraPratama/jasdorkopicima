'use client';

import { use, useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { useBrandStatus } from '@/hooks/useBrandStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { OutletSearchCard } from '@/components/OutletSearchCard';
import { OutletCardSkeleton } from '@/components/Skeleton';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { ActiveOrderBanner } from '@/components/ActiveOrderBanner';
import { QueueInfoBar } from '@/components/QueueInfoBar';
import {
  isBundlingPromoActive,
  getBundlingRemainingTime,
  shouldShowBundlingCountdown,
} from '@/lib/bundling';
import { useBundlingOnlyMode } from '@/hooks/useBundlingOnlyMode';
import { filterOutletSearchInput } from '@/lib/sanitizer';
import {
  getBrandConfig,
  isReservedSlug,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';
import { getBrandOutletProvider } from '@/lib/brand-provider';
import type { Outlet } from '@/types/domain';

// Offload SSR: KopiKenanganWifiBox mengambil password dari /api/wifi-today via client
const KopiKenanganWifiBox = dynamic(
  () => import('@/components/KopiKenanganWifiBox').then((m) => m.KopiKenanganWifiBox),
  { ssr: false }
);

interface BrandPageProps {
  params: Promise<{ brandSlug: string }>;
}

export default function BrandPage({ params }: BrandPageProps) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brandSlug;

  // 1. Blokir reserved slug dan brand tidak terdaftar (404)
  if (isReservedSlug(brandSlug)) {
    notFound();
  }

  const brand = getBrandConfig(brandSlug);
  if (!brand) {
    notFound();
  }

  // Set tab title spesifik brand
  useEffect(() => {
    if (brand) {
      document.title =
        brand.status === 'coming_soon'
          ? `${brand.name} (Segera Hadir) | Cima Group`
          : brand.promoBadge
            ? `Jasa Order ${brand.name} ${brand.promoBadge} | Cima Group`
            : `Jasa Order ${brand.name} | Cima Group`;
    }
  }, [brand]);

  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();
  const { isBrandActive, isLoading: isBrandStatusLoading } = useBrandStatus();
  const isBundlingOnly = useBundlingOnlyMode();

  // State pencarian outlet untuk brand aktif
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [featuredOutlets, setFeaturedOutlets] = useState<Outlet[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [outletCount, setOutletCount] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Countdown promo bundling terbatas
  const [countdown, setCountdown] = useState(() => getBundlingRemainingTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getBundlingRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load default featured outlets dan total outlet count via BrandOutletProvider
  useEffect(() => {
    if (brand.status !== 'active') return;

    let isCancelled = false;
    const provider = getBrandOutletProvider(brand.slug);
    if (!provider) {
      setIsLoadingFeatured(false);
      return;
    }

    // Ambil outlet count dinamis
    provider
      .getOutletCount()
      .then((count) => {
        if (!isCancelled && typeof count === 'number' && count > 0) {
          setOutletCount(count);
        }
      })
      .catch((err) => {
        console.warn(`[BrandPage] Gagal memuat outlet count ${brand.slug}:`, err);
      });

    // Ambil featured outlets
    provider
      .listFeaturedOutlets()
      .then((items) => {
        if (!isCancelled) {
          setFeaturedOutlets(items);
          setIsLoadingFeatured(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoadingFeatured(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [brand.slug, brand.status]);

  // Debounce query
  useEffect(() => {
    if (brand.status !== 'active') return;

    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(query.trim());
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [query, brand.status]);

  // Fetch search query via BrandOutletProvider
  useEffect(() => {
    if (brand.status !== 'active') return;

    if (!debouncedQuery) {
      setOutlets([]);
      setIsLoadingOutlets(false);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingOutlets(true);
    setSearchError(null);
    setHasSearched(true);

    const provider = getBrandOutletProvider(brand.slug);
    if (!provider) {
      setIsLoadingOutlets(false);
      return;
    }

    provider
      .searchOutlets(debouncedQuery)
      .then((items) => {
        if (!isCancelled) {
          setOutlets(items);
          setIsLoadingOutlets(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setSearchError(err instanceof Error ? err.message : 'Terjadi kendala saat mencari outlet');
          setOutlets([]);
          setIsLoadingOutlets(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, brand.slug, brand.status]);

  // Handle Jasdor Closed Gate
  if (!isStatusLoading && !isOpen && status) {
    return (
      <ClosedScreen
        currentWibTime={status?.currentWibTime}
        openTime={status?.openTime}
        closeTime={status?.closeTime}
        dayName={status?.dayName}
        message={status?.message}
        isBreak={status?.isBreak}
        onRefresh={refetch}
      />
    );
  }

  // Handle Brand Sedang Dimatikan / Stok Habis oleh Admin
  if (!isBrandStatusLoading && !isBrandActive(brandSlug)) {
    return (
      <div className="min-h-screen bg-[#FAF4E8] flex flex-col selection:bg-amber-300 selection:text-[#2B1D12]">
        <Header
          showBack={true}
          backHref="/"
          backLabel="Kembali ke Portal"
          title={brand.name}
          showChatAdmin={true}
        />

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <div className="w-full bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_#2B1D12] space-y-4">
            {/* Visual Emblem Brand */}
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-[3px_3px_0px_#2B1D12] border-2 border-[#2B1D12] grayscale-[30%]"
              style={{
                background: brand.accentColor || '#6B7280',
                color: '#FFFFFF',
              }}
            >
              {brand.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 border-2 border-rose-300 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#2B1D12]">
                Stok Habis / Tutup Sementara
              </span>
              <h1 className="font-display font-black text-xl sm:text-2xl text-[#2B1D12] pt-1">
                {brand.name}
              </h1>
              <p className="text-xs text-[#7A6658] font-bold">
                Pemesanan {brand.name} Sedang Ditutup
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#4A3628] leading-relaxed max-w-xs mx-auto font-medium">
              Maaf, kuota atau stok promo untuk {brand.name} sedang habis saat ini. Silakan cek brand lain yang masih buka di portal!
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link prefetch={false}
                href="/"
                className="w-full py-3 px-4 bg-[#2B1D12] hover:bg-[#3D2313] text-[#FAF4E8] text-xs sm:text-sm font-display font-black rounded-xl transition border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Kembali ke Portal
              </Link>
              <a
                href={getAdminWhatsAppUrl(`Halo Admin Jasdor, stok promo untuk ${brand.name} kapan ready lagi ya?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-bold rounded-xl transition border-2 border-emerald-300 flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4 fill-emerald-800" />
                <span>Tanya Admin via WhatsApp</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TAMPILAN 1: Brand Pilot "Segera Hadir" (misal Tomoro Coffee)
  if (brand.status === 'coming_soon') {
    return (
      <div className="min-h-screen bg-[#FAF4E8] flex flex-col selection:bg-amber-300 selection:text-[#2B1D12]">
        <Header
          showBack={true}
          backHref="/"
          backLabel="Kembali ke Portal"
          title={brand.name}
          showChatAdmin={true}
        />

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <div className="w-full bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_#2B1D12] space-y-4">
            {/* Visual Emblem Brand */}
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-[3px_3px_0px_#2B1D12] border-2 border-[#2B1D12]"
              style={{
                background: brand.accentColor || '#6B7280',
                color: '#FFFFFF',
              }}
            >
              {brand.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFE7D6] text-[#2B1D12] border-2 border-[#2B1D12] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#2B1D12]">
                Segera Hadir
              </span>
              <h1 className="font-display font-black text-xl sm:text-2xl text-[#2B1D12] pt-1">
                {brand.name}
              </h1>
              <p className="text-xs text-[#7A6658] font-bold">
                {brand.tagline}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#4A3628] leading-relaxed max-w-xs mx-auto font-medium">
              Layanan jasa order hemat untuk {brand.name} sedang kami persiapkan. Nantikan segera dengan diskon hingga 50%!
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link prefetch={false}
                href="/"
                className="w-full py-3 px-4 bg-[#2B1D12] hover:bg-[#3D2817] text-[#FAF4E8] text-xs sm:text-sm font-display font-black rounded-xl transition border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Kembali ke Portal
              </Link>
              <a
                href={getAdminWhatsAppUrl(`Halo Admin Jasdor, saya berminat jajan hemat untuk ${brand.name}. Kapan mulai tersedia?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#15803D] hover:bg-[#166534] text-white border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] text-xs sm:text-sm font-display font-black rounded-xl flex items-center justify-center gap-2 transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Tanya Admin via WhatsApp</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TAMPILAN 2: Brand Aktif (Kopi Kenangan, Fore)
  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col selection:bg-amber-300 selection:text-[#2B1D12]">
      {/* Header dengan Navigasi Balik ke Portal */}
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Portal"
        brandName={brand.name}
        brandSub={brand.tagline || 'LAYANAN JASA ORDER'}
        chatMessage={`Halo Admin Jasdor, saya butuh info jasa order ${brand.name}.`}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Indikator Dibuka Manual oleh Admin */}
        {status?.overrideType === 'force_open' && (
          <div className="p-2.5 sm:p-3 bg-emerald-50 border-2 border-emerald-700 rounded-2xl shadow-[2px_2px_0px_#065F46] flex items-center gap-2.5 text-xs text-emerald-950">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold text-emerald-900">Dibuka manual oleh admin</strong> - Layanan menerima pesanan di luar jadwal operasional normal.
            </div>
          </div>
        )}

        {/* Banner Status Tentatif Hari Selasa */}
        {status?.isTentative && (
          <div className="p-3 bg-[#FEF3C7] border-2 border-[#2B1D12] rounded-2xl shadow-[2px_2px_0px_#2B1D12] flex items-center gap-2.5 text-xs text-[#2B1D12]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold">Info Layanan:</strong> {status.tentativeNote || 'Hari ini tentative - konfirmasi ke admin dulu ya.'}
            </div>
          </div>
        )}

        {/* Banner Pengingat Pesanan Menunggu Pembayaran */}
        <ActiveOrderBanner />

        {/* Live Status Antrean Pemrosesan Toko */}
        <QueueInfoBar />

        {/* Hero Ramping Brand Aktif */}
        <div className="bg-[#2B1D12] text-[#FAF4E8] border-2 border-[#2B1D12] rounded-3xl p-5 relative overflow-hidden shadow-[4px_4px_0px_#C67D0A]">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-[#2B1D12] uppercase tracking-wider bg-[#FAF4E8] border-2 border-[#2B1D12] px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#2B1D12]">
                Layanan Jasa Order
              </span>
              {brand.promoBadge ? (
                <span className="text-[10px] font-black text-white bg-[#DC2626] border-2 border-[#2B1D12] px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-[2px_2px_0px_#2B1D12]">
                  {brand.promoBadge}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {brand.logo && (
                <div className="w-11 h-11 p-1.5 rounded-2xl bg-[#FFFDF9] shadow-[2px_2px_0px_#2B1D12] shrink-0 flex items-center justify-center border-2 border-[#2B1D12]">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <h1 className="font-display font-black text-xl sm:text-2xl text-[#FAF4E8] leading-tight tracking-tight">
                Pesan {brand.name} Lebih Hemat
              </h1>
            </div>

            {brand.slug === 'kopi-kenangan' ? (
              <>
                {/* Info Biaya Jasa Hero */}
                <div className="bg-[#FAF4E8] text-[#2B1D12] border-2 border-[#2B1D12] rounded-2xl p-2 sm:p-2.5 shadow-[2px_2px_0px_#C67D0A] text-left space-y-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#FFE7D6] border-2 border-[#2B1D12] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#2B1D12]">
                      <svg className="w-3 h-3 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-display font-black text-xs sm:text-[13px] text-[#2B1D12] tracking-tight">
                      Informasi Biaya Jasa
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[10px] sm:text-[11px] text-[#4A3628] font-semibold pl-1 leading-snug">
                    <p>- Biaya Jasa jika order hanya 1 menu = 4.000/menu</p>
                    <p>- Biaya Jasa jika order minimal 2 menu dst = 2.300/item</p>
                  </div>
                </div>

                <KopiKenanganWifiBox />
              </>
            ) : (
              <p className="text-xs sm:text-sm text-[#E3D6C5] leading-relaxed font-medium">
                Tersedia di {outletCount ? `${outletCount.toLocaleString('id-ID')} ` : ''}outlet resmi di seluruh Indonesia. Pilih outlet terdekat, tentukan menu favoritmu, dan pesan praktis via WhatsApp.
              </p>
            )}

            {/* 3 Langkah Order (Vertikal 2 Baris per Langkah, Sejajar Horizontal) */}
            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t-2 border-[#FAF4E8]/20 text-center">
              <div className="flex flex-col items-center gap-1 text-[#E3D6C5]">
                <span className="w-5 h-5 rounded-full bg-[#FAF4E8] text-[#2B1D12] font-black text-[11px] flex items-center justify-center shadow-[1px_1px_0px_#2B1D12]">
                  1
                </span>
                <span className="text-[10px] font-bold leading-tight">Cari Outlet</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[#E3D6C5]">
                <span className="w-5 h-5 rounded-full bg-[#FAF4E8] text-[#2B1D12] font-black text-[11px] flex items-center justify-center shadow-[1px_1px_0px_#2B1D12]">
                  2
                </span>
                <span className="text-[10px] font-bold leading-tight">Pilih Menu</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[#E3D6C5]">
                <span className="w-5 h-5 rounded-full bg-[#15803D] text-white font-black text-[11px] flex items-center justify-center border border-white shadow-[1px_1px_0px_#2B1D12]">
                  3
                </span>
                <span className="text-[10px] font-bold leading-tight">Order via WA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Mode Minimal Pembelian 50k */}
        {brand.slug === 'kopi-kenangan' && isBundlingOnly && (
          <div
            role="status"
            className="p-3.5 bg-[#FFF0C2] border-2 border-[#2B1D12] rounded-2xl shadow-[3px_3px_0px_#2B1D12] flex items-center gap-2.5 text-xs text-[#2B1D12]"
          >
            <span className="text-base shrink-0">ℹ️</span>
            <div className="leading-snug">
              <span className="font-bold">Mode Minimal Pembelian Aktif:</span> Pesanan menu reguler minimal Rp50.000 dan maksimal Rp60.000 (harga normal).
            </div>
          </div>
        )}

        {/* Khusus Brand Kopi Kenangan: Highlight Kategori Paket Bundling Kompak */}
        {brand.slug === 'kopi-kenangan' && (
          isBundlingPromoActive(new Date(), isBundlingOnly) ? (
            <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3 shadow-[3px_3px_0px_#2B1D12] space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#2B1D12] text-[#FAF4E8] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[1px_1px_0px_#C67D0A]">
                    <span>🎁</span>
                    <span>Paket Bundling</span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#DC2626] text-white border border-[#2B1D12] px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#2B1D12]">
                    PROMO TERBATAS
                  </span>
                </div>
                {shouldShowBundlingCountdown() && (
                  <span className="text-[10px] font-bold text-[#2B1D12] bg-[#FFF8E7] border border-[#2B1D12] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>⏳</span>
                    <span>{countdown.formatted}</span>
                  </span>
                )}
              </div>

              <div className="text-xs">
                <p className="text-xs text-[#2B1D12] font-black leading-tight">
                  Diskon 50% + hemat fee jasa order di tiap outlet Kopi Kenangan!
                </p>
              </div>

              {/* 3 Micro Chips (Inline) */}
              <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                <div className="px-1.5 py-1 bg-[#FAF4E8] rounded-lg border border-[#2B1D12]/20">
                  <span className="block font-black text-[10px] text-[#2B1D12] leading-tight truncate">3 Reguler</span>
                  <span className="text-[9px] font-bold text-[#15803D] block leading-tight">Fee 4rb</span>
                </div>
                <div className="px-1.5 py-1 bg-[#FAF4E8] rounded-lg border border-[#2B1D12]/20">
                  <span className="block font-black text-[10px] text-[#2B1D12] leading-tight truncate">2 Large</span>
                  <span className="text-[9px] font-bold text-[#15803D] block leading-tight">Fee 3.5rb</span>
                </div>
                <div className="px-1.5 py-1 bg-[#FAF4E8] rounded-lg border border-[#2B1D12]/20">
                  <span className="block font-black text-[10px] text-[#2B1D12] leading-tight truncate">2 Minum+2 Roti</span>
                  <span className="text-[9px] font-bold text-[#15803D] block leading-tight">Fee 6rb</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF4E8] border-2 border-[#2B1D12]/20 rounded-2xl p-3 text-center">
              <p className="text-xs font-bold text-[#7A6658]">Promo bundling berakhir</p>
            </div>
          )
        )}

        {/* Form Pencarian Outlet */}
        <section aria-labelledby="outlet-search-heading" className="space-y-3">
          <div className="space-y-1">
            <h2 id="outlet-search-heading" className="font-display font-black text-base text-[#2B1D12]">
              Cari Outlet {brand.name}
            </h2>
            <p className="text-xs text-[#7A6658] font-medium">
              Tersedia {outletCount ? `${outletCount.toLocaleString('id-ID')} ` : ''}outlet resmi di seluruh Indonesia. Ketik nama mall, gedung, jalan, atau area di sekitarmu
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B1D12]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(filterOutletSearchInput(e.target.value))}
              placeholder="Contoh: Lippo Mall Puri, CP, Senayan..."
              className="w-full pl-10 pr-10 py-3.5 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl text-xs sm:text-sm text-[#2B1D12] placeholder-[#7A6658] font-bold focus:border-[#C67D0A] focus:outline-hidden shadow-[3px_3px_0px_#2B1D12] transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A6658] hover:text-[#2B1D12]"
                aria-label="Hapus pencarian"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Daftar Outlet */}
        <section aria-labelledby="outlet-list-heading" className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="outlet-list-heading" className="font-display font-black text-sm text-[#2B1D12]">
              {hasSearched ? 'Hasil Pencarian' : 'Outlet Rekomendasi'}
            </h2>
            {hasSearched && !isLoadingOutlets ? (
              <span className="text-[11px] font-extrabold text-[#2B1D12] bg-[#DDF0FF] border border-[#2B1D12] px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#2B1D12]">
                {outlets.length} outlet ditemukan
              </span>
            ) : !hasSearched && !isLoadingFeatured ? (
              <span className="text-[11px] font-extrabold text-[#2B1D12] bg-[#FFE7D6] border border-[#2B1D12] px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#2B1D12]">
                {outletCount ? `${outletCount.toLocaleString('id-ID')} Outlet Tersedia` : 'Outlet Tersedia'}
              </span>
            ) : null}
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs font-bold text-rose-700 shadow-[2px_2px_0px_#DC2626]">
              {searchError}
            </div>
          )}

          {/* Kondisi Loading */}
          {(hasSearched ? isLoadingOutlets : isLoadingFeatured) ? (
            <div className="space-y-3">
              <OutletCardSkeleton />
              <OutletCardSkeleton />
              <OutletCardSkeleton />
            </div>
          ) : hasSearched ? (
            /* Hasil Pencarian */
            outlets.length > 0 ? (
              <div className="space-y-3">
                {outlets.map((outlet) => (
                  <OutletSearchCard key={outlet.id} outlet={outlet} />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl text-center space-y-2 shadow-[4px_4px_0px_#2B1D12]">
                <p className="font-display font-black text-sm text-[#2B1D12]">
                  Outlet Tidak Ditemukan
                </p>
                <p className="text-xs text-[#7A6658] font-medium max-w-xs mx-auto">
                  Coba kata kunci lain seperti nama mall atau area terdekat.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-2 text-xs font-black text-[#C67D0A] hover:underline"
                >
                  Tampilkan Outlet Rekomendasi
                </button>
              </div>
            )
          ) : (
            /* Default Featured Outlets */
            featuredOutlets.length > 0 ? (
              <div className="space-y-3">
                {featuredOutlets.map((outlet) => (
                  <OutletSearchCard key={outlet.id} outlet={outlet} />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl text-center text-xs text-[#7A6658] font-bold shadow-[3px_3px_0px_#2B1D12]">
                Gunakan kolom pencarian di atas untuk menemukan outlet {brand.name}.
              </div>
            )
          )}
        </section>

        {/* Banner Bantuan WhatsApp Cepat */}
        <div className="p-4 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl flex items-center justify-between gap-3 shadow-[4px_4px_0px_#2B1D12]">
          <div>
            <p className="font-display font-black text-xs text-[#2B1D12]">Butuh bantuan cari outlet?</p>
            <p className="text-[11px] text-[#4A3628] font-medium mt-0.5">Admin siap bantu via WhatsApp</p>
          </div>
          <a
            href={getAdminWhatsAppUrl(`Halo Admin Jasdor, saya butuh rekomendasi outlet ${brand.name} terdekat.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-black rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] flex items-center gap-1.5 transition shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span>Tanya Admin</span>
          </a>
        </div>
      </main>
    </div>
  );
}
