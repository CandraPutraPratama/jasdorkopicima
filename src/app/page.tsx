'use client';

import { useState, useEffect } from 'react';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { useBrandStatus } from '@/hooks/useBrandStatus';
import { ClosedScreen } from '@/components/ClosedScreen';
import { Header } from '@/components/Header';
import { BrandCard } from '@/components/BrandCard';
import { getBrandOutletProvider } from '@/lib/brand-provider';
import {
  getAllBrands,
  getAdminWhatsAppUrl,
  isBrandOrderable,
  TEKS_INFO_PEMBAYARAN_CHECKOUT,
} from '@/lib/site-config';
import { ActiveOrderBanner } from '@/components/ActiveOrderBanner';
import { RecentOrderReorderCard } from '@/components/RecentOrderReorderCard';
import { QueueInfoBar } from '@/components/QueueInfoBar';
import { TrustStrip } from '@/components/TrustStrip';

export default function PortalPage() {
  useEffect(() => {
    document.title = 'Jasdor Kopi Cima - Jasa Order Kopi Kenangan, Fore & Tomoro Promo Hemat';
  }, []);

  const { isOpen, status, isLoading: isStatusLoading, refetch } = useOperationalStatus();
  const { isBrandActive } = useBrandStatus();
  const brands = getAllBrands();
  const [outletCounts, setOutletCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let isCancelled = false;

    async function loadOutletCounts() {
      const activeBrands = getAllBrands().filter(
        (b) => b.status === 'active' && isBrandActive(b.slug)
      );
      const counts: Record<string, number> = {};

      await Promise.all(
        activeBrands.map(async (brand) => {
          const provider = getBrandOutletProvider(brand.slug);
          if (provider) {
            try {
              const count = await provider.getOutletCount();
              counts[brand.slug] = count;
            } catch (err) {
              console.warn(`[Portal] Gagal memuat jumlah outlet ${brand.slug}:`, err);
            }
          }
        })
      );

      if (!isCancelled) {
        setOutletCounts(counts);
      }
    }

    loadOutletCounts();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!isStatusLoading && !isOpen && status) {
    return (
      <ClosedScreen
        currentWibTime={status?.currentWibTime}
        openTime={status?.openTime}
        closeTime={status?.closeTime}
        dayName={status?.dayName}
        message={status?.message}
        isBreak={status?.isBreak}
        onRefresh={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col selection:bg-amber-300 selection:text-[#2B1D12]">
      {/* Header Ramping Cima Group */}
      <Header
        brandName="CIMA GROUP"
        brandSub="Mau Hemat? Order disini aja!"
        chatMessage="Halo Admin Cima Group, mau tanya seputar jasa order hemat."
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Indikator Dibuka Manual oleh Admin */}
        {status?.overrideType === 'force_open' && (
          <div className="p-2.5 sm:p-3 bg-emerald-50 border-2 border-emerald-700 rounded-2xl shadow-[2px_2px_0px_#065F46] flex items-center gap-2.5 text-xs text-emerald-950">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold text-emerald-900">Dibuka manual oleh admin</strong> - Layanan menerima pesanan di luar jadwal operasional normal.
            </div>
          </div>
        )}

        {/* Banner Status Tentatif Hari Selasa */}
        {status?.isTentative && (
          <div className="p-3 bg-[#FEF3C7] border-2 border-[#2B1D12] rounded-2xl shadow-[2px_2px_0px_#2B1D12] flex items-center gap-2.5 text-xs text-[#2B1D12]">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold">Info Layanan:</strong> {status.tentativeNote || 'Hari ini tentative - konfirmasi ke admin dulu ya.'}
            </div>
          </div>
        )}

        {/* Banner Pengingat Pesanan Menunggu Pembayaran */}
        <ActiveOrderBanner />

        {/* Live Status Antrean Pemrosesan Toko */}
        <QueueInfoBar />

        {/* Kartu Pesan Ulang Cepat untuk Pelanggan Kembali */}
        <RecentOrderReorderCard />

        {/* Hero Kompak (Varian C) */}
        <div className="bg-[#2B1D12] text-[#FAF4E8] border-2 border-[#2B1D12] rounded-2xl p-5 relative overflow-hidden shadow-[3px_3px_0px_#C67D0A]">
          <div className="relative z-10 space-y-1.5">
            <h1 className="font-display font-black text-2xl text-[#FAF4E8] leading-tight tracking-tight">
              Jajan Favorit, Setengah Harga!
            </h1>
            <p className="text-xs text-[#E3D6C5] leading-relaxed font-normal">
              Pilih brand favoritmu, tentukan outlet terdekat, lalu checkout praktis via WhatsApp. Promo diskon s/d 50% setiap hari.
            </p>
          </div>
        </div>

        {/* Grid Brand: aksi utama beranda, tepat di bawah hero */}
        <section aria-labelledby="brand-grid-heading" className="space-y-2.5">
          <div className="flex items-baseline justify-between px-1">
            <h2 id="brand-grid-heading" className="font-display font-bold text-lg text-[#2B1D12]">
              Pilih Brand Kopi
            </h2>
            <span className="text-xs text-[#4A3628] font-medium">
              {brands.filter((b) => isBrandOrderable(b) && isBrandActive(b.slug)).length} Brand Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {brands.map((brand) => (
              <BrandCard
                key={brand.slug}
                brand={brand}
                outletCount={outletCounts[brand.slug]}
                isActive={isBrandActive(brand.slug)}
              />
            ))}
          </div>
        </section>

        {/* Strip kepercayaan setelah aksi utama (pilih brand) */}
        <TrustStrip />

        {/* Info pembayaran: satu blok. Jadwal operasional ada di footer, tombol chat ada di header. */}
        <section
          aria-labelledby="payment-info-heading"
          className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[3px_3px_0px_#2B1D12] space-y-1.5"
        >
          <h2 id="payment-info-heading" className="font-display font-bold text-base text-[#2B1D12]">
            Bayar pakai QRIS, tanpa biaya admin
          </h2>
          <p className="text-xs leading-relaxed text-[#4A3628] font-medium">
            {TEKS_INFO_PEMBAYARAN_CHECKOUT}
          </p>
          <div className="pt-2.5 mt-1 border-t-2 border-[#2B1D12]/15 flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold text-sm text-[#2B1D12]">Ada pertanyaan sebelum order?</p>
              <p className="text-xs text-[#7A6658] font-medium">Admin siap bantu via WhatsApp</p>
            </div>
            <a
              href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang cara pesan.')}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-bold text-[#15803D] underline underline-offset-4 decoration-2 hover:text-[#166534]"
            >
              Tanya Admin
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
