import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { MyOrdersView } from '@/components/MyOrdersView';

export const metadata: Metadata = {
  title: 'Pesanan Saya | Jasdor',
  description: 'Daftar pesanan aktif dan riwayat layanan jasa order di Jasdor.',
};

export default function PesananSayaPage() {
  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col">
      <Header
        showBack={true}
        backHref="/"
        backLabel="Kembali ke Beranda"
        title="Pesanan Saya"
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4">
        <MyOrdersView />
      </main>
    </div>
  );
}
