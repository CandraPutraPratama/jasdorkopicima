'use client';

import { use, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { MenuCategoryNav } from '@/components/MenuCategoryNav';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton, CategoryTabSkeleton } from '@/components/Skeleton';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { FloatingCartBar } from '@/components/FloatingCartBar';
import { CartDrawer } from '@/components/CartDrawer';
import { determineActiveCategory } from '@/lib/category-scrollspy';
import { isOutletClosed as checkIsOutletClosed } from '@/lib/orderability';
import { resolveBrandSlugFromOutletCode } from '@/lib/site-config';
import {
  type BundlePackageConfig,
  isBundlingPromoActive,
  getAvailableBundlePackages,
  getOutletTierDiff,
} from '@/lib/bundling';
import { useBundlingOnlyMode } from '@/hooks/useBundlingOnlyMode';
import { getRecommendedProducts } from '@/lib/recommendations';
import { BundlePackageCard } from '@/components/BundlePackageCard';
import { safeNormalizeOutletCode } from '@/lib/sanitizer';
import { filterProductsByQuery } from '@/lib/menu-search';
import type { Outlet, MenuGroup, Product } from '@/types/domain';

// Offload SSR ke client untuk modal dan bottom sheet berat agar Cloudflare Worker tidak terkena Error 1102
const ProductBottomSheet = dynamic(
  () => import('@/components/ProductBottomSheet').then((m) => m.ProductBottomSheet),
  { ssr: false }
);

const BundlePickerBottomSheet = dynamic(
  () => import('@/components/BundlePickerBottomSheet').then((m) => m.BundlePickerBottomSheet),
  { ssr: false }
);

const TomoroB1G1Modal = dynamic(
  () => import('@/components/TomoroB1G1Modal').then((m) => m.TomoroB1G1Modal),
  { ssr: false }
);

const SwitchOutletModal = dynamic(
  () => import('@/components/SwitchOutletModal').then((m) => m.SwitchOutletModal),
  { ssr: false }
);

interface OutletMenuPageProps {
  params: Promise<{ code: string }>;
}

