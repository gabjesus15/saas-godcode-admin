# Arquitectura del proyecto — saas-godcode-admin

Panel SaaS multi-tenant con Next.js y Supabase. Sirve como **Super Admin** (gestión de empresas/suscripciones) y como **panel por tenant** (admin de negocio, menú público, pedidos, caja, etc.).

---

## 1. Resumen técnico

| Aspecto | Detalle |
|--------|---------|
| **Framework** | Next.js 16 (App Router) |
| **Backend / BBDD** | Supabase (Auth, Postgres, Storage) |
| **UI** | React 19, Tailwind CSS 4, Framer Motion, Lucide, Chart.js |
| **Multi-tenant** | Subdominios (`[subdomain]`) + `public_slug` en `companies` |
| **Idioma** | Mezcla TS/TSX (app, utils, parte de components) y JS/JSX (kit admin legacy) |

---

## 2. Flujos principales

- **Raíz `/`** → redirige a `/login` (login del Super Admin).
- **`/login`** → layout `(auth)`; login de Super Admin (email en `admin_users`).
- **`/(super-admin)/*`** → panel Super Admin (empresas, planes, dashboard); requiere sesión y rol en `admin_users`.
- **`/[subdomain]/*`** → sitio del tenant; el `subdomain` se resuelve a `companies.public_slug`. Incluye:
  - **`/[subdomain]`** → home del tenant (menú/catálogo).
  - **`/[subdomain]/menu`** → menú.
  - **`/[subdomain]/login`** → login del tenant (admin del negocio).
  - **`/[subdomain]/admin`** → panel de administración del tenant (pedidos, caja, inventario, clientes, etc.).
- **`/checkout/success` y `/checkout/cancel`** → post-pago (Mercado Pago / Stripe).
- **API** → rutas bajo `app/api/` (ej. `superadmin-user`, `admin-permissions`).

La resolución de URLs por tenant (subdominio vs path en localhost) se centraliza en `utils/tenant-url.ts`.

---

## 3. Índice de carpetas

### Raíz del proyecto

| Carpeta / archivo | Uso |
|-------------------|-----|
| **`app/`** | Rutas y layouts de Next.js (App Router). Páginas, layouts, estilos por ruta y API routes. |
| **`components/`** | Componentes React: Super Admin, tenant (shell, menú, carrito, admin kit), y UI reutilizable. |
| **`utils/`** | Utilidades: Supabase (client/server), auth admin, tenant-url, audit, `cn`, etc. |
| **`public/`** | Assets estáticos (favicon, SVGs, imágenes por tenant, placeholders). |
| **`supabase-functions-backup/`** | Respaldo de Edge Functions de Supabase (Stripe, Mercado Pago, suscripciones). No se compila con el build de Next (excluido en `tsconfig.json`). |
| **`.next/`** | Build y caché de Next.js (generado, no versionado). |
| **`node_modules/`** | Dependencias npm. |

---

### `app/`

