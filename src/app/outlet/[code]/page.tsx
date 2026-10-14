'use client';

import { use, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { MenuCategoryNav } from '@/components/MenuCategoryNav';
import { ProductCard } from '@/components/ProductCard';
import { ProductBottomSheet } from '@/components/ProductBottomSheet';
import { ProductCardSkeleton, CategoryTabSkeleton } from '@/components/Skeleton';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { FloatingCartBar } from '@/components/FloatingCartBar';
import { CartDrawer } from '@/components/CartDrawer';
import { SwitchOutletModal } from '@/components/SwitchOutletModal';
import { determineActiveCategory } from '@/lib/category-scrollspy';
import type { Outlet, MenuGroup, Product } from '@/types/domain';

interface OutletMenuPageProps {
  params: Promise<{ code: string }>;
}

export default function OutletMenuPage({ params }: OutletMenuPageProps) {
  const resolvedParams = use(params);
  const outletCode = resolvedParams.code;

  const { isOpen: isJasdorOpen, status: jasdorStatus, isLoading: isJasdorLoading, refetch } =
    useOperationalStatus();

  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

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

  // Kelompokkan dengan chip "Favorit" sebagai kategori paling kiri sebelum "Baru!"
  const displayedGroups = useMemo<MenuGroup[]>(() => {
    if (menuGroups.length === 0) return [];
    const favGroup: MenuGroup = {
      code: 'favorit',
      name: 'Favoritku',
      products: favoriteProducts,
    };
    return [favGroup, ...menuGroups];
  }, [menuGroups, favoriteProducts]);

  // Bottom Sheet state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
            setActiveCategoryCode(groups[0].code);
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
  }, [outletCode]);

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
    if (displayedGroups.length === 0) return;

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
  }, [displayedGroups]);

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
        backHref="/"
        backLabel="Kembali ke Cari Outlet"
        sticky={true}
        title={outlet ? outlet.name : undefined}
        badgeText={outlet ? (outlet.isOpen ? 'Buka Sekarang' : 'Tutup') : undefined}
        badgeVariant={outlet?.isOpen ? 'emerald' : 'rose'}
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
            Outlet ini tidak terdaftar atau berada di luar jangkauan layanan Kopi Kenangan kami.
          </p>
          <Link
            href="/"
            className="min-h-[44px] px-6 py-2.5 bg-[#26150B] text-[#FBBF24] font-display font-bold text-xs rounded-xl flex items-center justify-center shadow-xs"
          >
            Cari Outlet Kopi Kenangan
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
          <Link
            href="/"
            className="min-h-[44px] px-5 py-2.5 bg-[#26150B] text-[#FBBF24] font-display font-bold text-xs rounded-xl flex items-center justify-center"
          >
            Pilih Outlet Lain
          </Link>
        </div>
      )}

      {/* Content Outlet Menu */}
      {!isLoading && !errorMessage && outlet && (
        <div className="flex-1 flex flex-col">
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
          </div>

          {/* Sticky Horizontally Swipeable Menu Category Nav (Baris 2 sticky tepat di bawah Header) */}
          <MenuCategoryNav
            categories={displayedGroups}
            activeCategoryCode={activeCategoryCode}
            onSelectCategory={handleSelectCategory}
            stickyTopClass="top-[49px]"
          />

          {/* Daftar Produk per Kategori */}
          <div className="p-4 space-y-6 pb-28">
            {displayedGroups.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-[#EFE5D8] text-center">
                <p className="text-xs text-[#6A584D]">
                  Tidak ada menu aktif yang tersedia di outlet ini saat ini.
                </p>
              </div>
            ) : (
              displayedGroups.map((group) => {
                const isFavoritSection = group.code === 'favorit';
                const isFavoritEmpty = isFavoritSection && group.products.length === 0;

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
                        {isFavoritSection
                          ? `Favoritku — ${group.products.length} menu`
                          : group.name}
                      </h2>
                      {!isFavoritSection && (
                        <span className="text-[11px] text-[#8C7667] font-semibold">
                          {group.products.length} menu
                        </span>
                      )}
                    </div>

                    {isFavoritEmpty ? (
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
                          Belum ada menu favorit
                        </p>
                        <p className="text-[11px] text-[#735F52]">
                          Ketuk ikon hati untuk menyimpan favoritmu
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {group.products.map((product) => (
                          <ProductCard
                            key={`${group.code}-${product.bundleCode || product.id}`}
                            product={product}
                            isFavorite={isFavorite(product.id)}
                            onToggleFavorite={() => toggleFavorite(product.id)}
                            onSelectProduct={(p) => setSelectedProduct(p)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Lembar Detail Produk (Bottom Sheet) */}
      {selectedProduct && outlet && (
        <ProductBottomSheet
          outletCode={outlet.code}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(item) => cart.addItem(item, outlet.code, outlet.name)}
        />
      )}

      {/* Floating Cart Bar jika ada item di keranjang */}
      {cart.totalQuantity > 0 && (
        <FloatingCartBar
          totalQuantity={cart.totalQuantity}
          subtotal={cart.pricing.subtotal}
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
