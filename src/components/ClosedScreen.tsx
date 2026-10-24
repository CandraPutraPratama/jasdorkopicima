'use client';

import Image from 'next/image';
import { KopiKenanganWifiBox } from '@/components/KopiKenanganWifiBox';

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
  const displaySubtitle = (() => {
    if (!message || message.includes('Jadwal buka:')) {
      return `Kami sedang istirahat hari ini${dayName ? ` (${dayName})` : ''}. Pemesanan jasa order buka kembali sesuai jadwal berikut:`;
    }
    if (message.includes('Jam operasional:')) {
      return 'Layanan jasa order sedang istirahat di luar jam operasional. Buka kembali sesuai jadwal berikut:';
    }
    return message;
  })();

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6 sm:py-8 bg-[#FAF4E8] text-[#2B1D12]">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 mb-3 rounded-full bg-[#FFFDF9] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] overflow-hidden">
          <Image
            src="/brand/logo-cima.webp"
            alt="Logo Cima Group"
            fill
            sizes="88px"
            className="object-cover"
            priority
          />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-[#2B1D12]">
          jasdorkopicima
        </h1>
        <p className="text-[11px] uppercase tracking-widest text-[#C67D0A] font-black mt-0.5">
          Layanan Jasa Order Hemat
        </p>
      </div>

      {/* Main Status Message Card */}
      <div className="w-full max-w-sm bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-5 sm:p-6 text-center shadow-[4px_4px_0px_#2B1D12]">
        {/* Status Icon Badge */}
        <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl bg-[#FFF0C2] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] flex items-center justify-center text-[#2B1D12]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="font-display text-xl sm:text-2xl font-black text-[#2B1D12] tracking-tight mb-1.5">
          Jasdor Sedang Tutup
        </h2>
        <p className="text-xs text-[#6A584D] leading-relaxed mb-4">
          {displaySubtitle}
        </p>

        {/* Operating Hours Box */}
        <div className="bg-[#FAF4E8] rounded-2xl p-3.5 border-2 border-[#2B1D12]/15 text-left space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-[#7A6658] font-bold text-center">
            Jadwal Layanan Jasdor
          </div>
          <div className="pt-1.5 border-t border-[#2B1D12]/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2B1D12]">Jumat, Sabtu, Minggu</span>
              <span className="text-[#C67D0A] font-black">{openTime.replace(':', '.')} - {closeTime.replace(':', '.')} WIB</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#2B1D12]">Selasa</span>
              <span className="text-[#C67D0A] text-[10px] font-black uppercase tracking-wider bg-[#FFF0C2] border border-[#C67D0A]/30 px-2 py-0.5 rounded-md">
                Tentatif
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#7A6658]">Senin, Rabu, Kamis</span>
              <span className="text-[#8C7667] text-[11px] font-bold bg-[#2B1D12]/5 px-2 py-0.5 rounded-md">
                Libur
              </span>
            </div>
          </div>
          {currentWibTime && (
            <div className="text-[11px] text-[#7A6658] font-medium pt-2 border-t border-[#2B1D12]/10 text-center flex items-center justify-center gap-1.5">
              <span>Waktu server:</span>
              <span className="font-bold text-[#2B1D12]">{currentWibTime.replace(':', '.')} WIB</span>
              {dayName && <span className="text-[#7A6658]">({dayName})</span>}
            </div>
          )}
        </div>

        {/* WiFi Info Box */}
        <div className="mt-3.5">
          <KopiKenanganWifiBox />
        </div>

        {/* Action Button: Periksa Ulang Status */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            className="mt-4 w-full min-h-[44px] px-4 py-2.5 text-xs sm:text-[13px] font-black text-[#2B1D12] bg-[#FAF4E8] hover:bg-[#FFF8E7] active:scale-[0.98] transition border-2 border-[#2B1D12] rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_#2B1D12] hover:shadow-[1px_1px_0px_#2B1D12] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF9]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[#C67D0A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Periksa Ulang Status</span>
          </button>
        )}
      </div>

      {/* Footer Info / Micro Note */}
      <div className="pt-3 text-center">
        <p className="text-[11px] text-[#7A6658] font-medium flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-ping" />
          <span>Cek status diperbarui otomatis setiap 60 detik</span>
        </p>
      </div>
    </div>
  );
}
