/**
 * Data Menu Otoritatif TOMORO Coffee (Jasdor)
 *
 * KRITERIA MUTLAK:
 * - HANYA 39 menu final yang diizinkan (docs/tomoro-menu-promo-b1g1-final.json).
 * - Ke-36 menu lain di cache (semua FOOD, 1L, bundle, Master S.O.E, Triple Pistachio, Healing, Frappe)
 *   TIDAK dijual di Jasdor dan server wajib menolaknya.
 * - Flat menu dengan override tier bandara (Palembang: tomoro-plb03b-m, tomoro-plb03d-m; Dhoho: tomoro-ked01a-m).
 * - Deskripsi dari cache apa adanya (Kopi Susu Aren & Peach Oolong Milk Tea kosong).
  */

import type { MenuGroup, Product } from '../types/domain.ts';

export const TOMORO_AIRPORT_PALEMBANG_OUTLET_CODES = new Set<string>([
  'tomoro-plb03b-m', // Bandara SMB II Palembang Gate 3
  'tomoro-plb03d-m', // Landside Bandara Palembang
]);

export const TOMORO_AIRPORT_DHOHO_OUTLET_CODES = new Set<string>([
  'tomoro-ked01a-m', // Bandara Dhoho Kediri
]);

export function getTomoroAirportTier(outletCode?: string | null): 'palembang' | 'dhoho' | 'national' {
  if (!outletCode) return 'national';
  const norm = outletCode.trim().toLowerCase();
  if (TOMORO_AIRPORT_PALEMBANG_OUTLET_CODES.has(norm)) return 'palembang';
  if (TOMORO_AIRPORT_DHOHO_OUTLET_CODES.has(norm)) return 'dhoho';
  return 'national';
}

export interface TomoroProductItem {
  id: string;
  productCode: string;
  name: string;
  category: string;
  image: string;
  description: string;
  isSoldOut: boolean;
  isCombo: boolean;
  bundleCode: string;
  hargaNasional: number;
  hargaPalembang: number;
  hargaDhoho: number;
}

