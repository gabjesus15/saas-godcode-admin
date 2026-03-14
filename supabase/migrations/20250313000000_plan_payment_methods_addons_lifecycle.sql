-- Plan: métodos de pago del plan (cómo paga la suscripción al SaaS), add-ons y campos para ciclo de vida.
-- Ejecutar en Supabase SQL Editor o con: supabase db push / supabase migration up

-- Métodos de pago del plan (Stripe, Pago Móvil, Zelle, Transferencia, etc.)
CREATE TABLE IF NOT EXISTS plan_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  countries text[] NOT NULL DEFAULT '{}',
  auto_verify boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE plan_payment_methods IS 'Métodos con los que el negocio paga su suscripción al SaaS (por país).';

-- Configuración por método (banco, teléfono, email Zelle, etc.)
CREATE TABLE IF NOT EXISTS plan_payment_method_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id uuid NOT NULL REFERENCES plan_payment_methods(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(method_id, key)
);

CREATE INDEX IF NOT EXISTS idx_plan_payment_method_config_method_id ON plan_payment_method_config(method_id);

-- Add-ons (dominio propio, personalización, etc.)
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_one_time numeric(12,2),
  price_monthly numeric(12,2),
  type text NOT NULL CHECK (type IN ('one_time', 'monthly')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE addons IS 'Servicios extra que se pueden contratar con el plan (dominio, personalización, etc.).';

-- Add-ons contratados por empresa
CREATE TABLE IF NOT EXISTS company_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  price_paid numeric(12,2),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_company_addons_company_id ON company_addons(company_id);

-- Extras elegidos en el onboarding (qué pidió en el registro)
CREATE TABLE IF NOT EXISTS onboarding_application_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES onboarding_applications(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1,
  price_snapshot numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_application_addons_application_id ON onboarding_application_addons(application_id);

-- Columna en onboarding_applications: método de pago del plan elegido (slug)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'onboarding_applications' AND column_name = 'subscription_payment_method'
  ) THEN
    ALTER TABLE onboarding_applications ADD COLUMN subscription_payment_method text;
  END IF;
END $$;

-- payments_history: referencia de pago (comprobante subido para validación manual)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_history' AND column_name = 'reference_file_url'
  ) THEN
    ALTER TABLE payments_history ADD COLUMN reference_file_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_history' AND column_name = 'payment_method_slug'
  ) THEN
    ALTER TABLE payments_history ADD COLUMN payment_method_slug text;
  END IF;
END $$;

-- companies: permitir subscription_status 'payment_pending' (sin borrar datos ni políticas RLS)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.companies'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%subscription_status%'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.companies DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE public.companies
  ADD CONSTRAINT companies_subscription_status_check
  CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text, 'payment_pending'::text]));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Log de correos enviados (evitar duplicados y auditoría)
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  application_id uuid REFERENCES onboarding_applications(id) ON DELETE SET NULL,
  email_type text NOT NULL,
  to_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_log_company_type ON email_log(company_id, email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);

-- RLS en nuevas tablas (acceso solo con service_role desde API)
ALTER TABLE plan_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_payment_method_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_application_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Seed: métodos de pago del plan para Chile y Venezuela
INSERT INTO plan_payment_methods (slug, name, countries, auto_verify, sort_order) VALUES
  ('stripe', 'Stripe (tarjeta)', ARRAY['CL', 'VE', 'Chile', 'Venezuela'], true, 0),
  ('pago_movil', 'Pago Móvil', ARRAY['VE', 'Venezuela'], false, 10),
  ('zelle', 'Zelle', ARRAY['VE', 'Venezuela'], false, 20),
  ('transferencia', 'Transferencia bancaria', ARRAY['CL', 'VE', 'Chile', 'Venezuela'], false, 30)
ON CONFLICT (slug) DO NOTHING;

-- Seed: add-ons básicos
INSERT INTO addons (slug, name, description, price_one_time, price_monthly, type, sort_order) VALUES
  ('custom_domain', 'Dominio propio', 'Conectar tu dominio personalizado', null, 5, 'monthly', 0),
  ('branding', 'Personalización', 'Colores y logo a medida', 50, null, 'one_time', 10)
ON CONFLICT (slug) DO NOTHING;
