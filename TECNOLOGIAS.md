# Tecnologías, librerías y APIs — saas-godcode-admin

Listado de framework, librerías, servicios y variables de entorno del proyecto.

---

## Framework y runtime

| Tecnología   | Versión  | Uso                                      |
| ------------ | -------- | ---------------------------------------- |
| **Next.js**  | 16.1.6   | Framework React (App Router, SSR, subdominios) |
| **React**    | 19.2.3   | UI                                       |
| **React DOM**| 19.2.3   | Render en el navegador                   |
| **TypeScript** | ^5     | Tipado (dev)                             |
| **Node**     | (implícito) | Entorno de ejecución                  |

---

## Backend y base de datos

| Tecnología                 | Versión  | Uso                                      |
| -------------------------- | -------- | ---------------------------------------- |
| **Supabase**               | —        | BaaS: auth, base de datos, serverless    |
| **@supabase/supabase-js**  | ^2.98.0  | Cliente Supabase (browser/server)        |
| **@supabase/ssr**          | ^0.8.0   | Integración Supabase con SSR (cookies)   |

---

## APIs y servicios externos

| Servicio        | Uso                                                                 |
| --------------- | ------------------------------------------------------------------- |
| **Supabase**    | Base de datos, autenticación, RLS (URL + anon key + service role)   |
| **Cloudinary**  | Subida y gestión de imágenes                                        |
| **Mercado Pago**| Webhooks de pagos (en `supabase-functions-backup`)                  |
| **Stripe**      | Webhooks de pagos (en `supabase-functions-backup`)                  |

---

## UI y estilos

| Tecnología               | Versión  | Uso                          |
| ------------------------- | -------- | ---------------------------- |
| **Tailwind CSS**          | ^4       | Estilos utility-first        |
| **@tailwindcss/postcss**  | ^4       | PostCSS para Tailwind        |
| **lightningcss**          | ^1.31.1  | Procesamiento CSS            |
| **postcss-import**        | ^16.1.0  | Imports en PostCSS           |
| **clsx**                   | ^2.1.1   | Clases condicionales         |
| **tailwind-merge**        | ^3.5.0   | Combinar clases sin conflictos |

---

## Componentes e iconos

| Tecnología           | Versión   | Uso                    |
| --------------------- | --------- | ---------------------- |
| **lucide-react**      | ^0.575.0  | Iconos                 |
| **framer-motion**     | ^12.34.3  | Animaciones            |
| **qrcode.react**      | ^4.2.0    | Códigos QR             |
| **react-chartjs-2**   | ^5.3.1    | Gráficos (wrapper)     |
| **chart.js**          | ^4.5.1    | Motor de gráficos      |

---

## Herramientas de desarrollo

| Tecnología             | Versión  | Uso                              |
| ----------------------- | -------- | -------------------------------- |
| **ESLint**              | ^9       | Linter                           |
| **eslint-config-next**  | 16.1.6   | Reglas Next.js para ESLint       |
| **cross-env**           | ^7.0.3   | Variables de entorno en scripts  |
| **@types/node**         | ^20      | Tipos Node                       |
| **@types/react**        | ^19      | Tipos React                      |
| **@types/react-dom**    | ^19      | Tipos React DOM                  |

---

## Variables de entorno

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Tenant
- `NEXT_PUBLIC_TENANT_BASE_DOMAIN`
- `NEXT_PUBLIC_TENANT_PROTOCOL`

### Cloudinary
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`

### Build / desarrollo
- `NEXT_DISABLE_TURBOPACK`
- `VITE_PUBLIC_COMPANY_SLUG` (slug de empresa en dev)

---

## Resumen

- **Frontend:** Next.js 16, React 19, Tailwind 4, Framer Motion, Lucide, Chart.js, QR.
- **Backend/datos:** Supabase (DB + Auth + SSR).
- **APIs externas:** Supabase, Cloudinary; en backup también Mercado Pago y Stripe.
- **Lenguaje:** JavaScript (JSX) y TypeScript.
- **Arquitectura:** Multi-tenant por subdominio (`[subdomain]`), rutas super-admin y tenant-admin.
