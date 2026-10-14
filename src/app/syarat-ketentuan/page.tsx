import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  SITE_CONFIG,
  JADWAL_OPERASIONAL_LENGKAP,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Aturan Layanan Jasa Order',
  description:
    'Syarat dan ketentuan penggunaan layanan jasa order Kopi Kenangan Jasdor: alur pemesanan, pembayaran, garansi refund, dan batas tanggung jawab layanan.',
};

export default function TermsPage() {
  const waContactUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya ingin berkonsultasi mengenai syarat & ketentuan pesanan jasa order.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Syarat & Ketentuan"
      />

      <main className="flex-1 p-4 pb-12 max-w-md mx-auto w-full space-y-4">
        {/* Banner Hero */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Aturan Layanan
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Syarat & Ketentuan Jasdor
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Harap membaca aturan berikut sebelum melakukan pemesanan jasa order Kopi Kenangan promo setengah harga.
            </p>
          </div>
        </div>

        {/* Section 1: Definisi & Kedudukan Layanan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              01
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Kedudukan & Status Layanan
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              1.1. <strong>Jasdor</strong> ({SITE_CONFIG.brandName}) adalah penyedia <strong>layanan jasa order independen</strong> yang membantu pelanggan memesan menu makanan dan minuman Kopi Kenangan dengan skema potongan promo 50% untuk harga dasar minuman.
            </p>
            <p>
              1.2. Jasdor <strong>bukan merupakan perwakilan, mitra resmi, karyawan, atau cabang resmi dari PT Bumi Berkah Boga (Kopi Kenangan)</strong>. Semua transaksi adalah murni kesepakatan jasa order antara pelanggan dan Jasdor.
            </p>
          </div>
        </section>

        {/* Section 2: Jadwal Operasional & Alur Pemesanan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              02
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Jadwal Operasional & Alur Pemesanan
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              2.1. <strong>Jadwal Operasional</strong>: {JADWAL_OPERASIONAL_LENGKAP}. Pemesanan pada hari libur (Senin, Rabu, Kamis) atau di luar jam tersebut akan diproses pada sesi layanan berikutnya.
            </p>
            <p>
              2.2. Pelanggan wajib memilih outlet Kopi Kenangan yang berstatus <strong>Buka</strong> pada katalog website.
            </p>
            <p>
              2.3. Pelanggan wajib mengisi nama pemesan yang valid (maksimal 40 karakter) dan memilih opsi waktu pickup (sekarang atau slot 15 menit).
            </p>
            <p>
              2.4. Format pesanan dikirimkan via WhatsApp resmi dan dianggap sah setelah admin Jasdor mengonfirmasi ketersediaan menu di gerai.
            </p>
          </div>
        </section>

        {/* Section 3: Harga, Biaya Jasa & Pembayaran */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              03
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Harga, Biaya Jasa Order & Pembayaran
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              3.1. Promo potongan 50% berlaku khusus pada <strong>harga dasar minuman</strong> Kopi Kenangan. Tambahan ukuran cup, varian susu (Oatside), biji kopi (Juwara Beans), dan addon (topping) dikenakan biaya tambahan transparan sesuai rincian di katalog.
            </p>
            <p>
              3.2. <strong>Biaya Jasa Order</strong>:
              <br />• 1 item pesanan: Rp4.000 flat.
              <br />• 2 item atau lebih: Rp2.000 per item.
            </p>
            <p>
              3.3. <strong>Metode Pembayaran</strong> yang sah:
              <br />• QRIS (mendukung semua bank dan dompet digital).
              <br />• Transfer Bank Digital: HANYA <strong>Bank Jago</strong> dan <strong>Blu by BCA</strong>.
              <br />• E-Wallet: <strong>GoPay, DANA, ShopeePay, dan SeaBank</strong>.
            </p>
            <p>
              3.4. Pelanggan wajib menyelesaikan pembayaran setelah tagihan dikirimkan admin dan sebelum pesanan diproses oleh barista outlet.
            </p>
          </div>
        </section>

        {/* Section 4: Pembatalan & Kebijakan Refund */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              04
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Pembatalan & Garansi Pengembalian Dana (Refund)
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              4.1. Pelanggan dapat membatalkan pesanan tanpa biaya apapun selama pesanan belum dibayarkan atau belum diproses ke outlet.
            </p>
            <p>
              4.2. Jika pesanan sudah dibayarkan namun terjadi <strong>kehabisan stok di outlet</strong>, admin Jasdor akan menginformasikan kepada pelanggan dan dana akan <strong>di-refund 100% penuh</strong>.
            </p>
            <p>
              4.3. Jika pesanan sudah masuk antrean pembuatan oleh barista outlet, pembatalan sepihak oleh pelanggan tidak dapat diproses dan dana tidak dapat dikembalikan.
            </p>
          </div>
        </section>

        {/* Section 5: Batasan Tanggung Jawab */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2 border-l-4 border-l-[#C67D0A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-black shrink-0">
              05
            </span>
            <h2 className="font-display font-bold text-sm text-[#26150B]">
              Batasan Tanggung Jawab Jasa Order
            </h2>
          </div>
          <div className="text-xs text-[#4A3525] leading-relaxed space-y-2 pl-8 pt-1">
            <p>
              5.1. Jasdor bertindak sebagai perantara pemesanan (jasa order). Kualitas bahan baku, rasa, temperatur minuman, dan penyajian sepenuhnya merupakan standar operasional gerai resmi Kopi Kenangan.
            </p>
            <p>
              5.2. Pelanggan bertanggung jawab untuk mengambil pesanan di outlet sesuai dengan jadwal dan nama pemesan yang telah didaftarkan.
            </p>
          </div>
        </section>

        {/* Kartu Bantuan WhatsApp */}
        <div className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="font-display font-bold text-xs text-[#26150B] block">
              Butuh Penjelasan Tambahan?
            </span>
            <span className="text-[11px] text-[#735F52] block">
              Hubungi WhatsApp admin ({NOMOR_WHATSAPP_ADMIN_FORMATTED})
            </span>
          </div>
          <a
            href={waContactUrl}
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
