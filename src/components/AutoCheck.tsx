'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoCheckProps {
  /** Fungsi untuk mengecek status pesanan terbaru */
  onCheck: (isManual?: boolean) => Promise<void> | void;
  /** Status apakah pengecekan sedang berjalan */
  isChecking: boolean;
  /** Apakah status pesanan sudah final (selesai / dibatalkan / kedaluwarsa) */
  isFinal?: boolean;
  className?: string;
}

export function AutoCheck({
  onCheck,
  isChecking,
  isFinal = false,
  className = '',
}: AutoCheckProps) {
  const [countdown, setCountdown] = useState<number>(20);

  const isCheckingRef = useRef(isChecking);
  const onCheckRef = useRef(onCheck);

  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);

  useEffect(() => {
    onCheckRef.current = onCheck;
  }, [onCheck]);

  // Reset countdown kembali ke 20 detik
  const resetCountdown = useCallback(() => {
    setCountdown(20);
  }, []);

  // Polling interval 1 detik untuk menghitung mundur
  useEffect(() => {
    // Jika pesanan sudah final, jangan jalankan countdown sama sekali
    if (isFinal) {
      return;
    }

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Panggil pengecekan hanya jika tidak sedang ada request yang in-flight
          if (!isCheckingRef.current) {
            onCheckRef.current(false);
          }
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isFinal]);

  // Handler klik manual tombol Refresh Status
  const handleManualRefresh = () => {
    resetCountdown();
    if (!isChecking) {
      onCheck(true);
    }
  };

  // Kalkulasi SVG ring berdiameter 18px (radius 7px, keliling 2 * PI * 7 ≈ 43.98)
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  // Menghitung panjang stroke yang tersisa sesuai proporsi sisa waktu countdown
  const strokeDashoffset = circumference - (countdown / 20) * circumference;

  return (
    <div className={`flex items-center justify-between gap-2 px-1 pt-0.5 ${className}`}>
      {/* Indikator Cek Otomatis dengan Ring SVG 18px */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#6A584D] font-bold">
        <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <svg
            className="w-[18px] h-[18px] -rotate-90 transform"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            {/* Ring Background (Abu/Cokelat Halus) */}
            <circle
              cx="9"
              cy="9"
              r={radius}
              className="text-[#2B1D12]/15"
              stroke="currentColor"
              strokeWidth="2.2"
              fill="none"
            />
            {/* Ring Foreground (Hijau Berkurang Mengikuti Hitungan) */}
            <circle
              cx="9"
              cy="9"
              r={radius}
              className="text-[#15803D] transition-[stroke-dashoffset] duration-300 ease-linear"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <span>Cek otomatis tiap 20 dtk ({countdown})</span>
      </div>

      {/* Tombol Manual Refresh Status */}
      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={isChecking}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#FFF8E7] text-[#2B1D12] text-xs font-black rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-60"
        title="Segarkan status pesanan"
      >
        <svg
          className={`w-3.5 h-3.5 text-[#2B1D12] ${isChecking ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{isChecking ? 'Memeriksa...' : 'Refresh Status'}</span>
      </button>
    </div>
  );
}
