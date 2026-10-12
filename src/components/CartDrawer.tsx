'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { CartItem } from '@/lib/cart-reducer';
import type { OrderPricingResult } from '@/lib/pricing';
import type { Outlet } from '@/types/domain';
import { formatRupiah } from '@/lib/currency';
import { calculateAvailableScheduleSlots } from '@/lib/schedule-slots';
import { getWibTimeParts } from '@/lib/operational';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { BUSINESS_CONFIG } from '@/config/business';

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

  // Set default slot jika pick up terjadwal dipilih
  if (pickupMode === 'scheduled' && !selectedSlot && scheduleSlots.slots.length > 0) {
    setSelectedSlot(scheduleSlots.slots[0]);
  }

  if (!isOpen) return null;

  // Layar sukses setelah pesan WhatsApp terkirim dan dikonfirmasi
  if (orderCompleted) {
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
              Terima kasih, Kak <span className="font-semibold text-stone-800">{customerName}</span>. Tim jasdor akan segera mengonfirmasi pesananmu di WhatsApp.
            </p>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600">
            <p className="font-semibold text-[#111111]">Detail Ringkas:</p>
            <p className="mt-0.5">{pricing.totalQuantity} item • {formatRupiah(pricing.total)}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Outlet: {effectiveOutletName}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOrderCompleted(false);
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

  // Handle validasi pra-kirim ke WhatsApp
  const handleProceedToWhatsApp = async () => {
    setErrorMessage(null);
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      setErrorMessage('Silakan isi nama pemesan terlebih dahulu.');
      return;
    }

    if (trimmedName.length > 40) {
      setErrorMessage('Nama pemesan maksimal 40 karakter.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Keranjang pesanan masih kosong.');
      return;
    }

    if (pickupMode === 'scheduled' && !selectedSlot) {
      setErrorMessage('Silakan pilih jam jadwal pick up.');
      return;
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
          scheduledTime: selectedSlot,
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
    onClearCart();
    setShowSuccessDialog(false);
    setShowCopyModal(false);
    setOrderCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md max-h-[92vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
        {/* Header Drawer */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
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

        {/* Isi Drawer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Daftar Item Keranjang */}
          {items.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
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
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex gap-3 items-start"
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
                        <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
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

          {/* Form Checkout */}
          {items.length > 0 && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                Informasi Pick Up
              </h4>

              {/* Input Nama */}
              <div className="space-y-1">
                <label htmlFor="checkout-name" className="text-xs font-semibold text-stone-700 block">
                  Nama Pemesan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  maxLength={40}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Prasetyo"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-[#1F2937] placeholder-stone-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden transition"
                />
              </div>

              {/* Pilihan Waktu Pick Up */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">
                  Waktu Pengambilan
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupMode('now')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                      pickupMode === 'now'
                        ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className="block leading-tight">Pick up Sekarang</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Siap ~10 menit</span>
                  </button>

                  <button
                    type="button"
                    disabled={!scheduleSlots.isAvailable}
                    onClick={() => {
                      if (scheduleSlots.isAvailable) setPickupMode('scheduled');
                    }}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                      pickupMode === 'scheduled'
                        ? 'border-[#111111] bg-[#111111] text-[#D4AF37] font-bold shadow-xs'
                        : scheduleSlots.isAvailable
                        ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                        : 'border-stone-100 bg-stone-100 text-stone-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="block leading-tight">Jadwalkan Jam</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Hari ini saja</span>
                  </button>
                </div>

                {/* Dropdown Jam Terjadwal */}
                {pickupMode === 'scheduled' && scheduleSlots.isAvailable && (
                  <div className="pt-1">
                    <label htmlFor="schedule-slot-select" className="text-[11px] text-stone-500 block mb-1">
                      Pilih Jam Ambil (WIB):
                    </label>
                    <select
                      id="schedule-slot-select"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-[#1F2937] focus:border-[#D4AF37] outline-hidden"
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
          )}

          {/* Rincian Harga Lengkap */}
          {items.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-[#111111] uppercase tracking-wide text-[11px] pb-1 border-b border-stone-100">
                Ringkasan Pembayaran
              </h4>

              <div className="flex justify-between text-stone-600">
                <span>Sub Total ({pricing.totalQuantity} item)</span>
                <span className="font-semibold text-stone-900">{formatRupiah(pricing.subtotal)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>
                  {pricing.totalQuantity === 1
                    ? 'Biaya Jasa (1 item)'
                    : `Biaya Jasa (Rp2.000 x ${pricing.totalQuantity} item)`}
                </span>
                <span className="font-semibold text-stone-900">{formatRupiah(pricing.fee)}</span>
              </div>

              <div className="flex justify-between text-stone-400 line-through text-[11px]">
                <span>Total Harga Asli KK</span>
                <span>{formatRupiah(pricing.totalSavings + pricing.subtotal)}</span>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline font-bold text-sm">
                <span className="text-[#111111]">Total Tagihan</span>
                <span className="text-amber-800 text-base">{formatRupiah(pricing.total)}</span>
              </div>

              <div className="pt-1 text-center">
                <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Kamu hemat {formatRupiah(pricing.totalSavings)} dari harga normal!
                </span>
              </div>
            </div>
          )}

          {/* Pesan Error Validasi */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Tombol Kirim ke WhatsApp */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 space-y-2 shadow-lg">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleProceedToWhatsApp}
              className="w-full min-h-[50px] px-4 py-3 bg-[#111111] hover:bg-stone-900 active:scale-98 text-[#D4AF37] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Memvalidasi Pesanan...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>Kirim Pesanan ke WhatsApp • {formatRupiah(pricing.total)}</span>
                </>
              )}
            </button>
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
