'use client';

import Image from 'next/image';

interface ClosedScreenProps {
  currentWibTime?: string;
  openTime?: string;
  closeTime?: string;
  onRefresh?: () => void;
}

export function ClosedScreen({
  currentWibTime,
  openTime = '08:00',
  closeTime = '23:20',
  onRefresh,
}: ClosedScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-white text-stone-800">
      {/* Brand Header */}
      <div className="pt-8 flex flex-col items-center text-center">
        <div className="relative w-28 h-28 mb-4 drop-shadow-md">
          <Image
            src="/brand/logo-cima.webp"
            alt="Logo Jasdor Kopi Cima"
            fill
            sizes="112px"
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
          jasdorkopicima
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">
          Layanan Jastip Kopi Kenangan
        </p>
      </div>

      {/* Main Status Message Card */}
      <div className="w-full max-w-xs my-auto bg-stone-50 border border-stone-200/80 rounded-2xl p-6 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#111111] mb-2">
          Jasdor Sedang Tutup
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Kami sedang beristirahat. Pemesanan jastip hanya dapat dilakukan pada jam operasional.
        </p>

        {/* Operating Hours Box */}
        <div className="bg-white rounded-xl p-3 border border-stone-200 text-sm">
          <div className="text-xs text-stone-600 font-medium">Jam Operasional:</div>
          <div className="text-base font-bold text-[#111111] mt-0.5">
            {openTime.replace(':', '.')} - {closeTime.replace(':', '.')} WIB
          </div>
          {currentWibTime && (
            <div className="text-[11px] text-stone-600 mt-1">
              Waktu server sekarang: {currentWibTime.replace(':', '.')} WIB
            </div>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            className="mt-5 w-full min-h-[44px] px-4 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-98 transition rounded-xl flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Periksa Ulang Status
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="pb-4 text-center">
        <p className="text-xs text-stone-600 font-medium">
          Cek status diperbarui otomatis setiap 60 detik
        </p>
      </div>
    </div>
  );
}
