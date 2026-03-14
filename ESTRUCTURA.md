# Estructura y funcionamiento del proyecto

Este documento describe la estructura de la aplicación **saas-godcode-admin** (Next.js 16, App Router) y cómo funcionan sus flujos principales.

---

## 1. Resumen de la aplicación

- **Stack:** Next.js 16, React 19, Supabase (auth + BD), Tailwind CSS.
- **Modelo:** Multi-tenant por subdominio. Cada negocio tiene un `public_slug` que se usa como subdominio (ej: `mi-negocio.godcode.me` → slug `mi-negocio`).
- **Tres “mundos”:**
  1. **Raíz / redirect:** `/` redirige según host (godcode.me → `/login`, `*.godcode.me` → `/{subdomain}`).
  2. **Super Admin:** Panel para administrar empresas, planes, onboarding y soporte. Rutas bajo `(super-admin)/` y `/login`. Requiere usuario en `admin_users` con rol `super_admin`.
  3. **Tenant (por subdominio):** Sitio público del negocio (`/{subdomain}`, `/{subdomain}/menu`, `/{subdomain}/login`) y panel admin del tenant (`/{subdomain}/admin`). Usa `companies.public_slug` y `users` por empresa.
  4. **Onboarding:** Flujo público de alta de nuevos negocios (formulario, verificación email, pago, finalización). Rutas bajo `/onboarding`, `/checkout`, etc.

---

## 2. Estructura de carpetas

