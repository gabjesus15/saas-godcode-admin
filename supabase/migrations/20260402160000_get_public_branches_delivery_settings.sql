-- Opcional: extender la función `public.get_public_branches` en el proyecto Supabase SaaS
-- para devolver también `delivery_settings`, `origin_lat` y `origin_lng` por sucursal.
-- El cuerpo exacto depende de cómo esté definida hoy la función (joins, SECURITY, etc.).
--
-- Pasos típicos en el SQL Editor:
-- 1) `SELECT pg_get_functiondef('public.get_public_branches(text)'::regprocedure);`
-- 2) Añadir columnas al RETURNS TABLE y al SELECT principal desde `branches`.
-- 3) Asegurar políticas RLS / GRANT para `anon` si aplica.
--
-- Los tipos del cliente en este repo ya incluyen estos campos en
-- `types/supabase-database.ts` para cuando la función los exponga.

SELECT 1;
