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
      className={`sticky ${stickyTopClass || 'top-0'} z-20 bg-[#FBF8F4] border-b border-[#EFE5D8] shadow-2xs`}
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
                aria-label={isFavorit ? 'Kategori Favorit' : category.name}
                style={{ touchAction: 'manipulation' }}
                className={`min-h-[44px] ${
                  isFavorit ? 'px-3.5' : 'px-4'
                } py-2 rounded-full font-display text-xs font-bold whitespace-nowrap active:scale-95 shrink-0 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#26150B] text-[#FBBF24] shadow-xs'
                    : 'bg-[#F2EAE0] text-[#5C4638] hover:bg-[#EAE0D3]'
                }`}
              >
                {isFavorit ? (
                  <svg
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'fill-[#FBBF24] text-[#FBBF24]' : 'fill-[#E11D48] text-[#E11D48]'
                    }`}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
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
          className={`pointer-events-none absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-[#FBF8F4] via-[#FBF8F4]/80 to-transparent transition-opacity duration-200 z-10 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </nav>
  );
}
