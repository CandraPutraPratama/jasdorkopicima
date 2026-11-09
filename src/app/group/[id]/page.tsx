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
    const text = `Yuk pilih kopi bareng di ${session.outletName} via Jasdor Cima! Klik link ini untuk memasukkan pesananmu:\n${window.location.href}`;
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
        <div className="w-14 h-14 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center mb-3 border-2 border-rose-300 shadow-[2px_2px_0px_#2B1D12]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="font-display font-black text-base text-[#2B1D12] mb-1">
          Sesi Tidak Ditemukan
        </h1>
        <p className="text-xs text-[#7A6455] max-w-xs mb-5 leading-relaxed">
          {errorMessage || 'Sesi pesanan bareng ini tidak ditemukan atau sudah berakhir.'}
        </p>
        <Link
          href="/"
          className="min-h-[44px] px-5 py-2.5 bg-[#2B1D12] text-[#FBBF24] hover:bg-[#3D2313] font-display font-bold text-xs rounded-xl border border-[#2B1D12] shadow-[2px_2px_0px_#C67D0A] active:translate-x-[1px] active:translate-y-[1px]"
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
        title="Pesanan Bareng"
      />

      <main className="max-w-md mx-auto w-full px-4 pt-3 space-y-3.5">
        {/* Info Card Room */}
        <div className="p-4 bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-3xl shadow-[3px_3px_0px_#2B1D12] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C67D0A] block">
                {session.brandSlug.replace('-', ' ').toUpperCase()}
              </span>
              <h2 className="font-display font-black text-sm sm:text-base leading-tight text-[#2B1D12]">
                {session.outletName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#7A6455] mt-1">
                <span>Dibuat oleh:</span>
                <strong className="text-[#2B1D12] font-black">{session.hostName}</strong>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  session.status === 'open'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : session.status === 'locked'
                    ? 'bg-amber-50 text-amber-950 border-amber-400'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    session.status === 'open'
                      ? 'bg-emerald-600 animate-pulse'
                      : session.status === 'locked'
                      ? 'bg-amber-600'
                      : 'bg-neutral-500'
                  }`}
                />
                <span>
                  {session.status === 'open'
                    ? 'Terbuka'
                    : session.status === 'locked'
                    ? 'Terkunci'
                    : 'Selesai'}
                </span>
              </div>

              {isHost && (
                <span className="text-[10px] bg-[#FAF4E8] text-[#2B1D12] px-2 py-0.5 rounded-lg font-black border border-[#2B1D12]/20 shadow-2xs">
                  Kamu Host
                </span>
              )}
            </div>
          </div>

          {/* Tombol Share WhatsApp & Salin Link */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B1D12]/10">
            <button
              type="button"
              onClick={handleShareWA}
              className="min-h-[42px] px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs rounded-xl shadow-[2px_2px_0px_#1B8E47] border border-[#1B8E47] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
              </svg>
              <span>Bagikan ke WA</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[42px] px-3 py-1.5 bg-[#FAF4E8] hover:bg-[#FFE7D6] border border-[#2B1D12] text-[#2B1D12] font-display font-black text-xs rounded-xl shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              {isCopied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#2B1D12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section Daftar Pesanan */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-black text-xs text-[#2B1D12] uppercase tracking-wider">
              Daftar Pesanan ({totalCups} Minuman)
            </h3>
            <span className="text-xs font-display font-black text-[#C67D0A]">
              Subtotal: {formatRupiah(totalSubtotal)}
            </span>
          </div>

          {session.items.length === 0 ? (
            <div className="p-8 bg-[#FFFDF9] border-2 border-dashed border-[#D4C3B2] rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF4E8] border border-[#2B1D12]/20 flex items-center justify-center text-[#2B1D12]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="font-display font-black text-xs text-[#2B1D12]">
                Belum Ada Minuman yang Dipilih
              </p>
              <p className="text-[11px] text-[#7A6455] max-w-xs mx-auto leading-relaxed">
                Bagikan link ke teman kantor atau klik tombol di bawah untuk memilih menu pertamamu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(participantsMap.entries()).map(([pName, pItems]) => (
                <div
                  key={pName}
                  className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-3.5 shadow-[2px_2px_0px_#2B1D12] space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#2B1D12]/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#FAF4E8] border border-[#2B1D12]/20 flex items-center justify-center text-[#2B1D12]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <strong className="text-xs font-display font-black text-[#2B1D12]">
                        {pName}
                      </strong>
                      {pName === session.hostName && (
                        <span className="text-[9px] bg-[#FAF4E8] text-[#2B1D12] px-1.5 py-0.5 rounded-md font-black border border-[#2B1D12]/20">
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7A6455] font-bold">
                      {pItems.length} minuman
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
                              {item.variantDescription}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-[#C67D0A] italic mt-0.5">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-display font-black text-[#2B1D12]">
                            {formatRupiah(item.subtotal)}
                          </span>
                          {session.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, pName)}
                              title="Hapus minuman"
                              aria-label={`Hapus ${item.productName} milik ${pName}`}
                              className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-xs cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
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

      {/* Floating Bottom Bar (Solid & Grounded) */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#26150B] border-t-2 border-[#D9A74A]/40 p-3 z-30 shadow-[0_-4px_16px_rgba(43,29,18,0.15)]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Tombol Tambah Minuman Sendiri */}
          {session.status === 'open' && (
            <Link
              href={`/outlet/${session.outletCode}?groupId=${session.id}`}
              className="flex-1 min-h-[46px] px-3 bg-[#FAF4E8] text-[#2B1D12] border-2 border-[#2B1D12] hover:bg-white font-display font-black text-xs rounded-xl shadow-[2px_2px_0px_#2B1D12] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-[#2B1D12]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Pilih Minuman</span>
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
                  title="Kunci pesanan agar tidak ada penambahan lagi"
                  className="px-3.5 min-h-[46px] bg-[#3D2313] text-[#FBBF24] border border-[#D9A74A]/40 hover:bg-[#4E2D18] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Kunci</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  disabled={isLocking}
                  title="Buka kembali kunci pesanan"
                  className="px-3.5 min-h-[46px] bg-[#3D2313] text-neutral-200 border border-neutral-600 hover:bg-[#4E2D18] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-neutral-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Buka Kunci</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleHostCheckout}
                disabled={session.items.length === 0}
                className="flex-1 min-h-[46px] px-4 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#26150B] font-display font-black text-xs rounded-xl shadow-[3px_3px_0px_#C67D0A] flex items-center justify-center gap-2 transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-[#26150B]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Checkout ({totalCups} Minuman)</span>
              </button>
            </>
          )}

          {/* Jika bukan Host dan Sesi Terkunci */}
          {!isHost && session.status === 'locked' && (
            <div className="flex-1 p-2.5 bg-[#3D2313] border border-[#D9A74A]/40 rounded-xl text-center text-xs text-[#FBBF24] font-bold">
              Pesanan telah dikunci oleh Host ({session.hostName}) untuk pembayaran.
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
