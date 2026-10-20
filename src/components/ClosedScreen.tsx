'use client';

import Image from 'next/image';

interface ClosedScreenProps {
  currentWibTime?: string;
  openTime?: string;
  closeTime?: string;
  dayName?: string;
  message?: string;
  onRefresh?: () => void;
}

export function ClosedScreen({
  currentWibTime,
  openTime = '08:00',
  closeTime = '23:20',
  dayName,
  message,
  onRefresh,
}: ClosedScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-[#FBF8F4] text-[#26150B]">
      {/* Brand Header */}
      <div className="pt-8 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-4 drop-shadow-md rounded-full bg-[#FAF7EF] border-2 border-[#D9A74A]/50 overflow-hidden">
          <Image
            src="/brand/logo-cima.webp"
            alt="Logo Cima Group"
            fill
            sizes="96px"
            className="object-cover"
            priority
          />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-[#26150B]">
          jasdorkopicima
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#A66908] font-bold mt-1">
          Layanan Jasa Order Hemat
        </p>
      </div>

      {/* Main Status Message Card */}
      <div className="w-full max-w-xs my-auto bg-white border border-[#EFE5D8] rounded-3xl p-6 text-center shadow-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
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

        <h2 className="font-display text-xl font-bold text-[#26150B] mb-2">
          Jasdor Sedang Tutup
        </h2>
        <p className="text-xs text-[#6A584D] leading-relaxed mb-4">
          {message || 'Kami sedang beristirahat. Pemesanan jasa order hanya dapat diproses pada jam operasional.'}
        </p>

        {/* Operating Hours Box */}
        <div className="bg-[#FAF5EE] rounded-2xl p-3.5 border border-[#EFE5D8] text-sm space-y-1.5 text-left">
          <div className="text-xs text-[#735F52] font-semibold text-center">Jadwal Layanan Jasdor:</div>
          <div className="pt-1 border-t border-[#EFE5D8]/80 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#26150B]">Jumat, Sabtu, Minggu</span>
              <span className="text-[#A66908] font-bold">{openTime.replace(':', '.')} - {closeTime.replace(':', '.')} WIB</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#26150B]">Selasa</span>
              <span className="text-amber-800 text-[11px] font-semibold bg-amber-100/70 px-1.5 py-0.5 rounded">Tentatif</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#735F52]">Senin, Rabu, Kamis</span>
              <span className="text-[#8C7667] text-[11px]">Libur</span>
            </div>
          </div>
          {currentWibTime && (
            <div className="text-[11px] text-[#8C7667] pt-1.5 border-t border-[#EFE5D8]/80 text-center">
              Waktu server: {currentWibTime.replace(':', '.')} WIB {dayName ? `(${dayName})` : ''}
            </div>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            className="mt-5 w-full min-h-[44px] px-4 py-2.5 text-xs font-bold text-[#26150B] bg-[#F2EAE0] hover:bg-[#EAE0D3] active:scale-98 transition rounded-xl flex items-center justify-center gap-2 border border-[#E3D6C5]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[#A66908]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
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
        <p className="text-xs text-[#8C7667] font-medium">
          Cek status diperbarui otomatis setiap 60 detik
        </p>
      </div>
    </div>
  );
}
