'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  isOpen?: boolean;
}

export function Header({
  showBack = false,
  backHref = '/',
  backLabel = 'Kembali',
  isOpen,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center justify-between min-h-[58px]">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            href={backHref}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 hover:text-black active:scale-95 transition -ml-2"
            aria-label={backLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-200 shadow-xs">
              <Image
                src="/brand/logo-cima.webp"
                alt="Jasdor Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#111111] block leading-tight">
                jasdorkopicima
              </span>
              <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wide block leading-none">
                JASTIP DISKON 50%
              </span>
            </div>
          </Link>
        )}
      </div>

      {showBack && (
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-200">
            <Image
              src="/brand/logo-cima.webp"
              alt="Jasdor Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-bold text-[#111111]">jasdorkopicima</span>
        </Link>
      )}

      {isOpen !== undefined && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full border border-stone-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-medium text-stone-700">
            {isOpen ? 'Buka' : 'Tutup'}
          </span>
        </div>
      )}
    </header>
  );
}
