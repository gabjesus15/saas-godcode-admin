-- Líneas de texto editables por plan (precios / landing / tarjeta admin).
ALTER TABLE public.plans
	ADD COLUMN IF NOT EXISTS marketing_lines jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.plans.marketing_lines IS 'Lista de strings mostrados como viñetas; si no está vacía, sustituyen el resumen automático en landing.';
