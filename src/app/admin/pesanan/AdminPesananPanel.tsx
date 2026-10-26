'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { OrderRecord, OrderStatus } from '@/types/order';
import { formatRupiah } from '@/lib/currency';
import { getOrderBreakdown } from '@/lib/pricing';
import type { OperationalOverride } from '@/lib/site-settings';
import type { OperationalStatusResult } from '@/lib/operational';

// Pesanan yang relevan untuk tampilan default panel: yang sudah melewati klaim
// pembayaran (sudah klik "Saya Sudah Bayar"), ditambah pesanan terminal yang
// masih butuh refund. Pesanan yang masih menunggu_pembayaran dan pesanan
// kedaluwarsa/dibatalkan tanpa flag refund disembunyikan dari tampilan default
// supaya tidak membingungkan (tetap bisa dilihat lewat tab masing-masing).
function isPaidRelevantOrder(o: OrderRecord): boolean {
  return (
    o.status === 'menunggu_konfirmasi' ||
    o.status === 'antrian' ||
    o.status === 'diproses' ||
    o.status === 'selesai' ||
    ((o.status === 'dibatalkan' || o.status === 'kedaluwarsa') && Boolean(o.needs_refund))
  );
}

export type AdminTab = 'pesanan' | 'operasional' | 'mode_minimal' | 'brand';

