import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  JAM_LAYANAN,
  JADWAL_OPERASIONAL_LENGKAP,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  METODE_PEMBAYARAN,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FAQ - Pertanyaan Umum Layanan Jasa Order',
  description:
    'Pertanyaan yang sering diajukan mengenai layanan jasa order Jasdor: cara order, jadwal layanan, promo hemat multi-brand, biaya jasa order, metode pembayaran, dan refund.',
};

interface FaqItem {
  id: string;
  category: string;
  q: string;
  a: string;
  highlight?: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'tentang-jasdor',
    category: 'Layanan',
    q: 'Apa itu Jasdor dan bagaimana cara kerjanya?',
    a: 'Jasdor adalah portal layanan jasa order untuk berbagai brand minuman dan kopi favorit (seperti Kopi Kenangan, Fore Coffee, dan lainnya). Kami membantu Anda memesan menu dengan promo hemat spesial tiap brand, lalu pesanan diproses langsung ke gerai resmi pilihan Anda.',
    highlight: 'Layanan Jasa Order Multi-Brand',
  },
  {
    id: 'cara-order',
    category: 'Pemesanan',
    q: 'Bagaimana alur cara memesan di Jasdor?',
    a: 'Cukup 4 langkah praktis:\n1. Pilih brand kopi dan outlet terdekat yang berstatus buka di katalog Jasdor.\n2. Pilih menu dan sesuaikan varian (ukuran cup, takaran gula, es, dan topping).\n3. Buka keranjang, masukkan nama pemesan serta pilih jadwal pickup (sekarang atau slot 15 menit).\n4. Lanjutkan pembayaran dan konfirmasi ke WhatsApp admin Jasdor.',
  },
  {
    id: 'biaya-jasa',
    category: 'Tarif & Promo',
    q: 'Berapa biaya jasa order di Jasdor?',
    a: 'Biaya jasa order kami transparan, hemat, dan otomatis dihitung di keranjang sebelum checkout:\n• Rp2.000 per item jika Anda memesan 2 item atau lebih.\n• Rp4.000 flat jika Anda hanya memesan 1 item saja.\nPromo diskon hemat dinikmati sesuai ketentuan masing-masing brand (seperti diskon 50% pada menu minuman Kopi Kenangan atau promo Fore Coffee).',
    highlight: 'Mulai Rp2.000 / item',
  },
  {
    id: 'jadwal-operasional',
    category: 'Jadwal',
    q: 'Kapan hari dan jam operasional layanan Jasdor?',
    a: `Jadwal layanan jasa order Jasdor:\n• Pasti Buka: Jumat, Sabtu, Minggu pukul ${JAM_LAYANAN}.\n• Tentatif: Selasa (harap hubungi admin via WhatsApp terlebih dahulu untuk konfirmasi buka).\n• Libur: Senin, Rabu, Kamis.\nDi luar jam operasional atau saat libur, sistem ditutup sementara agar pesanan terlayani optimal.`,
    highlight: 'Jum–Min Pasti Buka',
  },
  {
    id: 'metode-bayar',
    category: 'Pembayaran',
    q: 'Apa saja metode pembayaran yang diterima dan bagaimana cara bayarnya?',
    a: 'Setelah Anda mengirimkan format pesanan via WhatsApp, admin Jasdor akan memeriksa ketersediaan di outlet lalu mengirimkan rincian total tagihan serta petunjuk pembayaran.\nMetode pembayaran yang kami terima:\n• QRIS: Mendukung semua bank & aplikasi pembayaran (GoPay, DANA, ShopeePay, BCA, Mandiri, BRI, dll) tanpa biaya admin.\n• Transfer Bank Digital: HANYA Bank Jago dan Blu by BCA.\n• E-Wallet Langsung: GoPay, DANA, ShopeePay, dan SeaBank.',
    highlight: 'QRIS, Bank Jago, Blu, E-Wallet',
  },
  {
    id: 'kebijakan-refund',
    category: 'Garansi',
    q: 'Bagaimana jika menu yang saya pesan habis di outlet?',
    a: 'Jika pesanan sudah dibayar namun ternyata stok menu di outlet habis saat barista memproses, admin Jasdor akan segera mengabari Anda melalui WhatsApp dan dana akan kami refund 100% penuh tanpa potongan apapun.',
    highlight: 'Garansi Refund 100%',
  },
  {
    id: 'kontak-bantuan',
    category: 'Bantuan',
    q: 'Bagaimana jika saya ingin berkonsultasi atau bertanya hal lain?',
    a: `Customer Service Jasdor siap membantu Anda via WhatsApp di nomor ${NOMOR_WHATSAPP_ADMIN_FORMATTED}. Jangan ragu untuk menghubungi admin saat jam layanan aktif.`,
  },
];

