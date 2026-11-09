'use client';

import { useState } from 'react';
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
    const text = `Yuk pesan kopi bareng di ${outletName} via Jasdor Cima! Klik link ini buat pilih kopimu sendiri ya:\n${createdGroup.joinUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGoToRoom = () => {
    if (!createdGroup) return;
    onClose();
    router.push(`/group/${createdGroup.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-[#FFFDF9] border-3 border-[#2B1D12] rounded-3xl p-5 shadow-[6px_6px_0px_#2B1D12] space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b-2 border-[#2B1D12]/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <div>
              <h2 className="font-display font-black text-sm sm:text-base text-[#2B1D12]">
                Pesan Bareng Kantor
              </h2>
              <p className="text-[11px] text-[#7A6455] font-medium truncate max-w-[240px]">
                {outletName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-[#2B1D12] bg-[#FAF4E8] text-[#2B1D12] font-black flex items-center justify-center hover:bg-rose-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Kondisi 1: Form Pembuatan */}
        {!createdGroup ? (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <p className="text-xs text-[#5A4537] leading-relaxed">
              Buat link pesanan bersama. Teman-temanmu cukup buka link dari HP masing-masing dan memilih kopinya sendiri. Semua pesanan terkumpul di keranjangmu!
            </p>

            <div className="space-y-1">
              <label htmlFor="host-name" className="text-xs font-bold text-[#2B1D12] block">
                Nama Kamu (Host Pembuat) *
              </label>
              <input
                id="host-name"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Misal: Dimas / Sarah"
                className="w-full min-h-[42px] px-3.5 py-2 bg-white border-2 border-[#2B1D12] rounded-xl text-xs font-medium text-[#2B1D12] focus:outline-hidden focus:shadow-[2px_2px_0px_#C67D0A]"
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
                className="w-full min-h-[42px] px-3.5 py-2 bg-white border-2 border-[#2B1D12] rounded-xl text-xs font-medium text-[#2B1D12] focus:outline-hidden focus:shadow-[2px_2px_0px_#C67D0A]"
              />
              <span className="text-[10px] text-[#7A6455] block">
                Dipakai untuk koordinasi pengambilan kopi jika sudah tiba.
              </span>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !hostName.trim()}
              className="w-full min-h-[46px] bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl shadow-[3px_3px_0px_#C67D0A] flex items-center justify-center gap-2 transition active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
                  <span>Membuat Link...</span>
                </>
              ) : (
                <span>🚀 Buat Link Pesanan Bareng</span>
              )}
            </button>
          </form>
        ) : (
          /* Kondisi 2: Berhasil Dibuat, Tampilkan Link & Tombol Share */
          <div className="space-y-3.5 text-center py-1">
            <div className="w-12 h-12 mx-auto bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
              🎉
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-[#2B1D12]">
                Link Pesanan Bareng Siap!
              </h3>
              <p className="text-xs text-[#7A6455] mt-0.5">
                Bagikan link ini ke grup WhatsApp kantor atau teman-temanmu:
              </p>
            </div>

            {/* Input URL Box */}
            <div className="flex items-center gap-1.5 p-2 bg-[#F2EAE0] border-2 border-[#2B1D12] rounded-xl">
              <input
                type="text"
                readOnly
                value={createdGroup.joinUrl}
                className="w-full bg-transparent text-xs font-mono text-[#2B1D12] outline-hidden select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 bg-white border border-[#2B1D12] text-[#2B1D12] text-xs font-bold rounded-lg shrink-0 shadow-2xs hover:bg-[#FFF8E7] cursor-pointer"
              >
                {isCopied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="min-h-[44px] bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs rounded-xl shadow-[2px_2px_0px_#1B8E47] border border-[#1B8E47] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📲 Share ke WA</span>
              </button>

              <button
                type="button"
                onClick={handleGoToRoom}
                className="min-h-[44px] bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl shadow-[2px_2px_0px_#C67D0A] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Masuk ke Room →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