export default function AdminPesananPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Tab navigasi admin: default selalu 'pesanan' (Halaman Utama / Page 1)
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminTab;
      if (tabParam && ['pesanan', 'operasional', 'mode_minimal', 'brand'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'pesanan';
  });

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'pesanan') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [newOrderNotice, setNewOrderNotice] = useState<string | null>(null);
  const ordersRef = useRef<OrderRecord[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Pilihan massal untuk memasukkan pesanan Perlu Dicek ke Antrian
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [isBulkQueueing, setIsBulkQueueing] = useState(false);

  // Pengaturan Situs: Mode Khusus Bundling
  const [isBundlingOnly, setIsBundlingOnly] = useState<boolean>(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<boolean>(false);
  const [settingsNotification, setSettingsNotification] = useState<string | null>(null);

  // Pengaturan Situs: Kontrol Manual Operasional
  const [operationalOverride, setOperationalOverrideState] = useState<OperationalOverride>('auto');
  const [effectiveStatus, setEffectiveStatus] = useState<OperationalStatusResult | null>(null);
  const [isUpdatingOverride, setIsUpdatingOverride] = useState<boolean>(false);
  const [overrideNotification, setOverrideNotification] = useState<string | null>(null);

  // Pengaturan Situs: Kontrol Ketersediaan Brand (Stok On / Off)
  const [brandStatusMap, setBrandStatusMap] = useState<Record<string, boolean>>({
    'kopi-kenangan': true,
    'fore': true,
    'tomoro': true,
  });
  const [updatingBrandSlug, setUpdatingBrandSlug] = useState<string | null>(null);

  // Fetch settings & operational status from API
  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const [settingsRes, opRes] = await Promise.all([
        fetch('/api/admin/site-settings'),
        fetch('/api/operational-status'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const modeVal =
          typeof data?.settings?.min_order_50k_mode === 'boolean'
            ? data.settings.min_order_50k_mode
            : data?.settings?.bundling_only_mode;
        if (typeof modeVal === 'boolean') {
          setIsBundlingOnly(modeVal);
        }
        if (typeof data?.settings?.operational_override === 'string') {
          setOperationalOverrideState(data.settings.operational_override);
        }
        if (data?.settings?.brand_status && typeof data.settings.brand_status === 'object') {
          setBrandStatusMap((prev) => ({
            ...prev,
            ...data.settings.brand_status,
          }));
        }
      }

      if (opRes.ok) {
        const opData: OperationalStatusResult = await opRes.json();
        setEffectiveStatus(opData);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

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
    fetchSettings();
  }, [fetchOrders, fetchSettings]);

  // Deteksi aktivitas user untuk smart polling hemat resource
  const lastActivityRef = useRef<number>(0);
  useEffect(() => {
    lastActivityRef.current = Date.now();
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('focus', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, []);

  // Auto-refresh live: daftar pesanan diperbarui tiap 20 detik (atau 60 detik jika standby/idle > 5 menit)
  // Ini mencegah rate limit Cloudflare/Supabase ketika laptop dibuka seharian.
  useEffect(() => {
    if (isAuthenticated !== true) return;
    const tick = async () => {
      if (document.hidden || updatingOrderId !== null || isBulkQueueing) return;
      const isIdle = lastActivityRef.current > 0 && Date.now() - lastActivityRef.current > 5 * 60 * 1000;
      if (isIdle && Math.floor(Date.now() / 1000) % 60 >= 20) {
        return;
      }
      try {
        const res = await fetch('/api/admin/orders');
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (res.status === 429) {
          console.warn('[AdminOrders] Polling terkena pembatasan frekuensi sementara, menunggu siklus berikutnya.');
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;
        const fresh: OrderRecord[] = data.orders || [];
        const prevIds = new Set(ordersRef.current.map((o) => o.id));
        const arrived = fresh.filter((o) => !prevIds.has(o.id) && isPaidRelevantOrder(o));
        setOrders(fresh);
        setSelectedQueueIds((prev) =>
          prev.filter((id) => fresh.some((o) => o.id === id && o.status === 'menunggu_konfirmasi'))
        );
        setLastUpdatedAt(new Date());
        if (arrived.length > 0) {
          setNewOrderNotice(`${arrived.length} pesanan baru masuk`);
        }
      } catch {
        // Abaikan galat sesaat; tick berikutnya mencoba lagi.
      }
    };
    const timer = setInterval(tick, 20000);
    return () => clearInterval(timer);
  }, [isAuthenticated, updatingOrderId, isBulkQueueing]);

  // Banner pesanan baru hilang sendiri setelah 20 detik.
  useEffect(() => {
    if (!newOrderNotice) return;
    const timer = setTimeout(() => setNewOrderNotice(null), 20000);
    return () => clearTimeout(timer);
  }, [newOrderNotice]);

  // Handle Toggle Min Order 50k Mode
  const handleToggleBundlingOnly = async () => {
    const nextValue = !isBundlingOnly;
    setIsUpdatingSettings(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_order_50k_mode: nextValue,
          bundling_only_mode: nextValue,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah pengaturan');
      }
      setIsBundlingOnly(nextValue);
      setSettingsNotification(
        nextValue
          ? 'Mode Minimal Pembelian 50k berhasil diaktifkan! Tersimpan.'
          : 'Mode Minimal Pembelian 50k dimatikan! Kembali normal. Tersimpan.'
      );
      setTimeout(() => {
        setSettingsNotification(null);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Handle Toggle Status Ketersediaan Brand (Stok Habis / Buka)
  const handleToggleBrandStatus = async (brandSlug: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUpdatingBrandSlug(brandSlug);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_slug: brandSlug,
          is_active: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status brand');
      }
      setBrandStatusMap((prev) => ({
        ...prev,
        [brandSlug]: nextStatus,
      }));
      setSettingsNotification(
        `Status brand ${brandSlug} berhasil diubah jadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`
      );
      setTimeout(() => setSettingsNotification(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Gagal mengubah status brand');
    } finally {
      setUpdatingBrandSlug(null);
    }
  };

  // Handle Ganti Status Override Operasional (Otomatis / Paksa Buka / Paksa Tutup)
  const handleChangeOperationalOverride = async (newOverride: OperationalOverride) => {
    if (newOverride === operationalOverride) return;
    setIsUpdatingOverride(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operational_override: newOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status operasional');
      }
      setOperationalOverrideState(newOverride);

      // Re-fetch operational status immediately agar status efektif langsung terbarui
      const opRes = await fetch('/api/operational-status');
      if (opRes.ok) {
        const opData = await opRes.json();
        setEffectiveStatus(opData);
      }

      const labelMap: Record<OperationalOverride, string> = {
        auto: 'Otomatis (mengikuti jadwal)',
        force_open: 'Paksa Buka (buka sekarang)',
        force_closed: 'Paksa Tutup (tutup sekarang)',
      };
      setOverrideNotification(`Status operasional berhasil diubah ke "${labelMap[newOverride]}". Tersimpan.`);
      setTimeout(() => {
        setOverrideNotification(null);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan status operasional');
    } finally {
      setIsUpdatingOverride(false);
    }
  };

  const getEffectiveStatusLabel = () => {
    if (operationalOverride === 'force_open') {
      return 'BUKA (manual)';
    }
    if (operationalOverride === 'force_closed') {
      return 'TUTUP (manual)';
    }

    if (!effectiveStatus) {
      return 'Memeriksa jadwal...';
    }

    if (effectiveStatus.isOpen) {
      if (effectiveStatus.isTentative) {
        return `BUKA (jadwal tentatif: hari ${effectiveStatus.dayName})`;
      }
      return `BUKA (jadwal: hari ${effectiveStatus.dayName})`;
    } else {
      return `TUTUP (jadwal: hari ${effectiveStatus.dayName})`;
    }
  };

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
      fetchSettings();
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
    const currentOrder = orders.find((o) => o.id === orderId);
    const confirmMessage =
      newStatus === 'diproses'
        ? currentOrder?.status === 'antrian'
          ? `Mulai proses order #${orderId}? Status akan berubah menjadi 'diproses'.`
          : `Konfirmasi pembayaran untuk order #${orderId}? Status akan berubah menjadi 'diproses'.`
        : newStatus === 'antrian'
          ? `Masukkan order #${orderId} ke antrian? Pembayaran dianggap terkonfirmasi dan pesanan menunggu giliran diproses.`
          : newStatus === 'selesai'
            ? `Tandai order #${orderId} selesai? Pesanan dianggap sudah jadi dan keluar dari hitungan antrean.`
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

  // --- Antrian massal: pilih banyak pesanan Perlu Dicek, konfirmasi sekali ---
  const toggleQueueSelection = (orderId: string) => {
    setSelectedQueueIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const waitingConfirmOrders = orders.filter((o) => o.status === 'menunggu_konfirmasi');
  const allWaitingSelected =
    waitingConfirmOrders.length > 0 &&
    waitingConfirmOrders.every((o) => selectedQueueIds.includes(o.id));

  const selectAllWaitingConfirm = () => {
    setSelectedQueueIds(waitingConfirmOrders.map((o) => o.id));
  };

  const handleBulkQueue = async () => {
    const ids = selectedQueueIds.filter(
      (id) => orders.find((o) => o.id === id)?.status === 'menunggu_konfirmasi'
    );
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Masukkan ${ids.length} pesanan ke antrian? Pembayaran dianggap terkonfirmasi dan pesanan menunggu giliran diproses.`
      )
    ) {
      return;
    }

    setIsBulkQueueing(true);
    const failed: string[] = [];
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'antrian' }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengubah status');
        }
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'antrian' as OrderStatus } : o))
        );
      } catch {
        failed.push(id);
      }
    }
    setIsBulkQueueing(false);
    setSelectedQueueIds(failed);
    if (failed.length > 0) {
      alert(`${failed.length} pesanan gagal dimasukkan ke antrian: ${failed.join(', ')}`);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return isPaidRelevantOrder(o);
    if (filterStatus === 'perlu_refund') return Boolean(o.needs_refund);
    return o.status === filterStatus;
  });

  const needsRefundCount = orders.filter((o) => o.needs_refund).length;
  const pendingConfirmationCount = orders.filter((o) => o.status === 'menunggu_konfirmasi').length;
  const activeBrandsCount = Object.values(brandStatusMap).filter(Boolean).length;

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
      <header className="sticky top-0 z-20 bg-[#FBF8F4]/95 backdrop-blur-md border-b-2 border-[#26150B]/10 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-base font-black text-[#26150B]">Panel Admin Jasdor</h1>
            <p className="text-[11px] text-[#7A6455] font-medium">Kelola pesanan dan kontrol operasional website</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Live
              {lastUpdatedAt && (
                <span className="font-normal text-[#7A6455]">
                  · {lastUpdatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                fetchOrders();
                fetchSettings();
              }}
              disabled={isLoadingOrders || isLoadingSettings}
              className="px-3 py-1.5 bg-white border border-[#E0D4C5] hover:bg-[#F2EBE1] text-[#26150B] text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              {isLoadingOrders || isLoadingSettings ? 'Memuat...' : 'Segarkan'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tab Navigasi Admin */}
        <nav aria-label="Menu Navigasi Admin" className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <button
            type="button"
            onClick={() => handleSelectTab('pesanan')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all border-2 cursor-pointer ${
              activeTab === 'pesanan'
                ? 'bg-[#26150B] text-[#FBBF24] border-[#26150B] shadow-[2px_2px_0px_#C67D0A]'
                : 'bg-white text-[#5A4537] border-[#E0D4C5] hover:bg-[#F2EBE1]'
            }`}
          >
            <span>📋 Pesanan</span>
            {pendingConfirmationCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  activeTab === 'pesanan'
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {pendingConfirmationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('operasional')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all border-2 cursor-pointer ${
              activeTab === 'operasional'
                ? 'bg-[#26150B] text-[#FBBF24] border-[#26150B] shadow-[2px_2px_0px_#C67D0A]'
                : 'bg-white text-[#5A4537] border-[#E0D4C5] hover:bg-[#F2EBE1]'
            }`}
          >
            <span>🕒 Status Operasional</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                operationalOverride === 'force_open'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : operationalOverride === 'force_closed'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {operationalOverride === 'force_open'
                ? 'Buka'
                : operationalOverride === 'force_closed'
                ? 'Tutup'
                : 'Otomatis'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('mode_minimal')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all border-2 cursor-pointer ${
              activeTab === 'mode_minimal'
                ? 'bg-[#26150B] text-[#FBBF24] border-[#26150B] shadow-[2px_2px_0px_#C67D0A]'
                : 'bg-white text-[#5A4537] border-[#E0D4C5] hover:bg-[#F2EBE1]'
            }`}
          >
            <span>🛍️ Mode Min 50k</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                isBundlingOnly
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
              }`}
            >
              {isBundlingOnly ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('brand')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all border-2 cursor-pointer ${
              activeTab === 'brand'
                ? 'bg-[#26150B] text-[#FBBF24] border-[#26150B] shadow-[2px_2px_0px_#C67D0A]'
                : 'bg-white text-[#5A4537] border-[#E0D4C5] hover:bg-[#F2EBE1]'
            }`}
          >
            <span>🏷️ Ketersediaan Brand</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-neutral-100 text-neutral-800 border border-neutral-300">
              {activeBrandsCount}/3 Aktif
            </span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Kontrol Status Operasional Website (Manual Override) */}
        {activeTab === 'operasional' && (
          <section aria-label="Status Operasional Website" className="bg-white rounded-2xl border-2 border-[#26150B] p-4 shadow-[3px_3px_0px_#26150B] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base shrink-0">🕒</span>
                <h2 className="text-xs font-black text-[#26150B] uppercase tracking-wider">
                  Status Operasional
                </h2>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    operationalOverride === 'force_open'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                      : operationalOverride === 'force_closed'
                      ? 'bg-rose-100 text-rose-950 border-rose-400'
                      : 'bg-amber-100 text-amber-950 border-amber-400'
                  }`}
                >
                  Mode: {operationalOverride === 'force_open' ? 'Paksa Buka' : operationalOverride === 'force_closed' ? 'Paksa Tutup' : 'Otomatis'}
                </span>
              </div>
              <div className="text-xs font-bold text-[#26150B] flex items-center gap-1.5 flex-wrap">
                <span className="text-[#7A6455] font-normal">Status Efektif:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                    (operationalOverride === 'force_open' || (operationalOverride === 'auto' && effectiveStatus?.isOpen))
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  Saat ini: {getEffectiveStatusLabel()}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6455] leading-relaxed pt-0.5">
                Pilihan <strong>Paksa Buka</strong> atau <strong>Paksa Tutup</strong> mengabaikan jadwal otomatis (sangat berguna untuk hari Selasa jika buka cuma 3-4 jam atau tutup total). Pilih <strong>Otomatis</strong> untuk mengikuti jadwal standar Jasdor (Jumat-Minggu 08:00-23:20 buka, Selasa tentatif, Senin/Rabu/Kamis tutup).
              </p>
            </div>
          </div>

          {/* 3 Tombol Pilihan Status Operasional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleChangeOperationalOverride('auto')}
              disabled={isLoadingSettings || isUpdatingOverride}
              className={`p-2.5 rounded-xl text-xs font-bold border-2 transition flex flex-col items-center justify-center text-center gap-0.5 ${
                operationalOverride === 'auto'
                  ? 'bg-[#26150B] text-[#FBBF24] border-[#26150B] shadow-[2px_2px_0px_#C67D0A]'
                  : 'bg-[#FAF4E8] text-[#26150B] border-[#E3D6C5] hover:bg-[#F2E8D8]'
              } disabled:opacity-50`}
            >
              <span className="font-black text-xs">Otomatis</span>
              <span className="text-[10px] opacity-80 font-medium">Ikuti jadwal resmi</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeOperationalOverride('force_open')}
              disabled={isLoadingSettings || isUpdatingOverride}
              className={`p-2.5 rounded-xl text-xs font-bold border-2 transition flex flex-col items-center justify-center text-center gap-0.5 ${
                operationalOverride === 'force_open'
                  ? 'bg-emerald-700 text-white border-emerald-900 shadow-[2px_2px_0px_#064E3B]'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              } disabled:opacity-50`}
            >
              <span className="font-black text-xs">Paksa Buka</span>
              <span className="text-[10px] opacity-80 font-medium">Buka abaikan jadwal</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeOperationalOverride('force_closed')}
              disabled={isLoadingSettings || isUpdatingOverride}
              className={`p-2.5 rounded-xl text-xs font-bold border-2 transition flex flex-col items-center justify-center text-center gap-0.5 ${
                operationalOverride === 'force_closed'
                  ? 'bg-rose-700 text-white border-rose-900 shadow-[2px_2px_0px_#881337]'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              } disabled:opacity-50`}
            >
              <span className="font-black text-xs">Paksa Tutup</span>
              <span className="text-[10px] opacity-80 font-medium">Tutup abaikan jadwal</span>
            </button>
          </div>

          {overrideNotification && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
              <span>✅</span>
              <span>{overrideNotification}</span>
            </div>
          )}
        </section>
        )}

        {/* Kontrol Mode Minimal Pembelian 50k */}
        {activeTab === 'mode_minimal' && (
          <section aria-label="Pengaturan Mode Minimal Pembelian 50k" className="bg-white rounded-2xl border-2 border-[#26150B] p-4 shadow-[3px_3px_0px_#26150B] space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base shrink-0">🛍️</span>
                  <h2 className="text-xs font-black text-[#26150B] uppercase tracking-wider">
                    Mode Minimal Pembelian 50k
                  </h2>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      isBundlingOnly
                        ? 'bg-amber-100 text-amber-950 border-amber-400'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {isBundlingOnly ? 'ON (Min 50k - Max 60k)' : 'OFF (Normal)'}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6455] leading-relaxed">
                  Saat <strong>ON</strong>, menu reguler dibuka kembali dengan batas total harga normal menu reguler Rp50.000 - Rp60.000 (pre-diskon). Paket bundling tetap aktif sesuai kuota per-paket. Efek aktif dalam 1-2 menit.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleBundlingOnly}
                  disabled={isLoadingSettings || isUpdatingSettings}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs min-h-[38px] ${
                    isBundlingOnly
                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-2 border-rose-300'
                      : 'bg-[#26150B] text-[#FBBF24] hover:bg-[#3D2313]'
                  } disabled:opacity-50`}
                >
                  {isUpdatingSettings ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : isBundlingOnly ? (
                    <span>Matikan Mode Min 50k (Kembali Bebas)</span>
                  ) : (
                    <span>Aktifkan Mode Minimal Pembelian 50k</span>
                  )}
                </button>
              </div>
            </div>

            {settingsNotification && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
                <span>✅</span>
                <span>{settingsNotification}</span>
              </div>
            )}
          </section>
        )}

        {/* Kontrol Ketersediaan Brand (Stok Habis / Buka) */}
        {activeTab === 'brand' && (
          <section aria-label="Kontrol Ketersediaan Brand" className="bg-white rounded-2xl border-2 border-[#26150B] p-4 shadow-[3px_3px_0px_#26150B] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base shrink-0">🏷️</span>
                <h2 className="text-xs font-black text-[#26150B] uppercase tracking-wider">
                  Kontrol Ketersediaan Brand (Stok)
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-800 border-neutral-300">
                  {Object.values(brandStatusMap).filter(Boolean).length} / 3 Brand Aktif
                </span>
              </div>
              <p className="text-[11px] text-[#7A6455] leading-relaxed">
                Matikan brand tertentu jika stok voucher/promo habis, sehingga website tetap bisa dibuka untuk brand lain yang masih ready.
              </p>
            </div>
          </div>

          {/* 3 Brand Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {[
              {
                slug: 'kopi-kenangan',
                name: 'Kopi Kenangan',
                badgeText: 'Diskon 50%',
              },
              {
                slug: 'fore',
                name: 'Fore Coffee',
                badgeText: 'Fore Menu',
              },
              {
                slug: 'tomoro',
                name: 'TOMORO Coffee',
                badgeText: 'Diskon 50% + B1G1',
              },
            ].map((b) => {
              const isActive = brandStatusMap[b.slug] ?? true;
              const isUpdating = updatingBrandSlug === b.slug;

              return (
                <div
                  key={b.slug}
                  className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-3 transition ${
                    isActive
                      ? 'bg-[#FAF4E8] border-[#26150B] shadow-[2px_2px_0px_#26150B]'
                      : 'bg-rose-50/60 border-rose-300 opacity-90'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-xs text-[#26150B] leading-tight">
                        {b.name}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isActive ? 'Buka (Aktif)' : 'Mati (Stok Habis)'}
                      </span>
                    </div>
                    <span className="inline-block text-[10px] text-[#7A6455] font-semibold">
                      {b.badgeText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBrandStatus(b.slug, isActive)}
                    disabled={isLoadingSettings || isUpdating}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 border shadow-2xs ${
                      isActive
                        ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 active:bg-rose-200'
                        : 'bg-emerald-700 text-white border-emerald-900 hover:bg-emerald-800 active:bg-emerald-900'
                    } disabled:opacity-50`}
                  >
                    {isUpdating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : isActive ? (
                      <span>Matikan (Stok Habis)</span>
                    ) : (
                      <span>Nyalakan (Ready)</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Kontrol dan Daftar Pesanan (Halaman Utama / Page 1) */}
        {activeTab === 'pesanan' && (
          <>
            {/* Filter Tab Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `Sudah Bayar (${orders.filter(isPaidRelevantOrder).length})` },
            {
              id: 'perlu_refund',
              label: `⚠️ Perlu Refund (${needsRefundCount})`,
              badge: needsRefundCount > 0,
              isAlert: true,
            },
            {
              id: 'menunggu_konfirmasi',
              label: `Perlu Dicek (${orders.filter((o) => o.status === 'menunggu_konfirmasi').length})`,
              badge: true,
            },
            {
              id: 'antrian',
              label: `Antrian (${orders.filter((o) => o.status === 'antrian').length})`,
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
              id: 'selesai',
              label: `Selesai (${orders.filter((o) => o.status === 'selesai').length})`,
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
              className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                filterStatus === tab.id
                  ? (tab as any).isAlert
                    ? 'bg-[#DC2626] text-white font-bold shadow-xs'
                    : 'bg-[#26150B] text-[#FBBF24] font-bold shadow-2xs'
                  : (tab as any).isAlert && needsRefundCount > 0
                  ? 'bg-rose-50 border-2 border-rose-400 text-rose-800 font-bold hover:bg-rose-100'
                  : 'bg-white border border-[#E0D4C5] text-[#5A4537] hover:bg-[#F2EBE1]'
              } ${tab.badge && filterStatus !== tab.id && !(tab as any).isAlert ? 'border-amber-300 bg-amber-50/50' : ''}`}
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

        {newOrderNotice && (
          <button
            type="button"
            onClick={() => {
              setNewOrderNotice(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            🔔 {newOrderNotice} - ketuk untuk melihat
          </button>
        )}

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE5D8] text-center space-y-1">
            <p className="font-semibold text-sm text-[#26150B]">Tidak ada pesanan ditemukan</p>
            <p className="text-xs text-[#8C7667]">
              {filterStatus === 'all'
                ? 'Belum ada pesanan yang sudah dibayar.'
                : 'Tidak ada pesanan untuk filter status ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isUpdating = updatingOrderId === order.id;
              const breakdown = getOrderBreakdown(order.items, order.fee);

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
                        {order.status === 'menunggu_konfirmasi' && (
                          <input
                            type="checkbox"
                            aria-label={`Pilih order ${order.id} untuk antrian`}
                            checked={selectedQueueIds.includes(order.id)}
                            onChange={() => toggleQueueSelection(order.id)}
                            className="w-[18px] h-[18px] shrink-0 cursor-pointer accent-[#4338CA]"
                          />
                        )}
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
                      {order.status === 'antrian' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Antrian
                        </span>
                      )}
                      {order.status === 'diproses' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Diproses
                        </span>
                      )}
                      {order.status === 'selesai' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600 text-white border border-emerald-700">
                          Selesai
                        </span>
                      )}
                      {order.status === 'kedaluwarsa' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          Kedaluwarsa
                        </span>
                      )}
                      {order.status === 'dibatalkan' && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Dibatalkan
                          </span>
                          {order.needs_refund && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DC2626] text-white animate-pulse">
                              <span>⚠️ Perlu Refund</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banner Wajib Refund Manual Jika Order Dibatalkan Setelah Bayar */}
                  {order.needs_refund && (
                    <div className="bg-[#FFEBEB] border-2 border-[#DC2626] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shadow-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0">⚠️</span>
                        <div>
                          <p className="font-display font-black text-xs text-[#DC2626] uppercase tracking-wide">
                            PERLU REFUND MANUAL (Batal Setelah Bayar)
                          </p>
                          <p className="text-[11px] text-[#2B1D12] mt-0.5 leading-snug font-medium">
                            Customer sudah konfirmasi bayar (Menunggu Konfirmasi) tapi pesanan dibatalkan. Segera hubungi customer untuk refund manual via WhatsApp.
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${order.customer_wa}?text=${encodeURIComponent(
                          `Halo kak ${order.customer_name}, terkait pesanan #${order.id} di Jasdor sebesar ${formatRupiah(order.total)} yang terbatalkan karena melewati batas hari operasional, kami ingin memproses pengembalian dana (refund). Mohon infokan nomor rekening atau e-wallet (BCA/Mandiri/GoPay/OVO/Dana) beserta nama pemilik rekening untuk transfer refund.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                      >
                        <span>Chat Refund WA ↗</span>
                      </a>
                    </div>
                  )}

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

                    <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EFE5D8] space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <p className="font-bold text-[#26150B] text-[11px] uppercase tracking-wide">
                          Total & Item:
                        </p>
                        <p className="text-base font-display font-black text-[#DC2626]">
                          {formatRupiah(order.total)}
                        </p>
                      </div>
                      <div className="text-[11px] text-[#5A4537] space-y-0.5 pt-0.5 border-b border-[#E8DEC8] pb-1.5">
                        {order.items.map((it, idx) => (
                          <p key={idx} className="truncate">
                            {it.quantity}x {it.name}
                          </p>
                        ))}
                      </div>
                      <div className="text-[10px] text-[#735F52] space-y-0.5 pt-0.5">
                        {breakdown.bundleQuantity > 0 && (
                          <div className="flex justify-between">
                            <span>Sub Total Bundling ({breakdown.bundleQuantity} item):</span>
                            <span className="font-semibold text-[#26150B]">{formatRupiah(breakdown.bundleSubtotal)}</span>
                          </div>
                        )}
                        {breakdown.regularQuantity > 0 && (
                          <div className="flex justify-between">
                            <span>Sub Total Normal ({breakdown.regularQuantity} item):</span>
                            <span className="font-semibold text-[#26150B]">{formatRupiah(breakdown.regularSubtotal)}</span>
                          </div>
                        )}
                        {breakdown.bundleFee > 0 && (
                          <div className="flex justify-between">
                            <span>Biaya Jasa Bundling:</span>
                            <span className="font-semibold text-[#26150B]">{formatRupiah(breakdown.bundleFee)}</span>
                          </div>
                        )}
                        {breakdown.regularFee > 0 && (
                          <div className="flex justify-between">
                            <span>Biaya Jasa Normal:</span>
                            <span className="font-semibold text-[#26150B]">{formatRupiah(breakdown.regularFee)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alasan Pembatalan Jika Ada */}
                  {order.cancellation_reason && (
                    <div className="text-[11px] text-[#5A4537] bg-[#F4EFE6] px-3 py-1.5 rounded-xl border border-[#E0D4C5]">
                      <span className="font-bold text-[#26150B]">Alasan Pembatalan: </span>
                      <span>{order.cancellation_reason}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {order.status === 'menunggu_konfirmasi' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'antrian')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {isUpdating ? 'Memproses...' : 'Antri'}
                      </button>
                    )}
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

                    {/* Tombol Selesai hanya muncul untuk pesanan yang sedang Diproses */}
                    {order.status === 'diproses' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'selesai')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUpdating ? (
                          'Memproses...'
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Selesai</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Tombol Proses hanya muncul untuk pesanan yang sudah masuk Antrian */}
                    {order.status === 'antrian' && (
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
                            <span>Mulai Proses</span>
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

        {/* Bar Aksi Antrian Massal */}
        {(selectedQueueIds.length > 0 ||
          (filterStatus === 'menunggu_konfirmasi' && waitingConfirmOrders.length > 0)) && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl bg-[#26150B] text-white rounded-2xl shadow-[4px_4px_0px_rgba(38,21,11,0.35)] border-2 border-[#26150B] px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold mr-1">
              {selectedQueueIds.length} pesanan dipilih
            </span>
            {!allWaitingSelected && waitingConfirmOrders.length > 0 && (
              <button
                type="button"
                onClick={selectAllWaitingConfirm}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-[11px] font-semibold rounded-lg transition"
              >
                Pilih Semua Perlu Dicek ({waitingConfirmOrders.length})
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {selectedQueueIds.length > 0 && (
                <button
                  type="button"
                  disabled={isBulkQueueing}
                  onClick={() => setSelectedQueueIds([])}
                  className="px-3 py-1.5 bg-transparent hover:bg-white/10 text-white/80 text-[11px] font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                disabled={isBulkQueueing || selectedQueueIds.length === 0}
                onClick={handleBulkQueue}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black rounded-xl transition disabled:opacity-40"
              >
                {isBulkQueueing
                  ? 'Memasukkan...'
                  : `Masukkan ke Antrian (${selectedQueueIds.length})`}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