export const TOMORO_FINAL_PRODUCTS: TomoroProductItem[] = [
  {
    "id": "I016",
    "productCode": "1350005",
    "name": "Matcha Latte",
    "category": "MATCHA SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/matcha-latte.webp",
    "description": "Kombinasi premium matcha yang wangi dan susu segar.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 27000,
    "hargaPalembang": 38000,
    "hargaDhoho": 34000
  },
  {
    "id": "I132",
    "productCode": "1350026",
    "name": "Matcha Oat Latte",
    "category": "MATCHA SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/matcha-oat-latte.webp",
    "description": "Susu oat yang luar biasa enak dengan cita rasa matcha yang khas, lahirlah matcha oat latte nya TOMORO.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 28000,
    "hargaPalembang": 38000,
    "hargaDhoho": 36000
  },
  {
    "id": "I01432",
    "productCode": "1100321",
    "name": "Sea Salt Cloud Matcha Latte",
    "category": "MATCHA SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/sea-salt-cloud-matcha-latte.webp",
    "description": "Perpaduan Matcha dan Susu dengan tambahan sea salt cloud foam diatasnya",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 45000,
    "hargaDhoho": 38000
  },
  {
    "id": "I01505",
    "productCode": "1100326",
    "name": "Matcha Jasmine Milk Tea",
    "category": "MATCHA SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/matcha-jasmine-milk-tea.webp",
    "description": "[CHARACTER CUP AKAN DIBERIKAN SELAMA PERSEDIAAN MASIH ADA] Perpaduan antara matcha aromatik dan teh melati yang lembut, dipadukan dengan susu creamy untuk menciptakan harmoni yang halus dan menyegarkan. Floral, segar, dan menenangkan di setiap tegukan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 28000,
    "hargaPalembang": 38000,
    "hargaDhoho": 34000
  },
  {
    "id": "I01413",
    "productCode": "1100317",
    "name": "Strawberry Matcha Latte",
    "category": "MATCHA SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/strawberry-matcha-latte.webp",
    "description": "Harmoni tiga bahan pilihan, stroberi segar, matcha premium, dan susu lembut, hadir dalam satu minuman berlapis yang menyegarkan, lembut, dan menyenangkan, cocok untuk suasana apapun.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 36000,
    "hargaPalembang": 45000,
    "hargaDhoho": 39000
  },
  {
    "id": "I221",
    "productCode": "1100069",
    "name": "TOMORO Aren Latte",
    "category": "TOMORO SIGNATURE",
    "image": "https://gambar.cimagroup.my.id/tomoro/tomoro-aren-latte.webp",
    "description": "Kopi susu favorit kita hanya menggunakan 100% kopi arabika, gula aren lokal dan susu segar. Sudah pasti favorit semua orang.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 21000,
    "hargaPalembang": 40000,
    "hargaDhoho": 26000
  },
  {
    "id": "I675",
    "productCode": "1100151",
    "name": "Sea Salt Cloud Caramel Macchiato",
    "category": "TOMORO SIGNATURE",
    "image": "https://gambar.cimagroup.my.id/tomoro/sea-salt-cloud-caramel-macchiato.webp",
    "description": "Perpaduan espresso, susu dan sirup caramel dengan tambahan vanilla cloud foam diatasnya",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 45000,
    "hargaDhoho": 38000
  },
  {
    "id": "I130",
    "productCode": "1100057",
    "name": "TOMORO Oat Latte",
    "category": "TOMORO SIGNATURE",
    "image": "https://gambar.cimagroup.my.id/tomoro/tomoro-oat-latte.webp",
    "description": "Minuman nge-hits kita, kini hadir dengan 'susu' oat yang sehat. Dijamin langsung jatuh cinta pada tegukan pertama. Percaya dehh!",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 38000,
    "hargaDhoho": 30000
  },
  {
    "id": "I749",
    "productCode": "1350073",
    "name": "Cheese Cloud Chocolate",
    "category": "TOMORO SIGNATURE",
    "image": "https://gambar.cimagroup.my.id/tomoro/cheese-cloud-chocolate.webp",
    "description": "Perpaduan antara TOMORO premium coklat, susu yang creamy, dan cheese cloud foam yang manis gurih dan lembut",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 40000,
    "hargaDhoho": 34000
  },
  {
    "id": "I003",
    "productCode": "1100041",
    "name": "Caffe Latte",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/caffe-latte.webp",
    "description": "\"Latte\" di Italia berarti susu. Campuran antara kopi dan susu yang seimbang dengan busa susu yang tipis dan lembut di atasnya.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 38000,
    "hargaDhoho": 30000
  },
  {
    "id": "I002",
    "productCode": "1100031",
    "name": "Caffe Americano",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/caffe-americano.webp",
    "description": "Rasa espresso yang kaya di tuangkan ke air panas, mempertahankan crema kopi sempurna di cangkir dengan cita rasa cokelat hazelnut dan gula merah.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 18000,
    "hargaPalembang": 30000,
    "hargaDhoho": 23000
  },
  {
    "id": "I686",
    "productCode": "1100153",
    "name": "Kopi Susu Aren",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/kopi-susu-aren.webp",
    "description": "",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 19000,
    "hargaPalembang": 35000,
    "hargaDhoho": 24000
  },
  {
    "id": "I005",
    "productCode": "1100011",
    "name": "Caffe Mocha",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/caffe-mocha.webp",
    "description": "Espresso dan cokelat ganache yang di kombinasi dengan susu hangat yang lembut.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 26000,
    "hargaPalembang": 40000,
    "hargaDhoho": 32000
  },
  {
    "id": "I004",
    "productCode": "1100037",
    "name": "Cappuccino",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/cappuccino.webp",
    "description": "Cappuccino membutuhkan keterampilan dari barista terbaik, perpaduan espresso yang sempurna dengan susu dan busa susu yang lebih tebal.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 38000,
    "hargaDhoho": 30000
  },
  {
    "id": "I010",
    "productCode": "1100049",
    "name": "Breve Latte",
    "category": "CLASSIC COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/breve-latte.webp",
    "description": "Kami menggunakan half&half untuk membuat minuman kopi susu yang lembut dan lebih kental.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 32000,
    "hargaPalembang": 42000,
    "hargaDhoho": 38000
  },
  {
    "id": "I011",
    "productCode": "1100009",
    "name": "Caramel Macchiato",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/caramel-macchiato.webp",
    "description": "Espresso yang kaya dicampurkan dengan sirup karamel sebelum ditambahkan ke dalam susu yang lembut.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 27000,
    "hargaPalembang": 38000,
    "hargaDhoho": 33000
  },
  {
    "id": "I710",
    "productCode": "1100161",
    "name": "Caramel Cheese Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/caramel-cheese-latte.webp",
    "description": "[CHARACTER CUP NAILOONG AKAN DIBERIKAN SELAMA PERSEDIAAN MASIH ADA] Perpaduan antara TOMORO Blend Espresso, sirup caramel dan cheese milk yang creamy dan gurih",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 40000,
    "hargaDhoho": 34000
  },
  {
    "id": "I642",
    "productCode": "1100118",
    "name": "Spanish Aren Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/spanish-aren-latte.webp",
    "description": "Perpaduan antara TOMORO Blend espresso, susu yang creamy dengan rasa manis dan sirup gula aren pada setiap tegukan",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 26000,
    "hargaPalembang": 38000,
    "hargaDhoho": 33000
  },
  {
    "id": "I219",
    "productCode": "1100065",
    "name": "Coconut Aren Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/coconut-aren-latte.webp",
    "description": "#SeruputBuatHealing A perfect blend of 100% Real Coconut Milk, Aren Syrup and Espresso from TOMORO Blend, create a sweet and creamy drinks.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 38000,
    "hargaDhoho": 30000
  },
  {
    "id": "I748",
    "productCode": "1100187",
    "name": "Cheese Cloud Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/cheese-cloud-latte.webp",
    "description": "[CHARACTER CUP NAILOONG AKAN DIBERIKAN SELAMA PERSEDIAAN MASIH ADA] Perpaduan antara TOMORO Blend Espresso, susu yang creamy, dan cheese cloud foam yang manis gurih dan lembut",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 40000,
    "hargaDhoho": 34000
  },
  {
    "id": "I641",
    "productCode": "1100117",
    "name": "Spanish Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/spanish-latte.webp",
    "description": "Perpaduan antara TOMORO Blend espresso dan susu yang creamy dengan rasa manis pada setiap tegukan",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 36000,
    "hargaDhoho": 32000
  },
  {
    "id": "I218",
    "productCode": "1100061",
    "name": "TOMORO Coconut Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/tomoro-coconut-latte.webp",
    "description": "#SeruputBuatHealing Coconut Latte Asli & Pertama di INDONESIA. Perpaduan 100% susu kelapa asli dan espresso dari TOMORO Blend menjadikan minuman ini lebih creamy & smooth.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 23000,
    "hargaPalembang": 38000,
    "hargaDhoho": 28000
  },
  {
    "id": "I065",
    "productCode": "1100053",
    "name": "Manuka Oat Latte",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/manuka-oat-latte.webp",
    "description": "Perpaduan madu manuka dengan susu oat yang sehat, menjadikan minuman ini cocok buat kalian yang sedang menjalankan hidup sehat",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 40000,
    "hargaDhoho": 38000
  },
  {
    "id": "I644",
    "productCode": "1100138",
    "name": "Spanish Aren Latte (Limited Edition Cup)",
    "category": "FLAVORED LATTE",
    "image": "https://gambar.cimagroup.my.id/tomoro/spanish-aren-latte-limited-edition-cup.webp",
    "description": "Perpaduan antara TOMORO Blend espresso, susu yang creamy dengan rasa manis dan sirup gula aren pada setiap tegukan",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 26000,
    "hargaPalembang": 38000,
    "hargaDhoho": 33000
  },
  {
    "id": "I00581",
    "productCode": "1100269",
    "name": "Dino-mite Mango Frappe ",
    "category": "CHEESE X NAILOONG SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/dino-mite-mango-frappe.webp",
    "description": "[CHARACTER CUP NAILOONG AKAN DIBERIKAN SELAMA PERSEDIAAN MASIH ADA] Perpaduan menyegarkan dan creamy dari mangga dan keju yang creamy menghadirkan pengalaman rasa manis dan gurih yang unik dan berkesan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 28000,
    "hargaPalembang": 38000,
    "hargaDhoho": 32000
  },
  {
    "id": "I00580",
    "productCode": "1100267",
    "name": "Dino-mite Cloud Tea",
    "category": "CHEESE X NAILOONG SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/dino-mite-cloud-tea.webp",
    "description": "[CHARACTER CUP NAILOONG AKAN DIBERIKAN SELAMA PERSEDIAAN MASIH ADA] Teh rasa buah mangga segar yang dipadukan dengan topping cheese cloud yang lembut, gurih dan creamy. Perpaduan lezat ini menggabungkan manisnya mangga khas buah tropis dengan cheese cloud yang lembut dan gurih, menghasilkan keseimbangan rasa yang sempurna.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 26000,
    "hargaPalembang": 38000,
    "hargaDhoho": 32000
  },
  {
    "id": "I01151",
    "productCode": "1100292",
    "name": "Strawberry Americano",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/strawberry-americano.webp",
    "description": "Perpaduan antara espresso dari TOMORO Blend dan Strawberry Purée asli, menghasilkan rasa manis yang menyegarkan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 23000,
    "hargaPalembang": 36000,
    "hargaDhoho": 30000
  },
  {
    "id": "I333",
    "productCode": "1350038",
    "name": "Strawberry Jasmine Tea",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/strawberry-jasmine-tea.webp",
    "description": "Perpaduan sempurna dari rasa manis dari Strawberry Purée Asli dan wangi dari Jasmine Green Tea, menghasilkan rasa yang menyegarkan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 23000,
    "hargaPalembang": 36000,
    "hargaDhoho": 27000
  },
  {
    "id": "I726",
    "productCode": "1100169",
    "name": "Peach Americano",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/peach-americano.webp",
    "description": "Perpaduan antara espresso dari TOMORO Blend dan Peach Purée asli, menghasilkan rasa manis yang menyegarkan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 23000,
    "hargaPalembang": 36000,
    "hargaDhoho": 30000
  },
  {
    "id": "I728",
    "productCode": "1350065",
    "name": "Peach Jasmine Tea",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/peach-jasmine-tea.webp",
    "description": "Perpaduan sempurna dari rasa manis dari Peach Purée Asli dan wangi dari Jasmine Green Tea, menghasilkan rasa yang menyegarkan.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 23000,
    "hargaPalembang": 38000,
    "hargaDhoho": 32000
  },
  {
    "id": "I298",
    "productCode": "1100075",
    "name": "Lemonade Americano",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/lemonade-americano.webp",
    "description": "Ekstrak lemon dicampur dengan Cafe Americano, memberikan sensasi rasa yang sangat berbeda. Sangat menyegarkan dan cocok untuk pelepas dahaga",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 22000,
    "hargaPalembang": 35000,
    "hargaDhoho": 25000
  },
  {
    "id": "I119",
    "productCode": "1350021",
    "name": "Pink Pop Lemonade",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/pink-pop-lemonade.webp",
    "description": "Perpaduan rasa lemon yang segar ditambahkan rasa manis, and it's pink!",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 15000,
    "hargaPalembang": 32000,
    "hargaDhoho": 18000
  },
  {
    "id": "I120",
    "productCode": "1350020",
    "name": "Pink Pop Lemon Tea",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/pink-pop-lemon-tea.webp",
    "description": "Perpaduan antara rasa asam manis dari lemon dan juga teh melati",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 19000,
    "hargaPalembang": 32000,
    "hargaDhoho": 22000
  },
  {
    "id": "I297",
    "productCode": "1100073",
    "name": "Grapefruit Americano",
    "category": "REFRESHING SERIES",
    "image": "https://gambar.cimagroup.my.id/tomoro/grapefruit-americano.webp",
    "description": "Perpaduan wangi grapefruit yang khas dengan aroma TOMORO Cafe Americano, menciptakan kombinasi yang sempurna dan pilihan yang tepat untuk musim panas",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 22000,
    "hargaPalembang": 35000,
    "hargaDhoho": 25000
  },
  {
    "id": "I601",
    "productCode": "1350050",
    "name": "Sea Salt Cloud Chocolate",
    "category": "NON COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/sea-salt-cloud-chocolate.webp",
    "description": "Perpaduan coklat premium dan susu dengan sea salt cloud foam diatasnya",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 42000,
    "hargaDhoho": 35000
  },
  {
    "id": "I066",
    "productCode": "1350009",
    "name": "Hojicha Oat Latte",
    "category": "NON COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/hojicha-oat-latte.webp",
    "description": "Perpaduan rasa manis dengan teknik pemanggangan dari hojicha menghasilkan wangi yang khas, berbalut dengan tekstur creamy dari susu oat yang sehat. Cocok buat kalian yang menyukai rasa manis",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 30000,
    "hargaPalembang": 42000,
    "hargaDhoho": 38000
  },
  {
    "id": "I015",
    "productCode": "1350001",
    "name": "Chocolate",
    "category": "NON COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/chocolate.webp",
    "description": "Kombinasi cokelat premium dan susu segar, menghasilkan rasa yang kaya dan lembut.",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 25000,
    "hargaPalembang": 40000,
    "hargaDhoho": 31000
  },
  {
    "id": "I131",
    "productCode": "1350022",
    "name": "Choco Oat Latte",
    "category": "NON COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/choco-oat-latte.webp",
    "description": "Coklat dan susu oat, sudah pasti tidak akan salah buat kamu. Pilihan yang tepat sekali untuk keseharianmu!",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 28000,
    "hargaPalembang": 38000,
    "hargaDhoho": 36000
  },
  {
    "id": "I00745",
    "productCode": "1100281",
    "name": "Peach Oolong Milk Tea",
    "category": "NON COFFEE",
    "image": "https://gambar.cimagroup.my.id/tomoro/peach-oolong-milk-tea.webp",
    "description": "",
    "isSoldOut": false,
    "isCombo": false,
    "bundleCode": "",
    "hargaNasional": 20000,
    "hargaPalembang": 35000,
    "hargaDhoho": 22000
  }
];

