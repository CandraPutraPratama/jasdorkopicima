import type { Metadata } from 'next';
import { TestimoniGalleryView } from '@/components/TestimoniGalleryView';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Testimoni Pelanggan - Bukti Nyata Jasa Order Jasdor',
  description:
    'Galeri testimoni pelanggan setia jasa order Jasdor: screenshot chat pemesanan dan bukti transaksi asli dari pelanggan.',
};

export default function TestimoniPage() {
  return <TestimoniGalleryView />;
}
