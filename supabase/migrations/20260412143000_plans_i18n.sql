ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS name_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_lines_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.plans.name_i18n IS 'Nombre del plan por locale: es,en,pt,fr,de,it.';
COMMENT ON COLUMN public.plans.marketing_lines_i18n IS 'Viñetas por locale: { es: string[], en: string[], ... }.';

UPDATE public.plans
SET
  name_i18n = jsonb_build_object(
    'es', COALESCE(NULLIF(trim(name), ''), 'Plan'),
    'en', COALESCE(NULLIF(trim(name), ''), 'Plan'),
    'pt', COALESCE(NULLIF(trim(name), ''), 'Plan'),
    'fr', COALESCE(NULLIF(trim(name), ''), 'Plan'),
    'de', COALESCE(NULLIF(trim(name), ''), 'Plan'),
    'it', COALESCE(NULLIF(trim(name), ''), 'Plan')
  ),
  marketing_lines_i18n = jsonb_build_object(
    'es', COALESCE(marketing_lines, '[]'::jsonb),
    'en', COALESCE(marketing_lines, '[]'::jsonb),
    'pt', COALESCE(marketing_lines, '[]'::jsonb),
    'fr', COALESCE(marketing_lines, '[]'::jsonb),
    'de', COALESCE(marketing_lines, '[]'::jsonb),
    'it', COALESCE(marketing_lines, '[]'::jsonb)
  );
