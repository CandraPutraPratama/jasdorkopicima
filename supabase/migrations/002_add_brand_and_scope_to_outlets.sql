-- ==============================================================================
-- Jasdor Kopi Cima: Migrasi Database Supabase (Revisi 5C)
-- Menambahkan kolom penanda brand dan in_scope pada tabel outlets
-- ==============================================================================

-- 1. Tambah kolom brand dan is_in_scope jika belum ada
ALTER TABLE public.outlets 
ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT 'Kopi Kenangan';

ALTER TABLE public.outlets 
ADD COLUMN IF NOT EXISTS is_in_scope BOOLEAN NOT NULL DEFAULT true;

-- 2. Buat indeks untuk filter pencarian cepat
CREATE INDEX IF NOT EXISTS idx_outlets_is_in_scope ON public.outlets (is_in_scope);
CREATE INDEX IF NOT EXISTS idx_outlets_brand ON public.outlets (brand);

-- 3. Update data awal (backfill) untuk menandai outlet yang berada di luar lingkup Kopi Kenangan
-- Outlet Kenangan Signature
UPDATE public.outlets
SET brand = 'Kenangan Signature',
    is_in_scope = false
WHERE name ILIKE '%Kenangan Signature%' OR code ILIKE 'KS.%';

-- Outlet Kenangan Heritage
UPDATE public.outlets
SET brand = 'Kenangan Heritage',
    is_in_scope = false
WHERE name ILIKE '%Kenangan Heritage%' OR code = 'JKT.KENHERTG';

-- Outlet Chigo / Chigo x Flip
UPDATE public.outlets
SET brand = 'Chigo x Flip',
    is_in_scope = false
WHERE (name ILIKE '%Chigo%' OR code ILIKE '%.CG%' OR code ILIKE 'TGR.CG%')
  AND is_in_scope = true;

-- Outlet non-resmi / booth alfamidi tanpa brand
UPDATE public.outlets
SET brand = 'Other',
    is_in_scope = false
WHERE code ILIKE 'BCR.JAB.%' AND is_in_scope = true;
