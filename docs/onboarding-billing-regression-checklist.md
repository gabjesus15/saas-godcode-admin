# Onboarding + Billing Regression Checklist

Este checklist define la validacion de no-regresion para cambios en:

- `app/api/onboarding/*`
- `app/api/super-admin/payments/validate/route.ts`
- `app/api/cron/subscription-status/route.ts`
- `app/api/tenant-payment-methods/*`

Objetivo: asegurar que cada refactor mantiene comportamiento igual o mejor, sin perdida funcional.

## 1) Precondiciones de prueba

- Branch activa: `dev/microservices-refactor`.
- Servidor local levantado: `http://localhost:3000`.
- Variables de entorno de pagos y correo configuradas en `.env`.
- Datos base disponibles:
	- 1 solicitud onboarding en estado `form_completed`.
	- 1 solicitud onboarding con metodo manual (`pago_movil`, `zelle` o `transferencia`).
	- 1 solicitud onboarding con metodo `stripe`.
	- 1 solicitud onboarding con metodo `paypal`.
	- 1 usuario super admin valido.

## 2) Casos criticos (bloqueantes)

### C1. Onboarding checkout manual crea pago pendiente de validacion

- Endpoint: `POST /api/onboarding/checkout`
- Entrada: token valido de solicitud con metodo manual y `months`.
- Esperado:
	- responde `200` con `manual: true`.
	- retorna `payment_reference` y `payment_id`.
	- inserta en `payments_history` con `status = pending_validation`.
	- empresa queda `subscription_status = payment_pending`.

### C2. Validacion manual desde super admin activa suscripcion

- Endpoint: `POST /api/super-admin/payments/validate`
- Entrada: `payment_id` o `payment_reference` de pago `pending_validation`.
- Esperado:
	- responde `200` con `ok: true`.
	- actualiza `payments_history.status` a `paid`.
	- actualiza `companies.subscription_status` a `active`.
	- define `subscription_ends_at`.

### C3. Finalize onboarding con pago ya aprobado

- Endpoint: `POST /api/onboarding/finalize?ref=...`
- Entrada: referencia de pago `paid` o `approved`.
- Esperado:
	- responde `200` con `ok: true`.
	- activa suscripcion de la empresa.
	- crea usuario auth y registro en `users` rol `ceo` (si no existia).
	- marca `onboarding_applications.status = active`.
	- define `welcome_email_sent_at`.

### C4. Activacion de addons del onboarding

- Flujo: ejecutar C2 o C3 sobre solicitud con addons.
- Esperado:
	- inserta/actualiza filas en `company_addons`.
	- `status = active`.
	- `expires_at` solo para addons `monthly`.

### C5. Idempotencia basica de finalize

- Flujo: ejecutar `POST /api/onboarding/finalize?ref=...` dos veces.
- Esperado:
	- segunda ejecucion no duplica usuario ni rompe flujo.
	- respuesta controlada (`alreadySent` o mensaje equivalente).

## 3) Casos importantes (no bloqueantes)

### I1. Checkout Stripe crea sesion y referencia

- Endpoint: `POST /api/onboarding/checkout`
- Entrada: solicitud con metodo `stripe`.
- Esperado:
	- responde `200` con `url` y `sessionId`.
	- inserta pago `pending` en `payments_history`.

### I2. Checkout PayPal crea orden y enlace approve

- Endpoint: `POST /api/onboarding/checkout`
- Entrada: solicitud con metodo `paypal`.
- Esperado:
	- responde `200` con `url` y `sessionId`.
	- inserta pago `pending` en `payments_history`.

### I3. Validate rechaza pagos no pendientes

- Endpoint: `POST /api/super-admin/payments/validate`
- Entrada: pago ya `paid`.
- Esperado:
	- responde `400`.
	- mensaje de estado no valido para validar.

### I4. Finalize con referencia inexistente

- Endpoint: `POST /api/onboarding/finalize?ref=no-existe`
- Esperado:
	- responde `404` con error de pago no encontrado.

## 4) Matriz de equivalencia funcional

En cada release de refactor, comparar contra baseline anterior:

- Contrato HTTP:
	- mismo endpoint.
	- mismo metodo.
	- mismo status code para mismo escenario.
	- mismas claves de respuesta esenciales (`ok`, `error`, `message`, `payment_reference`, `sessionId`).
- Efectos de datos:
	- mismas tablas afectadas.
	- mismos estados finales (`payments_history`, `companies`, `onboarding_applications`, `company_addons`, `users`).
- Comportamiento operativo:
	- sin duplicados de usuario.
	- sin estados intermedios invalidos.
	- errores siguen controlados y trazables.

## 5) Check rapido por despliegue

Ejecutar siempre antes de continuar con nueva refactorizacion:

- [ ] C1 ok
- [ ] C2 ok
- [ ] C3 ok
- [ ] C4 ok
- [ ] C5 ok
- [ ] I1 ok
- [ ] I2 ok
- [ ] I3 ok
- [ ] I4 ok

Si algun caso critico falla (C1-C5), se detiene la fase y se corrige antes de avanzar.
