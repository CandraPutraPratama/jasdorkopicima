'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  isOpen?: boolean;
  sticky?: boolean;
}

export function Header({
  showBack = false,
  backHref = '/',
  backLabel = 'Kembali',
  isOpen,
  sticky = true,
}: HeaderProps) {
  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-30' : 'relative z-10'
      } bg-[#FBF8F4]/95 backdrop-blur-md border-b border-[#EFE5D8] px-4 py-2.5 flex items-center justify-between min-h-[58px] transition-colors`}
    >
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            href={backHref}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#4A3225] hover:text-[#26150B] active:scale-95 transition -ml-2 rounded-xl"
            aria-label={backLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D9A74A]/40 shadow-xs bg-[#26150B] shrink-0">
              <Image
                src="/brand/logo-cima.webp"
                alt="Jasdor Logo"
                fill
                sizes="32px"
                className="object-contain p-0.5 group-hover:scale-105 transition"
                priority
              />
            </div>
            <div>
              <span className="font-display text-base font-extrabold tracking-tight text-[#26150B] block leading-tight">
                jasdorkopicima
              </span>
              <span className="text-[10px] text-[#A66908] font-bold tracking-wider block leading-none uppercase">
                JASTIP KOPI KENANGAN
              </span>
            </div>
          </Link>
        )}
      </div>

      {showBack && (
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#D9A74A]/40 bg-[#26150B] shrink-0">
            <Image
              src="/brand/logo-cima.webp"
              alt="Jasdor Logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <span className="font-display text-sm font-bold text-[#26150B]">jasdorkopicima</span>
        </Link>
      )}

      {isOpen !== undefined && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F4EDE3] rounded-full border border-[#E5DACB]">
          <span
            className={`w-2 h-2 rounded-full ${
              isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#4A3225]">
            {isOpen ? 'Buka' : 'Tutup'}
          </span>
        </div>
      )}
    </header>
  );
}
