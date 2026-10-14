import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-[#FBF8F4] text-[#26150B] text-center">
      {/* Header Brand */}
      <div className="pt-8 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-3 rounded-full bg-[#26150B] p-2 border border-[#D9A74A]/40 shadow-xs">
          <Image
            src="/brand/logo-cima.webp"
            alt="Logo Jasdor Kopi Cima"
            fill
            className="object-contain p-1.5"
            priority
          />
        </div>
        <span className="font-display text-base font-extrabold text-[#26150B] uppercase tracking-wider">
          jasdorkopicima
        </span>
      </div>

      {/* 404 Content */}
      <div className="w-full max-w-xs my-auto bg-white border border-[#EFE5D8] rounded-3xl p-6 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-3 bg-[#FEF3C7] text-[#B45309] rounded-2xl flex items-center justify-center font-display font-black text-2xl border border-[#FDE68A]">
          404
        </div>
        <h1 className="font-display text-lg font-bold text-[#26150B] mb-1.5">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-xs text-[#6A584D] leading-relaxed mb-5">
          Maaf, halaman atau outlet yang Anda tuju tidak ditemukan atau tautan sudah kedaluwarsa.
        </p>

        <Link
          href="/"
          className="min-h-[44px] w-full px-4 py-2.5 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] active:scale-95 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Footer */}
      <div className="pb-4">
        <p className="text-[11px] text-[#8C7667]">
          jasdorkopicima • Jasa Order Kopi Kenangan
        </p>
      </div>
    </div>
  );
}
