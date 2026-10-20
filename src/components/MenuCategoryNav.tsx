'use client';

import { useState, useEffect, useRef } from 'react';
import type { MenuGroup } from '@/types/domain';

interface MenuCategoryNavProps {
  categories: MenuGroup[];
  activeCategoryCode: string;
  onSelectCategory: (categoryCode: string) => void;
  stickyTopClass?: string;
}

export function MenuCategoryNav({
  categories,
  activeCategoryCode,
  onSelectCategory,
  stickyTopClass,
}: MenuCategoryNavProps) {
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Cek apakah masih ada chip tersembunyi di sisi kanan deretan (Langkah 4)
  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // Toleransi 4px untuk menangani pembulatan subpixel browser
    const hasMoreRight = el.scrollWidth - el.scrollLeft - el.clientWidth > 4;
    setCanScrollRight(hasMoreRight);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => {
      window.removeEventListener('resize', checkScrollability);
    };
  }, [categories]);

  // Sprint 2 Item 3.2 - Chip aktif selalu di tengah, instan tanpa smooth (behavior: 'auto')
  useEffect(() => {
    if (!activeCategoryCode) return;
    const container = scrollContainerRef.current;
    const chip = chipRefs.current[activeCategoryCode];
    if (!container || !chip) return;

    const containerWidth = container.clientWidth;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;
    const maxScroll = container.scrollWidth - containerWidth;

    // Hitung posisi tengah: chip berada di tengah viewport container
    const targetLeft = chipLeft - (containerWidth - chipWidth) / 2;
    // Jepit ke [0, maxScroll] agar tidak melampaui batas
    const clampedLeft = Math.max(0, Math.min(targetLeft, maxScroll));

    container.scrollTo({
      left: clampedLeft,
      behavior: 'auto', // INSTAN - tidak ada animasi smooth (Sprint 2 Item 3.2)
    });
  }, [activeCategoryCode]);

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      aria-label="Kategori Menu"
      /* sticky top-0 z-20 */
      className={`sticky ${stickyTopClass || 'top-0'} z-20 bg-[#FAF4E8] border-b-2 border-[#2B1D12] shadow-xs`}
    >
      <div className="relative">
        {/* Deretan Chip Kategori dengan scroll horizontal tanpa scrollbar */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-2 overflow-x-auto p-2.5 no-scrollbar"
        >
          {categories.map((category) => {
            const isActive = category.code === activeCategoryCode;
            const isFavorit = category.code === 'favorit';
            const isRekomendasi = isFavorit && category.name.includes('Rekomendasi');

            return (
              <button
                key={category.code}
                id={`chip-${category.code}`}
                ref={(el) => {
                  chipRefs.current[category.code] = el;
                }}
                type="button"
                onClick={() => onSelectCategory(category.code)}
                aria-pressed={isActive}
                aria-label={category.name}
                style={{ touchAction: 'manipulation' }}
                className={`min-h-[44px] px-4 py-2 rounded-xl font-display text-xs font-black whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 flex items-center justify-center transition-all border-2 border-[#2B1D12] ${
                  isActive
                    ? 'bg-[#2B1D12] text-[#FAF4E8] shadow-[2px_2px_0px_#C67D0A]'
                    : 'bg-[#FFFDF9] text-[#2B1D12] hover:bg-[#FFE7D6] shadow-[2px_2px_0px_#2B1D12]'
                }`}
              >
                {isFavorit && !isRekomendasi ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                        isActive ? 'fill-[#FAF4E8] text-[#FAF4E8]' : 'fill-[#DC2626] text-[#DC2626]'
                      }`}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>{category.name}</span>
                  </span>
                ) : (
                  category.name
                )}
              </button>
            );
          })}
        </div>

        {/* Fade gradient kanan: HANYA saat masih ada chip tersembunyi di kanan */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-[#FAF4E8] via-[#FAF4E8]/80 to-transparent transition-opacity duration-200 z-10 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </nav>
  );
}
