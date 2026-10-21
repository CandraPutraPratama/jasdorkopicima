'use client';

import { useEffect, useState } from 'react';

export interface WifiTodayData {
  ssid: string;
  username: string;
  password: string | null;
  dateLabel: string;
}

interface KopiKenanganWifiBoxProps {
  initialData?: WifiTodayData;
  className?: string;
}

const IDENTITY_ROW = 'flex items-center gap-3';
const VALUE_LINE = 'flex items-center gap-2';
const COPY_BUTTON =
  "shrink-0 -my-3 h-11 w-11 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition active:scale-95 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF9]";
const COPY_PLACEHOLDER = 'shrink-0 -my-3 h-11 w-11 rounded-lg bg-[#EFE5D8] animate-pulse';

export function KopiKenanganWifiBox({ initialData, className = '' }: KopiKenanganWifiBoxProps) {
  const [data, setData] = useState<WifiTodayData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWifiInfo() {
      try {
        const res = await fetch('/api/wifi-today', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as WifiTodayData;
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[WiFiBox] Gagal memuat info WiFi:', err);
        if (active) {
          setData((prev) => prev || {
            ssid: 'Teman Kenangan',
            username: 'kopikenangan',
            password: null,
            dateLabel: '',
          });
          setLoading(false);
        }
      }
    }

    loadWifiInfo();

    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async () => {
    if (!data?.password) return;

    // Tampilkan feedback "Tersalin" secara instan
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);

    // 1. Coba Clipboard API dengan batas waktu 500ms agar tidak menggantung di headless browser
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await Promise.race([
          navigator.clipboard.writeText(data.password),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
        ]);
        return;
      }
    } catch {
      // Lanjut ke fallback di bawah
    }

    // 2. Fallback textarea + execCommand
    try {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = data.password;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
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
  };

  if (loading && !data) {
    return (
      <div
        className={`bg-[#FFFDF9] text-[#2B1D12] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[2px_2px_0px_#C67D0A] flex flex-col ${className}`}
        aria-busy="true"
        aria-label="Memuat info WiFi Kopi Kenangan"
      >
        {/* Baris 1: Identitas Jaringan Skeleton */}
        <div className={IDENTITY_ROW}>
          <div className="w-10 h-10 rounded-xl bg-[#FFF0C2] border-2 border-[#2B1D12] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#2B1D12]">
            <svg className="w-5 h-5 text-[#2B1D12] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-7 bg-[#EFE5D8] rounded animate-pulse shrink-0" />
              <div className="h-3.5 w-28 bg-[#EFE5D8] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-12 bg-[#EFE5D8] rounded animate-pulse shrink-0" />
              <div className="h-3.5 w-24 bg-[#EFE5D8] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Divider horizontal tipis antar baris */}
        <div className="h-3 flex items-center" aria-hidden="true">
          <div className="h-px w-full bg-[#2B1D12]/20" />
        </div>

        {/* Baris 2: Password Skeleton */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex h-4 items-center">
            <div className="h-2.5 w-32 bg-[#EFE5D8] rounded animate-pulse" />
          </div>
          <div className={VALUE_LINE}>
            <div className="h-4 flex-1 bg-[#EFE5D8] rounded animate-pulse" />
            <div className={COPY_PLACEHOLDER} />
          </div>
        </div>
      </div>
    );
  }

  const hasPassword = Boolean(data?.password && data.password.trim().length > 0);
  const headerLabel = data?.dateLabel ? `Password hari ini (${data.dateLabel})` : 'Password hari ini';
  const ssid = data?.ssid || 'Teman Kenangan';
  const username = data?.username || 'kopikenangan';

  return (
    <div
      className={`bg-[#FFFDF9] text-[#2B1D12] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[2px_2px_0px_#C67D0A] flex flex-col ${className}`}
    >
      {/* Baris 1: Identitas Jaringan (Ikon WiFi + SSID & Username) */}
      <div className={IDENTITY_ROW}>
        {/* Tile Ikon WiFi: Ukuran tetap, tidak menyusut */}
        <div className="w-10 h-10 rounded-xl bg-[#FFF0C2] border-2 border-[#2B1D12] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#2B1D12]">
          <svg className="w-5 h-5 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
            />
          </svg>
        </div>

        {/* Sisa lebar penuh: 2 baris teks (SSID & Username) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-left">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6658] uppercase tracking-wide shrink-0">SSID</span>
            <span className="font-display font-black text-xs sm:text-[13px] text-[#2B1D12] tracking-tight break-words">
              {ssid}
            </span>
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6658] uppercase tracking-wide shrink-0">Username</span>
            <span className="font-mono font-black text-xs sm:text-[13px] text-[#2B1D12] tracking-tight break-words">
              {username}
            </span>
          </div>
        </div>
      </div>

      {/* Divider horizontal tipis antar baris (total pemisah 12px) */}
      <div className="h-3 flex items-center" aria-hidden="true">
        <div className="h-px w-full bg-[#2B1D12]/20" />
      </div>

      {/* Baris 2: Password Hari Ini */}
      <div className="flex flex-col gap-1 text-left">
        {/* Label kecil di atas */}
        <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6658] uppercase tracking-wide">
          {headerLabel}
        </span>

        {/* Password tampil bold memenuhi lebar + tombol copy di ujung kanan sejajar */}
        <div className={VALUE_LINE}>
          <span
            className={`flex-1 font-mono font-black text-xs sm:text-[13px] tracking-tight break-words select-all ${
              hasPassword ? 'text-[#2B1D12]' : 'text-[#7A6658] italic font-normal text-xs'
            }`}
          >
            {hasPassword ? data?.password : 'tanya ke barista'}
          </span>

          {hasPassword && (
            <button
              id="copy-wifi-btn"
              type="button"
              onClick={handleCopy}
              data-copied={copied ? 'true' : 'false'}
              aria-label={copied ? 'Password tersalin' : 'Salin password WiFi'}
              title={copied ? 'Password tersalin' : 'Salin password WiFi'}
              className={COPY_BUTTON}
            >
              {copied ? (
                <span className="text-[9px] sm:text-[10px] font-sans font-black text-emerald-700 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-300 flex items-center gap-1 shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tersalin</span>
                </span>
              ) : (
                <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
