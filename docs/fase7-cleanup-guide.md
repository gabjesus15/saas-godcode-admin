# Fase 7 - Limpieza post-migracion

## Resumen

Una vez que el microservicio `onboarding-billing` esta validado en produccion,
esta guia describe como hacer la transicion final y limpiar el codigo duplicado.

## Proceso de migracion gradual

El feature flag `FF_ONBOARDING_BILLING_EXTERNAL` tiene 3 modos:

| Valor | Modo | Comportamiento |
|---|---|---|
| `false` | Off | Logica local del BFF (sin proxy) |
| `true` | On | Proxy al microservicio, con fallback a logica local si falla |
| `proxy_only` | Proxy-only | Solo proxy, sin fallback. Error 502 si el micro no responde |

### Ruta de migracion recomendada

```
false  -->  true  -->  proxy_only  -->  borrar logica local
 (1)         (2)          (3)              (4)
```

1. **false**: Estado inicial. Todo funciona con logica local.
2. **true**: Proxy activo con safety net. Si el micro falla, el BFF responde con logica local.
3. **proxy_only**: Todo pasa por el micro. Si falla, se retorna 502. Esto permite detectar
   cualquier dependencia residual en la logica local.
4. **Borrar logica local**: Cuando `proxy_only` funciona estable por 1-2 semanas,
   es seguro borrar la logica local.

## Paso 3: Activar proxy_only

```bash
# En Vercel (BFF), cambiar:
FF_ONBOARDING_BILLING_EXTERNAL=proxy_only
```

Redesplegar y monitorear:
- Verificar que `/api/health` del BFF reporta `proxy.status: "reachable"`
- Revisar logs en Vercel por errores `proxy_error`
- Verificar que el header `x-proxy-mode: proxy_only` esta presente en las respuestas

### Rollback

Si algo falla, cambiar a `true` (proxy + fallback) o `false` (logica local pura).

## Paso 4: Borrar logica local (cuando estes listo)

### Archivos a simplificar (16 route handlers en el BFF)

Cada ruta se puede reducir a solo el proxy. Ejemplo:

**Antes** (`app/api/onboarding/addons/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

export async function GET(req: NextRequest) {
  const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/addons");
  if (proxied) return proxied;
  // ... 15 lineas de logica local ...
}
```

**Despues** (solo proxy):
```typescript
import { NextRequest } from "next/server";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

export async function GET(req: NextRequest) {
  return proxyToOnboardingBilling(req, "/api/onboarding/addons");
}
```

### Rutas a simplificar

- `app/api/onboarding/addons/route.ts`
- `app/api/onboarding/application/route.ts`
- `app/api/onboarding/apply/route.ts`
- `app/api/onboarding/bcv-rate/route.ts`
- `app/api/onboarding/check-beta/route.ts`
- `app/api/onboarding/checkout/route.ts`
- `app/api/onboarding/complete/route.ts`
- `app/api/onboarding/delete/route.ts`
- `app/api/onboarding/expire-unverified/route.ts`
- `app/api/onboarding/finalize/route.ts`
- `app/api/onboarding/paypal-capture/route.ts`
- `app/api/onboarding/plan-payment-methods/route.ts`
- `app/api/onboarding/upload-payment-reference/route.ts`
- `app/api/onboarding/verify/route.ts`
- `app/api/super-admin/payments/validate/route.ts`
- `app/api/cron/subscription-status/route.ts`

### Dependencias que se pueden remover del BFF (despues de limpiar)

Si ya ninguna otra parte del BFF usa estos modulos, se pueden eliminar:

- `lib/onboarding/checkout-service.ts`
- `lib/onboarding/billing-activation.ts`
- `lib/onboarding/welcome-provisioning.ts`
- `lib/onboarding/emails.ts`
- `lib/onboarding/recaptcha.ts`

**Verificar antes de borrar** que ningun otro archivo del BFF los importa:
```bash
rg "from.*lib/onboarding/" app/ components/ --files-with-matches
```

### Dependencias npm que podrian removerse

Si `@paypal/paypal-server-sdk` y `stripe` solo se usan en las rutas de onboarding:
```bash
rg "paypal-server-sdk|from.*stripe" app/ components/ lib/ --files-with-matches
```

## Checklist final

- [ ] `proxy_only` estable en produccion por 1-2 semanas
- [ ] Todas las rutas de onboarding responden correctamente via proxy
- [ ] Cron `subscription-status` funciona via proxy
- [ ] No hay errores `proxy_error` en los logs de Vercel
- [ ] Simplificar las 16 rutas a solo proxy
- [ ] Verificar que ningun otro codigo del BFF importa los modulos de `lib/onboarding/`
- [ ] Borrar modulos no usados de `lib/onboarding/`
- [ ] Remover dependencias npm no usadas si aplica
- [ ] Ejecutar `npm test` para verificar que nada se rompio
- [ ] Commit y deploy