```
saas-godcode-admin/
├── app/                          # App Router (Next.js)
│   ├── layout.tsx                # Layout raíz (fuentes, tema, preconnect)
│   ├── page.tsx                  # Redirecciones según host
│   ├── globals.css
│   ├── super-admin.tailwind.css
│   │
│   ├── (auth)/
│   │   └── login/page.tsx        # Login Super Admin (email/password → dashboard)
│   │
│   ├── (super-admin)/            # Rutas protegidas Super Admin
│   │   ├── layout.tsx            # Auth + AdminShell + Sidebar
│   │   ├── dashboard/page.tsx    # Métricas (empresas activas/suspendidas)
│   │   ├── companies/
│   │   │   ├── page.tsx         # Lista empresas
│   │   │   ├── [id]/page.tsx    # Detalle/edición empresa
│   │   │   └── new/page.tsx     # Nueva empresa
│   │   ├── plans/page.tsx       # Planes de suscripción
│   │   ├── onboarding/solicitudes/page.tsx  # Solicitudes de onboarding
│   │   ├── tickets/page.tsx     # Tickets de soporte
│   │   └── herramientas/page.tsx
│   │
│   ├── [subdomain]/              # Rutas por tenant (slug = subdomain)
│   │   ├── layout.tsx           # Tema tenant (CSS vars), TenantShell, preconnect Cloudinary
│   │   ├── page.tsx             # Home del negocio (HomeClient + sucursales)
│   │   ├── login/page.tsx       # Login panel tenant (TenantLoginShell)
│   │   ├── admin/page.tsx       # Panel admin tenant (auth + AdminApp)
│   │   ├── menu/
│   │   │   ├── page.tsx         # Menú público (MenuClient + productos por branch)
│   │   │   ├── manifest.webmanifest/route.ts
│   │   │   └── sw.js/route.ts   # Service worker offline
│   │   ├── tenant-favicon/      # Favicon dinámico por empresa
│   │   ├── tenant.css
│   │   └── styles/              # CSS por pantalla (Login, Menu, Admin*, etc.)
│   │
│   ├── onboarding/              # Flujo público de alta
│   │   ├── layout.tsx           # Cabecera + link “Ya tengo cuenta”
│   │   ├── page.tsx             # Paso 1: formulario (OnboardingStep1Form)
│   │   ├── verify/page.tsx      # Verificación email (token)
│   │   ├── pago/page.tsx        # Pago (Stripe/checkout)
│   │   └── complete/page.tsx   # Post-pago (CheckoutSuccessFinalize)
│   │
│   ├── checkout/
│   │   ├── success/page.tsx     # Redirect éxito pago
│   │   └── cancel/page.tsx      # Redirect cancelación pago
│   │
│   └── api/                     # API Routes
│       ├── onboarding/          # application, apply, verify, checkout, complete, delete, finalize, expire-unverified
│       ├── admin-modules/      # Módulos admin (tenant)
│       ├── admin-permissions/
│       ├── broadcasts/          # Super Admin
│       ├── tenant-broadcasts/
│       ├── tenant-staff/
│       ├── tenant-tickets/     # + [id]/messages
│       ├── tickets/             # Super Admin
│       ├── tickets/[id]/messages/
│       ├── roles/
│       └── superadmin-user/
│
├── components/
│   ├── theme/                   # SaasThemeScope, theme-toggle
│   ├── ui/                      # badge, button, card, checkbox, input, modal, skeleton
│   ├── onboarding/              # OnboardingStep1Form, OnboardingStep2Form, CheckoutSuccessFinalize
│   ├── super-admin/             # Panel Super Admin
│   │   ├── admin-shell.tsx      # Layout + Sidebar
│   │   ├── sidebar.tsx
│   │   ├── companies-view.tsx, company-form.tsx, company-*-tab.tsx, companies-table.tsx
│   │   ├── branches-*, roles-manager, broadcast-manager, tickets-manager
│   │   ├── admin-modules-manager, metric-card, branding-preview, etc.
│   │   └── AnimatedLogo.tsx
│   └── tenant/                  # Sitio y panel del negocio
│       ├── tenant-shell.tsx     # Wrapper con parallax y anti-zoom
│       ├── home-client.tsx      # Home (sucursales, horario, ContactBranchModal)
│       ├── menu-client.tsx      # Menú (productos, carrito, BranchSelectorModal)
│       ├── store-unavailable.tsx
│       ├── tenant-login-shell.tsx, tenant-login-form (no usado en kit; login usa shell)
│       ├── branch-selector-modal.tsx   # Selección sucursal (menú)
│       ├── contact-branch-modal.tsx     # Contacto sucursal (home)
│       ├── navbar.tsx, product-card.tsx, cart-float.tsx, cart-modal.tsx
│       ├── cart-provider.tsx, cart-context.tsx, use-cart.ts  # Estado carrito (Zustand + context)
│       ├── orders-service.ts, use-anti-zoom.ts
│       ├── utils/               # cloudinary, safe-ids, tenant-route (no formatters; se usa kit)
│       └── admin/
│           ├── admin-app.tsx    # Punto de entrada: providers + AdminPage (kit)
│           └── kit/              # Todo el panel admin del tenant (JS/JSX)
│               ├── admin/pages/Admin.jsx, AdminProvider.jsx
│               ├── admin/components/  # AdminSidebar, AdminKanban, OrderCard, ManualOrderModal, etc.
│               ├── admin/components/caja/  # CashManager, CashShiftModal, CashOrderDetailPanel, etc.
│               ├── admin/services/cashService.js
│               ├── admin/hooks/useManualOrder.js, useCashSystem.js
│               ├── admin/utils/receiptPrinting.js
│               ├── products/components/ProductModal, CategoryModal, ProductCard
│               ├── cart/components/CartModal.jsx, CartFloat.jsx (kit; uso interno)
│               ├── cart/hooks/useCart.js, cart-context.js
│               ├── orders/services/orders.js
│               ├── context/      # LocationContext, CashContext, BusinessContext
│               ├── lib/         # supabase.js, supabaseTables.js
│               └── shared/utils/ # formatters.js, orderUtils.js, exportUtils.js, cloudinary.js, safeIds.js
│
├── utils/
│   ├── supabase/                # client.ts, server.ts, auth-scope.ts
│   ├── admin.ts, admin/server-auth.ts
│   ├── tenant-cache.ts          # getCachedCompany(subdomain)
│   ├── tenant-url.ts, cn.ts, audit.ts
│
├── lib/
│   └── onboarding/              # emails.ts, recaptcha.ts
│
├── pages/
│   └── api/
│       └── client-info.ts       # Endpoint legacy (Pages Router)
│
├── public/                      # Fuentes, SVGs tenant, placeholders, favicons
├── next.config.ts
├── tailwind.config.js
├── babel.config.js
└── eslint.config.mjs
```

---

## 3. Cómo funciona cada flujo

### 3.1 Entrada y redirección (raíz)

- **`/`** (`app/page.tsx`):
  - Si `host === "godcode.me"` o `"www.godcode.me"` → `redirect("/login")`.
  - Si `host` coincide con `([^.]+).godcode.me` → `redirect(\`/${subdomain}\`)` (ej: `mi-tienda` → `/mi-tienda`).
  - En otros casos devuelve `null` (página en blanco o 404 según configuración).

### 3.2 Login Super Admin

- **`/login`** (`app/(auth)/login/page.tsx`): formulario cliente (email/password). Usa `createSupabaseBrowserClient("super-admin")` y redirige al dashboard tras login correcto.
- **`(super-admin)/layout.tsx`:** obtiene usuario con `createSupabaseServerClient()`, comprueba que exista en `admin_users` con rol `super_admin`; si no, `redirect("/login")`. Renderiza `AdminShell` + `Sidebar` y las rutas hijas (dashboard, companies, plans, tickets, etc.).

### 3.3 Tenant (subdominio)

