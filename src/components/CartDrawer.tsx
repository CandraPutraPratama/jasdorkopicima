'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
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

    setIsSubmitting(true);

    try {
      // 1. Cek jam buka jasdor secara real-time ke server
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

      // 2. Cek status buka outlet terbaru dari get_store
      if (effectiveOutletCode) {
        const storeRes = await fetch(`/api/outlets/${encodeURIComponent(effectiveOutletCode)}`, {
          cache: 'no-store',
        });
        const storeData = await storeRes.json();
        if (!storeData.outlet?.isOpen) {
          throw new Error(`Outlet ${effectiveOutletName} sedang tutup saat ini.`);
        }
      }

      // 3. Pengecekan stok yang benar-benar FRESH langsung ke KK API
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md max-h-[92vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
        {/* ZONA A: Header Tetap di Atas */}
        <div className="shrink-0 bg-white/95 backdrop-blur px-5 py-3.5 border-b border-stone-200 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-base text-[#111111] leading-tight">
              Keranjang Belanja
            </h3>
            <p className="text-[11px] text-stone-500 line-clamp-1">
              {effectiveOutletName}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Tutup keranjang"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ZONA B: Zona Tengah - DAFTAR ITEM SAJA yang bisa di-scroll */}
        <div className="relative flex-1 min-h-0 flex flex-col bg-stone-50/40">
          <div
            ref={itemsScrollRef}
            onScroll={updateScrollIndicator}
            className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
          >
            {items.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-stone-300"
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
                <p className="text-sm font-semibold">Keranjang masih kosong</p>
                <p className="text-xs mt-1">Pilih menu favoritmu di atas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const itemPricing = pricing.items[index];
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex gap-3 items-start"
                    >
                      {item.image && (
                        <div className="relative w-14 h-14 bg-stone-200 rounded-xl overflow-hidden shrink-0 border border-stone-100">
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
                          <h4 className="font-bold text-xs text-[#111111] leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-stone-400 hover:text-rose-500 p-1 -mr-1"
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
                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                            {item.variantDescription}
                          </p>
                        )}

                        {item.addons && item.addons.length > 0 && (
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Topping: {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-stone-400 italic mt-0.5">
                            Catatan: &quot;{item.notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-amber-800">
                              {formatRupiah(itemPricing ? itemPricing.subtotalItem : 0)}
                            </span>
                            <span className="text-[10px] text-stone-400 line-through">
                              {formatRupiah(itemPricing ? itemPricing.originalPricePerItem * item.quantity : 0)}
                            </span>
                          </div>

                          {/* Kontrol Kuantitas */}
                          <div className="flex items-center gap-2 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="text-stone-600 font-bold text-sm px-1.5 min-h-[30px]"
                              aria-label="Kurangi kuantitas"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#111111]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="text-stone-600 font-bold text-sm px-1.5 min-h-[30px]"
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
            className={`pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-stone-100 to-transparent transition-opacity duration-200 ${
              canScrollDown ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* ZONA C: Zona Bawah SELALU MENEMPEL (STICKY/PINNED) */}
        {items.length > 0 && (
          <div className="shrink-0 bg-white border-t border-stone-200 shadow-xl z-20 flex flex-col max-h-[65vh] overflow-y-auto">
            <div className="p-3.5 space-y-2.5">
              {/* 1. Informasi Pick Up (Ringkas) */}
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wide">
                    Informasi Pick Up
                  </h4>
                </div>

                {/* Input Nama */}
                <div className="space-y-1">
                  <label htmlFor="checkout-name" className="text-[11px] font-semibold text-stone-700 block">
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
                    className={`w-full min-h-[40px] px-3.5 py-2 bg-white border rounded-xl text-xs text-[#1F2937] placeholder-stone-400 outline-hidden transition ${
                      nameHighlight
                        ? 'border-rose-500 ring-2 ring-rose-400/50 bg-rose-50/40'
                        : 'border-stone-300 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]'
                    }`}
                  />
                </div>

                {/* Pilihan Waktu Pick Up */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-stone-700 block">
                    Waktu Pengambilan
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupMode('now')}
                      className={`min-h-[40px] p-2 rounded-xl border text-left text-xs font-medium transition ${
                        pickupMode === 'now'
                          ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
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
                          ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-2xs'
                          : scheduleSlots.isAvailable
                          ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                          : 'border-stone-100 bg-stone-100 text-stone-300 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="block text-[11px] leading-tight">Jadwalkan Jam</span>
                      <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">Hari ini saja</span>
                    </button>
                  </div>

                  {/* Dropdown Jam Terjadwal */}
                  {pickupMode === 'scheduled' && scheduleSlots.isAvailable && (
                    <div className="pt-1">
                      <label htmlFor="schedule-slot-select" className="text-[11px] text-stone-500 block mb-1">
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
                        className={`w-full min-h-[40px] px-3.5 py-2 bg-white border rounded-xl text-xs text-[#1F2937] outline-hidden ${
                          slotHighlight
                            ? 'border-rose-500 ring-2 ring-rose-400/50 bg-rose-50/40'
                            : 'border-stone-300 focus:border-[#D4AF37]'
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
                    <p className="text-[10px] text-amber-600">
                      {scheduleSlots.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Rincian Ringkasan Pembayaran */}
              <div className="bg-stone-50/60 rounded-xl p-2.5 border border-stone-200/70 text-xs space-y-1">
                <h4 className="font-bold text-[#111111] uppercase tracking-wide text-[10px] pb-1 border-b border-stone-200/60">
                  Ringkasan Pembayaran
                </h4>

                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>Sub Total ({pricing.totalQuantity} item)</span>
                  <span className="font-semibold text-stone-900">{formatRupiah(pricing.subtotal)}</span>
                </div>

                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>
                    {pricing.totalQuantity === 1
                      ? 'Biaya Jasa (1 item)'
                      : `Biaya Jasa (Rp2.000 x ${pricing.totalQuantity} item)`}
                  </span>
                  <span className="font-semibold text-stone-900">{formatRupiah(pricing.fee)}</span>
                </div>

                <div className="flex justify-between text-stone-400 line-through text-[10px]">
                  <span>Total Harga Asli KK</span>
                  <span>{formatRupiah(pricing.totalSavings + pricing.subtotal)}</span>
                </div>

                <div className="pt-1.5 border-t border-stone-200/60 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-[#111111] text-xs">Total Tagihan</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Hemat {formatRupiah(pricing.totalSavings)}
                    </span>
                    <span className="text-amber-800 text-sm font-extrabold">{formatRupiah(pricing.total)}</span>
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
                  <span className="leading-tight flex-1">{errorMessage}</span>
                </div>
              )}

              {/* 4. Tombol Kirim Pesanan ke WhatsApp */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProceedToWhatsApp}
                className="w-full min-h-[48px] px-4 py-3 bg-[#111111] hover:bg-stone-900 active:scale-98 text-[#D4AF37] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Memvalidasi Pesanan...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="h-4.5 w-4.5 text-[#25D366] shrink-0" />
                    <span>Kirim Pesanan ke WhatsApp • {formatRupiah(pricing.total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi "Sudah mengirim pesan di WhatsApp?" */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 border border-stone-100 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#111111]">
                Sudah mengirim pesan di WhatsApp?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Konfirmasi jika Anda sudah mengirimkan format pesanan ke WhatsApp Jasdor.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmWhatsAppSent}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#111111] text-[#D4AF37] font-bold text-xs rounded-xl shadow-xs"
              >
                Sudah
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessDialog(false)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl"
              >
                Belum
              </button>
            </div>

            {/* Tombol cadangan Salin Pesan */}
            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-amber-700 hover:underline font-medium min-h-[36px] flex items-center justify-center gap-1 mx-auto"
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
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
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
              <h3 className="font-bold text-sm text-[#111111]">
                Stok Tidak Dapat Dipastikan Otomatis
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
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
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#111111] text-[#D4AF37] font-bold text-xs rounded-xl shadow-xs"
              >
                Tetap Lanjut ke WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setShowUncertainModal(false)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-200"
              >
                Kembali ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salin Pesan bila URL melebihi batas */}
      {showCopyModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-3 text-center">
            <h3 className="font-bold text-sm text-[#111111]">
              Pesan Siap Dikirim
            </h3>
            <p className="text-xs text-stone-500">
              Panjang teks pesanan melebihi batas tautan browser. Silakan salin teks di bawah ini dan tempelkan (paste) di obrolan WhatsApp:
            </p>

            <textarea
              readOnly
              value={generatedMessage}
              rows={6}
              className="w-full p-2.5 text-[11px] bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-700"
            />

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#111111] text-[#D4AF37] font-bold text-xs rounded-xl"
            >
              {isCopied ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}
            </button>
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="w-full min-h-[36px] text-xs text-stone-500 hover:text-stone-800 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
