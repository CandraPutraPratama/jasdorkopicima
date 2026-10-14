/**
 * Logika dan konstanta pendukung navigasi kategori (Sprint 2 Item 3).
 * Menghitung kategori aktif berdasarkan posisi scroll (scrollspy) dan
 * menyediakan konstanta offset yang seragam.
 */

export const CHIP_BAR_HEIGHT = 58;
export const SECTION_SCROLL_MARGIN_TOP = 68;
export const SCROLLSPY_TOP_OFFSET = 72;

export interface SectionPosition {
  code: string;
  top: number;
}

export interface DetermineActiveCategoryOptions {
  sections: SectionPosition[];
  isAtBottom?: boolean;
  topOffset?: number;
}

/**
 * Menentukan kode kategori aktif berdasarkan posisi section terhadap viewport.
 * - Jika scroll sudah mencapai dasar dokumen, kategori terakhir selalu aktif.
 * - Jika tidak, kategori yang paling bawah yang posisinya sudah melewati / mencapai topOffset adalah yang aktif.
 * - Fallback ke kategori pertama jika belum ada yang mencapai threshold.
 */
export function determineActiveCategory({
  sections,
  isAtBottom = false,
  topOffset = SCROLLSPY_TOP_OFFSET,
}: DetermineActiveCategoryOptions): string {
  if (!sections || sections.length === 0) return '';

  // 1. Jika halaman di-scroll hingga mentok dasar, aktifkan kategori terakhir
  if (isAtBottom) {
    return sections[sections.length - 1].code;
  }

  // 2. Kategori pertama sebagai default
  let activeCode = sections[0].code;

  // 3. Cari section terjauh ke bawah yang top-nya sudah melewati ambang batas sticky bar
  for (const section of sections) {
    if (section.top <= topOffset + 15) {
      activeCode = section.code;
    }
  }

  return activeCode;
}
