'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getAdminWhatsAppUrl } from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { useMyOrders } from '@/lib/use-my-orders';

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
  showMyOrders?: boolean;
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
  showMyOrders = true,
  brandName,
  brandSub,
  chatMessage,
}: HeaderProps) {
  const shouldShowChatAdmin = showChatAdmin ?? !showBack;
  const { activeCount } = useMyOrders();

  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-20' : 'relative z-10'
      } bg-[#FAF4E8] border-b-2 border-[#2B1D12] px-3 py-1.5 flex items-center justify-between min-h-[52px] h-[52px] transition-colors`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack ? (
          <Link prefetch={false}
            href={backHref}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#2B1D12] hover:text-[#C67D0A] active:scale-95 transition -ml-1 rounded-xl shrink-0"
            aria-label={backLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link prefetch={false} href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] shrink-0 flex items-center justify-center bg-[#FFFDF9]">
              <Image
                src="/logo-jasdorkopicima.png"
                alt="Jasdor Kopi Cima Logo"
                fill
                sizes="36px"
                className="object-contain group-hover:scale-105 transition"
                priority
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display text-base font-black tracking-tight text-[#2B1D12] block leading-tight">
                {brandName || 'jasdorkopicima'}
              </span>
              <span className="font-display text-[11px] text-[#C67D0A] font-black tracking-tight block leading-none mt-0.5 whitespace-nowrap">
                {brandSub || 'LAYANAN JASA ORDER'}
              </span>
            </div>
          </Link>
        )}

        {/* Jika ada title khusus (misalnya nama outlet pada compact sticky header) */}
        {title && (
          <div className="flex-1 min-w-0 pr-1">
            <h1 className="font-display font-black text-sm text-[#2B1D12] truncate leading-tight">
              {title}
            </h1>
          </div>
        )}
      </div>

      {showBack && !title && (
        <Link prefetch={false} href="/" className="flex items-center gap-2 mr-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] shrink-0 flex items-center justify-center bg-[#FFFDF9]">
            <Image
              src="/logo-jasdorkopicima.png"
              alt="Jasdor Kopi Cima Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-display text-sm font-black text-[#2B1D12]">jasdorkopicima</span>
        </Link>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {showMyOrders && title !== 'Pesanan Saya' && (
          <Link prefetch={false}
            href="/pesanan-saya"
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold text-[#2B1D12] bg-[#FFFDF9] hover:bg-[#FFE7D6] border-2 border-[#2B1D12] rounded-xl transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_#2B1D12] min-h-[36px]"
            title="Pesanan Saya"
            aria-label="Pesanan Saya"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 text-[#2B1D12] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="hidden xs:inline sm:inline">Pesanan</span>
            {activeCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#DC2626] text-white text-[9px] font-black rounded-full border border-[#2B1D12] shadow-xs"
                suppressHydrationWarning
              >
                {activeCount}
              </span>
            )}
          </Link>
        )}

        {shouldShowChatAdmin && (
          <a
            href={getAdminWhatsAppUrl(chatMessage || 'Halo Admin Jasdor, saya butuh info layanan jasa order.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold text-white bg-[#15803D] hover:bg-[#166534] border-2 border-[#2B1D12] rounded-xl transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_#2B1D12] min-h-[36px]"
            title="Chat Admin WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="hidden sm:inline">Chat Admin</span>
            <span className="sm:hidden text-[10px]">Chat</span>
          </a>
        )}

        {badgeText ? (
          <span
            className={`shrink-0 px-2.5 py-1 text-[10px] font-black rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] ${
              badgeVariant === 'emerald'
                ? 'bg-[#D9F3EA] text-[#2B1D12]'
                : 'bg-[#FEF2F2] text-[#DC2626]'
            }`}
          >
            {badgeText}
          </span>
        ) : isOpen !== undefined ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFDF9] rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
            <span
              className={`w-2 h-2 rounded-full border border-[#2B1D12] ${
                isOpen ? 'bg-[#15803D]' : 'bg-[#DC2626]'
              }`}
            />
            <span className="text-[11px] font-bold text-[#2B1D12]">
              {isOpen ? 'Buka' : 'Tutup'}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
