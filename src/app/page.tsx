'use client';

import { useState, useEffect, useTransition } from 'react';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { OutletSearchCard } from '@/components/OutletSearchCard';
import { OutletCardSkeleton } from '@/components/Skeleton';
import { filterOutletSearchInput } from '@/lib/sanitizer';
import { getAdminWhatsAppUrl, NOMOR_WHATSAPP_ADMIN_FORMATTED, JADWAL_OPERASIONAL_RINGKAS } from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import type { Outlet } from '@/types/domain';

export default function HomePage() {
  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [featuredOutlets, setFeaturedOutlets] = useState<Outlet[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [, startTransition] = useTransition();

  // Load default featured outlets saat pertama kali homepage dibuka
  useEffect(() => {
    let isCancelled = false;

    fetch('/api/outlets?featured=true')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Gagal memuat outlet unggulan');
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setFeaturedOutlets(data.items || []);
          setIsLoadingFeatured(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoadingFeatured(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Debounce search query 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(query.trim());
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch outlets when debouncedQuery changes
  useEffect(() => {
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
          setSearchError(err.message || 'Terjadi kesalahan saat memuat outlet');
          setIsLoadingOutlets(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // 1. Loading status operasional pertama kali
  if (isStatusLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FBF8F4]">
        <div className="w-9 h-9 border-3 border-[#C67D0A] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-[#735F52] font-semibold">
          Memeriksa jam operasional Jasdor...
        </p>
      </div>
    );
  }

  // 2. TUTUP TOTAL jika di luar jam operasional (08.00 - 23.20 WIB)
  if (!isOpen) {
    return (
      <ClosedScreen
        currentWibTime={status?.currentWibTime}
        openTime={status?.openTime}
        closeTime={status?.closeTime}
        onRefresh={refetch}
      />
    );
  }

  // 3. Tampilan BUKA: Halaman Pencarian Outlet
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header isOpen={true} />

      <main className="flex-1 p-4 flex flex-col">
        {/* Banner Promo Ringkas & Appetizing */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white mb-4 shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          {/* Subtle warm glow background accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FBBF24]">
                Jasa Order Independen Kopi Cima
              </span>
              <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-[10px] font-black rounded-full uppercase tracking-wide shadow-xs">
                Hemat 50%
              </span>
            </div>

            <h1 className="font-display text-xl font-black tracking-tight text-white leading-tight">
              Kopi Kenangan Favoritmu, Setengah Harga
            </h1>

            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Diskon 50% menu dasar Kopi Kenangan. Biaya jasa order transparan Rp2.000/item (Rp4.000 untuk 1 item). Pesan praktis, checkout via WhatsApp!
            </p>

            {/* 3 Langkah Cara Order Cepat (Trust Section) */}
            <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] font-black text-[#FBBF24] block">1. PILIH OUTLET</span>
                <span className="text-[10px] text-[#D4C3B2] leading-tight block mt-0.5">Cari mall / cabang terdekat</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] font-black text-[#FBBF24] block">2. PILIH MENU</span>
                <span className="text-[10px] text-[#D4C3B2] leading-tight block mt-0.5">Kustomisasi cup & topping</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[10px] font-black text-[#FBBF24] block">3. WHATSAPP</span>
                <span className="text-[10px] text-[#D4C3B2] leading-tight block mt-0.5">Kirim & ambil pesanan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Kontak Admin Terpisah — Ringkas & Lega */}
        <div className="mb-4 bg-white border border-[#EFE5D8] rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0 animate-pulse" />
              <p className="text-xs font-bold text-[#26150B] leading-tight">
                Ada pertanyaan sebelum pesan?
              </p>
            </div>
            <p className="text-[11px] text-[#735F52] leading-tight mt-1 truncate">
              Admin siap bantu via WhatsApp ({NOMOR_WHATSAPP_ADMIN_FORMATTED}) • {JADWAL_OPERASIONAL_RINGKAS}
            </p>
          </div>
          <a
            href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang layanan jasa order Kopi Kenangan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 shrink-0"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
            <span>Chat Admin</span>
          </a>
        </div>

        {/* Input Pencarian Outlet */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7667]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="outlet-search-input"
            type="text"
            maxLength={60}
            value={query}
            onChange={(e) => setQuery(filterOutletSearchInput(e.target.value))}
            placeholder="Cari nama outlet, mall, atau jalan..."
            className="w-full min-h-[48px] pl-11 pr-10 py-2.5 bg-white border border-[#E0D4C5] focus:border-[#C67D0A] focus:ring-2 focus:ring-[#C67D0A]/20 rounded-2xl text-sm text-[#26150B] placeholder-[#9C897B] transition shadow-xs outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C7667] hover:text-[#26150B] min-h-[44px] min-w-[44px] justify-center"
              aria-label="Hapus kata kunci pencarian"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 text-xs">
          <span className="text-[11px] text-[#735F52] font-semibold shrink-0">Cari cepat:</span>
          {['Grand Indonesia', 'Puri', 'Kokas', 'Rungkut', 'Senayan'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuery(sample)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#EAE0D3] hover:border-[#C67D0A] text-[#4A3225] rounded-xl transition shrink-0 active:scale-95 shadow-2xs"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* State 1: Daftar Outlet Unggulan Default (Sebelum pengguna mencari) */}
        {!hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-sm text-[#26150B]">
                  Outlet Pilihan & Terpopuler
                </h2>
                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
                  Rekomendasi
                </span>
              </div>
              {!isLoadingFeatured && featuredOutlets.length > 0 && (
                <span className="text-[11px] text-[#8C7667] font-medium">
                  {featuredOutlets.length} outlet
                </span>
              )}
            </div>

            {isLoadingFeatured ? (
              <div className="space-y-3 pb-6">
                <OutletCardSkeleton />
                <OutletCardSkeleton />
                <OutletCardSkeleton />
              </div>
            ) : featuredOutlets.length > 0 ? (
              <div className="space-y-3 pb-6">
                {featuredOutlets.map((outlet) => (
                  <OutletSearchCard key={outlet.code || outlet.id} outlet={outlet} />
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-[#EFE5D8] shadow-xs my-auto">
                <div className="w-14 h-14 bg-[#FEF3C7] text-[#B45309] rounded-2xl flex items-center justify-center mb-3 border border-[#FDE68A]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2 className="font-display text-base font-bold text-[#26150B] mb-1">
                  Cari Outlet Kopi Kenangan
                </h2>
                <p className="text-xs text-[#6A584D] leading-relaxed max-w-xs mb-2">
                  Ketik nama outlet, mall, atau area jalan di atas untuk mulai memesan jasa order promo setengah harga.
                </p>
              </div>
            )}
          </div>
        )}

        {/* State 2: Skeleton Loading saat pencarian berlangsung */}
        {isLoadingOutlets && (
          <div className="space-y-3">
            <OutletCardSkeleton />
            <OutletCardSkeleton />
            <OutletCardSkeleton />
          </div>
        )}

        {/* State 3: Error pesan saat request gagal */}
        {searchError && !isLoadingOutlets && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center">
            <p className="text-xs font-semibold">{searchError}</p>
            <button
              onClick={() => setDebouncedQuery(query.trim())}
              type="button"
              className="mt-2 text-xs text-rose-900 underline font-semibold min-h-[44px]"
            >
              Coba Cari Lagi
            </button>
          </div>
        )}

        {/* State 4: Hasil Pencarian Outlet */}
        {!isLoadingOutlets && !searchError && hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs text-[#735F52] font-semibold">
                Ditemukan {outlets.length} outlet
              </span>
              <span className="text-[11px] text-[#8C7667] font-medium">
                Pilih cabang yang Buka
              </span>
            </div>

            {outlets.length === 0 ? (
              <div className="p-8 bg-white border border-[#EFE5D8] rounded-3xl text-center shadow-xs">
                <div className="w-12 h-12 bg-[#F4EDE3] text-[#8C7667] rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-sm font-bold text-[#26150B]">
                  Outlet Tidak Ditemukan
                </h3>
                <p className="text-xs text-[#6A584D] mt-1 max-w-xs mx-auto leading-relaxed">
                  Tidak ada outlet Kopi Kenangan yang cocok dengan &quot;{debouncedQuery}&quot;. Coba gunakan nama jalan atau mall terdekat lainnya.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {outlets.map((outlet) => (
                  <OutletSearchCard key={outlet.code || outlet.id} outlet={outlet} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
