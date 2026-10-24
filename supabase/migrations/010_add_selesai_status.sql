-- ==============================================================================
-- Jasdor: Migrasi 010 - Tambah status 'selesai' ke constraint status orders
-- ==============================================================================
-- Alur admin 3 langkah (2026-10-24): menunggu_konfirmasi -> antrian ->
-- diproses -> selesai. Status 'selesai' menandai pesanan yang sudah jadi
-- sehingga keluar dari hitungan antrean pelanggan (yang hanya menghitung
-- 'diproses'). Tanpa status akhir ini, order yang sudah selesai dibuat tetap
-- terbaca "sedang diproses" sampai pergantian hari.
--
-- Daftar status di bawah adalah daftar LENGKAP final (termasuk 'antrian' dari
-- migrasi 009). Aman dijalankan baik migrasi 009 sudah pernah dijalankan
-- maupun belum: cukup jalankan file ini saja.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
    status IN (
        'menunggu_pembayaran',
        'menunggu_konfirmasi',
        'antrian',
        'diproses',
        'selesai',
        'dibatalkan',
        'kedaluwarsa'
    )
);
