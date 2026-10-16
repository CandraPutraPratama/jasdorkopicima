'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMyOrders } from '@/lib/use-my-orders';
import { formatRupiah } from '@/lib/currency';
import { formatCountdownTimer } from '@/lib/my-orders';

function ActiveOrderCountdown({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const targetMs = new Date(expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = secondsLeft < 300; // < 5 menit

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
        isUrgent ? 'text-rose-600 animate-pulse' : 'text-amber-800'
      }`}
      suppressHydrationWarning
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatCountdownTimer(secondsLeft)}</span>
    </span>
  );
}

function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function MyOrdersView() {
  const { activeOrders, historyOrders, isLoading, refresh } = useMyOrders();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const totalOrdersCount = activeOrders.length + historyOrders.length;

  return (
    <div className="space-y-5">
      {/* Baris Judul & Tombol Refresh */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-display font-extrabold text-lg text-[#26150B] tracking-tight">
            Pesanan Saya
          </h2>
          <p className="text-xs text-[#735F52]">
            Daftar pesanan aktif dan riwayat dari perangkat ini
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5A4537] bg-white hover:bg-[#F2EAE0] border border-[#E0D4C5] rounded-xl transition active:scale-95 shadow-2xs disabled:opacity-50"
          title="Perbarui Status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-700' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-[11px]">{isRefreshing ? 'Memuat...' : 'Segarkan'}</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && totalOrdersCount === 0 && (
        <div className="space-y-3">
          <div className="h-32 bg-[#F2EAE0]/70 rounded-2xl animate-pulse" />
          <div className="h-24 bg-[#F2EAE0]/50 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && totalOrdersCount === 0 && (
        <div className="bg-white border border-[#EFE5D8] rounded-2xl p-7 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF5EE] border border-[#EBE0D2] flex items-center justify-center text-[#9C8271]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[#26150B]">
              Belum Ada Pesanan
            </h3>
            <p className="text-xs text-[#735F52] max-w-xs mx-auto leading-relaxed">
              Pesanan jasa order yang kamu buat dari perangkat ini akan muncul di sini secara otomatis.
            </p>
          </div>

          <Link
            href="/kopi-kenangan"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] font-display font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            Mulai Pesan Kopi Kenangan
          </Link>
        </div>
      )}

      {/* Bagian 1: Pesanan AKTIF (Di Bagian Atas) */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-display font-bold text-sm text-[#26150B] uppercase tracking-wider">
              Pesanan Berjalan ({activeOrders.length})
            </h3>
          </div>

          <div className="space-y-3">
            {activeOrders.map((order) => {
              const isPendingPayment = order.status === 'menunggu_pembayaran';
              const isWaitingConfirm = order.status === 'menunggu_konfirmasi';

              return (
                <div
                  key={order.id}
                  className="bg-white border-2 border-[#FDE68A] rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#26150B]">
                          #{order.id}
                        </span>
                        <span className="text-[10px] text-[#8C7667]">
                          {formatDateIndo(order.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#4A3225] mt-1 flex items-center gap-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-[#B45309] shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">{order.outlet_name || 'Outlet Kopi Kenangan'}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right shrink-0">
                      {isPendingPayment && (
                        <div className="inline-flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Menunggu Pembayaran
                          </span>
                          {order.expires_at && (
                            <ActiveOrderCountdown expiresAt={order.expires_at} />
                          )}
                        </div>
                      )}

                      {isWaitingConfirm && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                          Menunggu Konfirmasi Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Item & Total */}
                  <div className="pt-2 border-t border-[#F4EDE3] flex items-center justify-between text-xs">
                    <span className="text-[#735F52]">
                      {order.items?.length || 0} item pesanan
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8C7667] block leading-none">Total Tagihan</span>
                      <span className="font-display font-extrabold text-sm text-[#92400E]">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Lanjutkan ke Pembayaran */}
                  <Link
                    href={`/bayar/${encodeURIComponent(order.id)}`}
                    className="w-full min-h-[42px] px-4 py-2.5 bg-[#26150B] hover:bg-[#3D2313] text-[#FBBF24] font-display font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>
                      {isPendingPayment ? 'Lanjutkan Pembayaran' : 'Lihat Status & Konfirmasi'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bagian 2: Riwayat Pesanan (Di Bawah) */}
      {historyOrders.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-bold text-sm text-[#4A3225] uppercase tracking-wider">
            Riwayat Pesanan ({historyOrders.length})
          </h3>

          <div className="space-y-2.5">
            {historyOrders.map((order) => {
              const isProcessed = order.status === 'diproses';
              const isCancelled = order.status === 'dibatalkan';
              const isExpired = order.status === 'kedaluwarsa';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#EFE5D8] rounded-xl p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#26150B]">
                      #{order.id}
                    </span>

                    {/* Status Badge */}
                    {isProcessed && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Diproses
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Dibatalkan
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        Kedaluwarsa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#735F52]">
                    <div className="truncate pr-2">
                      <p className="font-medium text-[#26150B] truncate">
                        {order.outlet_name || 'Outlet Kopi Kenangan'}
                      </p>
                      <p className="text-[10px] text-[#A69485]">
                        {formatDateIndo(order.created_at)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-bold text-xs text-[#26150B]">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F4EDE3] flex items-center justify-between">
                    <span className="text-[11px] text-[#8C7667]">
                      {order.items?.length || 0} menu
                    </span>

                    <Link
                      href={`/bayar/${encodeURIComponent(order.id)}`}
                      className="text-[11px] font-bold text-[#A66908] hover:text-[#7A4B03] underline underline-offset-2"
                    >
                      Lihat Rincian
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
