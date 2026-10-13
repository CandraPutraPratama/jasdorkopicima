'use client';

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
  if (!categories || categories.length === 0) return null;

  return (
    <div className="sticky top-[58px] z-20 bg-white/95 backdrop-blur border-b border-stone-200 shadow-2xs">
      <div className="flex gap-2 overflow-x-auto p-2.5 no-scrollbar scroll-smooth">
        {categories.map((category) => {
          const isActive = category.code === activeCategoryCode;
          return (
            <button
              key={category.code}
              type="button"
              onClick={() => onSelectCategory(category.code)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 shrink-0 ${
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
    </div>
  );
}
