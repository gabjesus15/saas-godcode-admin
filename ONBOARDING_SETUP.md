# Configuración del Onboarding

Sistema de onboarding para nuevos negocios con verificación de email, formulario avanzado y pago con Stripe.

## 1. Base de datos

Ejecuta la migración en el SQL Editor de Supabase:

```bash
# El archivo está en:
# supabase/migrations/20250311000000_onboarding_applications.sql
```

O copia y ejecuta el contenido del archivo en Supabase Dashboard → SQL Editor → New Query.

## 2. Variables de entorno

Añade a tu `.env`:

```env
# Emails (Resend)
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM=onboarding@tudominio.com

# Notificaciones al equipo (opcional)
ONBOARDING_TEAM_EMAIL=equipo@tudominio.com

# reCAPTCHA (opcional, si no configuras pasa sin validar)
RECAPTCHA_SITE_KEY=6Lcxxxx
RECAPTCHA_SECRET_KEY=6Lcxxxx

# Stripe (para checkout)
STRIPE_SECRET_KEY=sk_xxxx
STRIPE_SUCCESS_URL=https://tudominio.com/checkout/success
STRIPE_CANCEL_URL=https://tudominio.com/onboarding/pago

# URL base de la app (para links en emails)
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 3. Rutas

| Ruta | Descripción | Público |
|------|-------------|---------|
| `/onboarding` | Formulario inicial de solicitud | Sí |
| `/onboarding/verify?token=...` | Verificación de email (redirect automático) | Sí |
| `/onboarding/complete?token=...` | Formulario avanzado post-verificación | Sí (con token) |
| `/onboarding/pago?token=...` | Paso de pago con Stripe | Sí (con token) |
| `/onboarding/solicitudes` | Dashboard interno de solicitudes | No (super-admin) |

## 4. Flujo

1. Usuario completa formulario inicial → email de verificación
2. Clic en link del email → `/onboarding/verify` → `/onboarding/complete`
3. Usuario completa datos avanzados + plan → `/onboarding/pago`
4. Usuario paga con Stripe → redirect a `/checkout/success`
5. La página de éxito llama a `/api/onboarding/finalize` para crear usuario y enviar email de bienvenida

## 5. reCAPTCHA

Para habilitar reCAPTCHA v2 o v3:

1. Crea un sitio en [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Añade `RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY` al `.env`
3. En el formulario inicial, incluye el widget de reCAPTCHA y envía el token en `recaptcha_token`

Si no configuras las variables, la validación se omite (modo desarrollo).

## 6. Webhook de Stripe

El flujo usa la API de Stripe directamente desde Next.js. Opcionalmente puedes actualizar el webhook de Stripe (`stripe-webhook`) para marcar `payments_history.status = "paid"` cuando ya existe el registro. El endpoint `/api/onboarding/finalize` puede verificar el pago con la API de Stripe si el status sigue en "pending".
