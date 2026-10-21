-- ==============================================================================
-- Jasdor: Migrasi Database Supabase (008_create_revoked_admin_sessions.sql)
-- Denylist sesi admin yang sudah logout.
--
-- Kenapa di Supabase, bukan KV:
-- Cloudflare KV bersifat eventually consistent, sehingga pencabutan sesi bisa
-- terlambat beberapa detik di isolate lain. Supabase memberi konsistensi kuat,
-- jadi logout langsung berlaku di seluruh dunia.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.revoked_admin_sessions (
    -- SHA-256 dari token sesi (bukan token mentah), 64 karakter hex.
    token_hash TEXT PRIMARY KEY,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Kapan token ini akan kedaluwarsa sendiri; baris bisa dibersihkan setelahnya.
    expires_at TIMESTAMPTZ NOT NULL
);

-- Indeks untuk pembersihan baris kedaluwarsa.
CREATE INDEX IF NOT EXISTS idx_revoked_admin_sessions_expires_at
ON public.revoked_admin_sessions (expires_at);

-- RLS aktif tanpa policy publik: hanya service role (server) yang bisa akses.
ALTER TABLE public.revoked_admin_sessions ENABLE ROW LEVEL SECURITY;
