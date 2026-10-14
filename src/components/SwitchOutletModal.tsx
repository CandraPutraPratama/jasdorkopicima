'use client';

import { useScrollLock } from '@/hooks/useScrollLock';

interface SwitchOutletModalProps {
  currentOutletName?: string | null;
  newOutletName?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SwitchOutletModal({
  currentOutletName,
  newOutletName,
  onConfirm,
  onCancel,
}: SwitchOutletModalProps) {
  // Kunci scroll halaman belakang selama modal konfirmasi outlet tampil
  useScrollLock(true);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#26150B]/60 backdrop-blur-2xs animate-in fade-in duration-150 overscroll-contain">
      <div className="fixed inset-0 touch-none" aria-hidden="true" />
      <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-[#EFE5D8] z-10 overscroll-contain">
        <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex items-center justify-center mx-auto">
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

        <div className="text-center space-y-1">
          <h3 className="font-display font-bold text-base text-[#26150B]">
            Ganti Outlet?
          </h3>
          <p className="text-xs text-[#6A584D] leading-relaxed">
            Keranjangmu saat ini berisi pesanan dari{' '}
            <span className="font-bold text-[#26150B]">{currentOutletName || 'outlet sebelumnya'}</span>.
            {newOutletName && (
              <>
                {' '}Memesan dari{' '}
                <span className="font-bold text-[#26150B]">{newOutletName}</span>{' '}
                akan mengosongkan keranjang lama.
              </>
            )}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] active:scale-95 text-xs font-display font-bold rounded-xl transition shadow-xs"
          >
            Ya, Ganti Outlet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#F2EAE0] hover:bg-[#EAE0D3] text-[#4A3225] active:scale-95 text-xs font-semibold rounded-xl transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