- **`[subdomain]`** es el segmento dinámico; en producción suele ser el primer segmento del host (ej: `mi-tienda` en `mi-tienda.godcode.me`).
- **`app/[subdomain]/layout.tsx`:**
  - Carga empresa con `getCachedCompany(subdomain)` (cache en memoria por slug).
  - Genera metadata (título, favicon) y variables CSS del tema (colores, fondo).
  - Inyecta `<link rel="preconnect">` a Cloudinary y envuelve en `TenantShell` (parallax, anti-zoom).
- **`/[subdomain]`** (`page.tsx`): si no hay empresa o está suspendida/cancelada → `StoreUnavailable`. Si no, carga sucursales, turnos abiertos y `business_info`; pasa props a `HomeClient` (nombre, logo, horario, sucursales con estado ABIERTO/CERRADO).
- **`/[subdomain]/login`:** carga empresa, tema (primaryColor, etc.) y renderiza `TenantLoginShell` (formulario de login del panel del negocio). Tras login, el usuario va a `/[subdomain]/admin`.
- **`/[subdomain]/admin`** (`admin/page.tsx`): servidor comprueba sesión (`createSupabaseServerClient("tenant")`), que el usuario exista en `users` para esa empresa y tenga rol permitido (`admin`/`ceo`/`cashier`). Carga módulos dinámicos (`saas_admin_modules`) y opciones de pestañas. Renderiza `AdminApp` con `companyId`, `companyName`, `logoUrl`, `userEmail`, permisos y módulos.
- **`AdminApp`** (`components/tenant/admin/admin-app.tsx`): envuelve en `LocationProvider` → `CashProvider` → `BusinessProvider` → `AdminProvider` → `AdminPage` (kit). `AdminPage` es el panel completo: sidebar, pestañas (Kanban, Historial, Clientes, Inventario, Caja, Analíticas, Config, Peligro, etc.), modales y servicios (órdenes, caja, productos, clientes).
- **`/[subdomain]/menu`:** página servidor que carga productos por categoría, precios por sucursal y datos del negocio; pasa todo a `MenuClient`. El menú puede filtrar por `branch` (query). Incluye PWA (manifest, sw.js).

### 3.4 Onboarding (nuevos negocios)

- **`/onboarding`:** formulario paso 1 (`OnboardingStep1Form`). Envío → API `apply` (crea solicitud, envía email verificación).
- **`/onboarding/verify`:** verificación con token; redirige a pago o completado según estado.
- **`/onboarding/pago`:** página de pago (Stripe/checkout).
- **`/checkout/success`** y **`/checkout/cancel`:** redirecciones post-pago.
- **`/onboarding/complete`:** finalización del proceso (CheckoutSuccessFinalize).
- APIs: `application`, `apply`, `verify`, `checkout`, `complete`, `delete`, `finalize`, `expire-unverified`.

### 3.5 APIs principales

| Ruta API | Uso |
|----------|-----|
| `onboarding/*` | Flujo de alta y pago |
| `admin-modules` | Módulos visibles en panel tenant |
| `admin-permissions` | Permisos por rol |
| `tenant-broadcasts`, `broadcasts` | Avisos |
| `tenant-staff` | Staff del tenant |
| `tenant-tickets`, `tickets` | Tickets de soporte (tenant y super-admin) |
| `roles` | Roles (super-admin) |
| `superadmin-user` | Usuario super-admin |

---

## 4. Componentes clave por zona

### 4.1 Tenant público (home + menú)

- **TenantShell:** layout cliente (parallax, anti-zoom, capas de contenido).
- **HomeClient:** lista de sucursales, horario, modal de contacto (`ContactBranchModal`).
- **MenuClient:** productos por categoría, selector de sucursal (`BranchSelectorModal`), carrito flotante y modal de carrito. Usa `CartProvider` (Zustand + hidratación) y `orders-service` para crear pedidos (con comprobante y `payment_method_specific`).

### 4.2 Panel admin del tenant (kit)

- **Admin.jsx:** estado global (productos, categorías, órdenes, clientes, sucursales, pestaña activa, modales). Carga datos con Supabase y servicios; lazy-load de Analíticas, Clientes, Inventario, Historial, Caja.
- **AdminSidebar.jsx:** navegación por pestañas (Kanban, Historial, Clientes, Inventario, Caja, Analíticas, Configuración, Peligro, Soporte) y módulos dinámicos. Respeta roles y `userAllowedTabs`.
- **AdminProvider.jsx:** contexto con `companyId`, permisos, módulos y estado de navegación.
- **Contextos:** `LocationContext` (sucursal seleccionada), `CashContext` (turnos de caja), `BusinessContext` (datos del negocio).
- **Caja:** `CashManager`, `CashShiftModal`, `CashShiftDetailModal`, `CashOrderDetailPanel`, `CashMovementModal`; servicio `cashService.js`.
- **Órdenes:** `orders.js` (createOrder con RPC, `payment_method_specific`); `orderUtils.js` (etiquetas de pago, slug para analíticas).
- **Productos/Categorías:** `ProductModal`, `CategoryModal`, `InventoryCard`, `ProductCard` (kit).

