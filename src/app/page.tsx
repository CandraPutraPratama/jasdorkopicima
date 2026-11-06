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

        {/* Strip Kepercayaan / Trust Strip */}
        <TrustStrip />

        {/* Grid Brand (2 Kolom Mobile-First, Kartu Muka Food Court) */}
        <section aria-labelledby="brand-grid-heading" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 id="brand-grid-heading" className="font-display font-bold text-base text-[#2B1D12]">
              Pilih Brand Kopi
            </h2>
            <span className="text-[11px] text-[#2B1D12] font-bold bg-[#FFE7D6] border border-[#2B1D12] px-2 py-0.5 rounded-lg">
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

        {/* Alur Pemesanan Cepat & Ringkas */}
        <section
          aria-labelledby="cara-order-heading"
          className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[3px_3px_0px_#2B1D12] space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <h2 id="cara-order-heading" className="font-display font-bold text-xs uppercase text-[#C67D0A] tracking-wider">
              Alur Pemesanan
            </h2>
            <span className="text-[10px] font-semibold text-[#7A6658]">Praktis & Bebas Antre</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
            <div className="p-2 rounded-xl bg-[#FAF4E8] border border-[#2B1D12]/15">
              <span className="text-[10px] font-black text-[#C67D0A] block">01</span>
              <p className="text-[11px] font-bold text-[#2B1D12] leading-tight mt-0.5">Pilih Outlet</p>
              <p className="text-[9px] text-[#7A6658] font-medium mt-0.5 leading-snug">Dekat lokasimu</p>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF4E8] border border-[#2B1D12]/15">
              <span className="text-[10px] font-black text-[#C67D0A] block">02</span>
              <p className="text-[11px] font-bold text-[#2B1D12] leading-tight mt-0.5">Pilih Menu</p>
              <p className="text-[9px] text-[#7A6658] font-medium mt-0.5 leading-snug">Hemat s/d 50%</p>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF4E8] border border-[#2B1D12]/15">
              <span className="text-[10px] font-black text-[#15803D] block">03</span>
              <p className="text-[11px] font-bold text-[#2B1D12] leading-tight mt-0.5">Ambil di Toko</p>
              <p className="text-[9px] text-[#7A6658] font-medium mt-0.5 leading-snug">Tanpa antre</p>
            </div>
          </div>
        </section>

        {/* Info Metode Pembayaran */}
        <section
          aria-labelledby="payment-info-heading"
          className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[3px_3px_0px_#2B1D12] space-y-2 text-xs text-[#2B1D12]"
        >
          <div className="flex items-center justify-between">
            <h2 id="payment-info-heading" className="font-display font-bold text-xs text-[#2B1D12]">
              Metode Pembayaran
            </h2>
            <span className="text-[10px] font-bold text-[#2B1D12] bg-[#D9F3EA] border border-[#2B1D12] px-2 py-0.5 rounded-lg">
              QRIS Bebas Biaya Admin
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#4A3628] font-normal">
            {TEKS_INFO_PEMBAYARAN_CHECKOUT}
          </p>
          <div className="pt-2 border-t border-[#2B1D12]/10 text-[10px] text-[#7A6658] font-medium">
            Jadwal operasional: <span className="font-bold text-[#2B1D12]">{JADWAL_OPERASIONAL_LENGKAP}</span>. Pesanan di luar jam buka diproses saat outlet beroperasi.
          </div>
        </section>

        {/* Banner Bantuan WhatsApp Cepat */}
        <div className="p-3.5 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl flex items-center justify-between gap-3 shadow-[3px_3px_0px_#2B1D12]">
          <div>
            <p className="font-display font-bold text-xs text-[#2B1D12]">Ada pertanyaan sebelum order?</p>
            <p className="text-[11px] text-[#7A6658] font-normal mt-0.5">Admin siap bantu via WhatsApp</p>
          </div>
          <a
            href={getAdminWhatsAppUrl('Halo Admin Jasdor, saya ingin bertanya tentang cara pesan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl border-2 border-[#2B1D12] shadow-[2px_2px_0px_#2B1D12] flex items-center gap-1.5 transition shrink-0 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
            <span>Tanya Admin</span>
          </a>
        </div>
      </main>
    </div>
  );
}
