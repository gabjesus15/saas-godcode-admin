# Fase 5 - Despliegue en Vercel: Microservicio onboarding-billing

## Prerequisitos

- Cuenta de Vercel con acceso al repo `gabjesus15/saas-godcode-admin`
- Branch `dev/microservices-refactor` pusheado y actualizado
- API key compartida generada (ver seccion de variables)

## Paso 1: Crear proyecto en Vercel

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Seleccionar **Import Git Repository** > `gabjesus15/saas-godcode-admin`
3. **IMPORTANTE** - Antes de hacer deploy, configurar:
   - **Project Name**: `onboarding-billing` (o el nombre que prefieras)
   - **Framework Preset**: Next.js (se detecta automaticamente)
   - **Root Directory**: click en **Edit** y escribir `services/onboarding-billing`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
4. En la seccion **Environment Variables**, agregar TODAS las variables listadas abajo
5. Click en **Deploy**

## Paso 2: Variables de entorno del microservicio

Estas variables deben configurarse en el proyecto de Vercel del microservicio.
Copiar los valores de tu BFF (proyecto principal) excepto donde se indique.

### Obligatorias

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oacoilyiquawwzexvxxi.supabase.co` | Mismo que BFF |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (tu anon key) | Mismo que BFF |
| `SUPABASE_SERVICE_ROLE_KEY` | (tu service role key) | Mismo que BFF |
| `NEXT_PUBLIC_TENANT_BASE_DOMAIN` | `www.godcode.me` | Mismo que BFF |
| `NEXT_PUBLIC_TENANT_PROTOCOL` | `https` | Usar `https` en produccion |
| `SERVICE_API_KEY` | (generar un secret de 64 chars) | **Mismo valor en BFF y microservicio** |

### Pagos

| Variable | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | (tu Stripe secret key) |
| `STRIPE_SUCCESS_URL` | `https://www.godcode.me/checkout/success` |
| `STRIPE_CANCEL_URL` | `https://www.godcode.me/onboarding/pago` |
| `PAYPAL_CLIENT_ID` | (tu PayPal client ID) |
| `PAYPAL_CLIENT_SECRET` | (tu PayPal secret) |

### Emails

| Variable | Valor |
|---|---|
| `RESEND_API_KEY` | (tu Resend API key) |
| `RESEND_FROM` | `noreply@godcode.me` |

### Opcionales

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://www.godcode.me` |
| `RECAPTCHA_SECRET_KEY` | (si usas reCAPTCHA) |
| `CRON_SECRET` | (para proteger endpoints cron) |

## Paso 3: Verificar el deploy

Una vez desplegado, abrir en el navegador:

```
https://tu-proyecto-onboarding-billing.vercel.app/api/health
```

Debe responder:

```json
{
  "service": "onboarding-billing",
  "status": "healthy",
  "checks": {
    "database": "ok",
    "env_supabase_url": "ok",
    "env_service_role": "ok",
    "env_service_api_key": "ok"
  }
}
```

Si alguno dice `"missing"` o `"unhealthy"`, revisa las variables de entorno.

## Paso 4: Activar el proxy en el BFF

En el proyecto de Vercel del **BFF principal** (`saas-godcode-admin`),
agregar o actualizar estas 3 variables:

| Variable | Valor |
|---|---|
| `FF_ONBOARDING_BILLING_EXTERNAL` | `true` |
| `ONBOARDING_BILLING_SERVICE_URL` | `https://tu-proyecto-onboarding-billing.vercel.app` |
| `SERVICE_API_KEY` | (mismo valor que en el microservicio) |

Luego redesplegar el BFF (Settings > Deployments > Redeploy).

## Paso 5: Verificar el proxy

Hacer una peticion a cualquier ruta de onboarding del BFF y verificar
que la respuesta incluye el header:

```
x-proxied-to: onboarding-billing
```

Ejemplo con curl:

```bash
curl -I https://www.godcode.me/api/onboarding/addons
# Buscar: x-proxied-to: onboarding-billing
```

## Rollback inmediato

Si algo falla:

1. En el proyecto de Vercel del BFF, cambiar `FF_ONBOARDING_BILLING_EXTERNAL` a `false`
2. Redesplegar el BFF
3. Todo vuelve a funcionar con logica local. No se pierden datos (misma BD).

## Configurar Cron en Vercel (opcional)

Si usas el endpoint `/api/cron/subscription-status` con Vercel Cron:

1. Crear `vercel.json` en el microservicio (ya existe) o agregar cron config:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-status",
      "schedule": "0 3 * * *"
    }
  ]
}
```

2. Configurar `CRON_SECRET` con el mismo valor en ambos proyectos.

**Nota**: Si el cron ya corre en el BFF y el proxy esta activo,
no necesitas configurarlo tambien en el microservicio. El BFF
redirigira la peticion automaticamente.
