-- Agregar columna para precios por región en la tabla plans
ALTER TABLE public.plans
	ADD COLUMN IF NOT EXISTS prices_by_continent jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.plans.prices_by_continent IS 'Precios por región. Formato: {"USA/Canada": {"price": 20, "currency": "USD"}, "Latinoamérica": {"price": 25, "currency": "USD"}, "Europe": {"price": 18, "currency": "EUR"}, "Asia": {"price": 22, "currency": "SGD"}, "Africa": {"price": 30, "currency": "ZAR"}, "Oceania": {"price": 35, "currency": "AUD"}}';

-- Crear índice GIN para búsquedas JSON más rápidas
CREATE INDEX IF NOT EXISTS idx_plans_prices_by_continent ON public.plans USING GIN (prices_by_continent);
