'use client';

import { useState, useEffect, useRef } from 'react';
import type { MenuGroup } from '@/types/domain';

interface MenuCategoryNavProps {
  categories: MenuGroup[];
  activeCategoryCode: string;
  onSelectCategory: (categoryCode: string) => void;
}

export function MenuCategoryNav({
  categories,
  activeCategoryCode,
  onSelectCategory,
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

  // Sprint 2 Item 3.2 — Chip aktif selalu di tengah, instan tanpa smooth (behavior: 'auto')
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
      behavior: 'auto', // INSTAN — tidak ada animasi smooth (Sprint 2 Item 3.2)
    });
  }, [activeCategoryCode]);

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      aria-label="Kategori Menu"
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs"
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
                style={{ touchAction: 'manipulation' }}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-[#111111] text-[#D4AF37] shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Fade gradient kanan: HANYA saat masih ada chip tersembunyi di kanan (Langkah 4) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-200 z-10 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </nav>
  );
}
