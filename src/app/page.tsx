'use client';

import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { BrandCard } from '@/components/BrandCard';
import { Footer } from '@/components/Footer';
import {
  getAllBrands,
  getAdminWhatsAppUrl,
  NOMOR_WHATSAPP_ADMIN_FORMATTED,
  JADWAL_OPERASIONAL_RINGKAS,
} from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

/* TODO: Ganti data di bawah ini dengan testimoni pelanggan asli setelah diluncurkan */
interface TestimonialItem {
  id: string;
  name: string;
  brand: string;
  quote: string;
  savings: string;
  isPlaceholderTodo: boolean;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    name: 'Dimas R.',
    brand: 'Kopi Kenangan',
    quote: 'Pesen 4 cup Kopi Kenangan Mantan buat anak kantor, bayar setengah harga. Admin fast respon banget!',
    savings: 'Hemat Rp42.000',
    isPlaceholderTodo: true,
  },
  {
    id: 'testi-2',
    name: 'Sarah P.',
    brand: 'Kopi Kenangan',
    quote: 'Format pesanannya gampang, tinggal klik WA. Langsung ambil di outlet tanpa ribet antre.',
    savings: 'Hemat Rp28.000',
    isPlaceholderTodo: true,
  },
  {
    id: 'testi-3',
    name: 'Andi K.',
    brand: 'Cima Group',
    quote: 'Langganan tiap weekend jajan kopi hemat. QRIS tanpa admin, super praktis!',
    savings: 'Hemat 50%',
    isPlaceholderTodo: true,
  },
];

