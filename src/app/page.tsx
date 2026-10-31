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
  JADWAL_OPERASIONAL_LENGKAP,
  TEKS_INFO_PEMBAYARAN_CHECKOUT,
} from '@/lib/site-config';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { ActiveOrderBanner } from '@/components/ActiveOrderBanner';
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold text-emerald-900">Dibuka manual oleh admin</strong> - Layanan menerima pesanan di luar jadwal operasional normal.
            </div>
          </div>
        )}

        {/* Banner Status Tentatif Hari Selasa */}
        {status?.isTentative && (
          <div className="p-3 bg-[#FEF3C7] border-2 border-[#2B1D12] rounded-2xl shadow-[2px_2px_0px_#2B1D12] flex items-center gap-2.5 text-xs text-[#2B1D12]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div className="font-medium leading-snug">
              <strong className="font-bold">Info Layanan:</strong> {status.tentativeNote || 'Hari ini tentative - konfirmasi ke admin dulu ya.'}
            </div>
          </div>
        )}

        {/* Banner Pengingat Pesanan Menunggu Pembayaran */}
        <ActiveOrderBanner />

        {/* Live Status Antrean Pemrosesan Toko */}
        <QueueInfoBar />

        {/* Hero Kompak (Varian C) */}
        <div className="bg-[#2B1D12] text-[#FAF4E8] border-2 border-[#2B1D12] rounded-3xl p-5 relative overflow-hidden shadow-[4px_4px_0px_#C67D0A]">
          {/* Subtle warm glow background */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#C67D0A]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <h1 className="font-display font-black text-2xl text-[#FAF4E8] leading-tight tracking-tight">
              Jajan Favorit, Setengah Harga!
            </h1>
            <p className="text-xs text-[#E3D6C5] leading-relaxed font-medium">
              Pilih brand favoritmu, tentukan outlet terdekat, lalu checkout praktis via WhatsApp. Promo diskon s/d 50% setiap hari.
            </p>
          </div>
        </div>

        {/* Strip Kepercayaan / Trust Strip */}
        <TrustStrip />

        {/* Grid Brand (2 Kolom Mobile-First, Kartu Muka Food Court) */}
        <section aria-labelledby="brand-grid-heading" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 id="brand-grid-heading" className="font-display font-black text-base text-[#2B1D12]">
              Pilih Brand Kopi
            </h2>
            <span className="text-[11px] text-[#2B1D12] font-extrabold bg-[#FFE7D6] border border-[#2B1D12] px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#2B1D12]">
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

        {/* 3 Langkah Cara Order Ringkas */}
        <section
          aria-labelledby="cara-order-heading"
          className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-4 shadow-[4px_4px_0px_#2B1D12] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="cara-order-heading" className="font-display font-black text-xs uppercase text-[#C67D0A] tracking-wider">
              3 Langkah Mudah Order
            </h2>
            <span className="text-[10px] font-extrabold text-[#2B1D12]">Gak Pake Ribet</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#FFE7D6] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#2B1D12] text-[#FAF4E8] text-[10px] font-black flex items-center justify-center mb-1">
                1
              </div>
              <p className="text-[11px] font-black text-[#2B1D12] leading-tight">Pilih Brand</p>
              <p className="text-[9px] text-[#4A3628] font-bold mt-0.5 leading-snug">Cari outlet</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#DDF0FF] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#2B1D12] text-[#FAF4E8] text-[10px] font-black flex items-center justify-center mb-1">
                2
              </div>
              <p className="text-[11px] font-black text-[#2B1D12] leading-tight">Pilih Menu</p>
              <p className="text-[9px] text-[#4A3628] font-bold mt-0.5 leading-snug">Hemat 50%</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#D9F3EA] border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12]">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#15803D] text-white text-[10px] font-black flex items-center justify-center mb-1 border border-[#2B1D12]">
                3
              </div>
              <p className="text-[11px] font-black text-[#2B1D12] leading-tight">Kirim WA</p>
              <p className="text-[9px] text-[#4A3628] font-bold mt-0.5 leading-snug">Admin siapkan</p>
            </div>
          </div>
        </section>

        {/* Info Metode Pembayaran */}
        <section
          aria-labelledby="payment-info-heading"
          className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl p-4 shadow-[4px_4px_0px_#2B1D12] space-y-2.5 text-xs text-[#2B1D12]"
        >
          <div className="flex items-center justify-between">
            <h2 id="payment-info-heading" className="font-display font-black text-xs text-[#2B1D12]">
              Metode Pembayaran
            </h2>
            <span className="text-[10px] font-black text-[#2B1D12] bg-[#D9F3EA] border border-[#2B1D12] px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#2B1D12]">
              QRIS Bebas Admin
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#4A3628] font-medium">
            {TEKS_INFO_PEMBAYARAN_CHECKOUT}
          </p>
          <div className="pt-2 border-t-2 border-[#2B1D12]/10 text-[10px] text-[#7A6658] font-bold">
            Jadwal operasional: <span className="font-black text-[#2B1D12]">{JADWAL_OPERASIONAL_LENGKAP}</span>. Pesanan di luar jam buka diproses saat outlet beroperasi.
          </div>
        </section>

        {/* Banner Bantuan WhatsApp Cepat */}
        <div className="p-4 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl flex items-center justify-between gap-3 shadow-[4px_4px_0px_#2B1D12]">
          <div>
            <p className="font-display font-black text-xs text-[#2B1D12]">Ada pertanyaan sebelum order?</p>
            <p className="text-[11px] text-[#4A3628] font-medium mt-0.5">Admin siap bantu via WhatsApp</p>
          </div>
          <a
            href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang cara pesan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-black rounded-xl border-2 border-[#2B1D12] shadow-[3px_3px_0px_#2B1D12] flex items-center gap-1.5 transition shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span>Tanya Admin</span>
          </a>
        </div>
      </main>
    </div>
  );
}