export default function FaqPage() {
  const waHelpUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya membaca halaman FAQ dan ingin menanyakan sesuatu tentang layanan jasa order.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Pusat Bantuan & FAQ"
      />

      <main className="flex-1 p-4 pb-12 max-w-md mx-auto w-full space-y-4">
        {/* Banner Hero FAQ */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Panduan Layanan
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Pertanyaan yang Sering Diajukan
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Panduan lengkap cara order, diskon promo 50%, jadwal operasional, dan garansi layanan jasa order Jasdor.
            </p>
          </div>
        </div>

        {/* Highlight Penegasan Layanan Jasa Order */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-[#78350F] shadow-2xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-amber-700 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block text-[#78350F] mb-0.5">
              Layanan Jasa Order
            </strong>
            Jasdor adalah layanan jasa order yang meneruskan dan memproses seluruh pesanan langsung ke gerai resmi brand pilihan Anda.
          </div>
        </div>

        {/* Highlight Jadwal Operasional */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#A66908] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Jadwal Layanan Pemesanan
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF7F2] text-[#6A584D] rounded-full border border-[#E8DEC0]">
              WIB (Waktu Indonesia Barat)
            </span>
          </div>
          <p className="text-xs font-bold text-[#26150B] leading-snug">
            {JADWAL_OPERASIONAL_LENGKAP}
          </p>
          <p className="text-[11px] text-[#735F52] leading-tight">
            Hari libur: Senin, Rabu, dan Kamis. Pemesanan di luar jadwal buka akan dibalas saat admin aktif kembali.
          </p>
        </div>

        {/* Daftar FAQ Cards dengan Aksen Warm Coffee */}
        <div className="space-y-3">
          {FAQ_LIST.map((faq) => (
            <article
              key={faq.id}
              className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A] transition hover:border-[#D9A74A]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A66908] block mb-0.5">
                    {faq.category}
                  </span>
                  <h2 className="font-display font-bold text-sm text-[#26150B] leading-snug">
                    {faq.q}
                  </h2>
                </div>
                {faq.highlight && (
                  <span className="shrink-0 px-2 py-0.5 bg-[#FBF5EC] text-[#8C5D17] text-[10px] font-bold rounded-md border border-[#EADAC5] whitespace-nowrap">
                    {faq.highlight}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4A3525] leading-relaxed whitespace-pre-line pt-0.5">
                {faq.a}
              </p>
            </article>
          ))}
        </div>

        {/* Ringkasan Metode Pembayaran */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold text-xs shrink-0">
              Rp
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#26150B]">
                Metode Pembayaran Resmi
              </h3>
              <p className="text-[11px] text-[#735F52]">
                Dibayarkan setelah admin mengonfirmasi pesanan Anda via WhatsApp
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-[#F2EAE0]">
            {METODE_PEMBAYARAN.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EDE3D6]/70 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-display font-bold text-xs text-[#26150B] block">
                    {m.nama}
                  </span>
                  <span className="text-[11px] text-[#5C4A3E] block mt-0.5">
                    {m.keterangan}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#15803D] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {m.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Bantuan WhatsApp Resmi */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl shadow-sm text-center space-y-3 border border-emerald-700/40">
          <h3 className="font-display font-black text-base text-white">
            Masih Punya Pertanyaan Lain?
          </h3>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xs mx-auto">
            Admin Jasdor siap membantu Anda pada jadwal buka: Jumat–Minggu (08:00–23:20 WIB) dan Selasa tentatif.
          </p>
          <a
            href={waHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-display font-bold text-xs rounded-xl transition active:scale-95 shadow-md"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
            <span>Tanya Admin via WhatsApp</span>
          </a>
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
