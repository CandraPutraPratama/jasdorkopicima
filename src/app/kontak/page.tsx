import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import {
  SITE_CONFIG,
  JAM_LAYANAN,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Kontak — Hubungi Customer Service Jasdor',
  description:
    'Hubungi admin layanan jastip Kopi Kenangan Jasdor via WhatsApp resmi. Siap melayani pemesanan, pertanyaan promo, kendala stok, dan refund.',
};

export default function ContactPage() {
  const waChatUrl = getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang pemesanan jastip Kopi Kenangan.');

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Kontak & Bantuan"
      />

      <main className="flex-1 p-4 pb-12 max-w-md mx-auto w-full space-y-4">
        {/* Banner Hero Kontak */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Customer Support
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Hubungi Kami
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Tim admin Jasdor siap membantu Anda untuk pertanyaan menu, ketersediaan outlet, konfirmasi pembayaran, maupun kendala order.
            </p>
          </div>
        </div>

        {/* Card Utama: WhatsApp CS Resmi */}
        <div className="p-5 bg-white rounded-3xl border border-[#EFE5D8] shadow-xs space-y-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <svg
              className="w-9 h-9 fill-[#15803D]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C67D0A] block">
              Saluran Resmi Customer Service
            </span>
            <h2 className="font-display font-black text-xl text-[#26150B] mt-1">
              WhatsApp Admin
            </h2>
            <p className="font-display font-extrabold text-base text-[#15803D] mt-0.5">
              {NOMOR_WHATSAPP_ADMIN_FORMATTED}
            </p>
          </div>

          <p className="text-xs text-[#6A584D] leading-relaxed max-w-xs mx-auto">
            Hubungi kami untuk konfirmasi pesanan, menanyakan menu yang tidak ada di katalog, atau informasi jadwal pickup.
          </p>

          <a
            href={waChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] px-6 py-3 bg-[#15803D] hover:bg-[#166534] text-white font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
          >
            <svg
              className="w-5 h-5 fill-white"
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span>Chat Admin WhatsApp Sekarang</span>
          </a>
        </div>

        {/* Info Jam Operasional & Layanan */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-[#8C7667] uppercase block">
              Jam Layanan
            </span>
            <span className="font-display font-bold text-sm text-[#26150B] block leading-tight">
              {JAM_LAYANAN}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium block">
              Setiap Hari (Senin – Minggu)
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-[#8C7667] uppercase block">
              Kecepatan Respon
            </span>
            <span className="font-display font-bold text-sm text-[#26150B] block leading-tight">
              &lt; 5 Menit
            </span>
            <span className="text-[10px] text-[#735F52] block">
              Pada jam operasional
            </span>
          </div>
        </div>

        {/* Navigasi ke FAQ & Ketentuan */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#8C7667] uppercase tracking-wider block">
            Bantuan Mandiri Cepat
          </span>
          <div className="divide-y divide-[#F2EAE0]">
            <Link
              href="/faq"
              className="py-2.5 flex items-center justify-between text-xs font-bold text-[#26150B] hover:text-[#C67D0A] transition"
            >
              <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
              <svg className="w-4 h-4 text-[#8C7667]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/syarat-ketentuan"
              className="py-2.5 flex items-center justify-between text-xs font-bold text-[#26150B] hover:text-[#C67D0A] transition"
            >
              <span>Syarat & Ketentuan Layanan</span>
              <svg className="w-4 h-4 text-[#8C7667]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/kebijakan-privasi"
              className="py-2.5 flex items-center justify-between text-xs font-bold text-[#26150B] hover:text-[#C67D0A] transition"
            >
              <span>Kebijakan Privasi Data</span>
              <svg className="w-4 h-4 text-[#8C7667]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-[#735F52] leading-relaxed max-w-xs mx-auto">
            {SITE_CONFIG.disclaimer}
          </p>
        </div>

        {/* Link Kembali */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7667] hover:text-[#26150B] transition"
          >
            <span>← Kembali ke Beranda</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
