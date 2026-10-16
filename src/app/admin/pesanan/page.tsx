'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { OrderRecord, OrderStatus } from '@/types/order';
import { formatRupiah } from '@/lib/currency';

export default function AdminPesananPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setOrderError(null);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setIsLoadingOrders(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar pesanan');
      }
      setIsAuthenticated(true);
      setOrders(data.orders || []);
    } catch (err: any) {
      setOrderError(err.message || 'Terjadi kesalahan saat memuat pesanan');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Login Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsSubmittingAuth(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password admin salah');
      }

      setIsAuthenticated(true);
      setPasswordInput('');
      fetchOrders();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Logout Admin
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      setOrders([]);
    } catch {}
  };

  // Handle Status Update (Konfirmasi Bayar / Batalkan)
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const confirmMessage =
      newStatus === 'diproses'
        ? `Konfirmasi pembayaran untuk order #${orderId}? Status akan berubah menjadi 'diproses'.`
        : `Yakin ingin membatalkan order #${orderId}?`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  // Tampilan Loading Awal
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#26150B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Tampilan Form Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#EFE5D8] shadow-md space-y-4">
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl font-bold text-[#26150B]">Admin Jasdor</h1>
            <p className="text-xs text-[#735F52]">Masukkan password admin untuk mengelola pesanan masuk</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="admin-pass" className="block text-xs font-semibold text-[#4A3225] mb-1">
                Password Admin
              </label>
              <input
                id="admin-pass"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Ketik password admin..."
                autoFocus
                className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-[#E0D4C5] focus:border-[#C67D0A] rounded-xl text-sm outline-hidden text-[#26150B]"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingAuth || !passwordInput.trim()}
              className="w-full min-h-[42px] px-4 py-2 bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313] font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isSubmittingAuth ? 'Memverifikasi...' : 'Masuk ke Panel'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#F2EAE0]">
            <Link href="/" className="text-xs text-[#8C7667] hover:underline">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Panel Admin
  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#26150B] pb-20 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-[#FBF8F4]/95 backdrop-blur-md border-b border-[#EFE5D8] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-base font-bold text-[#26150B]">Panel Pesanan Jasdor</h1>
            <p className="text-[11px] text-[#7A6455]">Konfirmasi manual pembayaran QRIS</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={isLoadingOrders}
              className="px-3 py-1.5 bg-white border border-[#E0D4C5] hover:bg-[#F2EBE1] text-[#26150B] text-xs font-semibold rounded-lg shadow-2xs transition"
            >
              {isLoadingOrders ? 'Memuat...' : 'Segarkan'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Filter Tab Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `Semua (${orders.length})` },
            {
              id: 'menunggu_konfirmasi',
              label: `Perlu Dicek (${orders.filter((o) => o.status === 'menunggu_konfirmasi').length})`,
              badge: true,
            },
            {
              id: 'menunggu_pembayaran',
              label: `Belum Bayar (${orders.filter((o) => o.status === 'menunggu_pembayaran').length})`,
            },
            {
              id: 'diproses',
              label: `Diproses (${orders.filter((o) => o.status === 'diproses').length})`,
            },
            {
              id: 'kedaluwarsa',
              label: `Kedaluwarsa (${orders.filter((o) => o.status === 'kedaluwarsa').length})`,
            },
            {
              id: 'dibatalkan',
              label: `Batal (${orders.filter((o) => o.status === 'dibatalkan').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition ${
                filterStatus === tab.id
                  ? 'bg-[#26150B] text-[#FBBF24] font-bold shadow-2xs'
                  : 'bg-white border border-[#E0D4C5] text-[#5A4537] hover:bg-[#F2EBE1]'
              } ${tab.badge && filterStatus !== tab.id ? 'border-amber-300 bg-amber-50/50' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {orderError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            {orderError}
          </div>
        )}

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE5D8] text-center space-y-1">
            <p className="font-semibold text-sm text-[#26150B]">Tidak ada pesanan ditemukan</p>
            <p className="text-xs text-[#8C7667]">
              {filterStatus === 'all'
                ? 'Belum ada pesanan yang masuk ke sistem.'
                : 'Tidak ada pesanan untuk filter status ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs transition space-y-3 ${
                    order.status === 'menunggu_konfirmasi'
                      ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/20'
                      : 'border-[#EFE5D8]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#F2EAE0] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#26150B]">
                          #{order.id}
                        </span>
                        <Link
                          href={`/bayar/${order.id}`}
                          target="_blank"
                          className="text-[10px] text-blue-700 hover:underline"
                        >
                          (Buka Halaman Bayar ↗)
                        </Link>
                      </div>
                      <p className="text-[11px] text-[#7A6455] mt-0.5">
                        {new Date(order.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB • {order.outlet_name || order.outlet_code}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {order.status === 'menunggu_konfirmasi' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Menunggu Konfirmasi
                        </span>
                      )}
                      {order.status === 'menunggu_pembayaran' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          Menunggu Bayar
                        </span>
                      )}
                      {order.status === 'diproses' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Diproses
                        </span>
                      )}
                      {order.status === 'kedaluwarsa' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          Kedaluwarsa
                        </span>
                      )}
                      {order.status === 'dibatalkan' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Items Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EFE5D8] space-y-1">
                      <p className="font-bold text-[#26150B] text-[11px] uppercase tracking-wide">
                        Pelanggan:
                      </p>
                      <p className="font-semibold text-[#26150B]">{order.customer_name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-[#5A4537]">
                        <span>WhatsApp:</span>
                        <a
                          href={`https://wa.me/${order.customer_wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          {order.customer_wa} ↗
                        </a>
                      </p>
                      {order.pickup_time && (
                        <p className="text-[11px] text-[#7A6455]">
                          Jadwal: <span className="font-medium text-[#26150B]">{order.pickup_time}</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EFE5D8] space-y-1">
                      <p className="font-bold text-[#26150B] text-[11px] uppercase tracking-wide">
                        Total & Item:
                      </p>
                      <p className="text-base font-display font-black text-[#DC2626]">
                        {formatRupiah(order.total)}
                      </p>
                      <div className="text-[11px] text-[#5A4537] space-y-0.5 pt-0.5">
                        {order.items.map((it, idx) => (
                          <p key={idx} className="truncate">
                            {it.quantity}x {it.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {order.status !== 'diproses' && order.status !== 'dibatalkan' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                        className="px-3.5 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        Batalkan
                      </button>
                    )}

                    {order.status !== 'diproses' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'diproses')}
                        className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUpdating ? (
                          'Memproses...'
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Konfirmasi Bayar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
