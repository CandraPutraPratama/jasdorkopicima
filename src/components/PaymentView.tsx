'use client';

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import Link from 'next/link';
import type { OrderRecord, OrderStatus } from '@/types/order';
import { formatRupiah } from '@/lib/currency';
import { getOrderBreakdown } from '@/lib/pricing';
import { QRIS_CONFIG, SITE_CONFIG } from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { buildOrderWhatsAppConfirmationMessage } from '@/lib/whatsapp';
import { saveMyOrder } from '@/lib/my-orders';
import { AutoCheck } from '@/components/AutoCheck';
import { fetchQueueStatus } from '@/hooks/useQueueStatus';
import { estimateQueueMinutes, type QueueStatus } from '@/lib/queue';
import {
  calculateBrewDurationMinutes,
  getBrewingProgress,
  type BrewingProgress,
} from '@/lib/brewing';
import {
  buildEmergencyExpiredWhatsAppUrl,
  playOrderNotificationSound,
  triggerDeviceVibration,
  startTitleFlash,
} from '@/lib/order-notifications';

interface PaymentViewProps {
  initialOrder: OrderRecord;
  /** Token akses pesanan untuk mengotorisasi polling status & konfirmasi bayar. */
  accessToken?: string | null;
}

export function PaymentView({ initialOrder, accessToken }: PaymentViewProps) {
  const [order, setOrder] = useState<OrderRecord>(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(() => {
    const isPast = new Date(initialOrder.expires_at).getTime() <= Date.now();
    if (isPast && initialOrder.status === 'menunggu_pembayaran') {
      return 'kedaluwarsa';
    }
    return initialOrder.status;
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    const expiresAtMs = new Date(initialOrder.expires_at).getTime();
    return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  });
  const [isCopiedAmount, setIsCopiedAmount] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isCaraBayarOpen, setIsCaraBayarOpen] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [, startTransition] = useTransition();
  const prevStatusRef = useRef<OrderStatus>(initialOrder.status);
  const hasAlertedBrewDoneRef = useRef<boolean>(false);
  const breakdown = getOrderBreakdown(order.items, order.fee);
  const tokenQuery = accessToken ? `?t=${encodeURIComponent(accessToken)}` : '';

  // Estimasi durasi racik barista berbasis jumlah item
  const brewDurationMinutes = useMemo(() => calculateBrewDurationMinutes(order.items), [order.items]);

  // Timestamp awal peracikan (disinkronkan dengan localStorage agar refresh tidak me-reset timer)
  const [brewStartTimeMs, setBrewStartTimeMs] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`jasdor_brew_start_${initialOrder.id}`);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
      if (initialOrder.status === 'selesai') {
        const start = initialOrder.updated_at ? new Date(initialOrder.updated_at).getTime() : Date.now();
        localStorage.setItem(`jasdor_brew_start_${initialOrder.id}`, String(start));
        return start;
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }
    return null;
  });

  // State progres barista meracik kopi
  const [brewProgress, setBrewProgress] = useState<BrewingProgress>(() => {
    if (initialOrder.status === 'selesai' && brewStartTimeMs) {
      return getBrewingProgress(brewStartTimeMs, brewDurationMinutes);
    }
    return {
      remainingSeconds: 0,
      elapsedSeconds: 0,
      progressPercent: 0,
      isBrewing: false,
    };
  });

  // Sinkronisasi waktu mulai brewing saat status berubah jadi 'selesai'
  useEffect(() => {
    if (status === 'selesai' && !brewStartTimeMs) {
      let startTime = Date.now();
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(`jasdor_brew_start_${order.id}`) : null;
        if (stored) {
          const parsed = Number(stored);
          if (!Number.isNaN(parsed) && parsed > 0) {
            setBrewStartTimeMs(parsed);
            return;
          }
        }
        startTime = order.updated_at ? new Date(order.updated_at).getTime() : Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem(`jasdor_brew_start_${order.id}`, String(startTime));
        }
      } catch {
        // Fallback jika localStorage bermasalah
      }
      setBrewStartTimeMs(startTime);
    }
  }, [status, order.id, order.updated_at, brewStartTimeMs]);

  // Timer interval live countdown saat barista sedang meracik
  useEffect(() => {
    if (status !== 'selesai' || !brewStartTimeMs) {
      return;
    }

    setBrewProgress(getBrewingProgress(brewStartTimeMs, brewDurationMinutes));

    const interval = setInterval(() => {
      const current = getBrewingProgress(brewStartTimeMs, brewDurationMinutes);
      setBrewProgress(current);
      if (!current.isBrewing) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, brewStartTimeMs, brewDurationMinutes]);

  // Feedback notifikasi audio, getar & title flash saat status berubah ke diproses / selesai
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== status) {
      prevStatusRef.current = status;
      if (status === 'diproses' || status === 'selesai') {
        playOrderNotificationSound();
        triggerDeviceVibration([200, 100, 200]);
        if (status === 'selesai') {
          const stop = startTitleFlash('☕ Kopi Sedang Diracik! | Jasdor Cima', 'Jasdor Kopi Cima');
          return stop;
        }
      }
    }
  }, [status]);

  // Feedback notifikasi saat racikan kopi barista selesai (waktu racik habis -> siap ditanya ke barista)
  useEffect(() => {
    if (status === 'selesai' && !brewProgress.isBrewing && !hasAlertedBrewDoneRef.current) {
      hasAlertedBrewDoneRef.current = true;
      playOrderNotificationSound();
      triggerDeviceVibration([300, 150, 300, 150, 300]);
      const stop = startTitleFlash('🔔 Kopi Siap Diambil! | Jasdor Cima', 'Jasdor Kopi Cima');
      return stop;
    }
  }, [status, brewProgress.isBrewing]);

  // Muat status antrean untuk estimasi dinamis di pesan konfirmasi WhatsApp
  useEffect(() => {
    let cancelled = false;
    fetchQueueStatus().then((data) => {
      if (!cancelled && data) {
        setQueueStatus(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch / cek status terbaru pesanan dari server
  const checkLatestStatus = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshingStatus(true);
    }
    // Segarkan juga status antrean bersamaan dengan polling status pesanan
    fetchQueueStatus().then((data) => {
      if (data) {
        setQueueStatus(data);
      }
    });
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}${tokenQuery}`,
        {
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          startTransition(() => {
            setOrder(data.order);
            setStatus(data.order.status);
          });
        }
      }
    } catch (err) {
      console.warn('[PaymentView] Gagal memeriksa status terbaru:', err);
    } finally {
      if (isManual) {
        setIsRefreshingStatus(false);
      }
    }
  }, [order.id, tokenQuery]);

  // Simpan ke Pesanan Saya di perangkat ini
  useEffect(() => {
    if (order?.id) {
      saveMyOrder(order.id, order.created_at, undefined, accessToken ?? undefined);
    }
  }, [order?.id, order?.created_at, accessToken]);

  // Hitung sisa waktu kedaluwarsa secara live
  useEffect(() => {
    const expiresAtMs = new Date(order.expires_at).getTime();

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        setStatus((curr) => (curr === 'menunggu_pembayaran' ? 'kedaluwarsa' : curr));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order.expires_at]);

  // Format detik menjadi MM:SS
  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(String(order.total));
      setIsCopiedAmount(true);
      setTimeout(() => setIsCopiedAmount(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setIsCopiedId(true);
      setTimeout(() => setIsCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handler tombol "Saya Sudah Bayar"
  const handleConfirmPaid = async () => {
    setIsSubmittingConfirm(true);
    setConfirmError(null);

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/confirm-payment${tokenQuery}`,
        {
          method: 'POST',
        }
      );
      let data: any;
      try {
        data = await res.json();
      } catch {
        // Server mengembalikan respons non-JSON. Jangan tampilkan "Unexpected token" ke pelanggan.
        throw new Error('Gagal mengonfirmasi pembayaran. Silakan coba beberapa saat lagi.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengonfirmasi status pembayaran');
      }

      startTransition(() => {
        setOrder(data.order);
        setStatus(data.order.status);
      });
    } catch (err: any) {
      setConfirmError(err.message || 'Terjadi kesalahan saat mengonfirmasi pembayaran.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Pesan pre-filled WhatsApp (dengan estimasi antrean dinamis bila tersedia).
  // Info antrean menghitung order 'antrian' dan 'diproses', jadi order ini sendiri
  // hanya dikeluarkan dari hitungan "di depan" bila ia sudah masuk antrean/diproses.
  const selfInQueue = status === 'antrian' || status === 'diproses';
  const queueAhead = queueStatus
    ? Math.max(queueStatus.activeOrders - (selfInQueue ? 1 : 0), 0)
    : undefined;
  const resolvedAccessToken = order.access_token ?? accessToken ?? undefined;
  const waConfirmText = buildOrderWhatsAppConfirmationMessage(
    queueStatus && queueAhead !== undefined
      ? {
          ...order,
          access_token: resolvedAccessToken,
          queueAhead,
          queueEstimateMinutes: estimateQueueMinutes(queueAhead),
        }
      : {
          ...order,
          access_token: resolvedAccessToken,
        }
  );
  const waConfirmUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(waConfirmText)}`;

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#2B1D12] pb-16 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FAF4E8] border-b-2 border-[#2B1D12] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-black text-[#2B1D12] hover:text-[#C67D0A] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Beranda Jasdor</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6A584D] font-bold">ID Pesanan:</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-xs font-mono font-black text-[#2B1D12] bg-white hover:bg-[#FFF8E7] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] px-2 py-0.5 rounded-lg transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              title="Salin ID Pesanan"
            >
              <span>{order.id}</span>
              {isCopiedId ? (
                <span className="text-[10px] text-[#15803D] font-sans font-black">Disalin!</span>
              ) : (
                <svg className="w-3 h-3 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={`max-w-md mx-auto px-4 pt-3 space-y-3 ${status === 'menunggu_konfirmasi' || status === 'antrian' ? 'pb-72' : status === 'menunggu_pembayaran' ? 'pb-32' : 'pb-8'}`}>
        {/* Status Banner */}
        {status === 'menunggu_pembayaran' && (
          <div className="bg-[#FFF0C2] border-2 border-[#2B1D12] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#2B1D12] shadow-[3px_3px_0px_#2B1D12]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#C67D0A] animate-pulse" />
              <span className="font-black">Menunggu Pembayaran</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-black text-[#2B1D12] bg-white px-2 py-0.5 rounded-lg border-2 border-[#2B1D12] shadow-[1px_1px_0px_#2B1D12]">
              <svg className="w-3.5 h-3.5 text-[#C67D0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span suppressHydrationWarning>{formatCountdown(timeLeftSeconds)}</span>
            </div>
          </div>
        )}

        {(status === 'antrian' || status === 'menunggu_konfirmasi') && (
          <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 sm:p-5 text-xs text-[#2B1D12] shadow-[4px_4px_0px_#2B1D12] space-y-3.5 animate-in fade-in">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#2B1D12]/15">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C67D0A] animate-pulse shrink-0" />
                <span className="font-display font-black text-sm sm:text-base text-[#2B1D12]">
                  Pesanan Masuk Antrian
                </span>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-[#FFF0C2] text-[#854D0E] border-2 border-[#2B1D12] shadow-[1.5px_1.5px_0px_#2B1D12]">
                {status === 'antrian' ? 'Dalam Antrian' : 'Menunggu Konfirmasi'}
              </span>
            </div>

            {/* Info Posisi & Estimasi */}
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-[#FAF4E8] rounded-xl p-2.5 sm:p-3 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
                <span className="text-[10px] font-bold text-[#7A6658] uppercase tracking-wider block">Posisi Antrian</span>
                <span className="font-display font-black text-sm sm:text-base text-[#2B1D12] mt-0.5 block">
                  {queueAhead !== undefined
                    ? queueAhead === 0
                      ? 'Giliran Terdepan'
                      : `${queueAhead} pesanan di depan`
                    : 'Dalam Antrian'}
                </span>
              </div>
              <div className="bg-[#FAF4E8] rounded-xl p-2.5 sm:p-3 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
                <span className="text-[10px] font-bold text-[#7A6658] uppercase tracking-wider block">Estimasi Siap</span>
                <span className="font-display font-black text-sm sm:text-base text-[#C67D0A] mt-0.5 block">
                  {queueAhead !== undefined && queueAhead > 3
                    ? `~${Math.max(20, (queueAhead + 1) * 4)} Menit`
                    : '~15 - 25 Menit'}
                </span>
              </div>
            </div>

            {/* Transparansi Alur Proses: 4 Tahapan (Vertikal di Layar HP, Horizontal di Layar Tablet/Desktop) */}
            <div className="bg-[#FAF4E8] rounded-xl p-3 sm:p-3.5 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] space-y-3">
              <p className="text-xs font-black text-[#2B1D12] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C67D0A] shrink-0" />
                <span className="bg-[#FFF0C2] px-2 py-0.5 rounded border border-[#2B1D12]/20">
                  Tahapan Proses Pesanan:
                </span>
              </p>

              {/* Tampilan Vertikal untuk Layar Kecil (< sm / 320px - 430px) */}
              <div className="sm:hidden space-y-2">
                {[
                  {
                    num: 1,
                    label: 'Verifikasi Pembayaran',
                    isDone: status === 'antrian',
                    isActive: status === 'menunggu_konfirmasi',
                  },
                  {
                    num: 2,
                    label: 'Admin Memproses',
                    isDone: false,
                    isActive: status === 'antrian',
                  },
                  {
                    num: 3,
                    label: 'Pesanan diterima',
                    isDone: false,
                    isActive: false,
                  },
                  {
                    num: 4,
                    label: 'Siap Di Pick Up/Ambil',
                    isDone: false,
                    isActive: false,
                  },
                ].map((step, idx, arr) => (
                  <div key={step.num} className="relative flex items-center gap-3">
                    {/* Garis penghubung vertikal antar lingkaran */}
                    {idx < arr.length - 1 && (
                      <div
                        className={`absolute left-[13px] top-[26px] bottom-[-10px] w-0.5 ${
                          step.isDone ? 'bg-[#15803D]' : 'bg-[#2B1D12]/20'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Lingkaran status */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-2 border-[#2B1D12] ${
                        step.isDone
                          ? 'bg-[#15803D] text-white shadow-[1px_1px_0px_#2B1D12]'
                          : step.isActive
                          ? 'bg-[#C67D0A] text-white ring-2 ring-[#C67D0A]/30 shadow-[1px_1px_0px_#2B1D12]'
                          : 'bg-[#E5E0D8] text-[#7A6658]'
                      }`}
                    >
                      {step.isDone ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.num
                      )}
                    </div>

                    {/* Label tahap */}
                    <div
                      className={`flex-1 min-w-0 px-3 py-2 rounded-xl border transition-all ${
                        step.isActive
                          ? 'bg-white border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]'
                          : step.isDone
                          ? 'bg-white/80 border border-[#15803D]/40'
                          : 'bg-white/40 border border-[#2B1D12]/10'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold block truncate ${
                          step.isDone
                            ? 'text-[#15803D]'
                            : step.isActive
                            ? 'text-[#2B1D12]'
                            : 'text-[#7A6658]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tampilan Horizontal dari Layar Tablet/Desktop ke Atas (>= sm) */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-2">
                {[
                  {
                    num: 1,
                    label: 'Verifikasi Pembayaran',
                    isDone: status === 'antrian',
                    isActive: status === 'menunggu_konfirmasi',
                  },
                  {
                    num: 2,
                    label: 'Admin Memproses',
                    isDone: false,
                    isActive: status === 'antrian',
                  },
                  {
                    num: 3,
                    label: 'Pesanan diterima',
                    isDone: false,
                    isActive: false,
                  },
                  {
                    num: 4,
                    label: 'Siap Di Pick Up/Ambil',
                    isDone: false,
                    isActive: false,
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between min-w-0 ${
                      step.isActive
                        ? 'bg-white border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]'
                        : step.isDone
                        ? 'bg-white/90 border-2 border-[#15803D]/50 shadow-[1px_1px_0px_#2B1D12]'
                        : 'bg-white/40 border border-[#2B1D12]/15'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-[#2B1D12] ${
                          step.isDone
                            ? 'bg-[#15803D] text-white'
                            : step.isActive
                            ? 'bg-[#C67D0A] text-white ring-2 ring-[#C67D0A]/30'
                            : 'bg-[#E5E0D8] text-[#7A6658]'
                        }`}
                      >
                        {step.isDone ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.num
                        )}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6658]">
                        Tahap {step.num}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold leading-tight break-words text-balance ${
                        step.isDone
                          ? 'text-[#15803D]'
                          : step.isActive
                          ? 'text-[#2B1D12]'
                          : 'text-[#7A6658]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box Penenang: Anti Spam Chat WA */}
            <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-xl p-3 shadow-[2px_2px_0px_#2B1D12] text-[11px] leading-snug">
              <p className="font-black text-[#854D0E] flex items-center gap-2">
                <span className="text-base leading-none shrink-0" role="img" aria-label="Chat">💬</span>
                <span>Harap Menunggu dengan Santai:</span>
              </p>
              <p className="text-[#2B1D12] mt-1 font-medium leading-relaxed">
                Admin Jasdor memproses pesanan satu per satu secara berurutan sesuai antrian. Mohon tidak spam chat WhatsApp agar admin bisa fokus memesankan pesananmu secepat mungkin tanpa terdistraksi.
              </p>
            </div>

            {/* Box Kebijakan Tegas: Anti Batal & Anti Refund */}
            <div className="bg-[#FFF5F5] border-2 border-[#DC2626] rounded-xl p-3 shadow-[2px_2px_0px_#DC2626] text-[11px] leading-snug">
              <p className="font-black text-[#DC2626] flex items-center gap-2">
                <span className="text-base leading-none shrink-0" role="img" aria-label="Peringatan">⚠️</span>
                <span>Kebijakan Pembatalan & Refund:</span>
              </p>
              <p className="text-[#2B1D12] mt-1 font-medium leading-relaxed">
                Pesanan yang sudah dibayar langsung masuk ke sistem pemesanan dan <strong>TIDAK DAPAT DIBATALKAN atau di-refund sepihak yaa kak🥰🙏.</strong>
              </p>
            </div>
          </div>
        )}

        {/* Indikator Polling Otomatis dengan Ring Countdown & Tombol Refresh (Elemen #4 Mockup) */}
        {(status === 'menunggu_pembayaran' || status === 'menunggu_konfirmasi' || status === 'antrian' || status === 'diproses') && (
          <AutoCheck
            onCheck={checkLatestStatus}
            isChecking={isRefreshingStatus}
          />
        )}

        {status === 'diproses' && (
          <div className="bg-[#D9F3EA] border-2 border-[#2B1D12] rounded-2xl p-4 text-xs text-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#15803D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-display font-black text-sm text-[#15803D]">
                Pembayaran Terverifikasi & Pesanan Diproses
              </span>
            </div>
            <p className="text-[11px] text-[#2B1D12] mt-0.5 leading-relaxed font-medium">
              Admin telah berhasil memverifikasi pembayaran dan bersiap memproses pesananmu. Mohon ditunggu bukti pesanan dan nomor antriannya yaa kak.
            </p>
            <div className="bg-white/80 rounded-xl p-2 border border-[#15803D]/20 text-[11px] flex items-center justify-between font-bold">
              <span className="text-[#6A584D]">Estimasi Pesanan diproses:</span>
              <span className="text-[#15803D]">~5 - 15 Menit</span>
            </div>
            <p className="text-[10px] text-[#6A584D] italic font-medium">
              Pesanan yang sudah diproses di outlet tidak dapat dibatalkan atau di-refund. Kamu bisa langsung bersiap menuju outlet bila memilih pick-up sekarang.
            </p>
          </div>
        )}

        {/* Status Selesai: Tahap 1 - Barista Sedang Meracik */}
        {status === 'selesai' && brewProgress.isBrewing && (
          <div className="bg-[#FFF8E7] border-2 border-[#2B1D12] rounded-2xl p-4 text-xs text-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]/15">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C67D0A] animate-pulse shrink-0" />
                <span className="font-display font-black text-sm text-[#854D0E]">
                  Pesananmu sedang Dibuat
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-[#C67D0A]/15 text-[#854D0E] border border-[#C67D0A]/30">
                Tahap Pembuatan
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 border-2 border-[#2B1D12]/20 shadow-[1px_1px_0px_#2B1D12] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#6A584D]">Estimasi Pesanan Selesai:</span>
                <span className="font-mono font-black text-sm text-[#C67D0A]">
                  ~{formatCountdown(brewProgress.remainingSeconds)}
                </span>
              </div>
              <div className="w-full bg-[#FAF4E8] rounded-full h-3 border-2 border-[#2B1D12] overflow-hidden p-0.5">
                <div
                  className="bg-[#C67D0A] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(5, brewProgress.progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6A584D] font-bold">
                <span>Admin Selesai</span>
                <span>{brewProgress.progressPercent}% Proses Pembuatan</span>
                <span>Siap Ambil</span>
              </div>
            </div>

            <div className="text-[11px] text-[#2B1D12] leading-relaxed bg-white/70 rounded-xl p-2.5 border border-[#2B1D12]/10 space-y-1">
              <p className="font-medium">
                Admin Jasdor telah selesai memesankan dan membayarkan pesananmu di Outlet resmi. Saat ini barista outlet sedang membuat pesanan sesuai yang dipesan.
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-bold border-t border-[#2B1D12]/10">
                <span className="text-[#6A584D]">Order atas nama:</span>
                <span className="font-black text-[#2B1D12] underline decoration-2">{order.customer_name}</span>
              </div>
            </div>

            <div className="bg-white/90 border border-[#C67D0A]/40 rounded-xl p-2.5 text-[11px] leading-snug">
              <p className="font-bold text-[#854D0E] flex items-center gap-1">
                <span>📍</span>
                <span>Persiapan Pengambilan:</span>
              </p>
              <p className="text-[#2B1D12] mt-0.5 font-medium">
                Jika lokasimu dekat dengan outlet {order.outlet_name || order.outlet_code}, kamu sudah bisa mulai berjalan santai menuju pick-up counter.
              </p>
            </div>
          </div>
        )}

        {/* Status Selesai: Tahap 2 - Rekomendasi Pick-up Realistis */}
        {status === 'selesai' && !brewProgress.isBrewing && (
          <div className="bg-[#E8F8F0] border-2 border-[#15803D] rounded-2xl p-4 text-xs text-[#2B1D12] shadow-[3px_3px_0px_#15803D] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#15803D]/20">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#15803D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-display font-black text-sm text-[#15803D]">
                  Waktu Racik Selesai
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30">
                Siap Ditanyakan ke Barista
              </span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border-2 border-[#15803D] shadow-[2px_2px_0px_#15803D] space-y-1.5">
              <p className="text-xs sm:text-[13px] font-bold text-[#2B1D12] leading-relaxed">
                &ldquo;Halo kak👋! sepertinya kopi sudah siap di pick up, silahkan tanya ke barista/kasir apakah orderan atas nama <span className="font-black text-[#15803D] underline decoration-2">{order.customer_name}</span> sudah siap atau belum&rdquo;
              </p>
            </div>

            <div className="text-[11px] text-[#2B1D12] leading-relaxed bg-white/80 rounded-xl p-2.5 border border-[#15803D]/20 space-y-1 font-medium">
              <p className="font-bold text-[#15803D]">Langkah Pengambilan di Outlet:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[#2B1D12] text-[11px]">
                <li>Datangi pick-up counter outlet <span className="font-bold">{order.outlet_name || order.outlet_code}</span>.</li>
                <li>Sebutkan nama pemesan: <span className="font-black text-[#15803D]">{order.customer_name}</span>.</li>
                <li>Jika barista masih menyelesaikan pesanan, mohon menunggu sejenak dengan ramah.</li>
              </ol>
            </div>

            <div className="text-[10px] text-[#6A584D] text-center pt-0.5 font-medium">
              Terima kasih sudah memesan lewat Jasdor Kopi Cima. Selamat menikmati kopimu!
            </div>
          </div>
        )}

        {status === 'kedaluwarsa' && (
          <div className="bg-[#FFEBEB] border-2 border-[#DC2626] rounded-2xl p-4 text-xs text-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#DC2626] font-black">
              <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Waktu Pembayaran Kedaluwarsa</span>
            </div>
            <p className="text-[11px] text-[#2B1D12] leading-relaxed font-medium">
              Batas waktu pembayaran 60 menit untuk pesanan ini telah habis. Jangan transfer untuk pesanan yang sudah kedaluwarsa.
            </p>

            {/* Tombol Darurat: Jika customer terlanjur transfer */}
            <div className="p-3 bg-white rounded-xl border-2 border-[#DC2626]/30 shadow-[2px_2px_0px_#DC2626] space-y-1.5">
              <p className="text-[11px] font-bold text-[#DC2626] flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Terlanjur Transfer di Menit Terakhir?</span>
              </p>
              <p className="text-[10px] text-[#4A3628] leading-snug font-medium">
                Jika uangmu sudah terlanjur terpotong dari m-banking/e-wallet, klik tombol di bawah untuk verifikasi manual ke admin:
              </p>
              <a
                href={buildEmergencyExpiredWhatsAppUrl(order.id, order.total)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-1 py-2 px-3 bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-bold rounded-lg transition border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                <span>Terlanjur Transfer? Hubungi Admin WhatsApp</span>
              </a>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center w-full min-h-[40px] px-4 py-2 bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] transition"
            >
              Buat Order Baru
            </Link>
          </div>
        )}

        {status === 'dibatalkan' && (
          <div className="bg-[#EFE5D8] border-2 border-[#2B1D12] rounded-2xl p-4 text-xs text-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] space-y-2">
            <p className="font-black text-[#2B1D12]">Pesanan Dibatalkan</p>
            <p className="text-[11px] text-[#6A584D]">Pesanan ini telah dibatalkan oleh admin atau sistem.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full min-h-[40px] px-4 py-2 bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] transition"
            >
              Kembali ke Menu Utama
            </Link>
          </div>
        )}

        {/* Section Pembayaran QRIS (HANYA tampil pada status menunggu_pembayaran) */}
        {status === 'menunggu_pembayaran' && (
          <section className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border-2 border-[#2B1D12] shadow-[4px_4px_0px_#2B1D12] space-y-3">
            {/* Box Nominal Total yang Menonjol dengan Uap Kopi (Elemen #1 Mockup) */}
            <div className="relative bg-[#FFF8E7] rounded-2xl p-3 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] text-center space-y-0.5">
              {/* 3 Garis Uap Kopi di Dalam Pojok Kanan Atas Kartu */}
              <div
                className="absolute right-5 top-2 flex items-end gap-1 pointer-events-none"
                aria-hidden="true"
              >
                <span
                  className="w-1 h-4 rounded-full bg-[#2B1D12]/25 motion-safe:animate-steam"
                  style={{ animationDelay: '0s' }}
                />
                <span
                  className="w-1 h-4 rounded-full bg-[#2B1D12]/25 motion-safe:animate-steam"
                  style={{ animationDelay: '0.4s' }}
                />
                <span
                  className="w-1 h-4 rounded-full bg-[#2B1D12]/25 motion-safe:animate-steam"
                  style={{ animationDelay: '0.8s' }}
                />
              </div>

              <span className="text-[10px] font-black text-[#6A584D] uppercase tracking-wider block">
                Total Nominal Pembayaran
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display text-2xl sm:text-3xl font-black text-[#DC2626] tracking-tight">
                  {formatRupiah(order.total)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="p-1.5 rounded-lg bg-white border-2 border-[#2B1D12] hover:bg-[#FFF8E7] text-[#2B1D12] text-xs transition flex items-center gap-1 shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  title="Salin Angka Nominal"
                >
                  {isCopiedAmount ? (
                    <span className="text-[10px] text-[#15803D] font-black px-1">Disalin</span>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[#6A584D] font-medium">
                Ketik nominal <span className="font-black text-[#2B1D12]">TEPAT {formatRupiah(order.total)}</span> tanpa dibulatkan.
              </p>
            </div>

            {/* QRIS Display Resmi (Statis SVG, 280px) */}
            <div className="flex flex-col items-center space-y-2 pt-0.5">
              <div className="w-full max-w-[310px] bg-white border-2 border-[#2B1D12] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#2B1D12] flex flex-col items-center">
                {/* Header QRIS */}
                <div className="w-full flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]/10 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-sm tracking-wider text-[#2B1D12]">QRIS</span>
                    <span className="text-[9px] font-bold text-[#7A6658] uppercase">Standar Nasional</span>
                  </div>
                  <span className="text-[10px] font-mono font-black text-[#2B1D12] bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#2B1D12]/20">
                    {QRIS_CONFIG.nmid}
                  </span>
                </div>

                <div className="text-center mb-2">
                  <p className="font-display font-black text-base text-[#2B1D12] tracking-tight">{QRIS_CONFIG.merchantName}</p>
                  <p className="text-[10px] font-medium text-[#7A6658]">NMID: {QRIS_CONFIG.nmid}</p>
                </div>

                {/* QR Code Container dengan Garis Hijau Scan (Elemen #2 Mockup) */}
                <div className="relative overflow-hidden bg-white p-3 rounded-xl border border-[#2B1D12]/15 flex items-center justify-center">
                  {/* Overlay Garis Hijau Scan QR dengan Animasi background-position */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-no-repeat motion-safe:animate-qr-scan z-10"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom, transparent, rgba(21,128,61,0.28), transparent)',
                      backgroundSize: '100% 46px',
                    }}
                    aria-hidden="true"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/payment/qris-cima-group.svg"
                    alt={`QRIS Pembayaran ${QRIS_CONFIG.merchantName}`}
                    width={280}
                    height={280}
                    className="w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] min-w-[240px] min-h-[240px] max-w-none block aspect-square"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Area Kucing di Bawah QR (Elemen #3 Mockup) */}
                <div className="flex items-center gap-2.5 mt-3 px-1 text-left">
                  <div className="w-[34px] h-[34px] min-w-[34px] min-h-[34px] rounded-full border-[3px] border-[#2B1D12] overflow-hidden bg-[#FAF4E8] shadow-[1px_1px_0px_#2B1D12] shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/avatar-kucing.webp"
                      alt="Maskot Kucing Jasdor Kopi Cima"
                      width={34}
                      height={34}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#7A6658] font-bold leading-tight">
                    Screenshot layar ini untuk scan via m-banking/e-wallet. Meong approved. 😎
                  </p>
                </div>
              </div>

              {/* Peringatan Keamanan Wajib */}
              <div className="w-full bg-[#FFEBEB] border-2 border-[#DC2626] rounded-xl px-2.5 py-1.5 text-center">
                <p className="text-[11px] text-[#2B1D12] font-bold leading-tight">
                  Pastikan merchant: <span className="font-black text-[#DC2626] underline decoration-2">{QRIS_CONFIG.merchantName}</span> sebelum bayar.
                </p>
              </div>
            </div>

            {/* Accordion Petunjuk Cara Bayar (Collapsed Secara Default) */}
            <div className="bg-[#FAF4E8] rounded-xl border-2 border-[#2B1D12] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsCaraBayarOpen((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between text-left font-black text-[#2B1D12] text-[11px] hover:bg-[#FFF8E7] transition cursor-pointer"
                aria-expanded={isCaraBayarOpen}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#C67D0A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Petunjuk Cara Bayar (5 Langkah)</span>
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-[#2B1D12] transition-transform duration-200 ${isCaraBayarOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCaraBayarOpen && (
                <div className="px-3 pb-3 pt-1 border-t-2 border-[#2B1D12] animate-in fade-in">
                  <ol className="list-decimal list-inside space-y-1 text-[#2B1D12] text-[11px] leading-relaxed font-medium">
                    <li>Buka aplikasi m-banking atau e-wallet pilihanmu (BCA, Mandiri, GoPay, OVO, Dana, dll).</li>
                    <li>Pindai (scan) kode QRIS di atas.</li>
                    <li>Ketik nominal <span className="font-black text-[#2B1D12]">TEPAT {formatRupiah(order.total)}</span> tanpa dibulatkan.</li>
                    <li>Periksa nama penerima: <span className="font-black text-[#2B1D12]">{QRIS_CONFIG.merchantName}</span>.</li>
                    <li>Selesaikan pembayaran, lalu tap tombol di bawah.</li>
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Ringkasan Rincian Pesanan */}
        <section className="bg-[#FFFDF9] rounded-3xl p-5 border-2 border-[#2B1D12] shadow-[4px_4px_0px_#2B1D12] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B1D12]">
            <h3 className="font-display font-black text-xs text-[#2B1D12] uppercase tracking-wide">
              Rincian Pesanan
            </h3>
            <span className="text-[11px] text-[#2B1D12] font-bold">
              Outlet: {order.outlet_name || order.outlet_code}
            </span>
          </div>

          <div className="space-y-2 divide-y-2 divide-[#EFE5D8]">
            {order.items.map((it, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#2B1D12] leading-tight">
                    {it.quantity}x {it.name}
                  </p>
                  {it.variantOptions && it.variantOptions.length > 0 && (
                    <p className="text-[11px] text-[#6A584D] font-medium mt-0.5">
                      {it.variantOptions.join(' • ')}
                    </p>
                  )}
                  {it.addons && it.addons.length > 0 && (
                    <p className="text-[11px] text-[#C67D0A] font-bold">
                      + {it.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {it.notes && (
                    <p className="text-[10px] text-[#8C7667] italic mt-0.5">
                      Catatan: &quot;{it.notes}&quot;
                    </p>
                  )}
                </div>
                <span className="font-black text-[#2B1D12] shrink-0 font-display">
                  {formatRupiah(it.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t-2 border-[#2B1D12] space-y-1 text-xs text-[#2B1D12]">
            {breakdown.bundleQuantity > 0 && (
              <div className="flex justify-between">
                <span>Sub Total Bundling ({breakdown.bundleQuantity} item)</span>
                <span className="font-bold text-[#2B1D12]">{formatRupiah(breakdown.bundleSubtotal)}</span>
              </div>
            )}
            {breakdown.regularQuantity > 0 && (
              <div className="flex justify-between">
                <span>Sub Total Normal ({breakdown.regularQuantity} item)</span>
                <span className="font-bold text-[#2B1D12]">{formatRupiah(breakdown.regularSubtotal)}</span>
              </div>
            )}
            {breakdown.bundleQuantity > 0 && (
              <div className="flex justify-between">
                <span>Biaya Jasa Bundling</span>
                <span className="font-bold text-[#2B1D12]">{formatRupiah(breakdown.bundleFee)}</span>
              </div>
            )}
            {breakdown.regularQuantity > 0 && (
              <div className="flex justify-between">
                <span>Biaya Jasa Normal</span>
                <span className="font-bold text-[#2B1D12]">{formatRupiah(breakdown.regularFee)}</span>
              </div>
            )}
            <div className="pt-2 border-t-2 border-[#2B1D12] flex justify-between items-baseline font-bold">
              <span className="text-xs font-black text-[#2B1D12]">Total Tagihan</span>
              <span className="font-display text-base font-black text-[#DC2626]">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF4E8] rounded-xl p-3 text-[11px] text-[#2B1D12] space-y-1 border-2 border-[#2B1D12]">
            <p><span className="font-black text-[#2B1D12]">Outlet:</span> {order.outlet_name || order.outlet_code}</p>
            <p><span className="font-black text-[#2B1D12]">Pemesan:</span> {order.customer_name} ({order.customer_wa})</p>
            <p><span className="font-black text-[#2B1D12]">Jadwal Pick up:</span> {order.pickup_time || 'Sekarang'}</p>
          </div>
        </section>
      </main>

      {/* Sticky Bottom CTA Bar (Hanya tampil pada status menunggu_pembayaran dan menunggu_konfirmasi) */}
      {(status === 'menunggu_pembayaran' || status === 'menunggu_konfirmasi' || status === 'antrian') && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF4E8] border-t-2 border-[#2B1D12] px-4 py-2.5 sm:py-3 shadow-lg">
          <div className="max-w-md mx-auto space-y-1.5">
            {confirmError && (
              <div className="p-2 bg-rose-50 border-2 border-[#DC2626] rounded-lg text-rose-900 text-[11px] text-center font-bold">
                {confirmError}
              </div>
            )}

            {status === 'menunggu_pembayaran' && (
              <div className="space-y-1.5">
                <div className="bg-[#FFF8E7] border border-[#C67D0A]/40 rounded-xl px-2.5 py-1 text-[10px] text-[#6A584D] text-center leading-tight">
                  <span className="font-bold text-[#2B1D12]">Catatan:</span> Pesanan yang sudah dibayar tidak dapat dibatalkan atau di-refund sepihak yaa kak🥰🙏.
                </div>
                <button
                  type="button"
                  disabled={isSubmittingConfirm}
                  onClick={handleConfirmPaid}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingConfirm ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FAF4E8] border-t-transparent rounded-full animate-spin" />
                      <span>Memperbarui Status...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-[#FAF4E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Saya Sudah Bayar</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-[#6A584D] font-bold">
                  Siapkan screenshot bukti pembayaranmu
                </p>
              </div>
            )}

            {(status === 'menunggu_konfirmasi' || status === 'antrian') && (
              <div className="space-y-2">
                {/* Box Info Wajib Kirim Bukti Pembayaran */}
                <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#2B1D12] space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#DC2626] uppercase tracking-wide">
                    <span className="text-sm">⚠️</span>
                    <span>WAJIB: Kirim Bukti Pembayaran</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] font-bold text-[#2B1D12] leading-snug">
                    <li>Screenshot bukti pembayaran dari aplikasi bank/e-wallet kamu</li>
                    <li>Klik tombol &quot;Kirim Bukti Bayar via WhatsApp&quot; di bawah</li>
                    <li>Lampirkan (attach) foto screenshot bukti tersebut di chat WhatsApp sebelum kirim</li>
                    <li>Kirim chat beserta fotonya - admin langsung mencocokkan dan memproses pesananmu</li>
                  </ol>
                  <p className="text-[10px] font-bold text-[#DC2626] bg-[#FFEBEB] px-2.5 py-1 rounded-lg border border-[#DC2626]/30 leading-tight">
                    Catatan: Pesanan TIDAK AKAN DIPROSES kasir sebelum bukti transfer dikirim ke WhatsApp.
                  </p>
                </div>

                <a
                  href={waConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white font-display font-black text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-center cursor-pointer"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-white shrink-0" />
                  <span>Kirim Bukti Bayar via WhatsApp (Wajib)</span>
                </a>
                <p className="text-[10px] text-center text-[#2B1D12] leading-tight font-bold">
                  Wajib dikirim agar pesananmu diproses. Pesanan tanpa bukti pembayaran WhatsApp tidak akan diproses admin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
