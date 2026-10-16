'use client';

import { use, useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { OutletSearchCard } from '@/components/OutletSearchCard';
import { OutletCardSkeleton } from '@/components/Skeleton';
import { Footer } from '@/components/Footer';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { filterOutletSearchInput } from '@/lib/sanitizer';
import {
  getBrandConfig,
  isReservedSlug,
  getAdminWhatsAppUrl,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
} from '@/lib/site-config';
import type { Outlet } from '@/types/domain';

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

  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();

  // State pencarian outlet untuk brand aktif
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [featuredOutlets, setFeaturedOutlets] = useState<Outlet[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [, startTransition] = useTransition();

  // Load default featured outlets untuk brand aktif
  useEffect(() => {
    if (brand.status !== 'active') return;

    let isCancelled = false;
    fetch('/api/outlets?featured=true')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat outlet unggulan');
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setFeaturedOutlets(data.items || []);
          setIsLoadingFeatured(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoadingFeatured(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [brand.status]);

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

  // Fetch search query
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

    fetch(`/api/outlets?q=${encodeURIComponent(debouncedQuery)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal mencari outlet');
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setOutlets(data.items || []);
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
  }, [debouncedQuery, brand.status]);

  // Handle Jasdor Closed Gate
  if (!isStatusLoading && !isOpen && status) {
    return <ClosedScreen status={status} onRefetch={refetch} />;
  }

  // TAMPILAN 1: Brand Pilot "Segera Hadir" (misal Tomoro Coffee)
  if (brand.status === 'coming_soon') {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col selection:bg-[#D9A74A]/30">
        <Header
          showBack={true}
          backHref="/"
          backLabel="Kembali ke Portal"
          title={brand.name}
          showChatAdmin={true}
        />

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <div className="w-full bg-white border border-[#EFE5D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            {/* Visual Emblem Brand */}
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-md border-2 border-white"
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
              <span className="inline-block px-3 py-1 rounded-full bg-[#E5DACB] text-[#4A3225] text-xs font-bold uppercase tracking-wider">
                Segera Hadir
              </span>
              <h1 className="font-display font-black text-xl sm:text-2xl text-[#26150B] pt-1">
                {brand.name}
              </h1>
              <p className="text-xs text-[#735F52] font-medium">
                {brand.tagline}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#5C4A3E] leading-relaxed max-w-xs mx-auto">
              Layanan jasa order hemat untuk {brand.name} sedang kami persiapkan. Nantikan segera dengan diskon hingga 50%!
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/"
                className="w-full py-2.5 px-4 bg-[#26150B] hover:bg-[#3B2314] text-[#FAF7F2] text-xs sm:text-sm font-bold rounded-xl transition shadow-xs active:scale-98"
              >
                Kembali ke Portal
              </Link>
              <a
                href={getAdminWhatsAppUrl(`Halo Admin Jasdor, saya berminat jajan hemat untuk ${brand.name}. Kapan mulai tersedia?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] border border-emerald-200/80 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-98"
              >
                <WhatsAppIcon className="w-4 h-4 fill-[#15803D]" />
                <span>Tanya Admin via WhatsApp</span>
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // TAMPILAN 2: Brand Aktif (Kopi Kenangan)
  return (
    <div className="min-h-screen bg-[#FBF8F4] flex flex-col selection:bg-[#D9A74A]/30">
      {/* Header dengan Navigasi Balik ke Portal */}
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Portal"
        brandName={brand.name}
        brandSub={brand.tagline || 'JASA ORDER INDEPENDEN'}
        chatMessage={`Halo Admin Jasdor, saya butuh info jasa order ${brand.name}.`}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Hero Ramping Brand Aktif */}
        <div className="bg-[#26150B] text-[#FAF7F2] rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-[#E5B563] uppercase tracking-wider bg-[#3B2314] px-2 py-0.5 rounded-full border border-[#52331C]">
                Jasa Order Independen
              </span>
              <span className="text-[10px] font-black text-white bg-[#DC2626] px-2 py-0.5 rounded-full uppercase tracking-wide">
                {brand.promoBadge}
              </span>
            </div>

            <h1 className="font-display font-black text-xl sm:text-2xl text-[#FAF7F2] leading-tight tracking-tight">
              Pesan {brand.name} Lebih Hemat
            </h1>

            <p className="text-xs sm:text-sm text-[#D4C3B3] leading-relaxed">
              Pilih outlet terdekat, tentukan menu favoritmu, dan nikmati diskon setengah harga via WhatsApp.
            </p>

            {/* 3 Langkah Horizontal Strip */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#3B2314] text-[10px]">
              <div className="flex items-center gap-1 text-[#D4C3B3]">
                <span className="w-4 h-4 rounded-full bg-[#3B2314] text-[#E5B563] font-bold flex items-center justify-center shrink-0">1</span>
                <span className="truncate">Cari Outlet</span>
              </div>
              <div className="flex items-center gap-1 text-[#D4C3B3]">
                <span className="w-4 h-4 rounded-full bg-[#3B2314] text-[#E5B563] font-bold flex items-center justify-center shrink-0">2</span>
                <span className="truncate">Pilih Menu</span>
              </div>
              <div className="flex items-center gap-1 text-[#D4C3B3]">
                <span className="w-4 h-4 rounded-full bg-[#15803D] text-white font-bold flex items-center justify-center shrink-0">3</span>
                <span className="truncate">Order via WA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Pencarian Outlet */}
        <section aria-labelledby="outlet-search-heading" className="space-y-3">
          <div className="space-y-1">
            <h2 id="outlet-search-heading" className="font-display font-bold text-base text-[#26150B]">
              Cari Outlet {brand.name}
            </h2>
            <p className="text-xs text-[#735F52]">
              Ketik nama mall, gedung, jalan, atau area di sekitarmu
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#735F52]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(filterOutletSearchInput(e.target.value))}
              placeholder="Contoh: Lippo Mall Puri, CP, Senayan..."
              className="w-full pl-10 pr-10 py-3 bg-white border border-[#EFE5D8] rounded-xl text-xs sm:text-sm text-[#26150B] placeholder-[#A8988B] focus:border-[#C67D0A] focus:outline-hidden focus:ring-1 focus:ring-[#C67D0A] shadow-2xs transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A8988B] hover:text-[#26150B]"
                aria-label="Hapus pencarian"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Daftar Outlet */}
        <section aria-labelledby="outlet-list-heading" className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="outlet-list-heading" className="font-display font-bold text-sm text-[#26150B]">
              {hasSearched ? 'Hasil Pencarian' : 'Outlet Rekomendasi'}
            </h2>
            {hasSearched && !isLoadingOutlets && (
              <span className="text-[11px] font-semibold text-[#735F52]">
                {outlets.length} outlet ditemukan
              </span>
            )}
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
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
              <div className="p-6 bg-white border border-[#EFE5D8] rounded-2xl text-center space-y-2">
                <p className="font-display font-bold text-sm text-[#26150B]">
                  Outlet Tidak Ditemukan
                </p>
                <p className="text-xs text-[#735F52] max-w-xs mx-auto">
                  Coba kata kunci lain seperti nama mall atau area terdekat.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-2 text-xs font-bold text-[#A66908] hover:underline"
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
              <div className="p-4 bg-white border border-[#EFE5D8] rounded-2xl text-center text-xs text-[#735F52]">
                Gunakan kolom pencarian di atas untuk menemukan outlet {brand.name}.
              </div>
            )
          )}
        </section>

        {/* Banner Bantuan WhatsApp Cepat */}
        <div className="p-3 bg-white border border-[#EFE5D8] rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="font-display font-bold text-xs text-[#26150B]">Butuh bantuan cari outlet?</p>
            <p className="text-[11px] text-[#735F52] mt-0.5">Admin siap bantu via WhatsApp ({NOMOR_WHATSAPP_ADMIN_FORMATTED})</p>
          </div>
          <a
            href={getAdminWhatsAppUrl(`Halo Admin Jasdor, saya butuh rekomendasi outlet ${brand.name} terdekat.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow-xs"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span>Tanya Admin</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
