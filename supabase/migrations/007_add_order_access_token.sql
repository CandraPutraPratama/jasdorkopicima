-- ==============================================================================
-- Jasdor: Migrasi Database Supabase (007_add_order_access_token.sql)
-- Token akses rahasia per pesanan (32 hex). Mencegah enumerasi pesanan:
-- ID publik (CG-XXXXXX) saja tidak cukup untuk membaca data pelanggan
-- atau mengonfirmasi pembayaran.
-- ==============================================================================

-- 1. Kolom token akses per pesanan
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS access_token TEXT DEFAULT NULL;

-- 2. Indeks unik untuk lookup cepat + mencegah token duplikat
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_access_token
ON public.orders (access_token)
WHERE access_token IS NOT NULL;

-- 3. Catatan migrasi:
--    Pesanan lama (sebelum migrasi ini) memiliki access_token NULL dan
--    sengaja TIDAK dapat diakses lagi melalui API publik / halaman bayar.
--    Ini adalah perilaku fail-closed yang disengaja: lebih baik pesanan
--    lama harus dibuat ulang daripada data pelanggan dapat dibaca siapa pun
--    yang menebak ID. Pesanan berjalan akan kedaluwarsa otomatis dalam
--    60 menit, dan pesanan aktif dibatalkan otomatis pada 00:00 WIB.