| Ruta | Uso |
|------|-----|
| **`layout.tsx`** | Layout raíz (fuentes, `globals.css`). |
| **`page.tsx`** | Página raíz; redirige a `/login`. |
| **`globals.css`** | Estilos globales. |
| **`super-admin.tailwind.css`** | Estilos Tailwind del panel Super Admin. |
| **`(auth)/`** | Grupo de rutas sin layout visual propio (solo wrapper); usado para login. |
| **`(auth)/login/`** | Página de login del **Super Admin**. |
| **`(super-admin)/`** | Grupo de rutas del panel Super Admin; layout verifica sesión y rol en `admin_users`. |
| **`(super-admin)/layout.tsx`** | Layout que protege con auth y envuelve con `AdminShell`. |
| **`(super-admin)/dashboard/`** | Dashboard Super Admin. |
| **`(super-admin)/companies/`** | Listado de empresas. |
| **`(super-admin)/companies/[id]/`** | Detalle/edición de una empresa. |
| **`(super-admin)/companies/new/`** | Alta de nueva empresa. |
| **`(super-admin)/plans/`** | Gestión de planes. |
| **`[subdomain]/`** | Rutas dinámicas por tenant; `subdomain` = `public_slug` de la empresa. |
| **`[subdomain]/layout.tsx`** | Layout tenant: carga empresa, tema (colores, favicon), envuelve con `TenantShell`. |
| **`[subdomain]/page.tsx`** | Home del tenant (p. ej. menú/catálogo). |
| **`[subdomain]/menu/`** | Página de menú del tenant. |
| **`[subdomain]/login/`** | Login del admin del tenant. |
| **`[subdomain]/admin/`** | Panel de administración del tenant (pedidos, caja, inventario, etc.). |
| **`[subdomain]/styles/`** | CSS por vista/feature del tenant (Admin, Menú, Cart, Modals, etc.). |
| **`[subdomain]/tenant.css`** | Estilos base del tenant (tema, variables CSS). |
| **`[subdomain]/tenant-favicon/`** | Route handler que sirve el favicon dinámico del tenant. |
| **`[subdomain]/head.tsx`** | Metadatos/cabeza específicos del tenant. |
| **`api/`** | API Routes de Next.js. |
| **`api/superadmin-user/`** | Endpoint relacionado con usuario Super Admin. |
| **`api/admin-permissions/`** | Endpoint de permisos de admin. |
| **`checkout/`** | Rutas post-pago. |
| **`checkout/success/`** | Página de pago exitoso. |
| **`checkout/cancel/`** | Página de pago cancelado. |

---

### `components/`

