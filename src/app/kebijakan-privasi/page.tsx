import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import {
  SITE_CONFIG,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Perlindungan Data Pengguna',
  description:
    'Kebijakan privasi dan perlindungan data pengguna di Jasdor: bagaimana data pesanan, nama, dan komunikasi WhatsApp dikelola secara aman dan rahasia.',
};

export default function PrivacyPage() {
  const waPrivacyUrl = getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya mengenai privasi data.');

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
              Komitmen kami untuk melindungi kerahasiaan identitas dan data pesanan Anda selama menggunakan layanan Jasdor.
            </p>
          </div>
        </div>

        {/* Ringkasan Jaminan Privasi */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3 text-emerald-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block text-emerald-950 mb-0.5">Jaminan Bebas Spam & Rahasia</strong>
            Data pesanan Anda hanya digunakan untuk memproses pesanan ke barista outlet dan <strong>tidak pernah diperjualbelikan kepada pihak ketiga manapun</strong>.
          </div>
        </div>

        {/* Section 1: Data yang Dikumpulkan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">1</span>
            Data yang Kami Kumpulkan
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              Kami hanya mengumpulkan data minimal yang dibutuhkan untuk kelancaran transaksi jastip:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#6A584D]">
              <li><strong>Nama Pemesan</strong>: Dicantumkan pada tiket pesanan di outlet Kopi Kenangan agar barista mengenali pesanan Anda.</li>
              <li><strong>Rincian Pesanan & Catatan</strong>: Menu yang dipilih, ukuran cup, takaran gula/es, dan topping khusus.</li>
              <li><strong>Nomor WhatsApp</strong>: Media komunikasi langsung antara pelanggan dan admin Jasdor saat checkout.</li>
              <li><strong>Data Teknis Ringkas</strong>: Cache lokal keranjang (di browser perangkat Anda) agar item belanja tidak hilang saat navigasi.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Tujuan Penggunaan Data */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">2</span>
            Tujuan Penggunaan Data
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>Data yang dikumpulkan semata-mata digunakan untuk:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#6A584D]">
              <li>Meneruskan dan mendaftarkan pesanan Anda ke sistem barista outlet Kopi Kenangan terpilih.</li>
              <li>Mengonfirmasi ketersediaan stok produk dan jadwal pengambilan (pickup).</li>
              <li>Mengirimkan informasi pembayaran QRIS/rekening resmi serta bukti konfirmasi pesanan.</li>
              <li>Memproses pengembalian dana (refund) jika terjadi kehabisan stok di outlet.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Pembagian Data Pihak Ketiga */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">3</span>
            Tidak Dibagikan ke Pihak Ketiga
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              Jasdor berkomitmen tegas untuk <strong>tidak menjual, menyewakan, atau membagikan data nomor kontak maupun nama Anda kepada pihak ketiga</strong> untuk tujuan periklanan, pemasaran spam, atau telemarketing.
            </p>
            <p>
              Data nama hanya disebutkan kepada kasir/barista outlet semata-mata untuk keperluan serah terima pesanan kopi.
            </p>
          </div>
        </section>

        {/* Section 4: Keamanan Pembayaran */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">4</span>
            Keamanan Transaksi & Pembayaran
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              Website Jasdor <strong>tidak menyimpan data nomor kartu kredit, kartu debit, atau PIN perbankan</strong> Anda. Seluruh pembayaran dilakukan secara aman melalui aplikasi perbankan atau e-wallet resmi pelanggan via scan QRIS atau transfer bank langsung.
            </p>
          </div>
        </section>

        {/* Kontak Hak Privasi */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs text-center space-y-2">
          <p className="text-xs text-[#6A584D] leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai privasi data Anda di {SITE_CONFIG.brandShort}, silakan hubungi admin kami melalui WhatsApp:
          </p>
          <a
            href={waPrivacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#26150B] text-[#FBBF24] font-display font-bold text-xs rounded-xl transition active:scale-95 shadow-xs"
          >
            <span>Hubungi Admin ({NOMOR_WHATSAPP_ADMIN_FORMATTED})</span>
          </a>
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
