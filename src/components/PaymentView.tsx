'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { OrderRecord, OrderStatus } from '@/types/order';
import { formatRupiah } from '@/lib/currency';
import { QRIS_CONFIG, SITE_CONFIG } from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { buildOrderWhatsAppConfirmationMessage } from '@/lib/whatsapp';
import { saveMyOrder } from '@/lib/my-orders';

interface PaymentViewProps {
  initialOrder: OrderRecord;
}

export function PaymentView({ initialOrder }: PaymentViewProps) {
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
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isCaraBayarOpen, setIsCaraBayarOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Simpan ke Pesanan Saya di perangkat ini
  useEffect(() => {
    if (order?.id) {
      saveMyOrder(order.id, order.created_at);
    }
  }, [order?.id, order?.created_at]);

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
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/confirm-payment`, {
        method: 'POST',
      });
      const data = await res.json();

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

  // Pesan pre-filled WhatsApp
  const waConfirmText = buildOrderWhatsAppConfirmationMessage(order);
  const waConfirmUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(waConfirmText)}`;

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#26150B] pb-16 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FBF8F4]/95 backdrop-blur-md border-b border-[#EFE5D8] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-[#6B5344] hover:text-[#26150B] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Beranda Jasdor</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8C7667]">ID Pesanan:</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#26150B] bg-[#EFE5D8] hover:bg-[#E2D5C3] px-2 py-0.5 rounded-md transition"
              title="Salin ID Pesanan"
            >
              <span>{order.id}</span>
              {isCopiedId ? (
                <span className="text-[10px] text-emerald-700 font-sans font-bold">Disalin!</span>
              ) : (
                <svg className="w-3 h-3 text-[#7A6455]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-3 pb-32 space-y-3">
        {/* Status Banner */}
        {status === 'menunggu_pembayaran' && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold">Menunggu Pembayaran</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
              <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span suppressHydrationWarning>{formatCountdown(timeLeftSeconds)}</span>
            </div>
          </div>
        )}

        {status === 'menunggu_konfirmasi' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-950 shadow-2xs animate-in fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping mt-1 shrink-0" />
            <div>
              <p className="font-bold">Menunggu Konfirmasi Admin</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                Terima kasih! Kamu sudah konfirmasi bayar. Admin Jasdor sedang mencocokkan mutasi rekening.
              </p>
            </div>
          </div>
        )}

        {status === 'diproses' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950 shadow-2xs animate-in fade-in">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-bold text-emerald-900">Pembayaran Terverifikasi & Pesanan Diproses</p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Admin telah mengonfirmasi pembayaranmu. Pesanan sedang diproses di outlet.
              </p>
            </div>
          </div>
        )}

        {status === 'kedaluwarsa' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 shadow-2xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Waktu Pembayaran Kedaluwarsa</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Batas waktu pembayaran 60 menit untuk pesanan ini telah habis. Jangan transfer untuk pesanan yang sudah kedaluwarsa.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full min-h-[40px] px-4 py-2 bg-[#26150B] text-[#FBBF24] font-bold text-xs rounded-xl shadow-xs transition"
            >
              Buat Order Baru
            </Link>
          </div>
        )}

        {status === 'dibatalkan' && (
          <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 text-xs text-stone-800 space-y-2">
            <p className="font-bold text-stone-900">Pesanan Dibatalkan</p>
            <p className="text-[11px] text-stone-600">Pesanan ini telah dibatalkan oleh admin atau sistem.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full min-h-[40px] px-4 py-2 bg-[#26150B] text-[#FBBF24] font-bold text-xs rounded-xl shadow-xs transition"
            >
              Kembali ke Menu Utama
            </Link>
          </div>
        )}

        {/* Section Pembayaran QRIS (Hanya tampil jika belum kedaluwarsa/batal) */}
        {status !== 'kedaluwarsa' && status !== 'dibatalkan' && (
          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE5D8] shadow-sm space-y-3">
            {/* Box Nominal Total yang Menonjol */}
            <div className="bg-[#FAF6F0] rounded-2xl p-3 border border-[#EFE5D8] text-center space-y-0.5">
              <span className="text-[10px] font-semibold text-[#735F52] uppercase tracking-wider block">
                Total Nominal Pembayaran
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display text-2xl sm:text-3xl font-black text-[#DC2626] tracking-tight">
                  {formatRupiah(order.total)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="p-1.5 rounded-lg bg-white border border-[#E0D4C5] hover:bg-[#F2EBE1] text-[#735F52] text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Salin Angka Nominal"
                >
                  {isCopiedAmount ? (
                    <span className="text-[10px] text-emerald-700 font-bold px-1">Disalin</span>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#735F52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[#8C7667]">
                Ketik nominal <span className="font-bold text-[#26150B]">TEPAT {formatRupiah(order.total)}</span> tanpa dibulatkan.
              </p>
            </div>

            {/* Gambar QRIS Statis Compact */}
            <div className="flex flex-col items-center space-y-1.5 pt-0.5">
              <div className="relative w-full max-w-[190px] sm:max-w-[210px] aspect-[1240/1748] rounded-2xl overflow-hidden border-2 border-[#26150B] shadow-md bg-white">
                <Image
                  src={QRIS_CONFIG.imagePath}
                  alt="QRIS Pembayaran Jasdor Cima Group"
                  fill
                  priority
                  className="object-contain p-1"
                  sizes="(max-width: 480px) 190px, 210px"
                />
              </div>

              {/* Peringatan Keamanan Wajib */}
              <div className="w-full bg-rose-50 border border-rose-200/80 rounded-xl px-2.5 py-1.5 text-center">
                <p className="text-[11px] text-rose-950 font-medium leading-tight">
                  Pastikan merchant: <span className="font-bold text-[#26150B] underline decoration-rose-400">{QRIS_CONFIG.merchantName}</span> sebelum bayar.
                </p>
              </div>
            </div>

            {/* Accordion Petunjuk Cara Bayar (Collapsed Secara Default) */}
            <div className="bg-[#FAF6F0] rounded-xl border border-[#EFE5D8] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsCaraBayarOpen((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between text-left font-bold text-[#26150B] text-[11px] hover:bg-[#F5EDE3] transition cursor-pointer"
                aria-expanded={isCaraBayarOpen}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#C67D0A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Petunjuk Cara Bayar (5 Langkah)</span>
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-[#7A6455] transition-transform duration-200 ${isCaraBayarOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCaraBayarOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-[#EFE5D8] animate-in fade-in">
                  <ol className="list-decimal list-inside space-y-1 text-[#5A4537] text-[11px] leading-relaxed">
                    <li>Buka aplikasi m-banking atau e-wallet pilihanmu (BCA, Mandiri, GoPay, OVO, Dana, dll).</li>
                    <li>Pindai (scan) kode QRIS di atas.</li>
                    <li>Ketik nominal <span className="font-bold text-[#26150B]">TEPAT {formatRupiah(order.total)}</span>.</li>
                    <li>Periksa nama penerima: <span className="font-bold text-[#26150B]">{QRIS_CONFIG.merchantName}</span>.</li>
                    <li>Selesaikan pembayaran, lalu tap tombol di bawah.</li>
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Ringkasan Rincian Pesanan */}
        <section className="bg-white rounded-3xl p-5 border border-[#EFE5D8] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EAE0]">
            <h3 className="font-display font-bold text-xs text-[#26150B] uppercase tracking-wide">
              Rincian Pesanan
            </h3>
            <span className="text-[11px] text-[#7A6455] font-medium">
              Outlet: {order.outlet_name || order.outlet_code}
            </span>
          </div>

          <div className="space-y-2 divide-y divide-[#F6EFE6]">
            {order.items.map((it, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#26150B] leading-tight">
                    {it.quantity}x {it.name}
                  </p>
                  {it.variantOptions && it.variantOptions.length > 0 && (
                    <p className="text-[11px] text-[#8C7667] mt-0.5">
                      {it.variantOptions.join(' • ')}
                    </p>
                  )}
                  {it.addons && it.addons.length > 0 && (
                    <p className="text-[11px] text-[#8C7667]">
                      + {it.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {it.notes && (
                    <p className="text-[10px] text-stone-500 italic mt-0.5">
                      Catatan: &quot;{it.notes}&quot;
                    </p>
                  )}
                </div>
                <span className="font-bold text-[#26150B] shrink-0 font-display">
                  {formatRupiah(it.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F2EAE0] space-y-1 text-xs text-[#6A584D]">
            <div className="flex justify-between">
              <span>Subtotal Menu</span>
              <span className="font-semibold text-[#26150B]">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Jasa Order</span>
              <span className="font-semibold text-[#26150B]">{formatRupiah(order.fee)}</span>
            </div>
            <div className="pt-2 border-t border-[#EFE5D8] flex justify-between items-baseline font-bold">
              <span className="text-xs text-[#26150B]">Total Tagihan</span>
              <span className="font-display text-base font-black text-[#DC2626]">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF6F0] rounded-xl p-3 text-[11px] text-[#7A6455] space-y-0.5 border border-[#EFE5D8]">
            <p><span className="font-semibold text-[#26150B]">Pemesan:</span> {order.customer_name} ({order.customer_wa})</p>
            {order.pickup_time && (
              <p><span className="font-semibold text-[#26150B]">Jadwal Pick up:</span> {order.pickup_time}</p>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom CTA Bar (Selalu terlihat di 1 layar tanpa scroll) */}
      {(status === 'menunggu_pembayaran' || status === 'menunggu_konfirmasi' || status === 'diproses') && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FBF8F4]/95 backdrop-blur-md border-t border-[#EFE5D8] px-4 py-2.5 sm:py-3 shadow-lg">
          <div className="max-w-md mx-auto space-y-1.5">
            {confirmError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px] text-center">
                {confirmError}
              </div>
            )}

            {status === 'menunggu_pembayaran' && (
              <button
                type="button"
                disabled={isSubmittingConfirm}
                onClick={handleConfirmPaid}
                className="w-full min-h-[46px] px-4 py-2.5 bg-[#26150B] hover:bg-[#3D2313] active:scale-98 text-[#FBBF24] font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60 cursor-pointer"
              >
                {isSubmittingConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
                    <span>Memperbarui Status...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Saya Sudah Bayar</span>
                  </>
                )}
              </button>
            )}

            {(status === 'menunggu_konfirmasi' || status === 'diproses') && (
              <>
                <a
                  href={waConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] active:scale-98 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md text-center cursor-pointer"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-white shrink-0" />
                  <span>Konfirmasi via WhatsApp (Wajib)</span>
                </a>
                <p className="text-[10px] text-center text-[#735F52] leading-tight font-medium">
                  Wajib dikirim agar pesananmu diproses. Pesanan tanpa konfirmasi WhatsApp tidak akan diproses admin.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
