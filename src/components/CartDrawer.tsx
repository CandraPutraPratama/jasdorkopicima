'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/lib/cart-reducer';
import type { OrderPricingResult } from '@/lib/pricing';
import type { Outlet } from '@/types/domain';
import { formatRupiah } from '@/lib/currency';
import { calculateAvailableScheduleSlots, isValidScheduleSlot } from '@/lib/schedule-slots';
import { getWibTimeParts } from '@/lib/operational';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { BUSINESS_CONFIG } from '@/config/business';
import {
  createOrderSummarySnapshot,
  formatOrderSummaryDetail,
  type OrderSummarySnapshot,
} from '@/lib/order-snapshot';
import {
  validateCustomerName,
  cleanCustomerName,
  filterCustomerNameInput,
} from '@/lib/sanitizer';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { useScrollLock } from '@/hooks/useScrollLock';
import { OPERATIONAL_GATE_ENABLED } from '@/lib/feature-flags';
import { RINGKASAN_METODE_PEMBAYARAN } from '@/lib/site-config';
import { isOutletClosed as checkIsOutletClosed } from '@/lib/orderability';

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
  const [customerName, setCustomerName] = useState('');
  const [pickupMode, setPickupMode] = useState<'now' | 'scheduled'>('now');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Submit / WhatsApp state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showUncertainModal, setShowUncertainModal] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<OrderSummarySnapshot | null>(null);

  // Kunci scroll tambahan saat sub-dialog aktif (reference counted)
  useScrollLock(showSuccessDialog || showUncertainModal || showCopyModal);

  // UX & Validation Attention states (Sprint 2 Item 1)
  const [nameHighlight, setNameHighlight] = useState(false);
  const [slotHighlight, setSlotHighlight] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Element Refs for scroll & focus control
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
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

  // Layar sukses setelah pesan WhatsApp terkirim dan dikonfirmasi
  if (orderCompleted) {
    const activeSnapshot = orderSnapshot ?? createOrderSummarySnapshot({
      customerName,
      pricing,
      outletName: effectiveOutletName,
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in overscroll-contain">
        <div className="fixed inset-0 touch-none" aria-hidden="true" />
        <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl z-10 overscroll-contain">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#111111]">
              Pesanan Terkirim!
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Terima kasih, Kak <span className="font-semibold text-stone-800">{activeSnapshot.customerName || customerName}</span>. Tim jasdor akan segera mengonfirmasi pesananmu di WhatsApp.
            </p>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600">
            <p className="font-semibold text-[#111111]">Detail Ringkas:</p>
            <p className="mt-0.5">{formatOrderSummaryDetail(activeSnapshot)}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Outlet: {activeSnapshot.outletName}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOrderCompleted(false);
              setOrderSnapshot(null);
              onClose();
            }}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#111111] text-[#D4AF37] font-bold text-xs rounded-xl shadow-xs"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    );
  }

  // Helper untuk memicu scroll halus, highlight visual, dan fokus pada input bermasalah (Langkah 3)
  const triggerFieldAttention = (field: 'name' | 'slot') => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    if (field === 'name') {
      setNameHighlight(true);
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      nameInputRef.current?.focus();
      highlightTimerRef.current = setTimeout(() => setNameHighlight(false), 2000);
    } else if (field === 'slot') {
      setSlotHighlight(true);
      slotSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slotSelectRef.current?.focus();
      highlightTimerRef.current = setTimeout(() => setSlotHighlight(false), 2000);
    }
  };

  // Handle validasi pra-kirim ke WhatsApp
  const handleProceedToWhatsApp = async () => {
    setErrorMessage(null);
    const nameValidation = validateCustomerName(customerName);

    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.errorMessage || 'Silakan isi nama pemesan terlebih dahulu.');
      triggerFieldAttention('name');
      return;
    }

    const trimmedName = nameValidation.sanitized;

    if (items.length === 0) {
      setErrorMessage('Keranjang pesanan masih kosong.');
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

    setIsSubmitting(true);

    try {
      // 1. Cek jam buka jasdor secara real-time ke server (hanya saat gerbang operasional aktif)
      if (OPERATIONAL_GATE_ENABLED) {
        let simulateParam = '';
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const sim = urlParams.get('simulate');
          if (sim === 'open' || sim === 'closed') {
            simulateParam = `?simulate=${sim}`;
          }
        }
        const opRes = await fetch(`/api/operational-status${simulateParam}`, { cache: 'no-store' });
        const opData = await opRes.json();
        if (!opData.isOpen) {
          throw new Error('Jasdor sedang tutup saat ini. Pesanan tidak dapat dikirim.');
        }
      }

      // 2. Cek status buka & orderability outlet terbaru dari get_store
      if (effectiveOutletCode) {
        const storeRes = await fetch(`/api/outlets/${encodeURIComponent(effectiveOutletCode)}`, {
          cache: 'no-store',
        });
        const storeData = await storeRes.json();
        const outletInfo = storeData.outlet;
        if (!outletInfo?.isOpen || !outletInfo?.canOrder) {
          setIsOutletClosedState(true);
          setOutletClosedReason(outletInfo?.orderReason || 'Tutup');
          throw new Error(
            `Outlet ${effectiveOutletName} sedang tutup (${outletInfo?.orderReason || 'Tidak menerima pesanan'}). Silakan pilih outlet lain.`
          );
        }
      }

      // 3. Pengecekan stok dan status outlet yang benar-benar FRESH langsung ke KK API
      if (effectiveOutletCode) {
        const valRes = await fetch(`/api/outlets/${encodeURIComponent(effectiveOutletCode)}/validate-cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((it) => ({
              bundleCode: it.bundleCode,
              sku: it.sku,
              name: it.name,
              quantity: it.quantity,
            })),
          }),
        });

        const valData = await valRes.json();

        if (!valData.valid) {
          if (valData.isOutletClosed) {
            setIsOutletClosedState(true);
            setOutletClosedReason(valData.outletReason || 'Tutup');
            throw new Error(
              valData.message ||
                `Outlet ${effectiveOutletName} sedang tutup (${valData.outletReason || 'Tidak menerima pesanan'}). Silakan pilih outlet lain.`
            );
          }
          const reasons = (valData.unavailableItems || [])
            .map((u: any) => `${u.name} (${u.reason})`)
            .join(', ');
          throw new Error(`Maaf, beberapa menu sedang habis di outlet: ${reasons}`);
        }

        // 4. Hitung estimasi waktu siap untuk pickup sekarang
        const now = new Date();
        const readyDate = new Date(now.getTime() + 10 * 60 * 1000);
        const { timeString: estimatedTime } = getWibTimeParts(readyDate);

        // 5. Bangun string pesan format WhatsApp resmi
        const message = buildWhatsAppMessage({
          customerName: trimmedName,
          outletName: effectiveOutletName,
          pickupMode,
          estimatedTime,
          scheduledTime: effectiveSelectedSlot,
          items,
        });

        setGeneratedMessage(message);

        // Jika stok tidak bisa dipastikan secara otomatis, beri pilihan eksplisit kepada customer
        if (valData.uncertain) {
          setShowUncertainModal(true);
          return;
        }

        // Jika stok terverifikasi valid, langsung buka WhatsApp
        dispatchWhatsAppOrder(message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memvalidasi pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dispatchWhatsAppOrder = (message: string) => {
    setOrderSnapshot(
      createOrderSummarySnapshot({
        customerName: cleanCustomerName(customerName),
        pricing,
        outletName: effectiveOutletName,
      })
    );
    const waInfo = buildWhatsAppUrl(BUSINESS_CONFIG.whatsappNumber, message);
    window.open(waInfo.url, '_blank', 'noopener,noreferrer');
    setShowSuccessDialog(true);
    if (!waInfo.isDirect) {
      setShowCopyModal(true);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('Gagal menyalin:', e);
    }
  };

  const handleConfirmWhatsAppSent = () => {
    if (!orderSnapshot) {
      setOrderSnapshot(
        createOrderSummarySnapshot({
          customerName: cleanCustomerName(customerName),
          pricing,
          outletName: effectiveOutletName,
        })
      );
    }
    onClearCart();
    setShowSuccessDialog(false);
    setShowCopyModal(false);
    setOrderCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#26150B]/60 backdrop-blur-2xs animate-in fade-in duration-200 overscroll-contain">
      <div className="fixed inset-0 touch-none" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md max-h-[92vh] bg-[#FBF8F4] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 overscroll-contain border-t border-[#EFE5D8]">
        {/* Drag handle */}
        <div className="w-12 h-1 bg-[#D4C3B2] rounded-full mx-auto mt-2.5 mb-1" />

        {/* ZONA A: Header Tetap di Atas */}
        <div className="shrink-0 bg-[#FBF8F4]/95 backdrop-blur px-5 py-3 border-b border-[#EFE5D8] flex items-center justify-between z-10 touch-none">
          <div>
            <h3 className="font-display font-bold text-base text-[#26150B] leading-tight">
              Keranjang Belanja
            </h3>
            <p className="text-[11px] text-[#735F52] line-clamp-1">
              {effectiveOutletName}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#8C7667] hover:text-[#26150B] hover:bg-[#F2EAE0] transition"
            aria-label="Tutup keranjang"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ZONA B: Zona Tengah - DAFTAR ITEM SAJA yang bisa di-scroll */}
        <div className="relative flex-1 min-h-0 flex flex-col bg-[#FAF6F0]">
          <div
            ref={itemsScrollRef}
            onScroll={updateScrollIndicator}
            className="cart-items-scroll flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
          >
            {items.length === 0 ? (
              <div className="py-12 text-center text-[#8C7667]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-[#C8B8A6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="font-display text-sm font-bold text-[#26150B]">Keranjang masih kosong</p>
                <p className="text-xs text-[#735F52] mt-1">Pilih menu favoritmu di atas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const itemPricing = pricing.items[index];
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs flex gap-3 items-start"
                    >
                      {item.image && (
                        <div className="relative w-14 h-14 bg-[#F4EDE3] rounded-xl overflow-hidden shrink-0 border border-[#EAE0D3]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
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

                        {item.variantDescription && (
                          <p className="text-[11px] text-[#6A584D] line-clamp-2 mt-0.5">
                            {item.variantDescription}
                          </p>
                        )}

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
                          <div className="flex items-center gap-2 bg-[#F2EAE0] px-2 py-0.5 rounded-lg border border-[#E3D6C5]">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="text-[#26150B] font-bold text-sm px-1.5 min-h-[30px]"
                              aria-label="Kurangi kuantitas"
                            >
                              -
                            </button>
                            <span className="font-display text-xs font-bold text-[#26150B]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="text-[#26150B] font-bold text-sm px-1.5 min-h-[30px]"
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
            className={`pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#FAF6F0] to-transparent transition-opacity duration-200 ${
              canScrollDown ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* ZONA C: Zona Bawah SELALU MENEMPEL (STICKY/PINNED) */}
        {items.length > 0 && (
          <div className="shrink-0 bg-[#FBF8F4] border-t border-[#EFE5D8] shadow-xl z-20 flex flex-col max-h-[65vh] overflow-y-auto overscroll-contain">
            <div className="p-3.5 space-y-2.5">
              {/* 1. Informasi Pick Up (Ringkas) */}
              <div className="bg-white rounded-2xl p-3 border border-[#EFE5D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-[11px] font-bold text-[#26150B] uppercase tracking-wide">
                    Informasi Pick Up
                  </h4>
                </div>

                {/* Input Nama */}
                <div className="space-y-1">
                  <label htmlFor="checkout-name" className="text-[11px] font-semibold text-[#4A3225] block">
                    Nama Pemesan <span className="text-rose-500">*</span>
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
                    className={`w-full min-h-[40px] px-3.5 py-2 bg-white border rounded-xl text-xs text-[#26150B] placeholder-[#9C897B] outline-hidden transition ${
                      nameHighlight
                        ? 'border-rose-500 ring-2 ring-rose-400/50 bg-rose-50/40'
                        : 'border-[#E0D4C5] focus:border-[#C67D0A] focus:ring-1 focus:ring-[#C67D0A]'
                    }`}
                  />
                </div>

                {/* Pilihan Waktu Pick Up */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#4A3225] block">
                    Waktu Pengambilan
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupMode('now')}
                      className={`min-h-[40px] p-2 rounded-xl border text-left text-xs font-medium transition ${
                        pickupMode === 'now'
                          ? 'border-[#26150B] bg-[#26150B] text-[#FBBF24] font-display font-bold shadow-2xs'
                          : 'border-[#E0D4C5] bg-white text-[#3D2313] hover:border-[#D9A74A]'
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
                      className={`min-h-[40px] p-2 rounded-xl border text-left text-xs font-medium transition ${
                        pickupMode === 'scheduled'
                          ? 'border-[#26150B] bg-[#26150B] text-[#FBBF24] font-display font-bold shadow-2xs'
                          : scheduleSlots.isAvailable
                          ? 'border-[#E0D4C5] bg-white text-[#3D2313] hover:border-[#D9A74A]'
                          : 'border-[#EFE5D8] bg-[#F4EDE3] text-[#BFAFA0] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="block text-[11px] leading-tight">Jadwalkan Jam</span>
                      <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">Hari ini saja</span>
                    </button>
                  </div>

                  {/* Dropdown Jam Terjadwal */}
                  {pickupMode === 'scheduled' && scheduleSlots.isAvailable && (
                    <div className="pt-1">
                      <label htmlFor="schedule-slot-select" className="text-[11px] text-[#735F52] block mb-1">
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
                        className={`w-full min-h-[40px] px-3.5 py-2 bg-white border rounded-xl text-xs text-[#26150B] outline-hidden ${
                          slotHighlight
                            ? 'border-rose-500 ring-2 ring-rose-400/50 bg-rose-50/40'
                            : 'border-[#E0D4C5] focus:border-[#C67D0A]'
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
                    <p className="text-[10px] text-[#A66908]">
                      {scheduleSlots.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Rincian Ringkasan Pembayaran */}
              <div className="bg-white rounded-2xl p-3 border border-[#EFE5D8] text-xs space-y-1.5">
                <h4 className="font-display font-bold text-[#26150B] uppercase tracking-wide text-[10px] pb-1 border-b border-[#F2EAE0]">
                  Ringkasan Pembayaran
                </h4>

                <div className="flex justify-between text-[#6A584D] text-[11px]">
                  <span>Sub Total ({pricing.totalQuantity} item)</span>
                  <span className="font-semibold text-[#26150B]">{formatRupiah(pricing.subtotal)}</span>
                </div>

                <div className="flex justify-between text-[#6A584D] text-[11px]">
                  <span>
                    {pricing.totalQuantity === 1
                      ? 'Biaya Jasa (1 item)'
                      : `Biaya Jasa (Rp2.000 x ${pricing.totalQuantity} item)`}
                  </span>
                  <span className="font-semibold text-[#26150B]">{formatRupiah(pricing.fee)}</span>
                </div>

                <div className="flex justify-between text-[#9C897B] line-through text-[10px]">
                  <span>Total Harga Asli KK</span>
                  <span>{formatRupiah(pricing.totalSavings + pricing.subtotal)}</span>
                </div>

                <div className="pt-2 border-t border-[#F2EAE0] flex justify-between items-baseline font-bold text-sm">
                  <span className="font-display text-[#26150B] text-xs font-bold">Total Tagihan</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Hemat {formatRupiah(pricing.totalSavings)}
                    </span>
                    <span className="font-display text-base font-black text-[#26150B]">{formatRupiah(pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Pesan Error Validasi */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in"
                >
                  <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="leading-tight flex-1 font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Baris Info Pembayaran (Display Only) */}
              <div className="bg-[#F7F2EC] border border-[#EAE0D3] rounded-xl p-2.5 flex items-start gap-2 text-[11px] leading-relaxed">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-[#C67D0A] shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div className="min-w-0">
                  <span className="font-bold text-[#26150B]">Pembayaran: </span>
                  <span className="font-semibold text-[#4A3225]">{RINGKASAN_METODE_PEMBAYARAN}</span>
                  <span className="text-[#735F52]"> — instruksi bayar dikirim admin via WA setelah pesanan dikonfirmasi.</span>
                </div>
              </div>

              {/* Banner Peringatan Outlet Tutup */}
              {isOutletClosed && (
                <div
                  role="alert"
                  className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-950 text-xs flex flex-col gap-2 shadow-2xs animate-in fade-in"
                >
                  <div className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-950 text-xs">
                        Outlet ini sedang tutup ({effectiveClosedReason})
                      </p>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        {effectiveOutletName} sedang tidak menerima pesanan saat ini. Silakan pilih outlet lain untuk melanjutkan pesanan.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="min-h-[38px] px-3.5 py-1.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] text-xs font-display font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs text-center"
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

              {/* 4. Tombol Kirim Pesanan ke WhatsApp (Official WhatsApp Green CTA) / Tombol Outlet Tutup */}
              {isOutletClosed ? (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[48px] px-4 py-3 bg-[#E5DACB] text-[#8C7667] font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  <span>Outlet Sedang Tutup — Tidak Bisa Dipesan</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProceedToWhatsApp}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#15803D] hover:bg-[#166534] active:scale-98 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memvalidasi Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="h-4.5 w-4.5 text-white shrink-0" />
                      <span>Kirim Pesanan ke WhatsApp • {formatRupiah(pricing.total)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi "Sudah mengirim pesan di WhatsApp?" */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#26150B]/60 backdrop-blur-2xs animate-in fade-in overscroll-contain">
          <div className="fixed inset-0 touch-none" aria-hidden="true" />
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 border border-[#EFE5D8] text-center z-10 overscroll-contain">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[#26150B]">
                Sudah kirim pesan ke WhatsApp?
              </h3>
              <p className="text-xs text-[#6A584D] leading-relaxed">
                Konfirmasi jika Anda sudah mengirimkan format pesanan ke WhatsApp Jasdor.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmWhatsAppSent}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] font-display font-bold text-xs rounded-xl shadow-xs"
              >
                Sudah
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessDialog(false)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#F2EAE0] hover:bg-[#EAE0D3] text-[#4A3225] font-semibold text-xs rounded-xl"
              >
                Belum
              </button>
            </div>

            {/* Tombol cadangan Salin Pesan */}
            <div className="pt-2 border-t border-[#F2EAE0]">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-[#A66908] hover:underline font-bold min-h-[36px] flex items-center justify-center gap-1 mx-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                {isCopied ? 'Tersalin!' : 'Salin Teks Pesan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peringatan Stok Tidak Pasti */}
      {showUncertainModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-[#26150B]/60 backdrop-blur-2xs animate-in fade-in overscroll-contain">
          <div className="fixed inset-0 touch-none" aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3.5 text-center z-10 overscroll-contain border border-[#EFE5D8]">
            <div className="w-12 h-12 bg-[#FEF3C7] text-[#B45309] rounded-2xl flex items-center justify-center mx-auto border border-[#FDE68A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm text-[#26150B]">
                Stok Tidak Dapat Dipastikan Otomatis
              </h3>
              <p className="text-xs text-[#6A584D] leading-relaxed">
                Koneksi pengecekan stok ke outlet sedang lambat. Kamu tetap dapat melanjutkan pesanan dan ketersediaan stok akan dikonfirmasi langsung oleh admin jasdor via WhatsApp.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUncertainModal(false);
                  dispatchWhatsAppOrder(generatedMessage);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] font-display font-bold text-xs rounded-xl shadow-xs"
              >
                Tetap Lanjut ke WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setShowUncertainModal(false)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#F2EAE0] hover:bg-[#EAE0D3] text-[#4A3225] font-semibold text-xs rounded-xl"
              >
                Kembali ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salin Pesan bila URL melebihi batas */}
      {showCopyModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-[#26150B]/60 backdrop-blur-2xs animate-in fade-in overscroll-contain">
          <div className="fixed inset-0 touch-none" aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3 text-center z-10 overscroll-contain border border-[#EFE5D8]">
            <h3 className="font-display font-bold text-sm text-[#26150B]">
              Pesan Siap Dikirim
            </h3>
            <p className="text-xs text-[#6A584D]">
              Panjang teks pesanan melebihi batas tautan browser. Silakan salin teks di bawah ini dan tempelkan (paste) di obrolan WhatsApp:
            </p>

            <textarea
              readOnly
              value={generatedMessage}
              rows={6}
              className="w-full p-2.5 text-[11px] bg-[#FAF7F2] border border-[#E0D4C5] rounded-xl font-mono text-[#26150B] overscroll-contain"
            />

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] font-display font-bold text-xs rounded-xl"
            >
              {isCopied ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}
            </button>
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="w-full min-h-[36px] text-xs text-[#8C7667] hover:text-[#26150B] font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