### 4.3 Super Admin

- **AdminShell + Sidebar:** rutas a dashboard, empresas, planes, onboarding/solicitudes, tickets, herramientas.
- **Companies:** lista, detalle por `[id]`, alta nueva; pestañas por empresa (datos, sucursales, branding, etc.).
- **Dashboard:** métricas con `MetricCardClient` (empresas activas/suspendidas, etc.).

### 4.4 Onboarding

- **OnboardingStep1Form / OnboardingStep2Form:** formularios del flujo.
- **CheckoutSuccessFinalize:** pantalla post-pago.
- **lib/onboarding/emails.ts:** envío de correos; **recaptcha.ts** para verificación.

---

## 5. Datos y autenticación

- **Supabase:** cliente público (`createSupabasePublicServerClient`) para datos no protegidos (empresa por slug, productos, branches). Cliente autenticado con scope `"tenant"` o `"super-admin"` según zona (`createSupabaseServerClient`, `createSupabaseBrowserClient`).
- **Tenant cache:** `getCachedCompany(subdomain)` en `utils/tenant-cache.ts` para evitar golpear BD en cada request del subdominio.
- **Auth:** Super Admin usa `admin_users`; tenant usa `users` (por `company_id` + `auth_user_id` o email). RLS en Supabase restringe por empresa/rol donde aplica.

---

## 6. Utilidades compartidas

- **Kit shared:** `formatters.js` (moneda, RUT, tiempo), `orderUtils.js` (métodos de pago, online/tienda), `exportUtils.js` (Excel), `cloudinary.js`, `safeIds.js`.
- **Utils raíz:** `tenant-url.ts`, `tenant-cache.ts`, `cn.ts`, `audit.ts`, `admin.ts`, `admin/server-auth.ts`.

---

## 7. Build y despliegue

- **Comandos:** `npm run build`, `npm run start` (Next escucha en `0.0.0.0`).
- **Imágenes:** `next.config.ts` usa `images.remotePatterns` (Cloudinary, Unsplash).
- **watchOptions:** se ignoran `supabase-functions-backup`, `tenant-template`, `_vercel_exclude` en dev.

---

## 8. Robustez y fallos corregidos / pendientes

### Corregido

- **`app/layout.tsx`:** El preconnect apuntaba a `https://YOUR_SUPABASE_PROJECT.supabase.co` (placeholder). Ahora usa `process.env.NEXT_PUBLIC_SUPABASE_URL` si existe; si no, no se inserta el `<link>`.

### Puntos de atención (sin cambiar comportamiento)

- **Catch vacíos:** Hay muchos `catch { }` o `catch (_) {}` (cookies en `utils/supabase/server.ts`, hidratación en `cart-provider`, `JSON.parse` en AdminDangerZone/orderUtils, localStorage en LocationContext, etc.). La mayoría son intencionales (fallback silencioso). En APIs o en `loadData` del kit, si en el futuro se quiere depurar mejor, se puede hacer `catch (e) { console.error(...); throw e; }` o devolver un 500 con mensaje genérico sin filtrar detalles sensibles.

- **Layout tenant con subdominio inexistente:** Si `getCachedCompany(subdomain)` devuelve `null`, el layout sigue renderizando con colores por defecto y las páginas hijas deciden: `/[subdomain]` → StoreUnavailable, `/[subdomain]/admin` → redirect a `/`. `/[subdomain]/login` muestra el formulario con "Panel privado". Es coherente; si se quisiera UX más estricta (404 para cualquier ruta bajo subdominio inexistente), se podría llamar a `notFound()` desde el layout cuando `!company`.

- **Dashboard Super Admin:** El KPI "MRR" está fijo en `$0` con el texto "Placeholder hasta integrar facturacion". Es intencional hasta tener integración de facturación.

- **AdminProvider (kit):** El audio de notificación se carga con `new Audio('/sounds/notification.mp3')` en un try/catch vacío. Si el archivo no existe o falla la carga, no hay feedback; opcionalmente se podría comprobar que el recurso exista en `public/sounds/` o desactivar el sonido en entornos donde no esté el asset.

- **orderUtils / sanitizeOrder:** Ya contemplan `order === null` y devuelven valores por defecto; no hay riesgo de crash por null en los componentes que usan `getPaymentLabel`, `getPaymentSlug`, `isOnlineOrder`.

Este documento refleja la estructura y el flujo tras la limpieza de archivos no usados (admin-page/admin-provider/admin-sidebar antiguos, tenant-brand, formatters.ts tenant, textarea UI, kit Menu/Navbar/Home/Login/ProtectedRoute/useFilteredProducts, BranchSelectorModal/ContactBranchModal del kit, admin-page.css, head.tsx y contenido de supabase-functions-backup).