export default function PortalPage() {
  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();
  const brands = getAllBrands();

  if (!isStatusLoading && !isOpen && status) {
    return <ClosedScreen status={status} onRefetch={refetch} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] flex flex-col selection:bg-[#D9A74A]/30">
      {/* Header Ramping Cima Group */}
      <Header
        brandName="CIMA GROUP"
        brandSub="PORTAL MULTI-BRAND"
        chatMessage="Halo Admin Cima Group, mau tanya seputar jasa order hemat."
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Hero Kompak (Varian C: Maksimal Sepertiga Layar) */}
        <div className="bg-[#26150B] text-[#FAF7F2] rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
          {/* Subtle warm glow background */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D9A74A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3B2314] border border-[#52331C] text-[10px] font-bold text-[#E5B563] uppercase tracking-wider">
              <span>Promo Jasa Order Hemat</span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-[#FAF7F2] leading-tight tracking-tight">
              Jajan Favorit, Setengah Harga
            </h1>
            <p className="text-xs sm:text-sm text-[#D4C3B3] leading-relaxed">
              Pilih brand → pilih outlet → checkout via WhatsApp. Promo s/d 50% tiap brand.
            </p>
          </div>
        </div>

        {/* Strip Kepercayaan / Trust Strip (Above the Fold) */}
        <div className="bg-white border border-[#EFE5D8] rounded-xl px-3 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5A4537] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>QRIS</span>
            </div>
            <span className="text-[#D9CEBF]">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Jago/Blu</span>
            </div>
            <span className="text-[#D9CEBF]">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>E-Wallet</span>
            </div>
            <span className="text-[#D9CEBF]">•</span>
            <div className="flex items-center gap-1.5 shrink-0 text-[#15803D] font-bold">
              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#15803D]" />
              <span>Admin Fast Respon</span>
            </div>
          </div>
        </div>

        {/* Grid Brand (2 Kolom Mobile-First, Kartu Muka Food Court) */}
        <section aria-labelledby="brand-grid-heading" className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="brand-grid-heading" className="font-display font-bold text-sm text-[#26150B]">
              Pilih Brand
            </h2>
            <span className="text-[11px] text-[#8C7A6B] font-medium">
              {brands.filter((b) => b.status === 'active').length} Brand Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {brands.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </section>

        {/* 3 Langkah Cara Order Ringkas */}
        <section
          aria-labelledby="cara-order-heading"
          className="bg-white border border-[#EFE5D8] rounded-2xl p-3.5 shadow-2xs space-y-2.5"
        >
          <h2 id="cara-order-heading" className="font-display font-bold text-xs uppercase text-[#8C5D17] tracking-wider">
            3 Langkah Mudah Order Hemat
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#F2EAE0]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#26150B] text-white text-[10px] font-bold flex items-center justify-center mb-1">
                1
              </div>
              <p className="text-[11px] font-bold text-[#26150B] leading-tight">Pilih Brand</p>
              <p className="text-[9px] text-[#735F52] mt-0.5 leading-snug">Cari outlet terdekat</p>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#F2EAE0]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#26150B] text-white text-[10px] font-bold flex items-center justify-center mb-1">
                2
              </div>
              <p className="text-[11px] font-bold text-[#26150B] leading-tight">Pilih Menu</p>
              <p className="text-[9px] text-[#735F52] mt-0.5 leading-snug">Diskon s/d 50%</p>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#F2EAE0]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#15803D] text-white text-[10px] font-bold flex items-center justify-center mb-1">
                3
              </div>
              <p className="text-[11px] font-bold text-[#26150B] leading-tight">Kirim WA</p>
              <p className="text-[9px] text-[#735F52] mt-0.5 leading-snug">Admin siapkan order</p>
            </div>
          </div>
        </section>

        {/* Info Metode Pembayaran Lengkap Sesuai Data Asli */}
        <section
          aria-labelledby="payment-info-heading"
          className="bg-[#FAF7F2] border border-[#EFE5D8] rounded-2xl p-3.5 space-y-2 text-xs text-[#5A4537]"
        >
          <div className="flex items-center justify-between">
            <h2 id="payment-info-heading" className="font-display font-bold text-xs text-[#26150B]">
              Metode Pembayaran & Ketentuan
            </h2>
            <span className="text-[10px] font-semibold text-[#8C5D17] bg-[#F2EAE0] px-2 py-0.5 rounded-full">
              Bayar Setelah Konfirmasi
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] leading-relaxed">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#26150B] shrink-0">• QRIS:</span>
              <span>Bisa semua aplikasi bank & e-wallet tanpa biaya admin.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#26150B] shrink-0">• Transfer Digital:</span>
              <span>Hanya Bank Jago dan Blu by BCA.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#26150B] shrink-0">• E-Wallet:</span>
              <span>GoPay, DANA, ShopeePay, dan SeaBank.</span>
            </div>
            <div className="pt-1.5 border-t border-[#E8DEC0]/80 text-[10px] text-[#735F52]">
              Jadwal operasional: <span className="font-semibold text-[#26150B]">{JADWAL_OPERASIONAL_RINGKAS}</span>. Pesanan di luar jam operasional diproses saat buka.
            </div>
          </div>
        </section>

        {/* Section Testimoni (Placeholder Bersih bertanda TODO Jelas) */}
        <section aria-labelledby="testimoni-heading" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="testimoni-heading" className="font-display font-bold text-sm text-[#26150B]">
              Kata Pelanggan
            </h2>
            {/* Penanda jujur bahwa ini placeholder review awal */}
            <span className="text-[10px] font-bold text-[#8C5D17] bg-[#F4EDE3] border border-[#E5DACB] px-1.5 py-0.5 rounded">
              Contoh Ulasan (TODO)
            </span>
          </div>

          <div className="space-y-2">
            {TESTIMONIALS.map((testi) => (
              <div
                key={testi.id}
                className="bg-white border border-[#EFE5D8] rounded-xl p-3 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#26150B]">{testi.name}</span>
                    <span className="text-[10px] text-[#735F52] bg-[#FAF7F2] px-1.5 py-0.5 rounded">
                      {testi.brand}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded">
                    {testi.savings}
                  </span>
                </div>
                <p className="text-xs text-[#5C4A3E] leading-relaxed italic">
                  &ldquo;{testi.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Banner Bantuan WhatsApp Cepat */}
        <div className="p-3 bg-white border border-[#EFE5D8] rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="font-display font-bold text-xs text-[#26150B]">Ada pertanyaan sebelum order?</p>
            <p className="text-[11px] text-[#735F52] mt-0.5">Admin siap bantu via WhatsApp ({NOMOR_WHATSAPP_ADMIN_FORMATTED})</p>
          </div>
          <a
            href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang cara pesan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow-xs"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span>Tanya Admin</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
