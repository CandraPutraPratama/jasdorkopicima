# Brief Proyek: jasdorkopicima

Brief untuk agent coding (Antigravity / Claude Code). Dibuat 11 Oktober 2026.

## 1. Ringkasan

jasdorkopicima adalah website jasa titip (jastip) Kopi Kenangan (KK). Customer memilih outlet, memilih menu dan varian, mengisi nama dan jam ambil, lalu menekan tombol yang membuka WhatsApp dengan pesan pesanan yang sudah terisi otomatis. Pemilik memproses pesanan secara manual lewat WhatsApp, customer membayar ke pemilik, dan customer mengambil pesanan langsung di outlet yang dipilih.

Website ini TIDAK memproses pembayaran dan TIDAK membuat order ke sistem KK. Website hanya alat bantu mengisi pesanan.

Website lama (rusak, jangan dipakai sebagai basis kode, hanya referensi tampilan): https://cimagroup.my.id/ (Next.js, theme color #1A0405). Website baru dibuat dari nol. Logo, warna, dan domain sudah dimiliki pemilik dan akan diberikan sebagai aset.

## 2. Prioritas Proyek

- Mobile-first: hampir semua pengguna membuka lewat HP.
- Awet dan mudah dirawat: pemilik merawat sendiri dibantu agent. Struktur kode sederhana, rapi, ada komentar seperlunya.
- Gratis atau hampir gratis: perkiraan 20 sampai 30 pesanan per hari.
- Tidak ada deadline. Kualitas lebih penting daripada kecepatan.

## 3. Stack yang Disepakati

- Framework: Next.js dengan TypeScript. Frontend dan API route (proxy ke API KK) dalam satu proyek.
- Database: Supabase (Postgres) untuk cache outlet dan menu.
- Hosting: gratis dan boleh komersial. Pilihan utama Cloudflare (Pages/Workers, Next.js lewat adapter OpenNext). Alasannya paket gratis Vercel Hobby setahu kami untuk penggunaan non-komersial, jadi cek syarat terbarunya sebelum memakai Vercel untuk produksi.
- Cloudflare R2: TIDAK dipakai di MVP. Gambar produk memakai URL dari KK dulu. Pertimbangkan R2 hanya jika gambar sering rusak.
- Repo di GitHub. Semua rahasia (nomor HP untuk token, kunci Supabase) di `.env`, jangan pernah di-commit.

## 4. Alur Pengguna

1. Customer memilih outlet (daftar semua outlet KK dari data, ada pencarian). Di luar jam buka, langkah ini tidak tersedia karena website tutup.
2. Muncul menu outlet itu, dikelompokkan seperti di KK (Promo & Combo, Baru!, Coffee, Non Coffee, dst). Customer memilih item dan varian (ukuran, suhu, biji kopi, tingkat gula, es, topping) plus catatan per item.
3. Keranjang menampilkan ringkasan dan total.
4. Customer mengisi nama dan jam ambil: pilihan "Pick up sekarang" atau "Jadwalkan pick up" (pilih jam).
5. Tombol "Kirim ke WhatsApp" membuka `https://wa.me/<nomor pemilik>?text=<pesan ter-encode>`.

Tidak ada fitur akun, login, atau riwayat di server. Fitur "pesan ulang" ditunda ke fase 2. Jika nanti dibuat, simpan di localStorage browser customer, jangan di database, supaya tidak memakan kuota server.

## 5. Aturan Harga dan Fee

Per item di website tampil 3 hal:

- Harga asli (dicoret).
- Harga promo (50% dari harga dasar menu, ditetapkan pemilik; tambahan varian dan topping tidak didiskon).
- Fee jasa.

Aturan fee (flat per item):

- Pesanan berisi lebih dari 1 item: Rp2.000 per item (contoh: 5 item = Rp10.000).
- Pesanan hanya 1 item: Rp4.000 untuk item itu.
- Tidak ada minimal order. Item dihitung per kuantitas: 2 kopi yang sama dihitung 2 item, jadi fee dihitung dari total kuantitas.

