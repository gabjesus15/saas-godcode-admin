-- Añadir columnas de plan personalizado en onboarding_applications si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'onboarding_applications' AND column_name = 'custom_plan_name'
  ) THEN
    ALTER TABLE onboarding_applications ADD COLUMN custom_plan_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'onboarding_applications' AND column_name = 'custom_plan_price'
  ) THEN
    ALTER TABLE onboarding_applications ADD COLUMN custom_plan_price text;
  END IF;
END $$;