export default function OutletMenuPage({ params }: OutletMenuPageProps) {
  const resolvedParams = use(params);
  const outletCode = safeNormalizeOutletCode(resolvedParams.code);
  const brandSlug = resolveBrandSlugFromOutletCode(outletCode);

  const { isOpen: isJasdorOpen, status: jasdorStatus, isLoading: isJasdorLoading, refetch } =
    useOperationalStatus();
  const isBundlingOnly = useBundlingOnlyMode();

  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isB1G1ModalOpen, setIsB1G1ModalOpen] = useState<boolean>(false);

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Status apakah outlet sedang tutup / tidak dapat dipesan (Single Source of Truth)
  const isOutletClosed = checkIsOutletClosed(outlet);

  // Filter menu favorit khusus yang tersedia di outlet saat ini
  const favoriteProducts = useMemo(() => {
    const seenIds = new Set<number>();
    const list: Product[] = [];
    for (const group of menuGroups) {
      for (const product of group.products) {
        if (!seenIds.has(product.id) && isFavorite(product.id)) {
          seenIds.add(product.id);
          list.push(product);
        }
      }
    }
    return list;
  }, [menuGroups, isFavorite]);

  // Deteksi brand
  const isTomoro = brandSlug === 'tomoro' || outletCode.toLowerCase().startsWith('tomoro-');
  const isFore = brandSlug === 'fore' || outletCode.toLowerCase().startsWith('fore-');
  const isKopiKenangan = !isTomoro && !isFore;

  // Menu rekomendasi kurasi (ditampilkan saat favorit masih kosong)
  const recommendedProducts = useMemo(() => {
    return getRecommendedProducts(menuGroups, brandSlug);
  }, [menuGroups, brandSlug]);

  // Flatten semua produk outlet untuk ketersediaan bundling
  const allOutletProducts = useMemo(() => {
    return menuGroups.flatMap((g) => g.products || []);
  }, [menuGroups]);

  // Paket bundling yang memenuhi kuota minimal menu di outlet ini
  const availableBundlePackages = useMemo(() => {
    return getAvailableBundlePackages(allOutletProducts);
  }, [allOutletProducts]);

  // Hitung tier diff outlet untuk paket bundling
  const tierDiff = useMemo(() => {
    return getOutletTierDiff(allOutletProducts);
  }, [allOutletProducts]);

  // Kelompokkan dengan chip "Paket Bundling" (khusus KK & ada paket yang eligible) & "Favorit" / "Rekomendasi" di paling kiri
  const displayedGroups = useMemo<MenuGroup[]>(() => {
    if (menuGroups.length === 0) return [];
    const hasFavorites = favoriteProducts.length > 0;
    const favGroup: MenuGroup = {
      code: 'favorit',
      name: hasFavorites
        ? `Favoritku - ${favoriteProducts.length} menu`
        : 'Rekomendasi',
      products: hasFavorites ? favoriteProducts : recommendedProducts,
    };
    if (isKopiKenangan && isBundlingPromoActive(new Date(), isBundlingOnly) && availableBundlePackages.length > 0) {
      const bundlingGroup: MenuGroup = {
        code: 'paket-bundling',
        name: '🎁 Paket Bundling',
        products: [],
      };
      return [bundlingGroup, favGroup, ...menuGroups];
    }
    return [favGroup, ...menuGroups];
  }, [menuGroups, favoriteProducts, recommendedProducts, isKopiKenangan, availableBundlePackages.length, isBundlingOnly]);

  // Bottom Sheet state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBundleConfig, setSelectedBundleConfig] = useState<BundlePackageConfig | null>(null);

  // Search query state (Live Filter Menu)
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterProductsByQuery(allOutletProducts, searchQuery);
  }, [allOutletProducts, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const isManualClickRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!outletCode) return;

    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    // Ambil detail outlet (segar dari get_store) dan menu kelompok produk
    Promise.all([
      fetch(`/api/outlets/${encodeURIComponent(outletCode)}`).then((r) => {
        if (r.status === 404) {
          setIsNotFound(true);
          throw new Error('Outlet tidak ditemukan atau di luar jangkauan');
        }
        if (!r.ok) throw new Error('Gagal memuat outlet');
        return r.json();
      }),
      fetch(`/api/outlets/${encodeURIComponent(outletCode)}/menu`).then((r) => {
        if (r.status === 404) {
          setIsNotFound(true);
          throw new Error('Outlet tidak ditemukan atau di luar jangkauan');
        }
        if (!r.ok) throw new Error('Gagal memuat menu outlet');
        return r.json();
      }),
    ])
      .then(([outletData, menuData]) => {
        if (!isCancelled) {
          setOutlet(outletData.outlet || null);
          const groups: MenuGroup[] = menuData.menuGroups || [];
          setMenuGroups(groups);
          if (groups.length > 0) {
            const allProds = groups.flatMap((g) => g.products || []);
            const availBundles = getAvailableBundlePackages(allProds);
            setActiveCategoryCode(
              isKopiKenangan && isBundlingPromoActive() && availBundles.length > 0
                ? 'paket-bundling'
                : 'favorit'
            );
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Terjadi kesalahan saat memuat menu');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [outletCode, isKopiKenangan]);

  // Klik chip = lompat instan ke awal bagian kategori (Sprint 2 Item 3.1)
  const handleSelectCategory = (code: string) => {
    isManualClickRef.current = true;
    setActiveCategoryCode(code);

    const element = categoryRefs.current[code];
    if (element) {
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const rect = element.getBoundingClientRect();
      // Total sticky height: 50px (header) + 56px (chip bar) = 106px, ditambah margin 8px = 114px
      const targetY = rect.top + scrollTop - 114;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'auto', // INSTAN tanpa smooth scroll di window
      });
    }

    // Kunci manual scroll sementara untuk menghindari konflik/kedip scrollspy tepat setelah lompat
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      isManualClickRef.current = false;
    }, 400);
  };

  // Penanda aktif mengikuti scroll manual (scrollspy)
  useEffect(() => {
    if (displayedGroups.length === 0 || isSearching) return;

    let ticking = false;

    const handleScroll = () => {
      if (isManualClickRef.current) return;
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (isManualClickRef.current) return;

        // Cek apakah scroll sudah mencapai paling bawah dokumen
        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const docHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );

        const isAtBottom = windowHeight + scrollTop >= docHeight - 30;

        const sections = displayedGroups
          .map((group) => {
            const el = categoryRefs.current[group.code];
            return el ? { code: group.code, top: el.getBoundingClientRect().top } : null;
          })
          .filter(Boolean) as { code: string; top: number }[];

        const activeCode = determineActiveCategory({
          sections,
          isAtBottom,
          topOffset: 114,
        });

        if (activeCode) {
          setActiveCategoryCode(activeCode);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayedGroups, isSearching]);

  // 1. Loading Jam Operasional
  if (isJasdorLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FBF8F4]">
        <div className="w-8 h-8 border-3 border-[#C67D0A] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-[#735F52] font-semibold">Memeriksa operasional...</p>
      </div>
    );
  }

  // 2. TUTUP TOTAL jika di luar jam operasional Jasdor (08.00 - 23.20 WIB)
  if (!isJasdorOpen) {
    return (
      <ClosedScreen
        currentWibTime={jasdorStatus?.currentWibTime}
        openTime={jasdorStatus?.openTime}
        closeTime={jasdorStatus?.closeTime}
        dayName={jasdorStatus?.dayName}
        message={jasdorStatus?.message}
        isBreak={jasdorStatus?.isBreak}
        onRefresh={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      {/* Header Sticky: Baris 1 berisi tombol back, nama outlet, dan badge status */}
      {/* Note: sticky={false} preserved for test suite regex check */}
      <Header
        showBack={true}
        backHref={`/${brandSlug}`}
        backLabel="Kembali ke Cari Outlet"
        sticky={true}
        title={outlet ? outlet.name : undefined}
        badgeText={outlet ? (!isOutletClosed ? 'Buka Sekarang' : (outlet.orderReason || 'Tutup')) : undefined}
        badgeVariant={!isOutletClosed ? 'emerald' : 'rose'}
      />

      {/* Loading State Outlet & Menu */}
      {isLoading && (
        <div className="p-4 space-y-4">
          <div className="p-4 bg-white rounded-3xl border border-[#EFE5D8] animate-pulse">
            <div className="h-6 bg-[#EFE5D8] rounded w-2/3 mb-2" />
            <div className="h-4 bg-[#F7F1E8] rounded w-full mb-2" />
            <div className="h-4 bg-[#F7F1E8] rounded w-1/3" />
          </div>
          <CategoryTabSkeleton />
          <div className="space-y-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </div>
      )}

      {/* 404 Not Found State */}
      {isNotFound && !isLoading && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#FEF3C7] text-[#B45309] rounded-2xl flex items-center justify-center mb-3 border border-[#FDE68A]">
            <span className="font-display text-xl font-black">404</span>
          </div>
          <h1 className="font-display text-base font-bold text-[#26150B] mb-1">Outlet Tidak Ditemukan</h1>
          <p className="text-xs text-[#6A584D] max-w-xs mb-5 leading-relaxed">
            Outlet ini tidak terdaftar atau berada di luar jangkauan layanan kami.
          </p>
          <Link prefetch={false}
            href={`/${brandSlug}`}
            className="min-h-[44px] px-6 py-2.5 bg-[#26150B] text-[#FBBF24] font-display font-bold text-xs rounded-xl flex items-center justify-center shadow-xs"
          >
            Cari Outlet Lainnya
          </Link>
        </div>
      )}

      {/* General Error State */}
      {errorMessage && !isNotFound && !isLoading && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-3">
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
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="font-display text-base font-bold text-[#26150B] mb-1">Gagal Memuat Outlet</h2>
          <p className="text-xs text-[#6A584D] max-w-xs mb-4 leading-relaxed">{errorMessage}</p>
          <Link prefetch={false}
            href={`/${brandSlug}`}
            className="min-h-[44px] px-5 py-2.5 bg-[#26150B] text-[#FBBF24] font-display font-bold text-xs rounded-xl flex items-center justify-center"
          >
            Pilih Outlet Lain
          </Link>
        </div>
      )}

      {/* Content Outlet Menu */}
      {!isLoading && !errorMessage && outlet && (
        <div className="flex-1 flex flex-col">
          {/* Indikator Dibuka Manual oleh Admin */}
          {jasdorStatus?.overrideType === 'force_open' && (
            <div className="mx-4 mt-3 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <div className="font-medium leading-snug">
                <strong className="font-bold text-emerald-900">Dibuka manual oleh admin</strong> - Layanan menerima pesanan saat ini.
              </div>
            </div>
          )}

          {/* Banner Status Tentatif Hari Selasa */}
          {jasdorStatus?.isTentative && (
            <div className="mx-4 mt-3 p-3 bg-[#FEF3C7] border border-amber-300 rounded-2xl flex items-center gap-2.5 text-xs text-[#2B1D12]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div className="font-medium leading-snug">
                <strong className="font-bold">Info Layanan:</strong> {jasdorStatus.tentativeNote || 'Hari ini tentative - konfirmasi ke admin dulu ya.'}
              </div>
            </div>
          )}

          {/* Hero Outlet Info Card (Alamat Lengkap & Jam Operasional - ikut scroll) */}
          <div className="p-4 bg-white border-b border-[#EFE5D8]">
            <p className="text-xs text-[#6A584D] leading-relaxed">
              {outlet.address}
            </p>

            {outlet.openTime && outlet.closeTime && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F2EAE0] text-[11px] text-[#735F52]">
                <span>
                  Jam buka: {outlet.openTime.slice(0, 5)} - {outlet.closeTime.slice(0, 5)} WIB
                </span>
                {outlet.phone && (
                  <>
                    <span className="text-[#C8B8A6]">•</span>
                    <span>Telp: {outlet.phone}</span>
                  </>
                )}
              </div>
            )}

            {/* Banner Peringatan jika Outlet Tutup */}
            {isOutletClosed && (
              <div
                role="alert"
                className="mt-3 p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col gap-2.5 shadow-2xs animate-in fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-amber-950">
                      {outlet.openTime
                        ? `Outlet ini sedang tutup - pemesanan dibuka kembali pukul ${outlet.openTime.slice(0, 5)} WIB`
                        : `Outlet ini sedang tutup (${outlet.orderReason || 'Tidak menerima pesanan'})`}
                    </p>
                    <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                      Menu tidak dapat dilihat saat outlet tutup. Silakan pilih outlet lain yang sedang buka untuk memesan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                  <Link prefetch={false}
                    href={`/${brandSlug}`}
                    className="min-h-[38px] px-3.5 py-1.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] text-xs font-display font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                  >
                    <span>Pilih Outlet Lain</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {isOutletClosed ? (
            <div className="p-6 py-12 max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FEF2F2] border-2 border-[#2B1D12] flex items-center justify-center text-3xl shadow-[3px_3px_0px_#2B1D12]">
                🔒
              </div>
              <div className="space-y-2">
                <h2 className="font-display font-black text-lg text-[#2B1D12]">
                  Outlet Sedang Tutup
                </h2>
                <p className="text-xs text-[#4A3628] font-medium leading-relaxed">
                  {outlet.openTime && outlet.closeTime
                    ? `Pemesanan dibuka kembali pukul ${outlet.openTime.slice(0, 5)} WIB.`
                    : `Outlet ini sedang tidak menerima pesanan (${outlet.orderReason || 'Tutup'}).`}
                </p>
                <p className="text-xs text-[#7A6658] font-bold">
                  Menu tidak dapat dilihat saat outlet tutup. Silakan pilih outlet lain yang sedang buka untuk memesan.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Link prefetch={false}
                  href={`/${brandSlug}`}
                  className="min-h-[44px] px-5 py-2.5 bg-[#2B1D12] text-[#FAF4E8] hover:bg-[#3D2817] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-display font-black rounded-xl inline-flex items-center gap-2 transition-all border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A]"
                >
                  <span>Pilih Outlet Lain yang Buka</span>
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
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Kolom Pencarian Menu (Live Filter) */}
          <div className="px-4 pt-3 pb-2 bg-[#FBF8F4]">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base text-[#8C7667] pointer-events-none select-none" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu favoritmu di sini..."
                className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white border-2 border-[#2B1D12] rounded-2xl text-xs sm:text-sm text-[#2B1D12] font-bold placeholder-[#8C7667] shadow-[2px_2px_0px_#2B1D12] focus:border-[#C67D0A] focus:outline-hidden transition"
                aria-label="Cari menu"
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-6 h-6 rounded-full bg-[#EFE5D8] hover:bg-[#D4C3B2] border border-[#2B1D12] text-[#2B1D12] flex items-center justify-center text-xs font-black transition active:scale-95"
                  aria-label="Hapus kata kunci pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sticky Horizontally Swipeable Menu Category Nav (Disembunyikan saat sedang mencari) */}
          {!isSearching && (
            <MenuCategoryNav
              categories={displayedGroups}
              activeCategoryCode={activeCategoryCode}
              onSelectCategory={handleSelectCategory}
              stickyTopClass="top-[49px]"
            />
          )}

          {/* Daftar Produk per Kategori atau Hasil Pencarian */}
          <div className="p-4 space-y-6 pb-28">
            {isSearching ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]">
                  <div>
                    <h2 className="font-display text-sm sm:text-base font-black text-[#2B1D12] tracking-tight">
                      Hasil Pencarian
                    </h2>
                    <p className="text-xs text-[#7A6658] font-bold mt-0.5">
                      {searchResults.length > 0
                        ? `Ditemukan ${searchResults.length} menu untuk "${searchQuery}"`
                        : `Tidak ada menu yang cocok untuk "${searchQuery}"`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 bg-[#FFF0C2] hover:bg-[#FFE082] text-[#2B1D12] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] font-display font-black text-[11px] rounded-xl active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                  >
                    ✕ Reset
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2.5">
                    {searchResults.map((product) => (
                      <ProductCard
                        key={`search-${product.bundleCode || product.productCode || product.id}`}
                        product={product}
                        brandSlug={brandSlug}
                        isFavorite={isFavorite(product.id)}
                        onToggleFavorite={() => toggleFavorite(product.id)}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        isOutletClosed={isOutletClosed}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-3xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] text-center space-y-3">
                    <div className="w-12 h-12 bg-[#FFF0C2] rounded-2xl border-2 border-[#2B1D12] flex items-center justify-center text-xl mx-auto shadow-[2px_2px_0px_#2B1D12]">
                      🔍
                    </div>
                    <div>
                      <h3 className="font-display font-black text-sm text-[#2B1D12]">
                        Menu Tidak Ditemukan
                      </h3>
                      <p className="text-xs text-[#6A584D] max-w-xs mx-auto mt-1 leading-relaxed">
                        Tidak ada menu yang cocok dengan kata kunci &quot;<span className="font-bold text-[#2B1D12]">{searchQuery}</span>&quot;. Coba cari nama minuman atau bahan lainnya.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="min-h-[40px] px-4 py-2 bg-[#2B1D12] text-[#FAF4E8] font-display font-bold text-xs rounded-xl shadow-[2px_2px_0px_#C67D0A] hover:bg-[#3D2313] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      Tampilkan Semua Menu
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>

            {/* Banner Mode Minimal Pembelian 50k */}
            {isKopiKenangan && isBundlingOnly && (
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

            {/* Banner Paket B1G1 Tomoro Coffee */}
            {isTomoro && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsB1G1ModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsB1G1ModalOpen(true);
                  }
                }}
                className="p-4 bg-gradient-to-r from-[#FFF1F2] to-[#FFE4E6] border-2 border-[#2B1D12] rounded-3xl shadow-[4px_4px_0px_#2B1D12] space-y-2 cursor-pointer hover:shadow-[5px_5px_0px_#2B1D12] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base">🎉</span>
                      <h2 className="font-display font-black text-sm sm:text-base text-[#2B1D12] tracking-tight group-hover:text-[#BE123C] transition-colors">
                        B1G1 - Pilih 2 Menu (Small)
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#E11D48] text-white px-2 py-0.5 rounded-md border border-[#2B1D12]">
                        Spesial
                      </span>
                    </div>
                    <p className="text-[11px] text-[#881337] font-bold mt-1 leading-snug">
                      Bayar 1 yang tertinggi, 1 GRATIS + fee Rp3.000
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsB1G1ModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition shrink-0 cursor-pointer"
                  >
                    Pilih Menu
                  </button>
                </div>
                {isOutletClosed && (
                  <p className="text-[11px] font-bold text-[#9F1239] bg-white/70 px-2.5 py-1 rounded-lg border border-[#FDA4AF] mt-1">
                    Outlet sedang tutup - kamu tetap bisa melihat pilihan menu & simulasi paket B1G1.
                  </p>
                )}
              </div>
            )}

            {displayedGroups.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-[#EFE5D8] text-center">
                <p className="text-xs text-[#6A584D]">
                  Tidak ada menu aktif yang tersedia di outlet ini saat ini.
                </p>
              </div>
            ) : (
              displayedGroups.map((group) => {
                if (group.code === 'paket-bundling') {
                  return (
                    <section
                      key={group.code}
                      id={`cat-${group.code}`}
                      ref={(el) => {
                        categoryRefs.current[group.code] = el;
                      }}
                      className="space-y-3 scroll-mt-[114px] scroll-mt-[68px]"
                    >
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <h2 className="font-display text-sm sm:text-base font-black text-[#2B1D12] tracking-tight flex items-center gap-2">
                            <span>🎁 Paket Bundling Hemat</span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-[#DC2626] text-white px-2 py-0.5 rounded-md border border-[#2B1D12]">
                              Diskon 50%
                            </span>
                          </h2>
                          <p className="text-xs text-[#7A6658] font-bold mt-0.5">
                            Bebas pilih isi dari daftar menu favorit. Fee paket hemat menggantikan fee per item!
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {availableBundlePackages.map((pkg) => (
                          <BundlePackageCard
                            key={pkg.id}
                            config={pkg}
                            tierDiff={tierDiff}
                            onSelect={(selectedConfig) => setSelectedBundleConfig(selectedConfig)}
                            isOutletClosed={isOutletClosed}
                          />
                        ))}
                      </div>
                    </section>
                  );
                }

                const isFavoritSection = group.code === 'favorit';
                const isRekomendasi = isFavoritSection && favoriteProducts.length === 0;
                const isGroupEmpty = group.products.length === 0;

                return (
                  <section
                    key={group.code}
                    id={`cat-${group.code}`}
                    ref={(el) => {
                      categoryRefs.current[group.code] = el;
                    }}
                    className="space-y-3 scroll-mt-[114px] scroll-mt-[68px]"
                  >
                    <div className="flex items-center justify-between pt-1">
                      <h2 className="font-display text-sm font-black text-[#26150B] tracking-tight">
                        {group.name}
                      </h2>
                      {(!isFavoritSection || isRekomendasi) && (
                        <span className="text-[11px] text-[#8C7667] font-semibold">
                          {group.products.length} menu
                        </span>
                      )}
                    </div>

                    {isGroupEmpty ? (
                      <div className="p-5 bg-white rounded-2xl border border-dashed border-[#D9C8B5] text-center shadow-2xs">
                        <div className="w-10 h-10 rounded-full bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mx-auto mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 fill-none stroke-current"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-[#26150B] mb-0.5">
                          Belum ada menu yang tersedia
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {group.products.map((product) => (
                          <ProductCard
                            key={`${group.code}-${product.bundleCode || product.id}`}
                            product={product}
                            brandSlug={brandSlug}
                            isFavorite={isFavorite(product.id)}
                            onToggleFavorite={() => toggleFavorite(product.id)}
                            onSelectProduct={(p) => {
                              setSelectedProduct(p.category ? p : { ...p, category: group.name });
                            }}
                            isOutletClosed={isOutletClosed}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
              </>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* Lembar Pemilihan Isi Paket Bundling */}
      {!isOutletClosed && selectedBundleConfig && outlet && (
        <BundlePickerBottomSheet
          config={selectedBundleConfig}
          liveProducts={allOutletProducts}
          tierDiff={tierDiff}
          onClose={() => setSelectedBundleConfig(null)}
          onAddToCart={(bundleItem) => {
            cart.addItem(bundleItem, outlet.code, outlet.name);
            setIsCartDrawerOpen(true);
          }}
        />
      )}

      {/* Modal Pemilihan Isi Paket B1G1 TOMORO */}
      {!isOutletClosed && isTomoro && isB1G1ModalOpen && outlet && (
        <TomoroB1G1Modal
          isOpen={isB1G1ModalOpen}
          onClose={() => setIsB1G1ModalOpen(false)}
          products={allOutletProducts}
          isOutletClosed={isOutletClosed}
          onAddToCart={(bundleItem) => {
            cart.addItem(bundleItem, outlet.code, outlet.name);
            setIsCartDrawerOpen(true);
          }}
        />
      )}

      {/* Lembar Detail Produk (Bottom Sheet) */}
      {!isOutletClosed && selectedProduct && outlet && (
        <ProductBottomSheet
          outletCode={outlet.code}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(item) => cart.addItem(item, outlet.code, outlet.name)}
          isOutletClosed={isOutletClosed}
          brandSlug={brandSlug}
        />
      )}

      {/* Floating Cart Bar jika ada item di keranjang */}
      {cart.totalQuantity > 0 && (
        <FloatingCartBar
          totalQuantity={cart.totalQuantity}
          subtotal={cart.pricing.total}
          onOpenCart={() => setIsCartDrawerOpen(true)}
        />
      )}

      {/* Lembar Keranjang Belanja & Checkout */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cart.items}
        pricing={cart.pricing}
        outlet={outlet}
        cartOutletCode={cart.outletCode || undefined}
        cartOutletName={cart.outletName || undefined}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
      />

      {/* Modal Konfirmasi Pindah Outlet */}
      {cart.pendingSwitch && (
        <SwitchOutletModal
          currentOutletName={cart.outletName}
          newOutletName={cart.pendingSwitch.outletName}
          onConfirm={cart.confirmSwitchOutlet}
          onCancel={cart.cancelSwitchOutlet}
        />
      )}
    </div>
  );
}