export const TOMORO_FINAL_PRODUCT_IDS = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.id)
);

export const TOMORO_FINAL_PRODUCT_NAMES = new Set<string>(
  TOMORO_FINAL_PRODUCTS.map((p) => p.name.trim().toLowerCase())
);

/** Peta lookup cepat berdasarkan ID dan nama lowercase */
export const TOMORO_PRODUCT_MAP = new Map<string, TomoroProductItem>();
TOMORO_FINAL_PRODUCTS.forEach((p) => {
  TOMORO_PRODUCT_MAP.set(p.id, p);
  TOMORO_PRODUCT_MAP.set(p.name.trim().toLowerCase(), p);
  if (p.productCode) {
    TOMORO_PRODUCT_MAP.set(p.productCode, p);
  }
});

/**
 * Memeriksa apakah suatu menu termasuk dalam 39 menu final yang diizinkan untuk brand TOMORO Coffee.
 */
export function isTomoroItemEligible(idOrNameOrCode: string): boolean {
  if (!idOrNameOrCode) return false;
  const clean = idOrNameOrCode.trim();
  const lower = clean.toLowerCase();
  return (
    TOMORO_PRODUCT_MAP.has(clean) ||
    TOMORO_PRODUCT_MAP.has(lower) ||
    TOMORO_FINAL_PRODUCT_IDS.has(clean) ||
    TOMORO_FINAL_PRODUCT_NAMES.has(lower)
  );
}