Catatan penting untuk agent:

- Harga asli diambil dari data API KK. Harga coret harus sama dengan harga di KK, jangan diubah.
- Diskon 50% HANYA berlaku untuk harga dasar menu. Tambahan varian dan topping (misalnya Large +Rp5.000, Juwara Beans +Rp3.000, topping) dibayar penuh tanpa diskon. Rumus per item: harga asli = harga dasar + total tambahan; harga promo = (harga dasar / 2) + total tambahan.
- Promo 50% berlaku terus. Persentase diskon dan nilai fee disimpan di satu tempat konfigurasi (file config atau tabel settings) supaya mudah diubah, jangan tersebar di banyak file.
- Customer membayar total harga promo ditambah fee jasa. Angka itulah yang tertulis sebagai Total di pesan WhatsApp.
- Teks "Kamu hemat Rp..." = total harga asli dikurangi total harga promo (berarti hanya potongan dari harga dasar), tidak termasuk fee jasa.
- Semua perhitungan uang memakai bilangan bulat rupiah, format `Rp21.000`.

## 6. Jam Operasional

Jasdor buka pukul 08.00 sampai 23.20 WIB. Di luar jam itu website TUTUP TOTAL: customer tidak bisa memilih outlet maupun melihat menu, hanya melihat halaman tutup yang menampilkan jam buka. Status buka ditentukan di server memakai zona waktu Asia/Jakarta (WIB), jangan bergantung pada jam perangkat customer. Jika jam tutup tiba saat customer sedang menyusun pesanan, tombol kirim ke WhatsApp dinonaktifkan dan muncul pemberitahuan.

## 7. Template Pesan WhatsApp

Format pesan (contoh dari pemilik):

```
Halo Kak, saya ingin memesan:

Brand: Kopi Kenangan
Nama: aaaa
Lokasi: Kopi Kenangan - MERR Rungkut Surabaya (DT)
Pickup: Sekarang (estimasi siap ~jam 10:25)

Pesanan:
- 1x Creamy Caramel Latte (Hot, Large (+Rp5.000), Juwara Beans (+Rp3.000), Less Sugar, Normal Ice) Rp25.000
  Catatan: Less Coffee, Extra Ice
- 1x Oatmeal Raisin Soft Baked Cookie Rp9.500

Sub Total: Rp34.500
Biaya Jasa (Rp2.000 x 2 item): Rp4.000
Total: Rp38.500

Kamu hemat Rp26.500 dari harga normal!

Mohon konfirmasi pesanan saya. Terima kasih!
```

Pickup sekarang = waktu klik tombol kirim ke WhatsApp ditambah 10 menit (WIB). Pickup terjadwal menampilkan jam yang dipilih customer, misalnya "Pickup: Terjadwal jam 14:30". Baris perolehan loyalty (stamp) sudah dihapus dari template. Satu baris per item dengan varian dalam kurung, catatan di baris bawahnya, dan harga per baris memakai harga promo (diskon hanya pada harga dasar, tambahan varian tetap penuh). Pesan harus di-encode dengan benar untuk URL WhatsApp, termasuk baris baru. Perhatikan batas panjang URL pada pesanan besar.

## 8. API Kopi Kenangan (Tidak Resmi)

Dokumentasi: https://github.com/Cliffamr/kopi-kenangan-api (hasil reverse-engineering dari order.kopikenangan.com, bisa berubah atau mati kapan saja tanpa pemberitahuan).

- Base: `https://order.kopikenangan.com/web_order/api/`. Semua request `POST` dengan JSON.
- Header umum: `Accept: application/json`, `language: id`, `time_zone: 7`, dan `authorization: <web_order_session_token>` untuk endpoint yang butuh auth.
- Kode error: `0` sukses, `444` token tidak valid atau kedaluwarsa, `-1` parameter salah.
- `sales_type`: `10402` untuk web order pickup.
- CORS: API hanya same-origin, jadi browser tidak bisa memanggil langsung. WAJIB lewat backend/proxy.

