'use client';

import { useState } from 'react';
import { getKopiKenanganWifiToday, type KopiKenanganWifiToday } from '@/data/wifi-passwords';

interface KopiKenanganWifiBoxProps {
  initialData?: KopiKenanganWifiToday;
}

export function KopiKenanganWifiBox({ initialData }: KopiKenanganWifiBoxProps) {
  const [wifiInfo] = useState<KopiKenanganWifiToday>(() => initialData || getKopiKenanganWifiToday());
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!wifiInfo.hasPassword || !wifiInfo.password) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(wifiInfo.password);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = wifiInfo.password;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Fallback jika clipboard API ditolak atau lingkungan headless/restricted
      try {
        if (typeof document !== 'undefined') {
          const textarea = document.createElement('textarea');
          textarea.value = wifiInfo.password;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
      } catch (err) {
        console.warn('[WiFiBox] Gagal menyalin password:', err);
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FFFDF9] text-[#2B1D12] border-2 border-[#2B1D12] rounded-2xl p-2 sm:p-2.5 shadow-[2px_2px_0px_#C67D0A] flex items-center gap-2 sm:gap-2.5">
      {/* Kolom 1: Ikon WiFi */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF0C2] border-2 border-[#2B1D12] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#2B1D12]">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
          />
        </svg>
      </div>

      {/* Kolom 2: SSID & Username (Bisa mengecil duluan jika ruang sempit) */}
      <div className="min-w-0 flex-1 shrink text-left">
        <span className="text-[9px] sm:text-[10px] text-[#7A6658] font-semibold leading-none block truncate">
          SSID: {wifiInfo.ssid}
        </span>
        <span className="font-mono font-black text-[11px] sm:text-xs text-[#2B1D12] tracking-tight block mt-0.5 leading-tight truncate">
          {wifiInfo.username}
        </span>
      </div>

      {/* Kolom 3: Garis Divider Vertikal Tipis */}
      <div className="w-[1px] self-stretch bg-[#2B1D12]/20 my-0.5 shrink-0" aria-hidden="true" />

      {/* Kolom 4: Password Hari Ini + Tombol Copy (SHRINK-0: TIDAK BOLEH TER-SQUEEZE) */}
      <div className="shrink-0 text-left">
        <span className="text-[9px] sm:text-[10px] text-[#7A6658] font-semibold leading-none block whitespace-nowrap">
          {wifiInfo.passwordHeaderLabel}
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
          <span
            className={`font-mono font-black text-[11px] sm:text-xs tracking-tight whitespace-nowrap ${
              wifiInfo.hasPassword ? 'text-[#2B1D12]' : 'text-[#7A6658] italic font-normal text-[10px] sm:text-[11px]'
            }`}
          >
            {wifiInfo.password}
          </span>

          {wifiInfo.hasPassword && (
            <button
              id="copy-wifi-btn"
              type="button"
              onClick={handleCopy}
              data-copied={copied ? 'true' : 'false'}
              aria-label="Salin password WiFi"
              title="Salin password WiFi"
              className="shrink-0 p-1 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition active:scale-95 cursor-pointer flex items-center justify-center min-w-[24px] min-h-[24px] sm:min-w-[26px] sm:min-h-[26px]"
            >
              {copied ? (
                <span className="text-[9px] sm:text-[10px] font-sans font-black text-emerald-700 px-1 py-0.5 bg-emerald-50 rounded border border-emerald-300 flex items-center gap-0.5 whitespace-nowrap">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tersalin</span>
                </span>
              ) : (
                <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
