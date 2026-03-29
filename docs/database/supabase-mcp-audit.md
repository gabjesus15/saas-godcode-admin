# Auditoría Supabase (MCP) — alineación con el plan de revisión

Fecha de snapshot: 2026-03-28. Fuente: herramientas MCP del proyecto vinculado (`list_tables`, `execute_sql`, `get_advisors`, `list_migrations`, `generate_typescript_types`).

## Migraciones versionadas en Supabase

El proyecto **sí** tiene historial en remoto (más de 100 migraciones), desde `initial_schema_setup` hasta `hero_banners_image_only_no_product`. El plan asumía “sin migraciones en repo”; la verdad operativa es: **el esquema vivo está gobernado por el remoto de Supabase**. Para alinear el repo, conviene `supabase link` + `supabase db pull` si quieres copiar SQL al workspace.

## RPC `create_order_transaction` (verificación en BD)

Existen **dos sobrecargas**:

1. Sin `p_payment_method_specific` — inserta en `orders` **sin** esa columna en el `INSERT` (el cuerpo antiguo).
2. Con `p_payment_method_specific` (default `NULL`) — `SECURITY DEFINER`, escribe `payment_method_specific` en `orders`.

**Ninguna** versión inserta en `order_items`, `order_payments` ni `order_status_history`. Solo `orders` + JSON `items` y actualización de `clients`.

## Conteos aproximados (`pg_stat_user_tables`) vs plan

| Tabla | Filas estimadas | Nota |
|-------|-----------------|------|
| `orders` | 2 | Pedidos reales en JSON |
| `order_items`, `order_payments`, `order_status_history` | 0 | Esquema normalizado **sin uso** por el RPC actual |
| `payment_methods` | 0 | Tabla relacional vacía; la app usa `branches.payment_methods` + `branch_payment_methods` |
| `email_log`, `subscription_notifications`, `cash_reconciliations` | 0 | Preparadas para jobs / features futuras |
| `backup_products` | 121 | Respaldo; sin PK en metadatos MCP |
| `backup_product_prices` | 0 | Respaldo |

Conclusión: el plan sobre “dualidad JSON vs tablas normalizadas” queda **confirmado en producción** para este proyecto.

## FKs e integridad

- `cash_movements`: FKs a `cash_shifts`, `orders`, `users`. La columna **`company_id` no tiene FK** en los metadatos (coincide con el plan).
- `subscription_notifications`: **`Relationships: []`** en tipos generados → **`company_id` sin FK** hacia `companies`.
- `admin_audit_logs`: sin FK en tipos (diseño típico de auditoría).

## Asesores de seguridad (Supabase linter)

- **RLS activado sin políticas** (INFO) en: `addons`, `branch_payment_methods`, `company_addons`, `email_log`, `onboarding_application_addons`, `onboarding_applications`, `plan_payment_method_config`, `plan_payment_methods`, `tenant_connected_accounts`. Suele ser aceptable si **solo service role** accede; si algún rol `authenticated` debe leer/escribir, hay que añadir políticas.
- **WARN**: `onboarding_applications_updated_at` con `search_path` mutable (revisar [function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)).
- **WARN**: protección de contraseñas filtradas desactivada en Auth — [documentación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Asesores de rendimiento

- Avisos **INFO** de **foreign keys sin índice** (p. ej. `cash_reconciliations_branch_fkey`). El volcado del linter es largo; revisar en Dashboard → Advisors → Performance y aplicar índices donde haya filtros/joins frecuentes.

## Artefactos en el repo tras esta tarea

- [`types/supabase-database.ts`](../../types/supabase-database.ts): tipos TypeScript generados por MCP (regenerar tras DDL). **No** están enlazados aún a `createClient<Database>` en toda la app: hacerlo de golpe rompe el tipado de `theme_config` (Json), respuestas RPC y varios `insert` dinámicos; conviene adoptar por módulo.
- Constantes de nombres de tabla que antes vivían en el kit admin del tenant ya no están en este repo; alinear strings con el esquema real y con [`types/supabase-database.ts`](../../types/supabase-database.ts).

## Próximos pasos (fuera de este PR)

1. Unificar llamadas a `create_order_transaction` en código para usar **siempre** la sobrecarga con `p_payment_method_specific` cuando corresponda (o deprecar la sobrecarga corta en BD).
2. Decidir: rellenar `order_*` desde el RPC **o** eliminar/documentar tablas como solo diseño futuro.
3. Opcional: FK `subscription_notifications.company_id` → `companies.id` y FK opcional `cash_movements.company_id` → `companies.id`.
4. `supabase db pull` al repo para que el plan “export schema” quede en carpetas de migración locales.
