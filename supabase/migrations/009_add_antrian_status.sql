-- ==============================================================================
-- Jasdor: Migrasi 009 - Tambah status 'antrian' ke constraint status orders
-- ==============================================================================
-- Fitur alur admin 2 langkah (2026-10-24): pesanan 'menunggu_konfirmasi' dapat
-- dimasukkan ke 'antrian' terlebih dahulu (termasuk konfirmasi massal), lalu
-- dipindah ke 'diproses' satu per satu lewat tombol "Mulai Proses".
-- Constraint lama dari migrasi 003 hanya mengizinkan 5 status, sehingga update
-- ke 'antrian' ditolak database ("Gagal memperbarui status ke antrian").

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
    status IN (
        'menunggu_pembayaran',
        'menunggu_konfirmasi',
        'antrian',
        'diproses',
        'dibatalkan',
        'kedaluwarsa'
    )
);
