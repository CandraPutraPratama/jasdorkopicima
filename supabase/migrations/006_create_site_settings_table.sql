-- ==============================================================================
-- Jasdor: Migrasi Database Supabase (006_create_site_settings_table.sql)
-- Tabel Pengaturan Situs Dinamis (Key-Value)
-- Digunakan untuk kontrol on/off Mode Khusus Bundling dan pengaturan situs lainnya
-- ==============================================================================

-- 1. Buat tabel site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS: Publik (Anon & Authenticated) dapat membaca pengaturan situs
CREATE POLICY "Allow public read access to site_settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);

-- 4. Kebijakan RLS: service_role memiliki akses penuh (baca/tulis)
CREATE POLICY "Allow service_role full access to site_settings"
ON public.site_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Seed awal: Mode Khusus Bundling aktif (value = 'true') sesuai kondisi saat ini
INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('bundling_only_mode', 'true', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