| Ruta | Uso |
|------|-----|
| **`super-admin/`** | Componentes solo del panel Super Admin. |
| **`super-admin/admin-shell.tsx`** | Shell del panel (sidebar + contenido). |
| **`components/super-admin/sidebar.tsx`** | Navegación lateral Super Admin. |
| **`components/super-admin/companies-table.tsx`** | Tabla de empresas. |
| **`components/super-admin/companies-view.tsx`** | Vista de listado/gestión de empresas. |
| **`components/super-admin/company-form.tsx`** | Formulario de empresa. |
| **`components/super-admin/company-global-form.tsx`** | Formulario global de empresa. |
| **`components/super-admin/company-global-tab.tsx`** | Pestaña de datos globales de empresa. |
| **`components/super-admin/company-tabs.tsx`** | Pestañas en detalle de empresa. |
| **`components/super-admin/company-status-toggle.tsx`** | Toggle de estado de empresa. |
| **`components/super-admin/company-health.tsx`** | Estado/salud de la empresa. |
| **`components/super-admin/branches-table.tsx`** | Tabla de sucursales. |
| **`components/super-admin/branch-row.tsx`** | Fila de sucursal. |
| **`components/super-admin/branches-create-form.tsx`** | Formulario de creación de sucursales. |
| **`components/super-admin/branding-preview.tsx`** | Vista previa de branding. |
| **`components/super-admin/metric-card.tsx`** | Tarjeta de métrica en dashboard. |
| **`components/tenant/`** | Componentes compartidos del lado tenant (público + admin). |
| **`components/tenant/tenant-shell.tsx`** | Contenedor cliente del tenant (scroll, capas, anti-zoom). |
| **`components/tenant/tenant-brand.tsx`** | Marca/logo del tenant. |
| **`components/tenant/tenant-login-form.tsx`** | Formulario de login del tenant. |
| **`components/tenant/home-client.tsx`** | Cliente de la home del tenant. |
| **`components/tenant/menu-client.tsx`** | Cliente de la página de menú. |
| **`components/tenant/navbar.tsx`** | Barra de navegación del tenant. |
| **`components/tenant/product-card.tsx`** | Tarjeta de producto. |
| **`components/tenant/cart-float.tsx`** | Botón/flotante del carrito. |
| **`components/tenant/cart-modal.tsx`** | Modal del carrito. |
| **`components/tenant/cart-provider.tsx`** | Contexto del carrito. |
| **`components/tenant/use-cart.ts`** | Hook del carrito. |
| **`components/tenant/orders-service.ts`** | Servicio de pedidos (API/llamadas). |
| **`components/tenant/store-unavailable.tsx`** | Mensaje de tienda no disponible. |
| **`components/tenant/branch-selector-modal.tsx`** | Modal para elegir sucursal. |
| **`components/tenant/contact-branch-modal.tsx`** | Modal de contacto con sucursal. |
| **`components/tenant/use-anti-zoom.ts`** | Hook para evitar zoom no deseado (móvil). |
| **`components/tenant/utils/`** | Utilidades usadas por componentes tenant. |
| **`components/tenant/utils/tenant-route.ts`** | Helpers de rutas por tenant. |
| **`components/tenant/utils/formatters.ts`** | Formateo de precios, fechas, etc. |
| **`components/tenant/utils/cloudinary.ts`** | Subida/configuración de imágenes (Cloudinary). |
| **`components/tenant/utils/safe-ids.ts`** | Utilidades para IDs seguros. |
| **`components/tenant/admin/`** | Capa que integra el “kit” admin en la app Next. |
| **`components/tenant/admin/admin-app.tsx`** | App wrapper del admin del tenant. |
| **`components/tenant/admin/admin-page.tsx`** | Página contenedora del admin. |
| **`components/tenant/admin/admin-provider.tsx`** | Provider de contexto del admin (en kit). |
| **`components/tenant/admin/admin-sidebar.tsx`** | Sidebar del admin (puede ser wrapper del kit). |
| **`components/tenant/admin/kit/`** | Kit de admin del tenant (lógica de negocio: pedidos, caja, productos, etc.). Mayoría en JS/JSX. |
| **`components/tenant/admin/kit/admin/`** | Módulo principal del panel admin (páginas, componentes, caja, configuración). |
| **`components/tenant/admin/kit/admin/pages/`** | Páginas del panel: `Admin.jsx`, `AdminProvider.jsx`. |
| **`components/tenant/admin/kit/admin/components/`** | Componentes del panel: sidebar, analytics, kanban, clientes, inventario, configuración, caja, etc. |
| **`components/tenant/admin/kit/admin/components/caja/`** | Componentes de caja: turnos, movimientos, detalle de pedidos, etc. |
| **`components/tenant/admin/kit/admin/hooks/`** | Hooks del admin (ej. pedidos manuales). |
| **`components/tenant/admin/kit/admin/utils/`** | Utilidades del admin (ej. impresión de tickets). |
| **`components/tenant/admin/kit/admin/styles/`** | CSS del panel admin (duplicados o referencias; estilos principales suelen estar en `app/[subdomain]/styles/`). |
| **`components/tenant/admin/kit/auth/`** | Auth del tenant: login y rutas protegidas. |
| **`components/tenant/admin/kit/auth/pages/`** | Página de login del tenant. |
| **`components/tenant/admin/kit/auth/components/`** | Componentes de auth (ej. `ProtectedRoute`). |
| **`components/tenant/admin/kit/cart/`** | Carrito: componentes y hooks. |
| **`components/tenant/admin/kit/cart/components/`** | `CartFloat`, `CartModal`, etc. |
| **`components/tenant/admin/kit/cart/hooks/`** | Contexto/hooks del carrito. |
| **`components/tenant/admin/kit/products/`** | Productos y categorías: páginas, componentes, hooks. |
| **`components/tenant/admin/kit/products/pages/`** | Página de menú (admin/catálogo). |
| **`components/tenant/admin/kit/products/components/`** | Modales de producto/categoría, tarjetas, etc. |
| **`components/tenant/admin/kit/orders/`** | Lógica de pedidos. |
| **`components/tenant/admin/kit/orders/services/`** | Servicios de pedidos (Supabase, estado, etc.). |
| **`components/tenant/admin/kit/context/`** | Contextos React: negocio, ubicación, caja. |
| **`components/tenant/admin/kit/lib/`** | Cliente Supabase y tablas/helpers de BBDD del kit. |
| **`components/tenant/admin/kit/components/shared/`** | Componentes compartidos del kit: Home, Navbar, modales de sucursal/contacto. |
| **`components/tenant/admin/kit/shared/`** | Utilidades y código compartido del kit. |
| **`components/tenant/admin/kit/shared/utils/`** | `orderUtils`, `exportUtils`, `safeIds`, `formatters`, etc. |
| **`components/tenant/admin/kit/assets/`** | Assets del kit (SVGs, etc.). |
| **`components/ui/`** | Componentes UI reutilizables (botones, cards, badge, input, skeleton). |

