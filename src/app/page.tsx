'use client';

import { useState, useEffect, useTransition } from 'react';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { OutletSearchCard } from '@/components/OutletSearchCard';
import { OutletCardSkeleton } from '@/components/Skeleton';
import type { Outlet } from '@/types/domain';

export default function HomePage() {
  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [, startTransition] = useTransition();

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-stone-500 font-medium">
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
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header isOpen={true} />

      <main className="flex-1 p-4 flex flex-col">
        {/* Banner Promo Ringkas */}
        <div className="bg-gradient-to-r from-[#111111] to-stone-900 rounded-2xl p-4 text-white mb-4 shadow-sm border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Jastip Independen Kopi Cima
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-[#D4AF37] border border-amber-500/30 text-[10px] font-semibold rounded-full">
              Diskon Menu Dasar
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Pilih Outlet Kopi Kenangan
          </h1>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            Diskon 50% dari harga dasar menu. Tambahan varian, topping, dan biaya jasa dibayar normal.
          </p>
        </div>

        {/* Input Pencarian Outlet */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
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
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="outlet-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama outlet, mall, atau jalan..."
            className="w-full min-h-[48px] pl-11 pr-10 py-2.5 bg-white border border-stone-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-amber-200/50 rounded-xl text-sm text-[#1F2937] placeholder-stone-400 transition shadow-xs outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 min-h-[44px] min-w-[44px] justify-center"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* State 1: Petunjuk sebelum mengetik */}
        {!hasSearched && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-stone-200/70 shadow-xs my-auto">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
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
            <h2 className="text-base font-bold text-[#111111] mb-1">
              Cari Outlet Terdekat
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs mb-4">
              Ketik nama outlet, nama mall, atau area jalan pada kolom di atas untuk melihat ketersediaan menu.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="text-[11px] text-stone-400 self-center mr-1">Contoh:</span>
              {['Rungkut', 'Grand Indonesia', 'Puri', 'Senayan'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setQuery(sample)}
                  className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition min-h-[36px]"
                >
                  {sample}
                </button>
              ))}
            </div>
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
              className="mt-2 text-xs text-rose-900 underline font-medium min-h-[44px]"
            >
              Coba Cari Lagi
            </button>
          </div>
        )}

        {/* State 4: Hasil Pencarian Outlet */}
        {!isLoadingOutlets && !searchError && hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs text-stone-500 font-medium">
                Ditemukan {outlets.length} outlet
              </span>
              <span className="text-[11px] text-stone-400">
                Pilih yang berstatus Buka
              </span>
            </div>

            {outlets.length === 0 ? (
              <div className="p-8 bg-white border border-stone-200 rounded-2xl text-center shadow-xs">
                <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-2">
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
                <h3 className="text-sm font-bold text-[#111111]">
                  Outlet Tidak Ditemukan
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Tidak ada outlet Kopi Kenangan yang cocok dengan kata kunci &quot;{debouncedQuery}&quot;. Coba gunakan nama jalan atau mall terdekat lainnya.
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
