-- Separar las Américas en USA/Canada y Latinoamérica
-- Esta migración actualiza los datos existentes que usaban "Americas"

-- Si existe "Americas", renombrar a "Latinoamérica" (nuevo default para Latinoamérica)
-- USA/Canada se deja configurar manualmente por el admin si es necesario
UPDATE public.plans
SET prices_by_continent = prices_by_continent - 'Americas' || jsonb_build_object(
	'Latinoamérica', prices_by_continent->'Americas'
)
WHERE prices_by_continent ? 'Americas';

-- Para planes sin prices_by_continent pero con precio, migrar a Latinoamérica
UPDATE public.plans
SET prices_by_continent = jsonb_build_object(
	'Latinoamérica', jsonb_build_object(
		'price', price,
		'currency', 'USD'
	)
)
WHERE price IS NOT NULL 
	AND price > 0 
	AND (prices_by_continent IS NULL OR prices_by_continent = '{}'::jsonb);