---

### `utils/`

| Ruta | Uso |
|------|-----|
| **`utils/supabase/`** | Clientes de Supabase. |
| **`utils/supabase/client.ts`** | Cliente Supabase para uso en cliente (browser). |
| **`utils/supabase/server.ts`** | Cliente Supabase para Server Components / API (cookies). |
| **`utils/admin.ts`** | Helpers de administración (roles, permisos). |
| **`utils/admin/server-auth.ts`** | Auth en servidor para Super Admin. |
| **`utils/tenant-url.ts`** | Construcción y resolución de URLs por tenant (subdominio vs path). |
| **`utils/audit.ts`** | Utilidades de auditoría. |
| **`utils/cn.ts`** | Utilidad para clases CSS (ej. `clsx`/`tailwind-merge`). |

---

### `public/`

| Ruta | Uso |
|------|-----|
| **`public/`** | Raíz de archivos estáticos. |
| **`public/tenant/`** | Assets por tenant: iconos (cash, category), logo placeholder, etc. |
| **`public/vercel.svg`**, **`public/file.svg`**, etc. | Iconos y placeholders globales. |

---

### `supabase-functions-backup/`

| Ruta | Uso |
|------|-----|
| **`supabase-functions-backup/functions/`** | Respaldo de Edge Functions. |
| **`.../stripe-checkout/`** | Creación de sesión de pago Stripe. |
| **`.../stripe-webhook/`** | Webhook de Stripe. |
| **`.../mercadopago-preference/`** | Creación de preferencia Mercado Pago. |
| **`.../mercadopago-webhook/`** | Webhook de Mercado Pago. |
| **`.../subscription-notifier/`** | Notificaciones de suscripción. |
| **`.../subscription-sweeper/`** | Tareas de limpieza/barrido de suscripciones. |

---

## 4. Datos y autenticación

- **Super Admin**: sesión con Supabase Auth; el email se valida contra la tabla `admin_users`; roles como `owner`, `super_admin`, `admin` permiten acceso a `/(super-admin)/*`.
- **Tenant**: empresas en tabla `companies` identificadas por `public_slug` (usado como “subdomain” en la URL). Tema en `theme_config`. Sucursales y productos por empresa/sucursal. El admin del tenant tiene su propio flujo de login y permisos.

---

## 5. Variables de entorno relevantes

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tenant**: `NEXT_PUBLIC_TENANT_BASE_DOMAIN`, `NEXT_PUBLIC_TENANT_PROTOCOL`
- **Cloudinary** (opcional): `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

Detalle completo en `README.md`.

---

## 6. Convenciones y notas

- Rutas por tenant usan el segmento dinámico `[subdomain]` (no implica obligatoriamente un subdominio DNS; en local puede ser path).
- El “kit” bajo `components/tenant/admin/kit/` está mayormente en JS/JSX; la app Next (app/, wrappers en components/tenant/admin/) en TypeScript.
- Estilos del tenant: variables CSS inyectadas en `app/[subdomain]/layout.tsx`; archivos por vista en `app/[subdomain]/styles/`.
- `tsconfig.json` excluye `supabase-functions-backup/**` para evitar errores de tipado Deno en build.
