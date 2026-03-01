# saas-godcode-admin

Panel SaaS multi-tenant con Next.js + Supabase.

## Requisitos

- Node.js 20+
- npm 10+
- Proyecto Supabase configurado

## Desarrollo local

1. Copia variables:
   - Duplicar `.env.example` como `.env.local`
2. Instala dependencias:
   - `npm install`
3. Ejecuta:
   - `npm run dev`

## Build de producción (igual que Vercel)

- `npm run build`

## Variables de entorno para Vercel

Configurar en Project Settings → Environment Variables:

### Obligatorias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_TENANT_BASE_DOMAIN`

### Recomendadas

- `NEXT_PUBLIC_TENANT_PROTOCOL` = `https`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Opcionales legacy

- `NEXT_PUBLIC_PUBLIC_COMPANY_SLUG`
- `NEXT_PUBLIC_COMPANY_SLUG`

## Checklist para no fallar en Vercel

- Confirmar que `npm run build` pasa localmente.
- Agregar todas las env vars obligatorias en Vercel para `Production` (y `Preview` si usas previews).
- Verificar que el dominio base en `NEXT_PUBLIC_TENANT_BASE_DOMAIN` coincide con tu wildcard/subdominios.
- Si usas subida de imágenes, configurar también variables de Cloudinary.

## Nota técnica de build

El build de Next excluye carpetas no-app (`supabase-functions-backup/**`, `tenant-template/**`) en `tsconfig.json` para evitar errores de tipado Deno durante deploy.
