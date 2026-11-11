'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error('[ErrorBoundary caught error]:', error);

    // Deteksi jika error berasal dari chunk script yang usang pasca-deployment baru
    const isChunkOrModuleError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Load failed');

    if (isChunkOrModuleError && typeof window !== 'undefined') {
      const reloadKey = 'jasdor_chunk_reload_' + (error?.digest || 'latest');
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    if (typeof window !== 'undefined') {
      // Hard reload memastikan browser mengunduh HTML dan chunk hash terbaru
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-white text-stone-800 text-center">
      <div className="pt-8 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-3">
          <Image
            src="/brand/logo-cima.webp"
            alt="Logo Jasdor Kopi Cima"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-sm font-bold text-[#111111] uppercase tracking-wider">
          jasdorkopicima
        </span>
      </div>

      <div className="w-full max-w-xs my-auto bg-stone-50 border border-stone-200/80 rounded-2xl p-6 shadow-xs">
        <div className="w-14 h-14 mx-auto mb-3 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-[#111111] mb-1.5">
          Terjadi Gangguan
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed mb-5">
          Sistem mengalami kendala sementara saat memuat data. Silakan coba kembali beberapa saat lagi.
        </p>

        <div className="space-y-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            type="button"
            className="min-h-[44px] w-full px-4 py-2.5 bg-[#111111] text-[#D4AF37] hover:bg-stone-900 active:scale-95 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isRetrying ? (
              <span className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {isRetrying ? 'Memuat Ulang...' : 'Coba Lagi'}
          </button>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="min-h-[44px] w-full px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center transition"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>

      <div className="pb-4">
        <p className="text-[11px] text-stone-400">
          jasdorkopicima • Layanan Jasa Order Hemat
        </p>
      </div>
    </div>
  );
}
