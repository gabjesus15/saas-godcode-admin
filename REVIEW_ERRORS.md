# Code Review Errors Tracker

Listado de hallazgos confirmados en la revisión actual, organizados para corrección incremental.

## Estados

- `pending`: pendiente de corrección
- `in_progress`: en curso
- `done`: corregido y validado
- `blocked`: requiere definición externa

## Errores

### ERR-01

- **Estado:** `pending`
- **Severidad:** Alta
- **Título:** El layout super-admin no valida rol específico
- **Ubicación:** `app/(super-admin)/layout.tsx`
- **Problema:** Solo valida que el usuario exista en `admin_users`, no que tenga rol permitido (`owner` o `super_admin`).
- **Riesgo:** Usuarios con rol insuficiente podrían entrar al panel super-admin.
- **Recomendación:** Reutilizar validación server-side de roles (`validateAdminRolesOnServer(["owner", "super_admin"])`) antes de renderizar.

### ERR-02

- **Estado:** `pending`
- **Severidad:** Alta
- **Título:** Queries sin filtro por tenant cuando branch = all
- **Ubicación:** `components/tenant/admin/kit/admin/pages/AdminProvider.jsx`
- **Problema:** En modo `selectedBranch.id === "all"`, varias consultas (`categories`, `products`, `orders`, `clients`) no aplican `company_id`.
- **Riesgo:** Exposición de datos cross-tenant.
- **Recomendación:** Aplicar filtro por `company_id` en todos los queries de modo `all`.

### ERR-03

- **Estado:** `pending`
- **Severidad:** Alta
- **Título:** Historial de cliente sin scope por tenant
- **Ubicación:** `components/tenant/admin/kit/admin/pages/AdminProvider.jsx`
- **Problema:** `loadClientHistory` filtra por `client_id` solamente.
- **Riesgo:** Puede devolver órdenes de otro tenant en escenarios de IDs expuestos y RLS débil.
- **Recomendación:** Añadir validación por `company_id` y/o `branch_id` consistente con el tenant activo.

### ERR-04

- **Estado:** `pending`
- **Severidad:** Alta
- **Título:** Exportación mensual sin filtro tenant en modo all
- **Ubicación:** `components/tenant/admin/kit/admin/components/AdminDangerZone.jsx`
- **Problema:** Al exportar con `selectedBranch.id === "all"`, la query de órdenes no filtra por `company_id`.
- **Riesgo:** Exportación de datos de otros tenants.
- **Recomendación:** Filtrar por `company_id` del tenant actual además del rango de fechas.

### ERR-05

- **Estado:** `pending`
- **Severidad:** Media
- **Título:** Home tenant sin manejo explícito de error en consultas secundarias
- **Ubicación:** `app/[subdomain]/page.tsx`
- **Problema:** Las consultas de `branches`, `cash_shifts` y `business_info` no validan `error`.
- **Riesgo:** Degradación silenciosa y comportamiento inconsistente ante fallos de red/DB.
- **Recomendación:** Manejar errores como en `app/[subdomain]/menu/page.tsx`, con fallback explícito.

## Orden sugerido

1. `ERR-01`
2. `ERR-02`
3. `ERR-04`
4. `ERR-03`
5. `ERR-05`

