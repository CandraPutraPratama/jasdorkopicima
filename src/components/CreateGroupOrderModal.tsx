'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSavedCustomer } from '../lib/saved-customer.ts';

interface CreateGroupOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletCode: string;
  outletName: string;
  brandSlug: string;
}

export function CreateGroupOrderModal({
  isOpen,
  onClose,
  outletCode,
  outletName,
  brandSlug,
}: CreateGroupOrderModalProps) {
  const router = useRouter();
  const [hostName, setHostName] = useState(() => {
    const saved = getSavedCustomer();
    return saved?.name || '';
  });
  const [hostWa, setHostWa] = useState(() => {
    const saved = getSavedCustomer();
    return saved?.phone || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{
    id: string;
    joinUrl: string;
    hostToken: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setErrorMessage('Silakan isi nama kamu terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/group-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug,
          outletCode,
          outletName,
          hostName: hostName.trim(),
          hostWa: hostWa.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat sesi pesanan bareng');
      }

      // Simpan token host agar browser ini dikenali sebagai Host
      try {
        localStorage.setItem(`jasdor_host_token_${data.group.id}`, data.group.hostToken);
      } catch {
        // ignore
      }

      setCreatedGroup({
        id: data.group.id,
        joinUrl: data.joinUrl,
        hostToken: data.group.hostToken,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdGroup) return;
    try {
      navigator.clipboard.writeText(createdGroup.joinUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdGroup) return;
    const text = `Yuk pesan kopi bareng di ${outletName} via Jasdor Cima! Klik link ini untuk memilih pesananmu:\n${createdGroup.joinUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGoToRoom = () => {
    if (!createdGroup) return;
    onClose();
    router.push(`/group/${createdGroup.id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B1D12]/70 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#FFFDF9] border-3 border-[#2B1D12] rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0px_#2B1D12] space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b-2 border-[#2B1D12]/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF4E8] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center text-[#2B1D12] shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2 id="group-order-modal-title" className="font-display font-black text-sm sm:text-base text-[#2B1D12] leading-tight">
                Pesan Bareng Teman
              </h2>
              <p className="text-[11px] text-[#7A6455] font-semibold truncate max-w-[220px]">
                {outletName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 rounded-xl border-2 border-[#2B1D12] bg-[#FAF4E8] text-[#2B1D12] font-black flex items-center justify-center hover:bg-[#FFE7D6] active:translate-x-[1px] active:translate-y-[1px] transition cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Kondisi 1: Form Pembuatan */}
        {!createdGroup ? (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div className="p-3 bg-[#FAF4E8] border border-[#2B1D12]/15 rounded-2xl text-xs text-[#5A4537] leading-relaxed">
              Buat satu link untuk kumpulkan pesanan teman kantor. Setiap orang memilih menunya sendiri dari HP masing-masing, dan kamu menyelesaikan satu pembayaran.
            </div>

            <div className="space-y-1">
              <label htmlFor="host-name" className="text-xs font-bold text-[#2B1D12] block">
                Nama Kamu (Host Pembuat) *
              </label>
              <input
                id="host-name"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Ketik nama kamu (misal: Dimas)..."
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#2B1D12] rounded-xl text-xs font-bold text-[#2B1D12] focus:outline-hidden focus:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]/10"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="host-wa" className="text-xs font-bold text-[#2B1D12] block">
                Nomor WhatsApp Kamu (Opsional)
              </label>
              <input
                id="host-wa"
                type="tel"
                value={hostWa}
                onChange={(e) => setHostWa(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#2B1D12] rounded-xl text-xs font-bold text-[#2B1D12] focus:outline-hidden focus:border-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]/10"
              />
              <span className="text-[10px] text-[#7A6455] block">
                Digunakan untuk koordinasi saat kurir tiba mengantar kopi.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-semibold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !hostName.trim()}
              className="w-full min-h-[48px] bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl border border-[#2B1D12] shadow-[3px_3px_0px_#C67D0A] flex items-center justify-center gap-2 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
                  <span>Membuat Link...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span>Buat Link Pesanan Bareng</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Kondisi 2: Berhasil Dibuat, Tampilkan Link & Tombol Share */
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-[#FAF4E8] border-2 border-[#2B1D12] rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C67D0A] block">
                Link Siap Digunakan
              </span>
              <h3 className="font-display font-black text-sm text-[#2B1D12] leading-tight">
                Bagikan Link ke Grup
              </h3>
              <p className="text-[11px] text-[#7A6455] leading-relaxed">
                Teman-temanmu cukup membuka link ini untuk memilih kopi kesukaannya:
              </p>
            </div>

            {/* Input URL Box */}
            <div className="flex items-center gap-1.5 p-2 bg-white border-2 border-[#2B1D12] rounded-xl shadow-[2px_2px_0px_#2B1D12]">
              <input
                type="text"
                readOnly
                value={createdGroup.joinUrl}
                aria-label="URL Link Pesanan Bareng"
                className="w-full bg-transparent px-2 text-xs font-mono font-bold text-[#2B1D12] outline-hidden select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#FAF4E8] hover:bg-[#FFE7D6] border border-[#2B1D12] text-[#2B1D12] text-xs font-display font-black rounded-lg shrink-0 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
              >
                {isCopied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Tersalin</span>
                  </>
                ) : (
                  <span>Salin Link</span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="min-h-[46px] bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs rounded-xl shadow-[2px_2px_0px_#1B8E47] border border-[#1B8E47] flex items-center justify-center gap-2 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                </svg>
                <span>Bagikan ke WA</span>
              </button>

              <button
                type="button"
                onClick={handleGoToRoom}
                className="min-h-[46px] bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl shadow-[3px_3px_0px_#C67D0A] border border-[#2B1D12] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <span>Buka Room Pesanan</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