Endpoint yang dipakai (hanya ini untuk MVP):

- `/create_web_token`, body `{ "phone": "628..." }`, menghasilkan `web_order_session_token`.
- `/store/query_store`, body `{ "page_num":1, "page_size":10, "keyword":"", "store_type":0 }`, daftar outlet, tanpa auth.
- `/store/get_store`, body `{ "store_code": "..." }`, detail satu outlet termasuk `is_open` dan jam buka, tanpa auth.
- `/product/query_web_order_product_menu`, body `{ "store_code": "...", "sales_type": 10402 }`, menu penuh per outlet, butuh auth.
- `/product/get_web_order_product_options`, varian SKU (ukuran, suhu, manis).
- `/product/get_web_order_combo_items`, isi paket combo (opsional).

TIDAK dipakai: `order/*`, `pay/*`, `cart/cart_price`, dan endpoint voucher.

## 9. Arsitektur Data

- Backend memegang token: membuat, menyimpan, dan memperbarui otomatis saat menerima error `444`. Token tidak pernah dikirim ke browser.
- Job sinkronisasi berkala (misal tiap beberapa jam) menarik outlet dan menu dari KK lalu menyimpannya ke Supabase.
- Frontend hanya membaca dari data milik sendiri (Supabase lewat server), tidak langsung dari KK. Jika KK mati atau berubah, website tetap tampil dengan data terakhir.
- Struktur tabel final ditentukan agent setelah melihat respons asli API (usulan awal: `stores`, `products`, `product_options`, `sync_logs`).
- Normalisasikan respons KK ke tipe TypeScript milik sendiri di satu lapisan adapter, supaya jika format KK berubah cukup satu tempat yang diperbaiki.

## 10. Aturan Kerja untuk Agent

- Kerja per tahap. Setelah tiap tahap selesai, berhenti dan laporkan hasilnya sebelum lanjut.
- Jangan percaya dokumentasi repo sebelum dites. Uji setiap endpoint dengan `curl` atau script kecil dan simpan respons asli sebagai file contoh di repo (hapus data sensitif).
- Uji pemanggilan API KK dari environment hosting yang akan dipakai, bukan hanya dari laptop. Server hosting bisa saja diblokir KK. Ini harus diketahui di awal.
- Jika ada keputusan yang belum jelas di brief ini, tanyakan, jangan menebak.
- Jangan memakai atau menyalin aset dan kode dari website lama, kecuali pemilik menyerahkannya sebagai aset.
- Beri README yang menjelaskan cara menjalankan, env yang dibutuhkan, dan cara men-deploy.

## 11. Tahapan

1. Setup proyek: repo, Next.js + TypeScript, struktur folder, `.env.example`.
2. Eksplorasi dan tes API, termasuk dari environment hosting. Simpan respons contoh. Laporkan temuan, terutama soal struktur harga (termasuk tambahan varian) dan jam buka outlet.
3. Backend proxy dan manajemen token.
4. Sinkronisasi outlet dan menu ke Supabase.
5. Frontend: halaman tutup di luar jam buka, pilih outlet, daftar menu, pilih varian dan catatan.
6. Keranjang, perhitungan fee, form nama dan jam ambil, pesan WhatsApp.
7. Penerapan branding (logo, warna), cek tampilan di HP, penanganan error dan kondisi kosong.
8. Deploy, domain, dan pemantauan sederhana (misal log sinkronisasi gagal).

## 12. Yang Masih Dibutuhkan dari Pemilik

- Nomor WhatsApp pemilik (satu nomor) dan aset branding (logo, warna, domain): diberikan pemilik saat tahap 7.
- Nomor HP untuk `create_web_token`: sudah disiapkan pemilik, diberikan lewat `.env`, tidak boleh masuk repo.
- Jika saat tes API ditemukan hal yang tidak sesuai brief (struktur harga, jam buka outlet, dan sebagainya), agent berhenti dan bertanya ke pemilik.
