'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CartItem } from '@/lib/cart-reducer';
import type { OrderPricingResult } from '@/lib/pricing';
import type { Outlet } from '@/types/domain';
import { formatRupiah } from '@/lib/currency';
import { calculateAvailableScheduleSlots, isValidScheduleSlot } from '@/lib/schedule-slots';
import { getWibTimeParts } from '@/lib/operational';
import {
  validateCustomerName,
  filterCustomerNameInput,
  validateCustomerPhone,
  filterCustomerPhoneInput,
} from '@/lib/sanitizer';
import { useScrollLock } from '@/hooks/useScrollLock';
import { isOutletClosed as checkIsOutletClosed } from '@/lib/orderability';
import { saveMyOrder, buildOrderPaymentUrl } from '@/lib/my-orders';
import { useMinOrder50kMode } from '@/hooks/useBundlingOnlyMode';
import { useQueueStatus, fetchQueueStatus } from '@/hooks/useQueueStatus';
import { QUEUE_POPUP_THRESHOLD_MINUTES, getQueueLoadInfo, type QueueStatus } from '@/lib/queue';
import { resolveBrandSlugFromOutletCode } from '@/lib/site-config';
import { getSavedCustomer, saveSavedCustomer } from '@/lib/saved-customer';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  pricing: OrderPricingResult;
  outlet: Outlet | null;
  cartOutletCode?: string;
  cartOutletName?: string;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  pricing,
  outlet,
  cartOutletCode,
  cartOutletName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const effectiveOutletCode = cartOutletCode || outlet?.code;
  const effectiveOutletName = cartOutletName || outlet?.name || 'Kopi Kenangan';

  // Mode Minimal Pembelian 50k & validasi item reguler
  const isMinOrderMode = useMinOrder50kMode();
  const isKopiKenangan = !effectiveOutletCode || !effectiveOutletCode.toLowerCase().startsWith('fore-');

  const regularValidationError = useMemo(() => {
    if (!isKopiKenangan || !isMinOrderMode || pricing.regularQuantity === 0) {
      return null;
    }
    if (pricing.regularNormalSubtotal < 50000) {
      return 'Minimal pembelian Rp50.000 (harga normal)';
    }
    if (pricing.regularNormalSubtotal > 60000) {
      return 'Maksimal pembelian Rp60.000 (harga normal)';
    }
    return null;
  }, [isKopiKenangan, isMinOrderMode, pricing.regularQuantity, pricing.regularNormalSubtotal]);

  // Status outlet tutup & validasi
  const [isOutletClosedState, setIsOutletClosedState] = useState<boolean>(false);
  const [outletClosedReason, setOutletClosedReason] = useState<string>('');

  const isOutletClosed =
    isOutletClosedState ||
    Boolean(outlet && outlet.code === effectiveOutletCode && checkIsOutletClosed(outlet));

  const effectiveClosedReason =
    (outlet && outlet.code === effectiveOutletCode && checkIsOutletClosed(outlet)
      ? outlet.orderReason
      : null) ||
    outletClosedReason ||
    'Tutup';

  // Cek kesegaran status buka/tutup outlet saat drawer dibuka (hanya jika data outlet belum ada di prop)
  useEffect(() => {
    if (!isOpen || !effectiveOutletCode) return;
    if (outlet && outlet.code === effectiveOutletCode) return;

    let cancelled = false;
    fetch(`/api/outlets/${encodeURIComponent(effectiveOutletCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.outlet) {
          if (checkIsOutletClosed(data.outlet)) {
            setIsOutletClosedState(true);
            setOutletClosedReason(data.outlet.orderReason || 'Tutup');
          } else {
            setIsOutletClosedState(false);
            setOutletClosedReason('');
          }
        }
      })
      .catch((err) => {
        console.warn('Gagal memverifikasi status outlet keranjang:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, effectiveOutletCode, outlet]);

  // Kunci scroll halaman belakang secara menyeluruh saat drawer aktif
  useScrollLock(isOpen);

  // Form checkout state
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [pickupMode, setPickupMode] = useState<'now' | 'scheduled'>('now');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Auto-fill nama dan nomor WA jika ada riwayat pesanan sebelumnya
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = getSavedCustomer();
      if (saved) {
        let filled = false;
        if (!customerName && saved.name) {
          setCustomerName(saved.name);
          filled = true;
        }
        if (!customerWa && saved.waInputPhone) {
          setCustomerWa(saved.waInputPhone);
          filled = true;
        }
        if (filled) {
          setHasAutoFilled(true);
        }
      }
    } catch {
      // safe fallback
    }
  }, [isOpen, customerName, customerWa]);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Info antrean + gerbang pop-up konfirmasi bila estimasi tunggu panjang
  const { queue } = useQueueStatus(isOpen);
  const [queueGate, setQueueGate] = useState<QueueStatus | null>(null);
  const queueConfirmedRef = useRef<boolean>(false);

  // UX & Validation Attention states (Sprint 2 Item 1)
  const [nameHighlight, setNameHighlight] = useState(false);
  const [waHighlight, setWaHighlight] = useState(false);
  const [slotHighlight, setSlotHighlight] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Element Refs for scroll & focus control
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const waInputRef = useRef<HTMLInputElement>(null);
  const slotSelectRef = useRef<HTMLSelectElement>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Deteksi petunjuk scroll fade gradient pada daftar item
  const updateScrollIndicator = useCallback(() => {
    const el = itemsScrollRef.current;
    if (!el) {
      setCanScrollDown(false);
      return;
    }
    // Toleransi 4px untuk rounding subpixel di browser mobile
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 4;
    setCanScrollDown(hasMore);
  }, []);

  useEffect(() => {
    updateScrollIndicator();
  }, [items, updateScrollIndicator]);

  useEffect(() => {
    const el = itemsScrollRef.current;
    if (!el) return;
    updateScrollIndicator();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateScrollIndicator());
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [updateScrollIndicator]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // Hitung slot pick up yang tersedia secara dinamis
  const scheduleSlots = useMemo(() => {
    const { hour, minute } = getWibTimeParts(new Date());
    return calculateAvailableScheduleSlots({
      currentWibHour: hour,
      currentWibMinute: minute,
      outletOpen: outlet?.openTime,
      outletClose: outlet?.closeTime,
    });
  }, [outlet?.openTime, outlet?.closeTime]);

  // Slot efektif yang aktif: jika slot yang dipilih masih valid dalam daftar slot, gunakan slot tersebut; bila belum ada atau sudah lewat, default ke slot pertama yang tersedia
  const effectiveSelectedSlot = useMemo(() => {
    if (!scheduleSlots.slots.length) return '';
    if (selectedSlot && scheduleSlots.slots.includes(selectedSlot)) {
      return selectedSlot;
    }
    return scheduleSlots.slots[0];
  }, [scheduleSlots.slots, selectedSlot]);

  if (!isOpen) return null;

  // Helper untuk memicu scroll halus, highlight visual, dan fokus pada input bermasalah (Langkah 3)
  const triggerFieldAttention = (field: 'name' | 'wa' | 'slot') => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    if (field === 'name') {
      setNameHighlight(true);
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      nameInputRef.current?.focus();
      highlightTimerRef.current = setTimeout(() => setNameHighlight(false), 2000);
    } else if (field === 'wa') {
      setWaHighlight(true);
      waInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      waInputRef.current?.focus();
      highlightTimerRef.current = setTimeout(() => setWaHighlight(false), 2000);
    } else if (field === 'slot') {
      setSlotHighlight(true);
      slotSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slotSelectRef.current?.focus();
      highlightTimerRef.current = setTimeout(() => setSlotHighlight(false), 2000);
    }
  };

  // Handle pembuatan pesanan dan pengalihan ke halaman pembayaran QRIS
  const handleProceedToPayment = async () => {
    setErrorMessage(null);
    const nameValidation = validateCustomerName(customerName);

    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.errorMessage || 'Silakan isi nama pemesan terlebih dahulu.');
      triggerFieldAttention('name');
      return;
    }

    const phoneValidation = validateCustomerPhone(customerWa);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || 'Silakan isi nomor WhatsApp pemesan.');
      triggerFieldAttention('wa');
      return;
    }

    const trimmedName = nameValidation.sanitized;
    const sanitizedPhone = phoneValidation.sanitized;

    if (items.length === 0) {
      setErrorMessage('Keranjang pesanan masih kosong.');
      return;
    }

    if (regularValidationError) {
      setErrorMessage(regularValidationError);
      return;
    }

    if (pickupMode === 'scheduled') {
      if (!effectiveSelectedSlot) {
        setErrorMessage('Silakan pilih jam jadwal pick up.');
        triggerFieldAttention('slot');
        return;
      }
      if (!isValidScheduleSlot(effectiveSelectedSlot) || !scheduleSlots.slots.includes(effectiveSelectedSlot)) {
        setErrorMessage('Jam jadwal pick up yang dipilih tidak valid atau sudah lewat.');
        triggerFieldAttention('slot');
        return;
      }
    }

    if (isOutletClosed) {
      setErrorMessage(
        `Outlet ${effectiveOutletName} sedang tutup dan tidak menerima pesanan saat ini. Silakan pilih outlet lain.`
      );
      return;
    }

    // Gerbang antrean: estimasi tunggu di atas ambang wajib dikonfirmasi
    // pelanggan lebih dulu (pop-up), kecuali ia sudah menekan "Tetap Order".
    if (!queueConfirmedRef.current) {
      const freshQueue = await fetchQueueStatus();
      if (freshQueue && freshQueue.estimateMinutes > QUEUE_POPUP_THRESHOLD_MINUTES) {
        setQueueGate(freshQueue);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Panggil API create-order di server
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Wajib mengikuti brand outlet yang dipilih - nilai statis di sini
          // membuat checkout brand lain (Tomoro/Fore) selalu ditolak server.
          brandSlug: resolveBrandSlugFromOutletCode(effectiveOutletCode ?? ''),
          outletCode: effectiveOutletCode,
          outletName: effectiveOutletName,
          customerName: trimmedName,
          customerWa: sanitizedPhone,
          items,
          pickupTime: pickupMode === 'scheduled' ? effectiveSelectedSlot : 'Sekarang (~10 menit)',
          notes: '',
        }),
      });

      let orderData: any;
      try {
        orderData = await orderRes.json();
      } catch {
        // Server mengembalikan respons non-JSON (mis. halaman error Cloudflare
        // saat deploy). Jangan tampilkan "Unexpected token" ke pelanggan.
        throw new Error('Gagal membuat pesanan. Silakan coba beberapa saat lagi.');
      }

      if (!orderRes.ok || !orderData.success) {
        if (orderData.isOutletClosed) {
          setIsOutletClosedState(true);
          setOutletClosedReason(orderData.reason || 'Tutup');
        }
        // Juga tangani jika ada valData.isOutletClosed dari validate-cart
        if (orderData.valData?.isOutletClosed) {
          setIsOutletClosedState(true);
          setOutletClosedReason(orderData.valData.outletReason || 'Tutup');
        }
        throw new Error(orderData.error || 'Gagal membuat pesanan. Silakan coba beberapa saat lagi.');
      }

      // 2. Berhasil membuat pesanan: simpan ke Pesanan Saya dan simpan identitas pelanggan untuk auto-fill
      if (orderData.orderId) {
        saveMyOrder(orderData.orderId, undefined, undefined, orderData.accessToken);
        saveSavedCustomer(trimmedName, sanitizedPhone);
      }

      // Kosongkan keranjang, tutup drawer, dan arahkan ke halaman bayar
      onClearCart();
      onClose();
      const paymentUrl =
        orderData.redirectUrl || buildOrderPaymentUrl(orderData.orderId, orderData.accessToken);
      router.push(paymentUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmitting(false);
      queueConfirmedRef.current = false;
    }
  };

  // Pelanggan menyetujui waktu tunggu di pop-up antrean: lanjutkan checkout.
  const handleQueueConfirm = () => {
    queueConfirmedRef.current = true;
    setQueueGate(null);
    void handleProceedToPayment();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#26150B]/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200">
      <div className="fixed inset-0 touch-none cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-[#FAF4E8] rounded-none sm:rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 overscroll-contain border-t-2 border-x-2 border-[#2B1D12]">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#2B1D12] rounded-full mx-auto mt-2.5 mb-1" />

        {/* ZONA A: Header Tetap di Atas */}
        <div className="shrink-0 bg-[#FAF4E8] px-5 py-3 border-b-2 border-[#2B1D12] flex items-center justify-between z-10 touch-none">
          <div>
            <h3 className="font-display font-black text-base text-[#2B1D12] leading-tight">
              Keranjang Belanja
            </h3>
            <p className="text-[11px] text-[#6A584D] font-bold line-clamp-1">
              {effectiveOutletName}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#2B1D12] bg-white border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            aria-label="Tutup keranjang"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ZONA B: Zona Tengah - DAFTAR ITEM SAJA yang bisa di-scroll */}
        <div className="relative flex-1 min-h-0 flex flex-col bg-[#FAF4E8]">
          <div
            ref={itemsScrollRef}
            onScroll={updateScrollIndicator}
            className="cart-items-scroll flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
          >
            {items.length === 0 ? (
              <div className="py-12 text-center text-[#6A584D]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-[#C67D0A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="font-display text-sm font-black text-[#2B1D12]">Keranjang masih kosong</p>
                <p className="text-xs text-[#6A584D] font-medium mt-1">Pilih menu favoritmu di atas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const itemPricing = pricing.items[index];
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#FFFDF9] rounded-2xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] flex gap-2.5 items-start"
                    >
                      {item.image && (
                        <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-display font-bold text-xs text-[#26150B] leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#9C897B] hover:text-rose-600 p-1 -mr-1"
                            aria-label={`Hapus ${item.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {item.isBundle && item.bundleDetails && item.bundleDetails.length > 0 ? (
                          <div className="mt-1 space-y-0.5 bg-[#FAF4E8] p-1.5 rounded-lg border border-[#2B1D12]/15">
                            {item.bundleDetails.map((d, dIdx) => (
                              <p key={dIdx} className="text-[10px] text-[#4A3628] font-bold">
                                • {d.name} {d.variantDescription ? <span className="text-[#7A6658]">({d.variantDescription})</span> : null}
                              </p>
                            ))}
                          </div>
                        ) : item.variantDescription ? (
                          <p className="text-[11px] text-[#6A584D] line-clamp-2 mt-0.5">
                            {item.variantDescription}
                          </p>
                        ) : null}

                        {item.addons && item.addons.length > 0 && (
                          <p className="text-[10px] text-[#A66908] font-medium mt-0.5">
                            Topping: {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-[#8C7667] italic mt-0.5">
                            Catatan: &quot;{item.notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F2EAE0]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-xs font-black text-[#DC2626]">
                              {formatRupiah(itemPricing ? itemPricing.subtotalItem : 0)}
                            </span>
                            <span className="text-[10px] text-[#9C897B] line-through">
                              {formatRupiah(itemPricing ? itemPricing.originalPricePerItem * item.quantity : 0)}
                            </span>
                          </div>

                          {/* Kontrol Kuantitas */}
                          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="text-[#2B1D12] font-black text-sm px-1.5 min-h-[30px]"
                              aria-label="Kurangi kuantitas"
                            >
                              -
                            </button>
                            <span className="font-display text-xs font-black text-[#2B1D12]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="text-[#2B1D12] font-black text-sm px-1.5 min-h-[30px]"
                              aria-label="Tambah kuantitas"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fade gradient petunjuk scroll: HANYA saat masih ada isi di bawahnya */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#FAF4E8] to-transparent transition-opacity duration-200 ${
              canScrollDown ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* ZONA C: form + ringkasan bisa di-scroll, tombol bayar SELALU NEMPEL di bawah */}
        {items.length > 0 && (
          <div className="shrink-0 bg-[#FAF4E8] border-t-2 border-[#2B1D12] shadow-xl z-20 flex flex-col min-h-0 max-h-[65vh]">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="p-3.5 space-y-2.5">
              {/* 1. Informasi Pick Up (Ringkas) */}
              <div className="bg-[#FFFDF9] rounded-2xl p-3 border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-[11px] font-black text-[#2B1D12] uppercase tracking-wide">
                    Informasi Pick Up
                  </h4>
                  {hasAutoFilled && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-600/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span>✓</span> Tersimpan otomatis
                    </span>
                  )}
                </div>

                {/* Input Nama */}
                <div className="space-y-1">
                  <label htmlFor="checkout-name" className="text-[11px] font-bold text-[#2B1D12] block">
                    Nama Pemesan <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="checkout-name"
                    type="text"
                    maxLength={40}
                    value={customerName}
                    onChange={(e) => {
                      const filtered = filterCustomerNameInput(e.target.value);
                      setCustomerName(filtered);
                      if (nameHighlight) setNameHighlight(false);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Contoh: Budi Prasetyo"
                    className={`w-full min-h-[40px] px-3.5 py-2 bg-white border-2 rounded-xl text-xs font-semibold text-[#2B1D12] placeholder-[#8C7667] outline-hidden transition ${
                      nameHighlight
                        ? 'border-[#DC2626] ring-2 ring-rose-400/50 bg-rose-50/40'
                        : 'border-[#2B1D12] focus:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]'
                    }`}
                  />
                </div>

                {/* Input Nomor WhatsApp */}
                <div className="space-y-1">
                  <label htmlFor="checkout-wa" className="text-[11px] font-bold text-[#2B1D12] block">
                    Nomor WhatsApp <span className="text-[#DC2626]">*</span>
                  </label>
                  <div
                    className={`flex items-center rounded-xl border-2 transition overflow-hidden bg-white ${
                      waHighlight
                        ? 'border-[#DC2626] ring-2 ring-rose-400/50 bg-rose-50/40'
                        : 'border-[#2B1D12] focus-within:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]'
                    }`}
                  >
                    <div className="bg-[#FAF4E8] px-3 py-2 border-r-2 border-[#2B1D12] text-xs font-black text-[#2B1D12] select-none flex items-center gap-1 shrink-0">
                      <span>🇮🇩</span>
                      <span>+62</span>
                    </div>
                    <input
                      ref={waInputRef}
                      id="checkout-wa"
                      type="tel"
                      maxLength={18}
                      value={customerWa}
                      onChange={(e) => {
                        let filtered = filterCustomerPhoneInput(e.target.value);
                        // Bersihkan awalan +62, 62, atau 0 otomatis jika diketik/paste agar tidak dobel +62
                        if (filtered.startsWith('+62')) filtered = filtered.slice(3);
                        else if (filtered.startsWith('62')) filtered = filtered.slice(2);
                        else if (filtered.startsWith('0')) filtered = filtered.slice(1);
                        setCustomerWa(filtered);
                        if (waHighlight) setWaHighlight(false);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="812-3456-7890"
                      className="w-full min-h-[40px] px-3.5 py-2 bg-transparent text-xs font-semibold text-[#2B1D12] placeholder-[#8C7667] outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#7A6658] font-medium">
                    Isi dengan nomor WhatsApp aktif yang bisa dihubungi, admin akan menghubungimu lewat nomor ini untuk konfirmasi pesanan.
                  </p>
                </div>

                {/* Pilihan Waktu Pick Up */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#2B1D12] block">
                    Waktu Pengambilan
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupMode('now')}
                      className={`min-h-[40px] p-2 rounded-xl border-2 text-left text-xs font-bold transition ${
                        pickupMode === 'now'
                          ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                          : 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7]'
                      }`}
                    >
                      <span className="block text-[11px] leading-tight">Pick up Sekarang</span>
                      <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">Siap ~10 menit</span>
                    </button>

                    <button
                      type="button"
                      disabled={!scheduleSlots.isAvailable}
                      onClick={() => {
                        if (scheduleSlots.isAvailable) setPickupMode('scheduled');
                      }}
                      className={`min-h-[40px] p-2 rounded-xl border-2 text-left text-xs font-bold transition ${
                        pickupMode === 'scheduled'
                          ? 'border-[#2B1D12] bg-[#2B1D12] text-[#FAF4E8] font-display shadow-[2px_2px_0px_#C67D0A]'
                          : scheduleSlots.isAvailable
                          ? 'border-[#2B1D12] bg-white text-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] hover:bg-[#FFF8E7]'
                          : 'border-[#D4C3B2] bg-[#EFE5D8] text-[#8C7667] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="block text-[11px] leading-tight">Jadwalkan Pick Up</span>
                      <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">Hari ini saja</span>
                    </button>
                  </div>

                  {/* Dropdown Jam Terjadwal */}
                  {pickupMode === 'scheduled' && scheduleSlots.isAvailable && (
                    <div className="pt-1">
                      <label htmlFor="schedule-slot-select" className="text-[11px] text-[#2B1D12] font-semibold block mb-1">
                        Pilih Jam Ambil (WIB):
                      </label>
                      <select
                        ref={slotSelectRef}
                        id="schedule-slot-select"
                        value={effectiveSelectedSlot}
                        onChange={(e) => {
                          setSelectedSlot(e.target.value);
                          if (slotHighlight) setSlotHighlight(false);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className={`w-full min-h-[40px] px-3.5 py-2 bg-white border-2 rounded-xl text-xs font-semibold text-[#2B1D12] outline-hidden ${
                          slotHighlight
                            ? 'border-[#DC2626] ring-2 ring-rose-400/50 bg-rose-50/40'
                            : 'border-[#2B1D12] focus:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]'
                        }`}
                      >
                        {scheduleSlots.slots.map((slot) => (
                          <option key={slot} value={slot}>
                            Pukul {slot} WIB
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!scheduleSlots.isAvailable && (
                    <p className="text-[10px] text-[#C67D0A] font-bold">
                      {scheduleSlots.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Rincian Ringkasan Pembayaran */}
              <div className="bg-[#FFFDF9] rounded-2xl p-3 border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] text-xs space-y-1.5">
                <h4 className="font-display font-black text-[#2B1D12] uppercase tracking-wide text-[10px] pb-1 border-b-2 border-[#2B1D12]">
                  Ringkasan Pembayaran
                </h4>

                {pricing.bundleQuantity > 0 && (
                  <div className="flex justify-between text-[#2B1D12] text-[11px]">
                    <span>Sub Total Bundling ({pricing.bundleQuantity} item)</span>
                    <span className="font-bold text-[#2B1D12]">{formatRupiah(pricing.bundleSubtotal)}</span>
                  </div>
                )}

                {pricing.regularQuantity > 0 && (
                  <div className="flex justify-between text-[#2B1D12] text-[11px]">
                    <span>Sub Total Normal ({pricing.regularQuantity} item)</span>
                    <span className="font-bold text-[#2B1D12]">{formatRupiah(pricing.regularSubtotal)}</span>
                  </div>
                )}

                {pricing.bundleQuantity > 0 && (
                  <div className="flex justify-between text-[#2B1D12] text-[11px]">
                    <span>Biaya Jasa Bundling</span>
                    <span className="font-bold text-[#2B1D12]">{formatRupiah(pricing.bundleFee)}</span>
                  </div>
                )}

                {pricing.regularQuantity > 0 && (
                  <div className="flex justify-between text-[#2B1D12] text-[11px]">
                    <span>Biaya Jasa Normal</span>
                    <span className="font-bold text-[#2B1D12]">{formatRupiah(pricing.regularFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8C7667] text-[10px]">
                  <span>Total Harga Normal</span>
                  <span className="line-through">{formatRupiah(pricing.totalSavings + pricing.subtotal)}</span>
                </div>

                <div className="pt-2 border-t-2 border-[#2B1D12] flex justify-between items-baseline font-bold text-sm">
                  <span className="font-display text-[#2B1D12] text-xs font-black">Total Pembayaran</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black text-[#15803D] bg-[#D9F3EA] px-2 py-0.5 rounded-full border-2 border-[#15803D]">
                      {`Kamu Hemat ${formatRupiah(pricing.totalSavings)}!`}
                    </span>
                    <span className="font-display text-base font-black text-[#2B1D12]">{formatRupiah(pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Pesan Error Validasi */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border-2 border-[#DC2626] rounded-xl text-rose-900 text-xs flex flex-col gap-2.5 shadow-[2px_2px_0px_#2B1D12] animate-in fade-in"
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="leading-tight flex-1 font-bold">{errorMessage}</span>
                  </div>

                  {errorMessage.toLowerCase().includes('refresh') && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full py-2 px-3 bg-[#DC2626] hover:bg-[#B91C1C] active:translate-x-0.5 active:translate-y-0.5 text-white font-bold text-xs rounded-lg shadow-[2px_2px_0px_#2B1D12] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Perbarui Keranjang Sekarang
                    </button>
                  )}
                </div>
              )}



              {/* Banner Peringatan Minimal/Maksimal Pembelian Menu Reguler */}
              {regularValidationError && (
                <div
                  role="alert"
                  className="p-3 bg-[#FFF0C2] border-2 border-[#DC2626] rounded-2xl text-[#2B1D12] text-xs flex flex-col gap-1 shadow-[3px_3px_0px_#2B1D12] animate-in fade-in"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#DC2626] text-xs">
                        {regularValidationError}
                      </p>
                      <p className="text-[11px] text-[#6A584D] mt-0.5 leading-relaxed font-medium">
                        Total harga normal menu reguler: <strong>{formatRupiah(pricing.regularNormalSubtotal)}</strong>. Pesanan menu reguler dibatasi antara Rp50.000 - Rp60.000 (harga normal).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Banner Peringatan Outlet Tutup */}
              {isOutletClosed && (
                <div
                  role="alert"
                  className="p-3 bg-[#FFF0C2] border-2 border-[#2B1D12] rounded-2xl text-[#2B1D12] text-xs flex flex-col gap-2 shadow-[3px_3px_0px_#2B1D12] animate-in fade-in"
                >
                  <div className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-[#C67D0A] shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#2B1D12] text-xs">
                        Outlet ini sedang tutup ({effectiveClosedReason})
                      </p>
                      <p className="text-[11px] text-[#2B1D12] mt-0.5 leading-relaxed font-medium">
                        {effectiveOutletName} sedang tidak menerima pesanan saat ini. Silakan pilih outlet lain untuk melanjutkan pesanan.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="min-h-[38px] px-3.5 py-1.5 bg-[#2B1D12] text-[#FAF4E8] hover:bg-[#3D2313] text-xs font-display font-black rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <span>Pilih Outlet Lain</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Info antrean pemrosesan saat ini */}
              {queue && (() => {
                const loadInfo = getQueueLoadInfo(queue.activeOrders);
                return (
                  <div
                    aria-label="Status Antrean Pemrosesan"
                    className={`mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 border-[#2B1D12] text-[11px] font-bold shadow-[2px_2px_0px_#2B1D12] ${loadInfo.badgeBg} ${loadInfo.badgeText}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${loadInfo.dotColor}`} />
                      <span className="truncate">
                        Antrean: {queue.activeOrders} order ({queue.totalItems} item) • {loadInfo.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-black">
                      ±{queue.estimateMinutes} mnt
                    </span>
                  </div>
                );
              })()}

            </div>
            </div>
            {/* Footer tombol bayar: selalu nempel di bawah drawer, tidak ikut scroll */}
            <div className="shrink-0 border-t-2 border-[#2B1D12] bg-[#FAF4E8] p-3.5">
              {/* 4. Tombol Lanjut ke Pembayaran QRIS / Tombol Outlet Tutup / Tombol Min Order Blocked */}
              {isOutletClosed ? (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[48px] px-4 py-3 bg-[#E5DACB] text-[#8C7667] font-display font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80 border-2 border-[#2B1D12]"
                >
                  <span>Outlet Sedang Tutup - Tidak Bisa Dipesan</span>
                </button>
              ) : regularValidationError ? (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[48px] px-4 py-3 bg-[#E5DACB] text-[#DC2626] font-display font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-90 border-2 border-[#DC2626]"
                >
                  <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{regularValidationError}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProceedToPayment}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#2B1D12] text-[#FAF4E8] font-display font-black text-xs rounded-xl flex items-center justify-center gap-2 transition border-2 border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FAF4E8] border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-[#FAF4E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Lanjut ke Pembayaran • {formatRupiah(pricing.total)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pop-up konfirmasi antrean panjang */}
      {queueGate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#26150B]/70 overscroll-contain animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#FAF4E8] rounded-3xl border-2 border-[#2B1D12] shadow-[5px_5px_0px_#2B1D12] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <h3 className="font-display font-black text-base text-[#2B1D12]">
                Antrean Lagi Ramai
              </h3>
            </div>
            <p className="text-xs font-bold text-[#4A3628] leading-relaxed">
              Saat ini ada {queueGate.activeOrders} order ({queueGate.totalItems} item)
              di antrean. Order diproses satu per satu sesuai urutan masuk, jadi
              estimasi pesananmu siap sekitar{' '}
              <span className="text-[#DC2626] font-black">
                ±{queueGate.estimateMinutes} menit
              </span>{' '}
              lagi.
            </p>
            <p className="text-[11px] font-bold text-[#7A6658] leading-relaxed">
              Tetap order sekarang? Antreanmu tercatat begitu pesanan dibuat dan
              pembayaran dikonfirmasi.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQueueGate(null)}
                className="py-2.5 px-3 bg-white hover:bg-[#FFE7D6] text-[#2B1D12] font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
              >
                Nanti Dulu
              </button>
              <button
                type="button"
                onClick={handleQueueConfirm}
                className="py-2.5 px-3 bg-[#15803D] hover:bg-[#166534] text-white font-display font-black text-xs rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
              >
                Tetap Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
