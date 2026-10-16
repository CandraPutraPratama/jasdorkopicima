-- ==============================================================================
-- Jasdor: Migrasi Database Supabase (Tabel Orders untuk Alur QRIS On-Site)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Format: 'CG-XXXXXX'
    brand_slug TEXT NOT NULL DEFAULT 'kopi-kenangan',
    outlet_code TEXT NOT NULL,
    outlet_name TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal INTEGER NOT NULL,
    fee INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'menunggu_pembayaran',
    notes TEXT DEFAULT '',
    pickup_time TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Batasan nilai status yang diizinkan
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
    status IN (
        'menunggu_pembayaran',
        'menunggu_konfirmasi',
        'diproses',
        'dibatalkan',
        'kedaluwarsa'
    )
);

-- Indeks pencarian dan pengurutan
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_wa ON public.orders (customer_wa);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Aktifkan RLS tanpa policy publik: akses database dibatasi hanya untuk server
-- melalui SUPABASE_SERVICE_ROLE_KEY.
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
