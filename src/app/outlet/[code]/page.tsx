'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { MenuCategoryNav } from '@/components/MenuCategoryNav';
import { ProductCard } from '@/components/ProductCard';
import { ProductBottomSheet } from '@/components/ProductBottomSheet';
import { ProductCardSkeleton, CategoryTabSkeleton } from '@/components/Skeleton';
import { useCart } from '@/hooks/useCart';
import { FloatingCartBar } from '@/components/FloatingCartBar';
import { CartDrawer } from '@/components/CartDrawer';
import { SwitchOutletModal } from '@/components/SwitchOutletModal';
import {
  determineActiveCategory,
  SECTION_SCROLL_MARGIN_TOP,
} from '@/lib/category-scrollspy';
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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

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

  // Klik chip = lompat instan ke awal bagian kategori (Langkah 2)
  const handleSelectCategory = (code: string) => {
    isManualClickRef.current = true;
    setActiveCategoryCode(code);

    const element = categoryRefs.current[code];
    if (element) {
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else {
        const top = element.getBoundingClientRect().top + window.pageYOffset - SECTION_SCROLL_MARGIN_TOP;
        window.scrollTo({ top, behavior: 'auto' });
      }
    }

    // Kunci manual scroll sementara untuk menghindari konflik/kedip scrollspy tepat setelah lompat
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      isManualClickRef.current = false;
    }, 200);
  };

  // Penanda aktif mengikuti scroll manual (scrollspy) (Langkah 3)
  useEffect(() => {
    if (menuGroups.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (isManualClickRef.current) return;
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (isManualClickRef.current) return;

        // Cek apakah scroll sudah mencapai paling bawah dokumen
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 30;

        const sections = menuGroups
          .map((group) => {
            const el = categoryRefs.current[group.code];
            return el ? { code: group.code, top: el.getBoundingClientRect().top } : null;
          })
          .filter(Boolean) as { code: string; top: number }[];

        const activeCode = determineActiveCategory({
          sections,
          isAtBottom,
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
  }, [menuGroups]);

  // 1. Loading Jam Operasional
  if (isJasdorLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-stone-600 font-medium">Memeriksa operasional...</p>
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
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header dengan tombol kembali (tidak sticky di halaman outlet agar bar chip menempel tepat di tepi atas viewport) */}
      <Header showBack={true} backHref="/" backLabel="Kembali ke Cari Outlet" sticky={false} />

      {/* Loading State Outlet & Menu */}
      {isLoading && (
        <div className="p-4 space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-stone-200 animate-pulse">
            <div className="h-6 bg-stone-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-stone-100 rounded w-full mb-2" />
            <div className="h-4 bg-stone-100 rounded w-1/3" />
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
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-3 border border-amber-200">
            <span className="text-xl font-black">404</span>
          </div>
          <h1 className="text-base font-bold text-[#111111] mb-1">Outlet Tidak Ditemukan</h1>
          <p className="text-xs text-stone-600 max-w-xs mb-5">
            Outlet ini tidak terdaftar atau berada di luar jangkauan layanan Kopi Kenangan kami.
          </p>
          <Link
            href="/"
            className="min-h-[44px] px-6 py-2.5 bg-[#111111] text-[#D4AF37] font-bold text-xs rounded-xl flex items-center justify-center shadow-sm"
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
          <h2 className="text-base font-bold text-[#111111] mb-1">Gagal Memuat Outlet</h2>
          <p className="text-xs text-stone-600 max-w-xs mb-4">{errorMessage}</p>
          <Link
            href="/"
            className="min-h-[44px] px-5 py-2.5 bg-[#111111] text-[#D4AF37] font-semibold text-xs rounded-xl flex items-center justify-center"
          >
            Pilih Outlet Lain
          </Link>
        </div>
      )}

      {/* Content Outlet Menu */}
      {!isLoading && !errorMessage && outlet && (
        <div className="flex-1 flex flex-col">
          {/* Header Outlet Info Card */}
          <div className="p-4 bg-white border-b border-stone-200">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-bold text-[#111111] leading-snug">
                {outlet.name}
              </h1>
              <span
                className={`shrink-0 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  outlet.isOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {outlet.isOpen ? 'Buka Sekarang' : 'Tutup'}
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {outlet.address}
            </p>

            {outlet.openTime && outlet.closeTime && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                <span>
                  Jam buka: {outlet.openTime.slice(0, 5)} - {outlet.closeTime.slice(0, 5)} WIB
                </span>
                {outlet.phone && (
                  <>
                    <span>•</span>
                    <span>Telp: {outlet.phone}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sticky Horizontally Swipeable Menu Category Nav */}
          <MenuCategoryNav
            categories={menuGroups}
            activeCategoryCode={activeCategoryCode}
            onSelectCategory={handleSelectCategory}
          />

          {/* Daftar Produk per Kategori */}
          <div className="p-4 space-y-6 pb-28">
            {menuGroups.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center">
                <p className="text-xs text-stone-600">
                  Tidak ada menu aktif yang tersedia di outlet ini saat ini.
                </p>
              </div>
            ) : (
              menuGroups.map((group) => (
                <section
                  key={group.code}
                  id={`cat-${group.code}`}
                  ref={(el) => {
                    categoryRefs.current[group.code] = el;
                  }}
                  className="space-y-3 scroll-mt-[68px]"
                >
                  <div className="flex items-center justify-between pt-1">
                    <h2 className="text-sm font-bold text-[#111111] tracking-tight">
                      {group.name}
                    </h2>
                    <span className="text-[11px] text-stone-400">
                      {group.products.length} menu
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product.bundleCode || product.id}
                        product={product}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                </section>
              ))
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
