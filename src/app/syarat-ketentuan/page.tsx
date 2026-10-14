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
  title: 'Syarat & Ketentuan — Aturan Layanan Jastip',
  description:
    'Syarat dan ketentuan penggunaan layanan jasa titip Kopi Kenangan Jasdor: alur pemesanan, pembayaran, garansi refund, dan batas tanggung jawab layanan.',
};

export default function TermsPage() {
  const waContactUrl = getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin berkonsultasi mengenai syarat & ketentuan pesanan.');

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
              Harap membaca ketentuan berikut sebelum melakukan pemesanan jastip Kopi Kenangan promo setengah harga.
            </p>
          </div>
        </div>

        {/* Section 1: Definisi & Kedudukan Layanan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">1</span>
            Kedudukan & Status Layanan
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              1.1. <strong>Jasdor</strong> ({SITE_CONFIG.brandName}) adalah penyedia jasa titip (jastip) independen yang membantu konsumen memesan menu minuman dan makanan Kopi Kenangan dengan skema potongan harga promo.
            </p>
            <p>
              1.2. Jasdor <strong>bukan merupakan perwakilan, mitra resmi, atau cabang resmi dari PT Bumi Berkah Boga (Kopi Kenangan)</strong>. Semua transaksi jastip adalah kesepakatan antara pelanggan dan Jasdor.
            </p>
          </div>
        </section>

        {/* Section 2: Alur Pemesanan & Data Pemesan */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">2</span>
            Alur Pemesanan & Checkout
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              2.1. Pelanggan wajib memilih outlet Kopi Kenangan yang berstatus <strong>Buka</strong> pada website.
            </p>
            <p>
              2.2. Pelanggan wajib mengisi nama pemesan yang valid (maksimal 40 karakter) dan memilih opsi pickup (sekarang atau slot terjadwal 15 menit).
            </p>
            <p>
              2.3. Pesanan dianggap sah setelah dikirimkan melalui format WhatsApp resmi dan dikonfirmasi ketersediaannya oleh admin Jasdor.
            </p>
          </div>
        </section>

        {/* Section 3: Pembayaran & Biaya Jasa */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">3</span>
            Harga, Fee Jasa & Pembayaran
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              3.1. Promo potongan 50% berlaku khusus untuk <strong>menu dasar minuman</strong> Kopi Kenangan. Tambahan opsi varian (ukuran Large, Juwara Beans, Oatside) dan addon (topping, syrup) dikenakan penambahan flat transparan sesuai daftar di katalog.
            </p>
            <p>
              3.2. <strong>Biaya Jasa (Fee Jastip)</strong>:
              <br />• 1 item pesanan: Rp4.000 flat.
              <br />• 2 item atau lebih: Rp2.000 per item.
            </p>
            <p>
              3.3. Pembayaran dilakukan via transfer bank atau QRIS resmi yang diberikan admin Jasdor sebelum pesanan diteruskan ke barista outlet.
            </p>
          </div>
        </section>

        {/* Section 4: Pembatalan & Kebijakan Refund */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">4</span>
            Pembatalan & Kebijakan Refund
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              4.1. <strong>Jika Menu Habis di Outlet</strong>: Apabila setelah pembayaran ternyata stok bahan/menu habis di outlet yang dipilih, admin akan menawarkan opsi ganti menu, pindah outlet, atau <strong>garansi refund 100% penuh</strong> tanpa potongan biaya apapun.
            </p>
            <p>
              4.2. <strong>Pembatalan Sepihak oleh Pelanggan</strong>: Pelanggan tidak dapat membatalkan pesanan apabila pesanan sudah diproses dan dibuat oleh barista Kopi Kenangan di outlet.
            </p>
          </div>
        </section>

        {/* Section 5: Batas Tanggung Jawab & Jam Operasional */}
        <section className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-2xs space-y-2">
          <h2 className="font-display font-bold text-sm text-[#26150B] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs flex items-center justify-center font-bold">5</span>
            Batas Tanggung Jawab (Disclaimer)
          </h2>
          <div className="text-xs text-[#5C4A3E] leading-relaxed space-y-2 pl-7">
            <p>
              5.1. Kualitas racikan rasa, suhu minuman, kebersihan packaging, dan kecepatan pembuatan fisik di outlet merupakan tanggung jawab penuh pihak Kopi Kenangan.
            </p>
            <p>
              5.2. Layanan Jasdor hanya melayani pemesanan pada jam operasional: <strong>{JAM_LAYANAN}</strong>.
            </p>
            <p>
              5.3. Pelanggan wajib mengambil pesanan di outlet sesuai nama pemesan atau nomor antrean yang diberikan admin Jasdor. Keterlambatan pengambilan di outlet yang menyebabkan es mencair berada di luar tanggung jawab Jasdor.
            </p>
          </div>
        </section>

        {/* Kontak Bantuan */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center space-y-2 text-[#78350F]">
          <p className="text-xs leading-relaxed">
            Punya pertanyaan mengenai syarat & ketentuan ini?
          </p>
          <a
            href={waContactUrl}
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
