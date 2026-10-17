'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  TESTIMONI_PHOTO_BASE_URL,
  TESTIMONI_PHOTO_MAX,
  TESTIMONI_CHANNEL_URL,
  getAdminWhatsAppUrl,
} from '@/lib/site-config';
import { TESTIMONI_CAPTIONS } from '@/data/testimonials';

interface PhotoItem {
  num: number;
  fileName: string;
  url: string;
  caption?: string;
}

// Generate daftar target foto 1..TESTIMONI_PHOTO_MAX berdasarkan konvensi penamaan
const ALL_PHOTO_ITEMS: PhotoItem[] = Array.from(
  { length: TESTIMONI_PHOTO_MAX },
  (_, index) => {
    const num = index + 1;
    const numStr = String(num).padStart(2, '0');
    const fileName = `testimoni-${numStr}.webp`;
    const url = `${TESTIMONI_PHOTO_BASE_URL}/${fileName}`;
    const caption = TESTIMONI_CAPTIONS[fileName];
    return {
      num,
      fileName,
      url,
      caption,
    };
  }
);

export default function TestimoniGalleryPage() {
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const shareTestiUrl = getAdminWhatsAppUrl(
    'Halo Admin Jasdor, saya ingin membagikan testimoni dan cerita pengalaman jajan hemat saya!'
  );

  // Fallback timeout untuk empty state jika pengecekan jaringan lambat
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut ESC untuk menutup lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    }
    if (activePhoto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  const loadedPhotos = ALL_PHOTO_ITEMS.filter((p) => loadedMap[p.num]);
  const totalChecked = Object.keys(checkedMap).length;
  const isCheckingComplete = totalChecked >= TESTIMONI_PHOTO_MAX || isTimedOut;
  const hasPhotos = loadedPhotos.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4]">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        sticky={true}
        title="Testimoni Pelanggan"
      />

      {/* Hidden preloader untuk mendeteksi keberadaan file di R2 tanpa merusak tampilan */}
      <div className="hidden" aria-hidden="true">
        {ALL_PHOTO_ITEMS.map((item) => (
          <img
            key={item.num}
            src={item.url}
            alt=""
            loading="lazy"
            onLoad={() => {
              setLoadedMap((prev) => ({ ...prev, [item.num]: true }));
              setCheckedMap((prev) => ({ ...prev, [item.num]: true }));
            }}
            onError={() => {
              setCheckedMap((prev) => ({ ...prev, [item.num]: true }));
            }}
          />
        ))}
      </div>

      <main className="flex-1 p-4 pb-12 max-w-2xl mx-auto w-full space-y-4">
        {/* Banner Hero Testimoni */}
        <div className="bg-gradient-to-br from-[#26150B] via-[#351F14] to-[#1C0D06] rounded-3xl p-5 text-white shadow-md border border-[#D9A74A]/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C67D0A]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="px-2.5 py-0.5 bg-[#C67D0A]/30 text-[#FBBF24] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#D9A74A]/30 inline-block mb-2">
              Bukti Nyata Pelanggan
            </span>
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-tight">
              Galeri Testimoni Jasdor
            </h1>
            <p className="text-xs text-[#E3D6C5] mt-1.5 leading-relaxed">
              Screenshot chat pemesanan dan bukti transaksi asli dari pelanggan setia jasa order Cima Group.
            </p>
          </div>
        </div>

        {/* Ringkasan Skor & Jaminan Keaslian */}
        <div className="bg-white rounded-2xl p-4 border border-[#EFE5D8] shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-amber-500 text-sm">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="text-xs font-bold text-[#26150B] ml-1.5">
                100% Bukti Asli
              </span>
            </div>
            <p className="text-[11px] text-[#735F52] mt-0.5">
              Tangkapan layar chat dan pesanan terverifikasi
            </p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              Real Order
            </span>
          </div>
        </div>

        {/* Galeri Foto: 2 Kolom Mobile, 3-4 Kolom Desktop */}
        {hasPhotos ? (
          <section aria-label="Galeri Foto Testimoni" className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {loadedPhotos.map((photo) => (
                <div
                  key={photo.num}
                  onClick={() => setActivePhoto(photo)}
                  className="group bg-white border border-[#EFE5D8] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#D9A74A]/50 transition-all duration-200 cursor-pointer flex flex-col active:scale-[0.98]"
                >
                  <div className="relative aspect-[4/5] bg-[#F7F2EB] overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`Testimoni pelanggan Jasdor ${photo.num}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-xs">
                        Perbesar
                      </span>
                    </div>
                  </div>

                  {photo.caption && (
                    <div className="p-2.5 bg-white border-t border-[#F2ECE1]">
                      <p className="text-[11px] text-[#4A3525] font-medium leading-snug line-clamp-2">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : !isCheckingComplete ? (
          /* Loading State saat mendeteksi foto */
          <div className="p-8 text-center text-xs text-[#735F52] space-y-2">
            <div className="w-6 h-6 border-2 border-[#C67D0A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat galeri testimoni...</p>
          </div>
        ) : (
          /* Empty State: Jika belum ada satupun foto di R2 */
          <div className="p-6 bg-gradient-to-b from-[#FFFDF9] to-[#F7EFE4] rounded-2xl border border-dashed border-[#D9CEBF] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white text-[#8B1E19] flex items-center justify-center mx-auto shadow-2xs border border-[#EFE5D8]">
              <span className="text-xl">📸</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-[#26150B]">
                Belum Ada Foto Testimoni
              </h2>
              <p className="text-xs text-[#735F52] mt-1 max-w-xs mx-auto leading-relaxed">
                Testimoni foto sedang dikumpulkan - ceritakan pengalamanmu dan kirimkan bukti pesananmu ke WhatsApp admin!
              </p>
            </div>

            <a
              href={shareTestiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Kirim Cerita & Testimoni via WhatsApp</span>
            </a>
          </div>
        )}

        {/* CTA Ajakan Kirim Testimoni (Jika galeri memiliki foto) */}
        {hasPhotos && (
          <div className="p-4 bg-gradient-to-b from-[#FFFDF9] to-[#F7EFE4] rounded-2xl border border-dashed border-[#D9CEBF] text-center space-y-2.5">
            <p className="text-xs text-[#4A3525] font-medium leading-relaxed">
              Punya pengalaman hemat saat memesan di Jasdor? Bagikan cerita dan bukti pesananmu!
            </p>
            <a
              href={shareTestiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Kirim Testimoni via WhatsApp</span>
            </a>
          </div>
        )}

        {/* CTA Channel Testimoni di Bagian Bawah */}
        <div className="p-4 bg-white border border-[#EFE5D8] rounded-2xl text-center space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#15803D] flex items-center justify-center mx-auto border border-emerald-200">
            <WhatsAppIcon className="w-4 h-4 fill-[#15803D]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs text-[#26150B]">
              Channel Testimoni Pelanggan
            </h3>
            <p className="text-[11px] text-[#735F52] mt-0.5">
              Lihat lebih banyak testimoni di channel khusus kami
            </p>
          </div>
          <a
            href={TESTIMONI_CHANNEL_URL}
            target={TESTIMONI_CHANNEL_URL === '#' ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (TESTIMONI_CHANNEL_URL === '#') {
                e.preventDefault();
                alert('Channel WhatsApp testimoni segera hadir! Hubungi admin untuk informasi lebih lanjut.');
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E0D4C5] text-[#26150B] text-xs font-bold transition active:scale-[0.98]"
          >
            <span>Buka Channel Testimoni</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </main>

      {/* Lightbox Fullscreen Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan Penuh Testimoni"
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Tombol Tutup */}
          <button
            type="button"
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-lg transition active:scale-95"
            aria-label="Tutup foto"
          >
            ✕
          </button>

          {/* Konten Gambar Lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center justify-center"
          >
            <img
              src={activePhoto.url}
              alt={`Testimoni pelanggan Jasdor ${activePhoto.num}`}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />

            {activePhoto.caption && (
              <div className="mt-3 bg-black/60 text-white text-xs px-4 py-2 rounded-xl backdrop-blur-md text-center max-w-md">
                {activePhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
