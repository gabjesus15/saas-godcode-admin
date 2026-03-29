# RLS y columnas `delivery_settings` / `handoff_code`

## Síntoma

- Error al cargar el menú o sucursales tras añadir `branches.delivery_settings`.
- Mensajes tipo **permission denied for column** o **42501** al hacer `select`/`update`.
- A veces se confunden con “RLS” porque el cliente solo muestra un error genérico de PostgREST.

## Causa habitual

En PostgreSQL, los privilegios pueden existir **por columna**. Tras un `ALTER TABLE ... ADD COLUMN`, conviene repetir `GRANT` explícitos para `anon`, `authenticated` y `service_role` alineados con el resto de la tabla.

## Solución

Ejecutar en el proyecto Supabase (SQL Editor o herramienta MCP `execute_sql` / `apply_migration`) los `GRANT` por columna:

- `branches.delivery_settings`: `SELECT` para `anon`, `authenticated`, `service_role`; `UPDATE` para `authenticated`, `service_role`.
- `orders.handoff_code`: `SELECT` para `anon`, `authenticated`, `service_role`.

No hace falta versionar `.sql` en el repo si preferís aplicar solo vía MCP o Dashboard.

## Comprobar políticas (Dashboard → SQL)

```sql
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('branches', 'orders')
ORDER BY tablename, policyname;
```

Para la tienda pública (anon) deben seguir existiendo políticas **SELECT** permisivas en `branches` (p. ej. `app_anon_branches_select` o equivalentes). La RPC `create_order_transaction` es **SECURITY DEFINER** y el rol `postgres` tiene **BYPASSRLS** en proyectos Supabase estándar, así que los inserts internos no deberían chocar con RLS si la función está bien desplegada.

## Si el fallo es solo al actualizar delivery desde el panel tenant

Comprueba que el usuario autenticado tenga políticas **UPDATE**/`ALL` en `branches` con `company_id` correcto (p. ej. `branches_authenticated_company` o `tenant_company_access` en tu esquema).
