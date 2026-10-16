'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getAdminWhatsAppUrl } from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

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
  brandName?: string;
  brandSub?: string;
  chatMessage?: string;
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
  brandName,
  brandSub,
  chatMessage,
}: HeaderProps) {
  const shouldShowChatAdmin = showChatAdmin ?? !showBack;

  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-20' : 'relative z-10'
      } bg-[#FBF8F4] border-b border-[#EFE5D8] px-3 py-1.5 flex items-center justify-between min-h-[50px] h-[50px] transition-colors`}
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
            <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <Image
                src="/brand/logo-cima.webp"
                alt="Cima Group Logo"
                fill
                sizes="36px"
                className="object-contain group-hover:scale-105 transition"
                priority
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display text-base font-extrabold tracking-tight text-[#26150B] block leading-tight">
                {brandName || 'jasdorkopicima'}
              </span>
              <span className="text-[10px] text-[#A66908] font-bold tracking-wider block leading-none uppercase mt-0.5">
                {brandSub || 'JASA ORDER KOPI KENANGAN'}
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
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
            <Image
              src="/brand/logo-cima.webp"
              alt="Cima Group Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-display text-sm font-bold text-[#26150B]">jasdorkopicima</span>
        </Link>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        {shouldShowChatAdmin && (
          <a
            href={getAdminWhatsAppUrl(chatMessage || 'Halo Admin Jasdor, saya butuh info jasa order Kopi Kenangan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-full transition active:scale-95 shadow-xs"
            title="Chat Admin WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-[#15803D] shrink-0" />
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
