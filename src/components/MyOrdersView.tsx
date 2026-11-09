'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMyOrders } from '@/lib/use-my-orders';
import { formatRupiah } from '@/lib/currency';
import { formatCountdownTimer, buildOrderPaymentUrl, getMyOrderAccessToken } from '@/lib/my-orders';
import { executeReorder } from '@/lib/reorder';

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
  const router = useRouter();
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
          <h2 className="font-display font-black text-lg text-[#2B1D12] tracking-tight">
            Pesanan Saya
          </h2>
          <p className="text-xs text-[#6A584D] font-medium">
            Daftar pesanan aktif dan riwayat dari perangkat ini
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2B1D12] bg-white hover:bg-[#FFF8E7] border-2 border-[#2B1D12] rounded-xl transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_#2B1D12] disabled:opacity-50"
          title="Perbarui Status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C67D0A]' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
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
          <div className="h-32 bg-[#EFE5D8] border-2 border-[#D4C3B2] rounded-2xl animate-pulse" />
          <div className="h-24 bg-[#EFE5D8] border-2 border-[#D4C3B2] rounded-2xl animate-pulse" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && totalOrdersCount === 0 && (
        <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-7 text-center space-y-4 shadow-[4px_4px_0px_#2B1D12]">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF0C2] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center text-[#2B1D12]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-black text-base text-[#2B1D12]">
              Belum Ada Pesanan
            </h3>
            <p className="text-xs text-[#6A584D] max-w-xs mx-auto leading-relaxed font-medium">
              Pesanan jasa order yang kamu buat dari perangkat ini akan muncul di sini secara otomatis.
            </p>
          </div>

          <Link prefetch={false}
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#2B1D12] text-[#FAF4E8] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Pilih Brand & Mulai Pesan
          </Link>
        </div>
      )}

      {/* Bagian 1: Pesanan AKTIF (Di Bagian Atas) */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C67D0A] animate-pulse" />
            <h3 className="font-display font-black text-sm text-[#2B1D12] uppercase tracking-wider">
              Pesanan Berjalan ({activeOrders.length})
            </h3>
          </div>

          <div className="space-y-3">
            {activeOrders.map((order) => {
              const isPendingPayment = order.status === 'menunggu_pembayaran';
              const isWaitingConfirm = order.status === 'menunggu_konfirmasi';
              const isInQueue = order.status === 'antrian';

              return (
                <div
                  key={order.id}
                  className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[4px_4px_0px_#2B1D12] space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#2B1D12]">
                          #{order.id}
                        </span>
                        <span className="text-[10px] text-[#6A584D] font-bold">
                          {formatDateIndo(order.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#2B1D12] mt-1 flex items-center gap-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-[#C67D0A] shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
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
                        <span className="truncate">{order.outlet_name || 'Outlet Pilihan'}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right shrink-0">
                      {isPendingPayment && (
                        <div className="inline-flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#FFF0C2] text-[#2B1D12] border-2 border-[#2B1D12]">
                            Menunggu Pembayaran
                          </span>
                          {order.expires_at && (
                            <ActiveOrderCountdown expiresAt={order.expires_at} />
                          )}
                        </div>
                      )}

                      {isWaitingConfirm && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#DDF0FF] text-[#2B1D12] border-2 border-[#2B1D12]">
                          Menunggu Konfirmasi Admin
                        </span>
                      )}

                      {isInQueue && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#E0E7FF] text-[#2B1D12] border-2 border-[#2B1D12]">
                          Dalam Antrian
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Item & Total */}
                  <div className="pt-2 border-t-2 border-[#2B1D12] flex items-center justify-between text-xs">
                    <span className="text-[#6A584D] font-bold">
                      {order.items?.length || 0} item pesanan
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] text-[#6A584D] block leading-none font-bold">Total Tagihan</span>
                      <span className="font-display font-black text-sm text-[#DC2626]">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Lanjutkan ke Pembayaran */}
                  <Link prefetch={false}
                    href={buildOrderPaymentUrl(order.id, getMyOrderAccessToken(order.id))}
                    className="w-full min-h-[42px] px-4 py-2.5 bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] transition hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
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
                      strokeWidth={2.5}
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
          <h3 className="font-display font-black text-sm text-[#2B1D12] uppercase tracking-wider">
            Riwayat Pesanan ({historyOrders.length})
          </h3>

          <div className="space-y-2.5">
            {historyOrders.map((order) => {
              const isProcessed = order.status === 'diproses';
              const isCompleted = order.status === 'selesai';
              const isCancelled = order.status === 'dibatalkan';
              const isExpired = order.status === 'kedaluwarsa';

              return (
                <div
                  key={order.id}
                  className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[3px_3px_0px_#2B1D12] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs text-[#2B1D12]">
                      #{order.id}
                    </span>

                    {/* Status Badge */}
                    {isProcessed && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#D9F3EA] text-[#15803D] border-2 border-[#15803D]">
                        Diproses
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-600 text-white border-2 border-emerald-700">
                        Selesai
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#FFEBEB] text-[#DC2626] border-2 border-[#DC2626]">
                        Dibatalkan
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EFE5D8] text-[#6A584D] border-2 border-[#2B1D12]">
                        Kedaluwarsa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#2B1D12]">
                    <div className="truncate pr-2">
                      <p className="font-bold text-[#2B1D12] truncate">
                        {order.outlet_name || 'Outlet Pilihan'}
                      </p>
                      <p className="text-[10px] text-[#6A584D] font-medium">
                        {formatDateIndo(order.created_at)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-black text-xs text-[#2B1D12]">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-[#2B1D12] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6A584D] font-bold">
                        {order.items?.length || 0} menu
                      </span>
                      <span className="text-[#6A584D]">•</span>
                      <Link prefetch={false}
                        href={buildOrderPaymentUrl(order.id, getMyOrderAccessToken(order.id))}
                        className="text-[11px] font-black text-[#C67D0A] hover:underline underline-offset-2"
                      >
                        Lihat Rincian
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => executeReorder(order, router)}
                      className="px-3 py-1 rounded-xl bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-[11px] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] hover:bg-[#3D2A1C] transition flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Pesan Lagi</span>
                    </button>
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
