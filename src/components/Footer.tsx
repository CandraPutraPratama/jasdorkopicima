'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SITE_CONFIG,
  JADWAL_OPERASIONAL_LENGKAP,
} from '@/lib/site-config';

export function Footer() {
  const pathname = usePathname();

  // 5. Halaman /pesanan-saya: HAPUS footer sepenuhnya (hanya di halaman ini)
  if (pathname === '/pesanan-saya' || pathname?.startsWith('/pesanan-saya/')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t-2 border-[#2B1D12] bg-[#FAF4E8] text-[#2B1D12] px-4 pt-6 pb-8">
      <div className="max-w-md mx-auto space-y-4 text-center">
        {/* Hierarki 1: Nama Brand & Tagline */}
        <div className="space-y-1">
          <span className="font-display font-black text-base text-[#2B1D12] block tracking-tight">
            {SITE_CONFIG.brandName}
          </span>
          <p className="text-xs text-[#6A584D] font-bold">
            Mau Hemat? Order disini aja!
          </p>
        </div>

        {/* Hierarki 2: Jam Operasional */}
        <div className="pt-0.5 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8E7] border-2 border-[#2B1D12] rounded-full text-[11px] font-black text-[#C67D0A] shadow-[2px_2px_0px_#2B1D12]">
            <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0" />
            <span>{JADWAL_OPERASIONAL_LENGKAP}</span>
          </div>
        </div>

        {/* Hierarki 3: Deretan Link Navigasi Informasi */}
        <div className="pt-2 border-t-2 border-[#2B1D12]/15">
          <nav
            aria-label="Navigasi Informasi"
            className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs font-bold text-[#2B1D12]"
          >
            {SITE_CONFIG.navLinks.map((link, idx) => (
              <span key={link.href} className="inline-flex items-center gap-2.5">
                <Link
                  href={link.href}
                  prefetch={false}
                  className="hover:text-[#C67D0A] underline-offset-4 hover:underline transition"
                >
                  {link.label}
                </Link>
                {idx < SITE_CONFIG.navLinks.length - 1 && (
                  <span className="text-[#2B1D12]/30 text-[10px] select-none">•</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Hierarki 4: Hak Cipta */}
        <div className="pt-2 border-t border-[#2B1D12]/10">
          <p className="text-[10px] text-[#7A6658] font-bold tracking-wide">
            © {new Date().getFullYear()} JasdorKopiCima • Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
