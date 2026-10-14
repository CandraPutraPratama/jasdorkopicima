'use client';

import { useEffect } from 'react';

// Modul-level state untuk reference counting dan restorasi posisi scroll
let lockCount = 0;
let savedScrollY = 0;
let originalStyles = {
  position: '',
  top: '',
  left: '',
  right: '',
  width: '',
  overflow: '',
  paddingRight: '',
};

export function getScrollLockCount(): number {
  return lockCount;
}

export function lockScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount === 0) {
    // 1. Simpan posisi scroll vertikal saat ini sebelum body di-lock
    savedScrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    // 2. Hitung lebar scrollbar untuk mencegah layout shift horizontal di desktop
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // 3. Simpan style asli document.body
    originalStyles = {
      position: document.body.style.position || '',
      top: document.body.style.top || '',
      left: document.body.style.left || '',
      right: document.body.style.right || '',
      width: document.body.style.width || '',
      overflow: document.body.style.overflow || '',
      paddingRight: document.body.style.paddingRight || '',
    };

    // 4. Terapkan fixed lock yang terbukti handal di Android Chrome DAN iOS Safari
    // (iOS Safari mengabaikan overflow:hidden saja; position: fixed + top offset adalah standar industri)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
  }

  lockCount++;
}

export function unlockScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount > 0) {
    lockCount--;
  }

  if (lockCount === 0) {
    // Ambil scrollY yang tersimpan dari inline style atau variabel
    const currentTop = document.body.style.top;
    const parsedScrollY = currentTop ? Math.abs(parseInt(currentTop, 10)) : savedScrollY;

    // Kembalikan style asli
    document.body.style.position = originalStyles.position;
    document.body.style.top = originalStyles.top;
    document.body.style.left = originalStyles.left;
    document.body.style.right = originalStyles.right;
    document.body.style.width = originalStyles.width;
    document.body.style.overflow = originalStyles.overflow;
    document.body.style.paddingRight = originalStyles.paddingRight;

    // Kembalikan posisi scroll halaman katalog persis ke titik sebelum drawer dibuka
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, parsedScrollY);
    }
  }
}

/**
 * Hook reusable untuk mengunci scroll body saat overlay/modal dibuka,
 * dan mengembalikannya secara presisi ke posisi semula saat ditutup.
 */
export function useScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked) return;
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}
