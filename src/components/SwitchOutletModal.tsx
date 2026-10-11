'use client';

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
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-stone-100">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
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
          <h3 className="font-bold text-base text-[#111111]">
            Ganti Outlet?
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Keranjangmu saat ini berisi pesanan dari{' '}
            <span className="font-semibold text-stone-800">{currentOutletName || 'outlet sebelumnya'}</span>.
            {newOutletName && (
              <>
                {' '}Memesan dari{' '}
                <span className="font-semibold text-stone-800">{newOutletName}</span>{' '}
                akan mengosongkan keranjang lama.
              </>
            )}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#111111] text-[#D4AF37] hover:bg-stone-900 active:scale-95 text-xs font-bold rounded-xl transition shadow-xs"
          >
            Ya, Ganti Outlet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[44px] px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-95 text-xs font-semibold rounded-xl transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
