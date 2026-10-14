import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Perlindungan Data Pengguna',
  description:
    'Kebijakan privasi dan perlindungan data pengguna di Jasdor: bagaimana data pesanan, nama pemesan, dan komunikasi WhatsApp jasa order dikelola secara aman dan rahasia.',
};

export default function PrivacyPage() {
  const waPrivacyUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya ingin bertanya mengenai privasi data layanan jasa order.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Kebijakan Privasi"
      />

      <main className="flex-1 p-4 pb-12 max-w-md mx-auto w-full space-y-4">
        {/* Banner Hero */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Keamanan & Privasi
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Kebijakan Privasi Jasdor
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Komitmen kami untuk melindungi kerahasiaan identitas dan data pesanan Anda selama menggunakan layanan jasa order Jasdor.
            </p>
          </div>
        </div>

        {/* Ringkasan Jaminan Privasi */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 shadow-2xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block text-emerald-950 mb-0.5">
              Jaminan Bebas Spam & Data Tidak Dibagikan
            </strong>
            Data pesanan Anda hanya digunakan untuk memproses pesanan ke barista gerai Kopi Kenangan dan <strong>tidak pernah dibagikan, disewakan, atau dijual kepada pihak ketiga manapun</strong>.
          </div>
        </div>

        {/* Section 1: Data yang Dikumpulkan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              01
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Data yang Kami Kumpulkan
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              Kami hanya mengumpulkan data minimal yang dibutuhkan untuk kelancaran transaksi jasa order:
            </p>
            <ul className="space-y-1.5 text-[#5C4A3E]">
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span><strong>Nama Pemesan</strong>: Dicantumkan pada tiket pesanan di outlet agar barista mengenali pesanan Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span><strong>Rincian Pesanan & Catatan</strong>: Menu yang dipilih, ukuran cup, takaran gula/es, dan opsi addon/topping.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span><strong>Nomor WhatsApp</strong>: Media komunikasi langsung antara pemesan dan admin Jasdor saat checkout.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span><strong>Penyimpanan Keranjang Lokal</strong>: Disimpan sementara di memori browser perangkat Anda agar keranjang tidak hilang saat berpindah menu.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Tujuan Penggunaan Data */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              02
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Tujuan Penggunaan Data
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>Data yang dikumpulkan secara ketat hanya digunakan untuk:</p>
            <ul className="space-y-1.5 text-[#5C4A3E]">
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span>Meneruskan dan mendaftarkan pesanan ke kasir/barista outlet Kopi Kenangan pilihan Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span>Konfirmasi ketersediaan stok menu dan jadwal pengambilan (pickup).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span>Mengirimkan tagihan pembayaran resmi (QRIS / Bank Jago / Blu by BCA / E-wallet) serta konfirmasi pembayaran.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C67D0A] font-bold">•</span>
                <span>Memproses refund 100% apabila menu pesanan habis di outlet.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Keamanan Pembayaran & Privasi Keuangan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              03
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Keamanan Transaksi & Data Finansial
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              Website Jasdor <strong>tidak pernah meminta atau menyimpan data kredensial finansial sensitif</strong> seperti nomor kartu debit/kredit, PIN ATM, atau password m-banking pengguna.
            </p>
            <p>
              Seluruh transaksi diselesaikan langsung melalui aplikasi perbankan atau e-wallet resmi pengguna ke rekening resmi / QRIS Jasdor.
            </p>
          </div>
        </section>

        {/* Section 4: Hak Pengguna */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              04
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Hak & Penghapusan Data Pengguna
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              Pelanggan berhak meminta riwayat chat WhatsApp dan data pesanan dihapus kapan saja dengan menghubungi admin Customer Service kami.
            </p>
          </div>
        </section>

        {/* Kartu Kontak WhatsApp */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="font-display font-bold text-xs text-[#26150B] block">
              Pertanyaan Mengenai Privasi?
            </span>
            <span className="text-[11px] text-[#735F52] block">
              Hubungi Admin WA ({NOMOR_WHATSAPP_ADMIN_FORMATTED})
            </span>
          </div>
          <a
            href={waPrivacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-xs shrink-0"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Chat Admin</span>
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
