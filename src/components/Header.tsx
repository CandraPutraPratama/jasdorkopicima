'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getAdminWhatsAppUrl } from '@/lib/site-config';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  isOpen?: boolean;
  sticky?: boolean;
  title?: string;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'rose' | 'amber';
  showChatAdmin?: boolean;
}

export function Header({
  showBack = false,
  backHref = '/',
  backLabel = 'Kembali',
  isOpen,
  sticky = true,
  title,
  badgeText,
  badgeVariant = 'emerald',
  showChatAdmin,
}: HeaderProps) {
  const shouldShowChatAdmin = showChatAdmin ?? !showBack;

  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-20' : 'relative z-10'
      } bg-[#FBF8F4]/98 backdrop-blur-md border-b border-[#EFE5D8] px-3 py-1.5 flex items-center justify-between min-h-[50px] h-[50px] transition-colors`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack ? (
          <Link
            href={backHref}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#4A3225] hover:text-[#26150B] active:scale-95 transition -ml-1 rounded-xl shrink-0"
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

        {/* Jika ada title khusus (misalnya nama outlet pada compact sticky header) */}
        {title && (
          <div className="flex-1 min-w-0 pr-1">
            <h1 className="font-display font-bold text-sm text-[#26150B] truncate leading-tight">
              {title}
            </h1>
          </div>
        )}
      </div>

      {showBack && !title && (
        <Link href="/" className="flex items-center gap-2 mr-2">
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

      <div className="flex items-center gap-1.5 shrink-0">
        {shouldShowChatAdmin && (
          <a
            href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya butuh info jastip Kopi Kenangan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-full transition active:scale-95 shadow-xs"
            title="Chat Admin WhatsApp"
          >
            <svg
              className="w-3.5 h-3.5 fill-[#16A34A]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.449.741.963 1.2 1.344 1.198 1.579 1.242 1.802 1.144.173-.076.549-.636.694-.853.145-.217.29-.181.488-.108.199.072 1.26.594 1.476.702.217.108.362.163.415.253.053.09.053.52-.091.925z" />
            </svg>
            <span className="hidden sm:inline">Chat Admin</span>
            <span className="sm:hidden text-[10px]">Chat</span>
          </a>
        )}

        {badgeText ? (
          <span
            className={`shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
              badgeVariant === 'emerald'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {badgeText}
          </span>
        ) : isOpen !== undefined ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EDE3] rounded-full border border-[#E5DACB]">
            <span
              className={`w-2 h-2 rounded-full ${
                isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-[#4A3225]">
              {isOpen ? 'Buka' : 'Tutup'}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
