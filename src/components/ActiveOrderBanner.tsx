'use client';

import Link from 'next/link';
import { useMyOrders } from '@/lib/use-my-orders';
import { formatRupiah } from '@/lib/currency';
import { buildOrderPaymentUrl, getMyOrderAccessToken } from '@/lib/my-orders';

export function ActiveOrderBanner() {
  const { activePendingPaymentOrder } = useMyOrders();

  if (!activePendingPaymentOrder) {
    return null;
  }

  const orderTotalFormatted = formatRupiah(activePendingPaymentOrder.total);
  const paymentUrl = buildOrderPaymentUrl(
    activePendingPaymentOrder.id,
    getMyOrderAccessToken(activePendingPaymentOrder.id)
  );

  return (
    <div
      role="alert"
      className="w-full bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        <p className="text-xs font-medium text-[#78350F] truncate leading-tight">
          Pesanan menunggu pembayaran{' '}
          <strong className="font-extrabold text-[#92400E]">{orderTotalFormatted}</strong>
        </p>
      </div>

      <Link prefetch={false}
        href={paymentUrl}
        className="shrink-0 inline-flex items-center gap-1 px-3 py-1 bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-bold rounded-xl transition shadow-2xs active:scale-95 whitespace-nowrap"
      >
        <span>Lanjutkan Bayar</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
