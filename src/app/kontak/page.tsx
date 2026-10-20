import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  SITE_CONFIG,
  JAM_LAYANAN,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Kontak - Hubungi Customer Service Jasdor',
  description:
    'Hubungi admin layanan jasa order Jasdor via WhatsApp resmi. Siap melayani pemesanan, ketersediaan outlet berbagai brand, konfirmasi pembayaran, dan refund.',
};

export default function ContactPage() {
  const waChatUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya ingin bertanya tentang layanan jasa order.'
  );

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
              Hubungi Admin Jasdor
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Admin kami siap membantu Anda seputar ketersediaan outlet, pertanyaan promo, kendala pembayaran, atau konfirmasi pesanan.
            </p>
          </div>
        </div>

        {/* Card Utama: WhatsApp CS Resmi dengan Logo Resmi */}
        <div className="p-5 bg-white rounded-3xl border border-[#EFE5D8] shadow-xs space-y-4 text-center relative overflow-hidden">
          {/* Subtle warm accent bar top */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#075E54]" />

          <div className="w-16 h-16 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center mx-auto border border-[#25D366]/30 shadow-2xs mt-1">
            <WhatsAppIcon className="w-9 h-9 fill-[#25D366]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#15803D] text-[11px] font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span>Customer Service WhatsApp</span>
            </div>
            <h2 className="font-display font-black text-xl text-[#26150B] mt-1">
              Admin Jasdor Kopi Cima
            </h2>
            <p className="font-display font-black text-lg text-[#15803D] tracking-wide mt-0.5">
              {NOMOR_WHATSAPP_ADMIN_FORMATTED}
            </p>
          </div>

          <p className="text-xs text-[#5C4A3E] leading-relaxed max-w-xs mx-auto">
            Klik tombol di bawah untuk langsung terhubung dengan admin kami via WhatsApp resmi (tanpa perlu simpan nomor).
          </p>

          <a
            href={waChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition active:scale-95 shadow-md"
          >
            <WhatsAppIcon className="w-5 h-5 fill-white shrink-0" />
            <span>Chat Admin WhatsApp Sekarang</span>
          </a>
        </div>

        {/* Info Jadwal Operasional Lengkap */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-black text-xs shrink-0">
              ⏱
            </div>
            <div>
              <h3 className="font-display font-bold text-xs text-[#26150B] uppercase tracking-wider">
                Jadwal Layanan Pemesanan
              </h3>
              <p className="text-[11px] text-[#735F52]">
                Jam aktif operasional kasir & respon admin
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F2EAE0] text-xs">
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-[#15803D] block">
                  Jumat, Sabtu, Minggu (Pasti Buka)
                </span>
                <span className="text-[11px] text-[#2C5E3B] block mt-0.5">
                  Layanan aktif penuh untuk seluruh outlet brand yang berstatus buka.
                </span>
              </div>
              <span className="shrink-0 text-[11px] font-extrabold text-[#15803D] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                {JAM_LAYANAN}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-[#92400E] block">
                  Selasa (Tentatif)
                </span>
                <span className="text-[11px] text-[#78350F] block mt-0.5">
                  Buka tentatif. Silakan chat admin WhatsApp terlebih dahulu untuk konfirmasi.
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-[#92400E] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                Hubungi Admin
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF7F2] border border-[#E8DEC0] rounded-xl flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-[#735F52] block">
                  Senin, Rabu, Kamis (Libur)
                </span>
                <span className="text-[11px] text-[#8C7667] block mt-0.5">
                  Layanan tutup sementara. Pesan yang masuk akan dibalas saat jam buka berikutnya.
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-[#735F52] bg-white px-2 py-0.5 rounded-md border border-[#E8DEC0]">
                Tutup
              </span>
            </div>
          </div>
        </div>

        {/* Apa Saja yang Bisa Dibantu Admin? */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2.5">
          <h3 className="font-display font-bold text-xs text-[#26150B] uppercase tracking-wider">
            Apa Saja yang Bisa Dibantu Admin?
          </h3>
          <ul className="space-y-2 text-xs text-[#4A3525]">
            <li className="flex items-start gap-2">
              <span className="text-[#C67D0A] font-bold">✓</span>
              <span><strong>Ketersediaan Menu</strong>: Memeriksa apakah varian atau topping favorit masih tersedia di outlet tujuan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C67D0A] font-bold">✓</span>
              <span><strong>Metode Bayar</strong>: Panduan pembayaran via QRIS, Bank Jago, Blu by BCA, atau e-wallet (GoPay, DANA, ShopeePay, SeaBank).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C67D0A] font-bold">✓</span>
              <span><strong>Pesanan Khusus / Kantor</strong>: Pemesanan jumlah banyak untuk rapat atau acara kantor.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C67D0A] font-bold">✓</span>
              <span><strong>Garansi Refund 100%</strong>: Pengembalian dana cepat jika stok menu habis di gerai.</span>
            </li>
          </ul>
        </div>

        {/* Penegasan Disclaimer */}
        <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EDE3D6] text-center">
          <p className="text-[11px] text-[#735F52] leading-relaxed">
            {SITE_CONFIG.disclaimer}
          </p>
        </div>

        {/* Link Kembali ke Beranda */}
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
