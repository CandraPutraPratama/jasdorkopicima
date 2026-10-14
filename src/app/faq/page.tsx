import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import {
  SITE_CONFIG,
  JAM_LAYANAN,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  METODE_PEMBAYARAN,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'FAQ — Pertanyaan Umum Layanan Jastip',
  description:
    'Pertanyaan yang sering diajukan mengenai layanan jastip Kopi Kenangan Jasdor: cara order, jam layanan, diskon 50%, biaya jasa, metode pembayaran, dan refund.',
};

interface FaqItem {
  q: string;
  a: string;
  highlight?: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    q: 'Apa itu Jasdor dan bagaimana cara kerjanya?',
    a: 'Jasdor adalah layanan jasa titip (jastip) independen khusus menu Kopi Kenangan. Kami membantu Anda memesan menu favorit dengan promo diskon 50% untuk harga dasar minuman, lalu pesanan langsung dikirimkan formatnya ke WhatsApp admin untuk diproses dan diambil di outlet pilihan Anda.',
    highlight: 'Jastip Independen • Diskon 50% Menu Dasar',
  },
  {
    q: 'Apakah Jasdor berafiliasi resmi dengan Kopi Kenangan?',
    a: 'Tidak. Jasdor adalah penyedia layanan jasa titip independen pihak ketiga dan bukan merupakan perwakilan, mitra resmi, atau afiliasi dari PT Bumi Berkah Boga (Kopi Kenangan). Semua merek dagang, logo, dan nama produk adalah hak milik resmi Kopi Kenangan.',
    highlight: 'Bukan Afiliasi Resmi',
  },
  {
    q: 'Bagaimana cara memesan di Jasdor?',
    a: 'Cukup 4 langkah mudah:\n1. Pilih outlet Kopi Kenangan terdekat yang sedang buka di beranda.\n2. Pilih menu dan sesuaikan opsi varian (cup size, sugar, ice, topping).\n3. Buka keranjang belanja, masukkan nama pemesan dan pilih jadwal pickup (sekarang atau terjadwal 15 menit).\n4. Klik "Kirim Pesanan via WhatsApp" untuk mengirim ringkasan pesanan ke WhatsApp admin Jasdor.',
  },
  {
    q: 'Berapa biaya jasa titip (fee jastip) di Jasdor?',
    a: 'Biaya jastip kami sangat transparan dan hemat:\n• Rp2.000 per item jika Anda memesan 2 item atau lebih.\n• Rp4.000 flat jika Anda hanya memesan 1 item saja.\nBiaya jasa ini otomatis dihitung di keranjang belanja sebelum checkout.',
    highlight: 'Mulai Rp2.000/item',
  },
  {
    q: 'Kapan jam operasional layanan Jasdor?',
    a: `Layanan pemesanan jastip Jasdor beroperasi setiap hari (Senin – Minggu) pukul ${JAM_LAYANAN}. Di luar jam tersebut, pemesanan ditutup sementara untuk memastikan seluruh pesanan diproses saat barista outlet melayani.`,
  },
  {
    q: 'Apa saja metode pembayaran yang diterima dan bagaimana cara bayarnya?',
    a: 'Setelah Anda mengirimkan format pesanan melalui WhatsApp, admin Jasdor akan mengonfirmasi ketersediaan stok di outlet dan mengirimkan rincian tagihan beserta QRIS / nomor rekening resmi Jasdor.\nKami menerima:\n• QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay — tanpa biaya admin)\n• Transfer Bank (BCA, Mandiri, BRI, BNI)\n• E-Wallet (GoPay, OVO, DANA, ShopeePay)',
  },
  {
    q: 'Bagaimana kebijakan pembatalan dan refund pesanan?',
    a: 'Jika pesanan belum dibayarkan atau belum diproses oleh admin Jasdor ke outlet, Anda dapat membatalkan pesanan tanpa biaya apapun. Jika pesanan sudah dibayar namun ternyata stok menu di outlet habis saat barista memproses, admin Jasdor akan segera mengabari Anda dan dana akan di-refund 100% penuh.',
    highlight: 'Garansi Refund 100% jika Stok Habis',
  },
  {
    q: 'Bagaimana jika saya ingin mengajukan pertanyaan lain?',
    a: `Anda dapat langsung menghubungi Customer Service kami melalui WhatsApp resmi di ${NOMOR_WHATSAPP_ADMIN_FORMATTED}. Admin kami siap membantu Anda dengan ramah setiap hari selama jam operasional.`,
  },
];

export default function FaqPage() {
  const waHelpUrl = getAdminWhatsAppUrl('Halo Admin Jasdor, saya membaca halaman FAQ dan ingin menanyakan sesuatu.');

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      {/* Header dengan tombol kembali */}
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
              Semua hal yang perlu Anda ketahui tentang cara order, diskon 50%, jam layanan, dan ketentuan jastip Jasdor.
            </p>
          </div>
        </div>

        {/* Highlight Penegasan Independen */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-[#78350F]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-amber-700 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block text-[#78350F] mb-0.5">Layanan Jastip Independen</strong>
            {SITE_CONFIG.disclaimer} Pemesanan diproses langsung ke barista outlet Kopi Kenangan pilihan Anda.
          </div>
        </div>

        {/* Daftar FAQ Cards */}
        <div className="space-y-3">
          {FAQ_LIST.map((faq, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 transition hover:border-[#D9A74A]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-bold text-sm text-[#26150B] leading-snug">
                  {faq.q}
                </h2>
                {faq.highlight && (
                  <span className="shrink-0 px-2 py-0.5 bg-[#F2EAE0] text-[#735F52] text-[10px] font-bold rounded-md whitespace-nowrap">
                    {faq.highlight}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C4A3E] leading-relaxed whitespace-pre-line">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Ringkasan Metode Pembayaran */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold text-xs">
              Rp
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#26150B]">
                Metode Pembayaran Tersedia
              </h3>
              <p className="text-[11px] text-[#735F52]">
                Dibayarkan setelah admin mengonfirmasi pesanan Anda di WhatsApp
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
                  <span className="text-[10px] text-[#735F52] block">
                    {m.keterangan}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#15803D] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {m.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Bantuan WhatsApp */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl shadow-sm text-center space-y-3 border border-emerald-700/40">
          <h3 className="font-display font-black text-base text-white">
            Masih Punya Pertanyaan Lain?
          </h3>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xs mx-auto">
            Admin Jasdor siap membantu Anda setiap hari pukul {JAM_LAYANAN}.
          </p>
          <a
            href={waHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-display font-bold text-xs rounded-xl transition active:scale-95 shadow-md"
          >
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
