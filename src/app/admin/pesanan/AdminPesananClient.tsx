'use client';

import dynamic from 'next/dynamic';

// Panel admin dirender sepenuhnya di browser (tanpa SSR) supaya Worker
// Cloudflare tidak perlu merender 982 baris panel + seluruh komponennya di
// server. Ini mencegah Error 1102 (Worker exceeded resource limits) yang
// sesekali muncul di /admin/pesanan pada paket gratis: halaman admin memang
// 100% komponen client (data diambil lewat fetch dari browser), jadi tidak
// ada yang hilang dengan menonaktifkan SSR di sini.
const AdminPesananPanel = dynamic(() => import('./AdminPesananPanel'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-[#26150B] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function AdminPesananClient() {
  return <AdminPesananPanel />;
}
