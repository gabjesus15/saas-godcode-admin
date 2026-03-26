# Fase 3 - Guia de Migracion: Microservicio onboarding-billing

## Arquitectura

```
BFF (Next.js en Vercel A)
  |
  |--> Feature Flag OFF: logica local (lib/onboarding/*)
  |
  |--> Feature Flag ON: proxy HTTP --> Microservicio (Vercel B)
                                         |
                                         |--> Supabase (misma BD)
                                         |--> Stripe / PayPal / Resend
```

El BFF conserva toda la logica local. Cuando `FF_ONBOARDING_BILLING_EXTERNAL=true`,
las 16 rutas del dominio onboarding/billing hacen proxy transparente al microservicio.

## Variables de entorno

### En el BFF (proyecto raiz)

| Variable | Valor | Descripcion |
|---|---|---|
| `FF_ONBOARDING_BILLING_EXTERNAL` | `false` (default) | Activa/desactiva el proxy |
| `ONBOARDING_BILLING_SERVICE_URL` | `https://onboarding-billing-xxx.vercel.app` | URL del microservicio |
| `SERVICE_API_KEY` | `<secret-compartido>` | Clave compartida para auth inter-servicio |

### En el microservicio (services/onboarding-billing)

Todas las variables de Supabase, Stripe, PayPal, Resend, reCAPTCHA, cron, etc.
deben configurarse identicas al BFF. Adicionalmente:

| Variable | Descripcion |
|---|---|
| `SERVICE_API_KEY` | Misma clave que el BFF (para validar requests del proxy) |

## Crear proyecto Vercel B

1. En el dashboard de Vercel, crear un nuevo proyecto
2. Conectar al repositorio `saas-godcode-admin`
3. En Settings > General > Root Directory: `services/onboarding-billing`
4. En Settings > Environment Variables: copiar todas las variables del BFF + `SERVICE_API_KEY`
5. Deploy

## Activar la migracion

1. Verificar que `/api/health` del microservicio responde `200 healthy`
2. En el BFF, cambiar `FF_ONBOARDING_BILLING_EXTERNAL=true`
3. Configurar `ONBOARDING_BILLING_SERVICE_URL` con la URL de Vercel B
4. Redesplegar el BFF

## Rollback inmediato

1. Cambiar `FF_ONBOARDING_BILLING_EXTERNAL=false` en las env vars del BFF
2. Redesplegar el BFF
3. El trafico vuelve a usar la logica local. No se pierden datos porque ambos
   servicios usan la misma base de datos Supabase.

## Rutas migradas (16 endpoints)

### Onboarding (14)
- POST `/api/onboarding/apply`
- GET `/api/onboarding/verify`
- POST `/api/onboarding/complete`
- POST `/api/onboarding/checkout`
- POST `/api/onboarding/finalize`
- GET `/api/onboarding/addons`
- GET `/api/onboarding/application`
- GET `/api/onboarding/bcv-rate`
- GET `/api/onboarding/check-beta`
- DELETE `/api/onboarding/delete`
- POST `/api/onboarding/expire-unverified`
- GET `/api/onboarding/paypal-capture`
- GET `/api/onboarding/plan-payment-methods`
- POST `/api/onboarding/upload-payment-reference`

### Super Admin (1)
- POST `/api/super-admin/payments/validate`

### Cron (1)
- GET/POST `/api/cron/subscription-status`

## Checklist de verificacion funcional

Usar el checklist existente en `docs/onboarding-billing-regression-checklist.md`.
Ejecutar ANTES y DESPUES de activar el feature flag para verificar equivalencia.

### Tests adicionales para el proxy

- [ ] Con `FF_ONBOARDING_BILLING_EXTERNAL=false`, todo funciona como antes
- [ ] Con `FF_ONBOARDING_BILLING_EXTERNAL=true`, la response incluye header `x-proxied-to: onboarding-billing`
- [ ] `/api/health` del microservicio responde healthy
- [ ] Error en microservicio: el proxy devuelve null y se ejecuta la logica local (fallback)
- [ ] Ruta protegida (super-admin validate) rechaza requests sin `x-internal-api-key`
- [ ] Cron subscription-status funciona con `Authorization: Bearer <CRON_SECRET>`

## Estructura del microservicio

```
services/onboarding-billing/
  package.json
  next.config.ts
  tsconfig.json
  vercel.json
  .env.example
  app/
    layout.tsx
    page.tsx
    api/
      health/route.ts
      onboarding/
        apply/route.ts
        verify/route.ts
        complete/route.ts
        checkout/route.ts
        finalize/route.ts
        addons/route.ts
        application/route.ts
        bcv-rate/route.ts
        check-beta/route.ts
        delete/route.ts
        expire-unverified/route.ts
        paypal-capture/route.ts
        plan-payment-methods/route.ts
        upload-payment-reference/route.ts
      super-admin/payments/validate/route.ts
      cron/subscription-status/route.ts
  lib/
    supabase-admin.ts
    env.ts
    logger.ts
    app-url.ts
    api-key-auth.ts
    onboarding/
      billing-activation.ts
      checkout-service.ts
      welcome-provisioning.ts
      emails.ts
      recaptcha.ts
```
