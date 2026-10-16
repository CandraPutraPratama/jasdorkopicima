export interface TestimonialItem {
  id: string;
  name: string;
  brand: string;
  quote: string;
  savings?: string;
  date?: string;
  rating?: number;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    name: 'Dimas R.',
    brand: 'Kopi Kenangan',
    quote: 'Pesen 4 cup Kopi Kenangan Mantan buat anak kantor, bayar setengah harga. Admin fast respon banget!',
    savings: 'Hemat Rp42.000',
    date: 'Maret 2026',
    rating: 5,
  },
  {
    id: 'testi-2',
    name: 'Sarah P.',
    brand: 'Kopi Kenangan',
    quote: 'Format pesanannya gampang, tinggal klik WA. Langsung ambil di outlet tanpa ribet antre.',
    savings: 'Hemat Rp28.000',
    date: 'April 2026',
    rating: 5,
  },
  {
    id: 'testi-3',
    name: 'Andi K.',
    brand: 'Fore Coffee',
    quote: 'Langganan tiap weekend jajan kopi hemat. QRIS tanpa admin, super praktis!',
    savings: 'Hemat 50%',
    date: 'April 2026',
    rating: 5,
  },
];
