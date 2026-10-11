-- ==============================================================================
-- Jasdor Kopi Cima: Migrasi Database Supabase (Tahap 4 Bagian B)
-- 1. Tabel outlets (pencarian cepat nama & alamat)
-- 2. Tabel generic_cache (menu & opsi varian dengan stale-if-error)
-- 3. Row Level Security (RLS) diaktifkan tanpa policy publik (server-only via service_role)
-- ==============================================================================

-- Aktifkan ekstensi pg_trgm untuk pencarian ILIKE / fulltext super cepat pada nama dan alamat
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------------------------
-- 1. Tabel: outlets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outlets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    open_time TEXT DEFAULT '',
    close_time TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks pencarian nama dan alamat menggunakan trigram (mendukung pencarian substring ILIKE instan)
CREATE INDEX IF NOT EXISTS idx_outlets_name_trgm ON public.outlets USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_outlets_address_trgm ON public.outlets USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_outlets_code ON public.outlets (code);
CREATE INDEX IF NOT EXISTS idx_outlets_is_active ON public.outlets (is_active);

-- ------------------------------------------------------------------------------
-- 2. Tabel: generic_cache
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generic_cache (
    key TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_generic_cache_expires_at ON public.generic_cache (expires_at);

-- ------------------------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- Aktifkan RLS di semua tabel TANPA policy publik.
-- Hanya koneksi server dengan SUPABASE_SERVICE_ROLE_KEY yang dapat membaca & menulis.
-- Akses publik via anon key / browser ditolak secara default.
-- ------------------------------------------------------------------------------
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generic_cache ENABLE ROW LEVEL SECURITY;

-- Catatan:
-- Tidak ada CREATE POLICY untuk public/anon.
-- Service Role Key Supabase otomatis membypass RLS (admin access) di level server.
