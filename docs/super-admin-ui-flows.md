# Inventario de flujos UI — Super Admin

Leyenda: **OK** usable en prod; **Parcial** funciona con limitaciones; **Riesgo** depende de RLS/cookies; **N/A** no aplica.

| Flujo | Estado | Notas |
|--------|--------|--------|
| Login super-admin | OK | `admin_users` rol `super_admin` o `support`. |
| Dashboard + métricas | OK | Enlaces a vistas filtradas. |
| Empresas listado | Parcial | Carga vía `createSupabaseServerClient`; si RLS bloquea al rol, falla en silencio hasta el mensaje genérico (errores logueados en servidor con `console.error`). |
| Empresa detalle / tabs | Parcial | Misma dependencia de RLS en servidor; formularios cliente usan browser client (`super-admin` scope). |
| Salud pagos / embudo / auditoría | OK | Auditoría GET usa `supabaseAdmin` tras validación de rol. |
| Tickets | OK | APIs validan `SAAS_READ_ROLES` / `SAAS_MUTATE_ROLES`. |
| Herramientas (roles, módulos, comunicados) | OK | UI `readOnly` para `support`; APIs mutación devuelven 403. |
| Paleta Cmd/Ctrl+K | OK | Navegación + búsqueda de empresas (`/api/super-admin/companies-search`). |
| Atajos `?` / `g` `d` | OK | `AdminShortcutsHelp`. |
| Drawer móvil | OK | Foco, Esc, swipe, paleta no rompe captura Esc. |
| PWA manifest | OK | Iconos en `public/saas-admin/`. |
| Rol support | Parcial | Lectura API centralizada con `validateAdminRolesOnServer` + admin client; lecturas directas del navegador a tablas tenant pueden fallar si RLS no contempla JWT de staff SaaS. |

## Cierre de gaps (seguimiento técnico)

1. **RLS (versionado en repo)**: migración [`supabase/migrations/20260329143000_saas_admin_staff_rls.sql`](../../supabase/migrations/20260329143000_saas_admin_staff_rls.sql) — funciones `is_saas_admin_reader()` / `is_saas_admin_mutator()` y políticas para `admin_users` (lectura de la fila propia), `companies`, `branches`, `users`, `business_info`, `payments_history`, `plans` (`SELECT` para staff; mutaciones vía cliente solo `super_admin`). Aplicar con **SQL Editor** o `supabase db push` / `supabase migration up` contra el proyecto vinculado. Las políticas **se combinan en OR** con las existentes para `authenticated`; no habilitan RLS por sí solas en tablas donde siga desactivado.
2. **Errores**: evitar `catch {}` sin log; preferir `console.error` en servidor y mensaje UX genérico (aplicado en listado/detalle de empresas).
3. **Mantenimiento**: banner por `NEXT_PUBLIC_SAAS_ADMIN_MAINTENANCE_BANNER`; tabla opcional queda como mejora futura si se necesita editar sin redeploy.

Última revisión: 2026-03-29.
