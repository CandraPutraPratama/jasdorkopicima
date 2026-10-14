import Link from 'next/link';
import {
  SITE_CONFIG,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
  JAM_LAYANAN,
} from '@/lib/site-config';

export function Footer() {
  const waUrl = getAdminWhatsAppUrl('Halo Admin Jasdor, saya butuh bantuan terkait pesanan jastip Kopi Kenangan.');

  return (
    <footer className="mt-auto border-t border-[#EFE5D8] bg-[#F7F1E8]/90 text-[#5C4A3E] px-4 pt-6 pb-8">
      <div className="max-w-md mx-auto space-y-4">
        {/* Brand & Kontak Cepat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#E8DEC0]/60">
          <div>
            <span className="font-display font-extrabold text-sm text-[#26150B] block tracking-tight">
              {SITE_CONFIG.brandName}
            </span>
            <span className="text-[11px] text-[#8C7667] font-medium block mt-0.5">
              Layanan Jastip Promo Setengah Harga • Jam: {JAM_LAYANAN}
            </span>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 bg-white hover:bg-[#F2EAE0] border border-[#E0D4C5] text-[#15803D] hover:text-[#166534] text-xs font-bold rounded-lg transition active:scale-95 shadow-2xs"
            aria-label="Hubungi Admin WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WA: {NOMOR_WHATSAPP_ADMIN_FORMATTED}</span>
          </a>
        </div>

        {/* Link Halaman Navigasi Informasi */}
        <nav aria-label="Navigasi Informasi" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-[#6A584D]">
          {SITE_CONFIG.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#26150B] underline-offset-4 hover:underline transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Penegasan Independen & Hak Cipta */}
        <div className="pt-2 text-center space-y-1">
          <p className="text-[11px] text-[#735F52] font-medium leading-relaxed">
            {SITE_CONFIG.disclaimer}
          </p>
          <p className="text-[10px] text-[#A69485]">
            © {new Date().getFullYear()} {SITE_CONFIG.brandShort} • Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
