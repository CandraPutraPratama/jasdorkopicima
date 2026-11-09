'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/currency';
import type { GroupOrderSession, GroupOrderItem } from '@/lib/group-order-service';
import { convertGroupItemsToCartItems } from '@/lib/group-order-service';
import { Header } from '@/components/Header';

export default function GroupOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  const router = useRouter();

  const [session, setSession] = useState<GroupOrderSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Ambil hostToken dari localStorage jika ada
  useEffect(() => {
    if (typeof window !== 'undefined' && groupId) {
      const token = localStorage.getItem(`jasdor_host_token_${groupId}`);
      if (token) setHostToken(token);
    }
  }, [groupId]);

  // Fetch data session
  const fetchGroupSession = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/group-orders/${encodeURIComponent(groupId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sesi pesanan bareng tidak ditemukan');
      }
      setSession(data.group);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat data pesanan bareng');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupSession();
    // Auto-polling tiap 5 detik agar realtime
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchGroupSession();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchGroupSession]);

  const isHost = Boolean(hostToken && session?.hostToken && hostToken === session.hostToken);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    try {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleShareWA = () => {
    if (!session || typeof window === 'undefined') return;
    const text = `Yuk pilih kopi bareng di ${session.outletName} via Jasdor Cima! Klik link ini buat masukin pesanan kopimu ya:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleToggleLock = async () => {
    if (!session || !hostToken) return;
    setIsLocking(true);
    try {
      const nextAction = session.status === 'locked' ? 'unlock' : 'lock';
      const res = await fetch(`/api/group-orders/${encodeURIComponent(groupId)}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostToken, action: nextAction }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status');
      }
      setSession(data.group);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status sesi');
    } finally {
      setIsLocking(false);
    }
  };

  const handleDeleteItem = async (itemId: string, participantName: string) => {
    if (!confirm(`Hapus minuman milik "${participantName}" dari pesanan bareng?`)) return;
    try {
      const res = await fetch(
        `/api/group-orders/${encodeURIComponent(groupId)}/items/${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus item');
      }
      setSession(data.group);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus minuman');
    }
  };

  const handleHostCheckout = () => {
    if (!session || session.items.length === 0) {
      alert('Belum ada minuman di pesanan bareng ini.');
      return;
    }

    // Konversi items ke CartItem dengan catatan nama pemesan
    const cartItems = convertGroupItemsToCartItems(session.items);

    const preparedState = {
      brandSlug: session.brandSlug,
      outletCode: session.outletCode,
      outletName: session.outletName,
      items: cartItems,
      customerName: session.hostName,
      customerPhone: session.hostWa || '',
      notes: `[Pesanan Bareng] Host: ${session.hostName} (${session.items.length} cup)`,
    };

    try {
      sessionStorage.setItem('jasdor_cart_v1', JSON.stringify(preparedState));
    } catch {
      // ignore
    }

    // Arahkan ke outlet dengan trigger membuka CartDrawer
    router.push(`/outlet/${session.outletCode}?openCart=true`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#C67D0A] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-[#7A6455] font-bold">Memuat pesanan bareng...</p>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center text-2xl font-black mb-3 border-2 border-rose-300">
          ⚠️
        </div>
        <h1 className="font-display font-black text-base text-[#2B1D12] mb-1">
          Sesi Tidak Ditemukan
        </h1>
        <p className="text-xs text-[#7A6455] max-w-xs mb-5 leading-relaxed">
          {errorMessage || 'Sesi pesanan bareng ini tidak ditemukan atau sudah berakhir.'}
        </p>
        <Link
          href="/"
          className="min-h-[44px] px-5 py-2.5 bg-[#2B1D12] text-[#FBBF24] font-display font-bold text-xs rounded-xl shadow-[2px_2px_0px_#C67D0A]"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Hitung total item & harga
  const totalCups = session.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const totalSubtotal = session.items.reduce((acc, it) => acc + it.subtotal, 0);

  // Group items berdasarkan nama pemesan
  const participantsMap = new Map<string, GroupOrderItem[]>();
  for (const it of session.items) {
    const list = participantsMap.get(it.participantName) || [];
    list.push(it);
    participantsMap.set(it.participantName, list);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F4] text-[#2B1D12] pb-28 font-sans">
      <Header
        showBack={true}
        backHref={`/outlet/${session.outletCode}`}
        backLabel="Kembali ke Outlet"
        sticky={true}
        title="Pesanan Bareng Kantor"
      />

      <main className="max-w-md mx-auto w-full px-4 pt-3 space-y-3.5">
        {/* Info Card Room */}
        <div className="p-4 bg-white border-2 border-[#2B1D12] rounded-3xl shadow-[3px_3px_0px_#2B1D12] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C67D0A] block">
                {session.brandSlug.replace('-', ' ').toUpperCase()}
              </span>
              <h2 className="font-display font-black text-sm sm:text-base leading-tight text-[#2B1D12]">
                {session.outletName}
              </h2>
              <p className="text-xs text-[#7A6455] mt-0.5">
                Host: <strong className="text-[#2B1D12]">{session.hostName}</strong>
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  session.status === 'open'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : session.status === 'locked'
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}
              >
                {session.status === 'open' ? '🟢 Buka' : session.status === 'locked' ? '🔒 Terkunci' : '✅ Dipesan'}
              </span>

              {isHost && (
                <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-extrabold border border-amber-300">
                  👑 Kamu Host
                </span>
              )}
            </div>
          </div>

          {/* Tombol Share WhatsApp & Salin Link */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F2EAE0]">
            <button
              type="button"
              onClick={handleShareWA}
              className="min-h-[40px] px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs rounded-xl shadow-xs border border-[#1B8E47] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📲 Share ke WA</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[40px] px-3 py-1.5 bg-white border border-[#2B1D12] text-[#2B1D12] hover:bg-[#FFF8E7] font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isCopied ? '✅ Tersalin!' : '🔗 Salin Link'}</span>
            </button>
          </div>
        </div>

        {/* Section Daftar Pesanan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-black text-xs text-[#2B1D12] uppercase tracking-wider">
              Daftar Minuman ({totalCups} Cup)
            </h3>
            <span className="text-xs font-bold text-[#C67D0A]">
              Est. {formatRupiah(totalSubtotal)}
            </span>
          </div>

          {session.items.length === 0 ? (
            <div className="p-6 bg-white border-2 border-dashed border-[#D4C3B2] rounded-3xl text-center space-y-2">
              <div className="text-3xl">☕</div>
              <p className="font-bold text-xs text-[#2B1D12]">Belum ada minuman yang ditambahkan</p>
              <p className="text-[11px] text-[#7A6455] max-w-xs mx-auto">
                Bagikan link ke teman-teman kantor atau klik tombol di bawah untuk memilih minuman pertamamu!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(participantsMap.entries()).map(([pName, pItems]) => (
                <div
                  key={pName}
                  className="bg-white border-2 border-[#2B1D12] rounded-2xl p-3 shadow-[2px_2px_0px_#2B1D12] space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-[#F2EAE0] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">👤</span>
                      <strong className="text-xs font-black text-[#2B1D12]">{pName}</strong>
                      {pName === session.hostName && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-bold">
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7A6455] font-semibold">
                      {pItems.length} cup
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pItems.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#2B1D12] leading-tight">
                            {item.quantity}x {item.productName}
                          </div>
                          {item.variantDescription && (
                            <div className="text-[11px] text-[#7A6455] leading-snug mt-0.5">
                              ({item.variantDescription})
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-[#C67D0A] italic mt-0.5">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-[#2B1D12]">
                            {formatRupiah(item.subtotal)}
                          </span>
                          {session.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, pName)}
                              title="Hapus minuman"
                              className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-[#2B1D12] p-3 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Tombol Tambah Minuman Sendiri */}
          {session.status === 'open' && (
            <Link
              href={`/outlet/${session.outletCode}?groupId=${session.id}`}
              className="flex-1 min-h-[46px] px-3 bg-[#FAF4E8] text-[#2B1D12] border-2 border-[#2B1D12] hover:bg-[#FFE7D6] font-display font-black text-xs rounded-xl shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <span>+ Pilih Kopi</span>
            </Link>
          )}

          {/* Tombol Khusus Host: Kunci & Lanjut Checkout */}
          {isHost && (
            <>
              {session.status === 'open' ? (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  title="Kunci pesanan agar teman tidak menambah lagi"
                  className="px-3 min-h-[46px] bg-amber-50 text-amber-900 border-2 border-amber-400 hover:bg-amber-100 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🔒 Kunci</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  title="Buka kembali kunci pesanan"
                  className="px-3 min-h-[46px] bg-neutral-100 text-neutral-800 border-2 border-neutral-300 hover:bg-neutral-200 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🔓 Buka</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleHostCheckout}
                disabled={session.items.length === 0}
                className="flex-1 min-h-[46px] px-4 bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-black text-xs rounded-xl shadow-[3px_3px_0px_#C67D0A] flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>🛒 Checkout ({totalCups} Cup)</span>
              </button>
            </>
          )}

          {/* Jika bukan Host dan Sesi Terkunci */}
          {!isHost && session.status === 'locked' && (
            <div className="flex-1 p-2 bg-amber-50 border border-amber-300 rounded-xl text-center text-xs text-amber-950 font-bold">
              🔒 Pesanan sudah dikunci oleh Host ({session.hostName}). Sedang proses pembayaran!
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