/**
 * Mengambil harga normal (pre-promo) menu Tomoro untuk outlet tertentu (memperhitungkan tier bandara).
 * Mengembalikan null jika menu tidak termasuk dalam 39 menu final yang diizinkan.
 */
export function getTomoroProductNormalPrice(
  idOrNameOrCode: string,
  outletCode?: string | null
): number | null {
  if (!idOrNameOrCode) return null;
  const clean = idOrNameOrCode.trim();
  const lower = clean.toLowerCase();
  const prod = TOMORO_PRODUCT_MAP.get(clean) || TOMORO_PRODUCT_MAP.get(lower);
  if (!prod) return null;

  const tier = getTomoroAirportTier(outletCode);
  if (tier === 'palembang') return prod.hargaPalembang;
  if (tier === 'dhoho') return prod.hargaDhoho;
  return prod.hargaNasional;
}

/**
 * Menghasilkan menuGroups resmi Tomoro Coffee untuk outlet tertentu.
 * Mengelompokkan 39 menu final ke dalam 7 kategori resmi dengan harga tier outlet tersebut.
 */
export function getTomoroMenuForOutlet(outletCode?: string | null): MenuGroup[] {
  const tier = getTomoroAirportTier(outletCode);

  const categoryConfigs: Array<{ category: string; code: string; name: string }> = [
    { category: 'MATCHA SERIES', code: 'M-TOMORO-MATCHA', name: 'Matcha Series' },
    { category: 'TOMORO SIGNATURE', code: 'M-TOMORO-SIGNATURE', name: 'TOMORO Signature' },
    { category: 'CLASSIC COFFEE', code: 'M-TOMORO-CLASSIC', name: 'Classic Coffee' },
    { category: 'FLAVORED LATTE', code: 'M-TOMORO-FLAVORED', name: 'Flavored Latte' },
    { category: 'CHEESE X NAILOONG SERIES', code: 'M-TOMORO-CHEESE', name: 'Cheese x Nailoong' },
    { category: 'REFRESHING SERIES', code: 'M-TOMORO-REFRESHING', name: 'Refreshing Series' },
    { category: 'NON COFFEE', code: 'M-TOMORO-NONCOFFEE', name: 'Non Coffee' },
  ];

  return categoryConfigs.map((cfg) => {
    const catProducts = TOMORO_FINAL_PRODUCTS.filter((p) => p.category === cfg.category);
    const domainProducts: Product[] = catProducts.map((p) => {
      const normalPrice =
        tier === 'palembang'
          ? p.hargaPalembang
          : tier === 'dhoho'
            ? p.hargaDhoho
            : p.hargaNasional;

      return {
        id: p.id as any,
        bundleCode: p.bundleCode,
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        image: p.image,
        basePrice: normalPrice,
        originalPrice: normalPrice,
        isSoldOut: p.isSoldOut,
        isCombo: p.isCombo,
      };
    });

    return {
      code: cfg.code,
      name: cfg.name,
      products: domainProducts,
    };
  });
}
