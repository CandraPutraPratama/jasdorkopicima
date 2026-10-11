import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-white text-stone-800 text-center">
      {/* Header Brand */}
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

      {/* 404 Content */}
      <div className="w-full max-w-xs my-auto bg-stone-50 border border-stone-200/80 rounded-2xl p-6 shadow-xs">
        <div className="w-14 h-14 mx-auto mb-3 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black text-xl">
          404
        </div>
        <h1 className="text-lg font-bold text-[#111111] mb-1.5">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed mb-5">
          Maaf, halaman atau outlet yang Anda tuju tidak ditemukan atau tautan sudah kedaluwarsa.
        </p>

        <Link
          href="/"
          className="min-h-[44px] w-full px-4 py-2.5 bg-[#111111] text-[#D4AF37] hover:bg-stone-900 active:scale-95 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Footer */}
      <div className="pb-4">
        <p className="text-[11px] text-stone-400">
          jasdorkopicima • Jastip Kopi Kenangan
        </p>
      </div>
    </div>
  );
}
