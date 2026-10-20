-- ==============================================================================
-- Jasdor: Migrasi Database Supabase (005_auto_cancel_and_refund_flag.sql)
-- Auto-batalkan pesanan yang belum selesai saat pergantian hari (00:00 WIB)
-- & Flag "Perlu Refund" untuk pesanan yang dibatalkan setelah bayar
-- ==============================================================================

-- 1. Tambahkan kolom cancellation_reason jika belum ada
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT NULL;

-- 2. Tambahkan kolom needs_refund jika belum ada
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS needs_refund BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Indeks untuk mempercepat query admin & filter pesanan yang perlu refund
CREATE INDEX IF NOT EXISTS idx_orders_needs_refund 
ON public.orders (needs_refund) 
WHERE needs_refund = TRUE;

-- 4. Fungsi SQL: auto_cancel_unconfirmed_orders
-- Menjalankan pembatalan otomatis untuk seluruh pesanan non-final pada pergantian hari (00:00 WIB).
-- Hanya membatalkan status 'menunggu_pembayaran' dan 'menunggu_konfirmasi'.
-- Status 'diproses', 'dibatalkan', dan 'kedaluwarsa' TIDAK disentuh.
-- Jika pesanan berstatus 'menunggu_konfirmasi' (customer SUDAH bayar via QRIS), tandai needs_refund = TRUE.
CREATE OR REPLACE FUNCTION public.auto_cancel_unconfirmed_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER := 0;
BEGIN
    UPDATE public.orders
    SET 
        status = 'dibatalkan',
        cancellation_reason = 'Otomatis dibatalkan - melewati batas hari operasional',
        needs_refund = CASE 
            WHEN status = 'menunggu_konfirmasi' THEN TRUE 
            ELSE needs_refund 
        END
    WHERE status IN ('menunggu_pembayaran', 'menunggu_konfirmasi');

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- Berikan izin eksekusi fungsi ke service_role
GRANT EXECUTE ON FUNCTION public.auto_cancel_unconfirmed_orders() TO service_role;

-- 5. Pendaftaran Job pg_cron:
-- Jadwal: '0 17 * * *' (Pukul 17:00 UTC = 00:00 WIB setiap hari)
-- Nama Job: 'auto-cancel-unconfirmed-orders'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Hapus jadwal sebelumnya jika ada agar idempotent
        PERFORM cron.unschedule('auto-cancel-unconfirmed-orders')
        WHERE EXISTS (
            SELECT 1 FROM cron.job WHERE jobname = 'auto-cancel-unconfirmed-orders'
        );

        -- Jadwalkan eksekusi setiap hari jam 00:00 WIB (17:00 UTC)
        PERFORM cron.schedule(
            'auto-cancel-unconfirmed-orders',
            '0 17 * * *',
            'SELECT public.auto_cancel_unconfirmed_orders();'
        );
    END IF;
END $$;
