import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { TESTIMONIALS } from '@/data/testimonials';
import { getAdminWhatsAppUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Testimoni Pelanggan - Layanan Jasa Order Hemat',
  description:
    'Lihat pengalaman pelanggan yang telah menggunakan layanan jasa order promo hemat Kopi Kenangan dan Fore Coffee via Cima Group.',
};

export default function TestimonialsPage() {
  const shareTestiUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya ingin membagikan testimoni dan cerita pengalaman jajan hemat saya!'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Testimoni Pelanggan"
      />

      <main className="flex-1 p-4 pb-12 max-w-md mx-auto w-full space-y-4">
        {/* Banner Hero Testimoni */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Cerita Pelanggan
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Apa Kata Mereka?
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Pengalaman nyata pelanggan jajan kopi dan makanan favorit lebih hemat lewat layanan jasa order Cima Group.
            </p>
          </div>
        </div>

        {/* Ringkasan Skor & Kepuasan */}
        <div className="bg-white rounded-2xl p-4 border border-[#EFE5D8] shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-amber-500 text-sm">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="text-xs font-bold text-[#26150B] ml-1.5">5.0 / 5.0</span>
            </div>
            <p className="text-[11px] text-[#735F52] mt-0.5">
              100% Pesanan Terverifikasi via WhatsApp
            </p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              Terpercaya
            </span>
          </div>
        </div>

        {/* Daftar Testimoni */}
        <div className="space-y-3">
          {TESTIMONIALS.map((testi) => (
            <article
              key={testi.id}
              className="p-4 bg-white rounded-2xl border border-[#EFE5D8] shadow-xs hover:border-[#D9A74A]/40 transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF4ED] text-[#8B1E19] font-bold text-xs flex items-center justify-center border border-[#EFE5D8]">
                    {testi.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#26150B]">{testi.name}</h2>
                    <span className="text-[10px] text-[#8C7A6B] block">
                      {testi.brand} {testi.date ? `• ${testi.date}` : ''}
                    </span>
                  </div>
                </div>
                {testi.savings && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {testi.savings}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#4A3728] leading-relaxed italic">
                &ldquo;{testi.quote}&rdquo;
              </p>

              <div className="flex items-center gap-1 text-amber-500 text-xs">
                {Array.from({ length: testi.rating ?? 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Empty state / Ceritakan Pengalaman Ramah */}
        <div className="p-5 bg-gradient-to-b from-[#FFFDF9] to-[#F7EFE4] rounded-2xl border border-dashed border-[#D9CEBF] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#8B1E19] flex items-center justify-center mx-auto shadow-2xs border border-[#EFE5D8]">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#26150B]">
              Sudah Pernah Order di Jasdor?
            </h3>
            <p className="text-xs text-[#735F52] mt-1 max-w-xs mx-auto leading-relaxed">
              Testimoni dikumpulkan bertahap - ceritakan pengalamanmu dan bantu teman-teman lain jajan hemat tanpa ribet!
            </p>
          </div>

          <a
            href={shareTestiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white" />
            <span>Kirim Cerita & Testimoni via WhatsApp</span>
          </a>
        </div>
      </main>
    </div>
  );
}
