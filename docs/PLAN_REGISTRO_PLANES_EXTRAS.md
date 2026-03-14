# Plan: Sistema de registro, planes y servicios extra

Este documento explica el flujo actual de onboarding, por qué el panel de solicitudes muestra poca información útil, y un plan completo para: registro, planes, servicios extra, ciclo de vida del negocio (reactivar/suspender, sin borrado), métodos de pago del plan por país (Chile / Venezuela), pagos manuales y validación desde el SaaS, y sistema de correos automáticos.

---

## 0. Dos conceptos de “método de pago”

| Concepto | Dónde se usa | Quién lo elige |
|----------|--------------|----------------|
| **Método de pago del plan** | Cómo el **negocio paga su suscripción** al SaaS (Stripe, Pago Móvil, Zelle, Transferencia, etc.). | Cliente en el **registro** (paso 2 o 3). Según **país** (Chile / Venezuela) se muestran opciones distintas. |
| **Métodos de pago del negocio** | Formas de pago que el **negocio ofrece a sus clientes** (efectivo, tarjeta, etc.) en sucursales. | Se configuran en la ficha de cada **sucursal** en el panel (ya existe en branches). |

En este plan, “método de pago” sin más se refiere al **método de pago del plan** (suscripción). Los métodos del negocio se gestionan como hoy en sucursales.

---

## 1. Cómo funciona hoy (los 3 formularios del cliente)

El cliente pasa por **3 pasos**; cada uno guarda datos en `onboarding_applications` (y en paso 3 también se crean `companies`, `branches`, `payments_history`).

| Paso | Ruta | Qué completa el cliente | Qué se guarda |
|------|------|-------------------------|---------------|
| **1 – Solicitud** | `/onboarding` | Nombre del negocio, su nombre, email, teléfono, rubro, mensaje | `business_name`, `responsible_name`, `email`, `phone`, `sector`, `message`. Estado: `pending_verification`. Se envía email con link de verificación. |
| **2 – Datos del negocio** | `/onboarding/complete?token=...` | Razón social, logo, dirección fiscal/facturación, RUT, redes, descripción, **plan** (o plan custom), país, moneda, **dominio propio** (opcional) | `legal_name`, `logo_url`, `fiscal_address`, `billing_*`, `social_*`, `description`, **`plan_id`**, **`custom_plan_name`**, **`custom_plan_price`**, **`custom_domain`**, `country`, `currency`, `payment_methods`. Estado: `form_completed`. |
| **3 – Pago** | `/onboarding/pago?token=...` | Meses a pagar, método (Stripe u otros) | Se crean: `companies`, `branches`, `business_info`, registro en `payments_history` (pending). Se actualiza `onboarding_applications`: `company_id`, estado `payment_pending`. Tras pago (Stripe): `finalize` crea usuario y envía bienvenida; estado pasa a `active`. |

Resumen: **formulario 1** = contacto y negocio básico; **formulario 2** = datos legales + **plan y extras** (plan custom, dominio); **formulario 3** = solo pago. Casi toda la información útil para “crear el negocio” y saber qué compró está en el paso 2 y en `payments_history`, pero el panel de solicitudes no la muestra bien.

---

## 2. Por qué el panel de solicitudes no te ayuda tanto

En **Solicitudes** (`/onboarding/solicitudes`) hoy se lista `onboarding_applications` con:

- Negocio, responsable, email, rubro, estado, fecha, `company_id` (link “Ver empresa”), plan_id (solo ID).
- **No se muestra:** nombre del plan, si es plan custom ni precio custom, si pidió dominio propio (`custom_domain`), si ya pagó (estado del pago en `payments_history`), ni datos del paso 2 (razón social, dirección fiscal, etc.).

Por eso:

- No ves de un vistazo **qué plan eligió** ni **qué extras** (dominio, personalización).
- No sabes si **ya pagó** o sigue en “Pago pendiente” solo con el estado de la solicitud.
- Para “crear el negocio” o dar soporte tienes que abrir la empresa (si ya tiene `company_id`) o no tienes un resumen rico de la solicitud.

El sistema **sí** tiene en BD la información (plan_id, custom_plan_*, custom_domain, y pagos en `payments_history`), pero el panel no la expone. El plan que sigue corrige eso y ordena planes y extras.

---

## 3. Plan completo: registro, planes y servicios extra

### Fase A – Panel de solicitudes útil (rápido)

Objetivo: que desde Solicitudes veas todo lo necesario para saber “qué pidió” y “si ya pagó”.

1. **Ampliar datos que se piden a la API**
   - Incluir en el `select` de `onboarding_applications`: `plan_id`, `custom_plan_name`, `custom_plan_price`, `custom_domain`, `legal_name`, `fiscal_address`, `status`, `company_id`, y si hace falta campos ya usados (business_name, email, etc.).
   - Para cada solicitud con `company_id`, opcionalmente hacer un query a `payments_history` (o a un endpoint que devuelva “último pago” por `company_id`) para mostrar “Pagado / Pendiente” y monto/fecha.

2. **Vista en la tabla (o detalle)**
   - **Plan:** mostrar nombre del plan (join con `plans` por `plan_id` o texto “Plan custom: {custom_plan_name} – {custom_plan_price}”).
   - **Extras:** columna o chips “Dominio propio: sí/no” (según `custom_domain`); más adelante “Personalización” si se añade ese extra.
   - **Pago:** columna “Pago” con badge “Pagado” / “Pendiente” (y opcionalmente link a la empresa donde ya se ve el historial de pagos).

3. **Vista detalle de una solicitud (opcional pero recomendado)**
   - Página o modal “Ver solicitud” con:
     - Datos del paso 1 y 2 (negocio, contacto, razón social, dirección, plan, custom_plan_*, custom_domain).
     - Estado de la solicitud y, si existe, de la empresa y último pago.
     - Acciones: “Ir a empresa” (si tiene `company_id`), “Eliminar solicitud” (como ahora).

Con esto el panel deja de ser “vago” y te ayuda a crear nuevos negocios y a saber si el cliente ya pagó y qué compró.

---

### Fase B – Modelo de planes y servicios extra en BD

Objetivo: soportar planes base + add-ons (dominio propio, personalización, etc.) de forma clara.

1. **Planes (ya existe `plans`)**
   - Mantener: `id`, `name`, `price`, `max_branches`, `is_public`, `features`, etc.
   - Opcional: campo `add_on_ids` (array de IDs de servicios extra que se pueden comprar con ese plan) o una tabla `plan_addons` (plan_id, addon_id) para ofrecer solo ciertos extras por plan.

2. **Tabla de servicios extra (add-ons)**
   - Crear por ejemplo `addons`:
     - `id`, `slug` (ej. `custom_domain`, `branding`), `name`, `description`, `price_one_time` o `price_monthly`, `type` (one_time | monthly).
   - Ejemplos de filas: “Dominio propio” (precio único o mensual), “Personalización de colores/logo” (precio único).

3. **Vincular extras al onboarding y a la empresa**
   - **Opción A – En onboarding_applications:**  
     Añadir columnas como `custom_domain` (ya existe), `addon_ids` (array) o tabla `onboarding_application_addons(application_id, addon_id, quantity, price_snapshot)`. Así el paso 2 puede guardar “qué extras eligió” y el panel de solicitudes mostrarlos.
   - **Opción B – En companies / subscription:**  
     Tabla `company_addons(company_id, addon_id, status, price_paid, expires_at)` para reflejar qué extras tiene activos cada empresa (útil cuando se facturan o se renuevan).
   - Recomendación: **A** para “qué pidió en el registro” y **B** para “qué tiene contratado” una vez creada la empresa; sincronizar al finalizar onboarding (finalize) o al confirmar pago.

4. **Pago de extras**
   - Si Stripe: en el checkout de onboarding, añadir line items por cada add-on elegido (o un solo line item “Extras” con el total).
   - Registrar en `payments_history` (o en una tabla `payment_items`) qué parte del pago corresponde a plan y qué parte a cada extra, para tener historial claro.

---

### Fase C – Flujo de registro (onboarding) alineado con planes y extras

1. **Paso 2 – Formulario “Datos del negocio”**
   - Ya existe: plan (select de `plans`), plan custom (nombre + precio), `custom_domain`.
   - Añadir (cuando exista `addons`): bloque “Servicios opcionales” con checkboxes/select de add-ons (dominio propio, personalización, etc.) y precios. Al enviar, guardar en `onboarding_applications` (columnas o tabla `onboarding_application_addons`).

2. **Paso 3 – Pago**
   - Al crear la sesión de Stripe (o otro método), incluir en el total:
     - Precio del plan × meses.
     - Precio de cada extra (one_time una vez, o monthly × meses).
   - En `checkout` (y en `finalize` si aplica): crear empresa con `plan_id`; si hay extras, crear filas en `company_addons` y/o guardar en `theme_config` / `companies` lo que corresponda (ej. dominio propio en `custom_domain`).

3. **Finalize (tras pago exitoso)**
   - Además de crear usuario y enviar email: actualizar estado de la solicitud a `active`; opcionalmente marcar add-ons como “activos” en `company_addons` y disparar cualquier lógica de provisioning (ej. aviso para configurar dominio).

---

### Fase D – Cómo “manejamos” dominio propio y personalización

- **Dominio propio**
  - **Registro:** ya se guarda `custom_domain` en paso 2 y en `companies`. En el panel de solicitudes (Fase A) lo mostramos como “Sí/No” o el valor.
  - **Uso:** el tenant puede mostrar ese dominio cuando esté configurado (DNS apuntando a tu app o proxy). Falta: flujo en el panel del tenant o en Super Admin para “ingresar/editar dominio” y una guía (DNS). No hace falta cambiar el flujo de registro para “pensar cómo lo manejamos”; solo definir: “dominio = campo en company + instrucciones de DNS + opcionalmente verificación”.

- **Personalización (colores, logo, etc.)**
  - **Registro:** si añades add-on “Personalización”, en paso 2 el cliente lo elige; guardas en la solicitud y en la empresa (ej. `theme_config` ya tiene logo y colores; el paso 2 ya sube logo). El “extra” puede ser “soporte o horas de personalización” o “paquete de branding”; el precio se suma al checkout.
  - **Uso:** se gestiona como hoy en el panel del tenant (tema, logo). El add-on solo afecta precio y visibilidad en el panel (“Este negocio tiene personalización contratada”).

- **Resumen:** no hace falta un “sistema de provisioning” complejo al inicio; basta con:
  - Guardar en BD qué plan y qué extras eligió.
  - Mostrarlo en Solicitudes y en la ficha de la empresa.
  - Incluir los extras en el pago (Stripe) y en el historial.
  - Documentar en un doc o en la UI cómo se configura dominio propio (DNS) y qué incluye “personalización”.

---

### Fase E – Panel Super Admin: empresas y pagos

- **Empresas:** en la ficha de cada empresa ya tienes (o puedes tener) pestaña “Pagos” con `payments_history`. Añadir ahí, si usas `company_addons`, una sección “Servicios extra activos” (dominio, personalización, etc.).
- **Solicitudes:** con Fase A tienes en la misma lista (o en el detalle) plan, extras y estado de pago; con eso puedes crear nuevos negocios con toda la información a la vista.

---

### Fase F – Ciclo de vida del negocio: reactivar, suspender, nunca borrar

- **Regla:** los negocios **no se borran**; solo se **suspenden** (o se reactivan). Borrado físico no se expone en la UI; si hace falta por RGPD, dejarlo como operación manual en BD.
- **Estados útiles de `companies.subscription_status`:** por ejemplo `active`, `suspended`, `trial`, `payment_pending`, `cancelled`. Definir qué implica cada uno (acceso al panel, vencimiento, etc.).
- **Reactivar un negocio que no completó el pago:**
  - Caso: solicitud en `payment_pending`, empresa ya creada pero sin pago confirmado (o pago manual pendiente de validación).
  - En Super Admin: desde Solicitudes o desde la ficha de la empresa, acción **“Reactivar / Permitir pago”**: enviar de nuevo link de pago o instrucciones (según método), o marcar que el cliente puede volver a `/onboarding/pago?token=...` (si el token sigue válido). No “borrar” la empresa; solo permitir completar el flujo de pago o que el admin valide un pago manual.
- **Suspender (desactivar) un negocio:**
  - Acción en la ficha de empresa: **“Suspender”** → `subscription_status = 'suspended'`. El tenant pierde acceso o tiene acceso limitado (según reglas de negocio). No se elimina la empresa ni los datos.
- **Cambio de estatus automático:**
  - Por cron o job: si `subscription_ends_at` pasó y no hay renovación, pasar a `suspended` (o a un estado “vencido” que luego se trate igual que suspendido).
  - Cuando el admin **valida un pago manual**, actualizar `subscription_status` a `active` y `subscription_ends_at` según meses pagados.
  - Opcional: cuando se detecta pago Stripe (webhook o finalize), actualizar estado automáticamente (ya se hace en esencia).

---

### Fase G – Métodos de pago del plan (cómo paga la suscripción)

- **Por país (Chile / Venezuela):**
  - En el **formulario de registro** (paso 2 o 3), según el **país** que eligió el cliente, se cargan solo los **métodos de pago del plan** disponibles para ese país.
  - Ejemplo Chile: Stripe, Transferencia bancaria (manual), etc.
  - Ejemplo Venezuela: Pago Móvil, Zelle, Transferencia, Stripe (si aplica), etc. Precio en USD y conversión a bolívares (tasa BCV).
  - Guardar en `onboarding_applications` el método elegido (ej. `subscription_payment_method` o reutilizar campo existente si ya hay algo) para mostrarlo en Solicitudes y en la empresa.

- **Configuración de métodos en el SaaS (admin):**
  - **Tabla o configuración** de “métodos de pago del plan”: por ejemplo `plan_payment_methods` o en `settings` / JSON: id, nombre (Pago Móvil, Zelle, Stripe, Transferencia), países donde aplica (CL, VE), si tiene auto-verificación (sí/no), orden.
  - **Editar la información de cada método:** datos que el cliente verá o usará para pagar (banco, teléfono, email Zelle, cuenta para transferencia, etc.). Puede ser una tabla `plan_payment_method_config` (method_id, key, value) o JSON por método. El admin desde Super Admin edita estos datos; en la pantalla de pago del onboarding se muestran al cliente según el método elegido.

- **Cambiar el método de pago de un plan (o de una empresa):**
  - En la ficha de la **empresa**: poder cambiar “método de pago de la suscripción” (para próximos pagos o para indicar cómo pagó esta vez). No necesariamente cambiar el plan (precio), sino “cómo paga” (Stripe vs manual).
  - Si el “método” está a nivel de **plan** (cada plan tiene métodos permitidos), entonces en la configuración de **planes** permitir asociar métodos disponibles por plan; en el registro solo se muestran los métodos del plan elegido que además aplican al país.

---

### Fase H – Pagos manuales (sin auto-verificación): Venezuela, referencia, validación desde SaaS

- **Métodos sin auto-verificación:** por ejemplo Pago Móvil, Zelle, Transferencia en Venezuela (y otros donde no hay webhook). El cliente paga por su cuenta; el sistema **no** puede saber solo si ya pagó; hace falta que **suban una referencia** y que el **admin valide** el pago.

- **Flujo para el cliente (ej. Venezuela):**
  1. En **paso 3 (pago)** se muestra:
     - Precio del plan en **USD**.
     - **Conversión a moneda local** (ej. VES) usando tasa BCV (consultar API o valor configurable en admin).
     - Instrucciones del método elegido (datos de Pago Móvil, Zelle, etc.) que configuraste en Fase G.
     - **Subir referencia de pago:** campo para adjuntar imagen o PDF del comprobante (guardar en storage o como URL en `payments_history` o tabla `payment_references`).
  2. Tras subir, el registro en `payments_history` queda en `pending` (o estado “pendiente de validación”). La empresa puede seguir en `payment_pending` o en un estado “esperando validación”.

- **Validación desde el SaaS:**
  - En Super Admin, en **Solicitudes** o en la ficha de la **empresa** (pestaña Pagos): listar pagos pendientes de validación.
  - Por cada pago: ver referencia subida, monto, método; botón **“Validar pago”** (y opcional “Rechazar” con motivo).
  - Al validar: actualizar `payments_history.status` a `paid` (o `approved`); actualizar `companies.subscription_status` a `active` y `subscription_ends_at` según meses pagados; si corresponde, disparar **finalize** (crear usuario, enviar email de bienvenida) o un flujo equivalente para “primer pago validado”.

- **Tasa BCV:** tener en configuración (Super Admin o env) la fuente de la tasa (API BCV o valor manual); usarla solo para **mostrar** el equivalente en VES; el monto oficial a efectos de facturación puede seguir siendo USD.

---

### Fase I – Sistema de correos (notificaciones automáticas y por proceso)

- **Objetivo:** reutilizar y extender el sistema de correos que ya tienes (verificación de email en onboarding) para avisar al cliente en varios momentos del ciclo.

- **Eventos y ejemplos de correos:**

| Evento | Momento | Contenido (resumen) |
|--------|---------|----------------------|
| Verificación | Tras paso 1 (ya existe) | Link para verificar email y continuar al paso 2. |
| Deuda por pagar | Pago pendiente o vencido; recordatorio programado (cron) | Recordatorio de pago pendiente, link o instrucciones según método. |
| Plan por vencer | X días antes de `subscription_ends_at` (cron) | “Tu plan vence el DD/MM; renueva para seguir activo.” |
| Facturación | Tras pago confirmado (Stripe o validación manual) | Correo con “factura” o resumen: plan, monto, fecha, referencia. |
| Página lista / configurada | Manual o automático cuando se marque “sitio listo” | “Tu sitio ya está configurado y listo para usar” + link al tenant. |
| Cambio de estatus | Al suspender o reactivar (desde admin) | “Tu suscripción ha sido suspendida” / “Tu cuenta ha sido reactivada.” |

- **Implementación:**
  - Definir **plantillas** por tipo (en código o en BD) y enviar con el mismo mecanismo que el email de verificación (ej. Resend).
  - **Disparadores:**
    - Manual: desde Super Admin al validar pago, al suspender/reactivar, al marcar “sitio listo”.
    - Automático: cron/job que revise `subscription_ends_at` y envíe “plan por vencer”; otro que revise pagos pendientes y envíe “deuda por pagar”.
  - Opcional: tabla `email_log` (company_id, type, sent_at) para no duplicar envíos y para auditoría.

- **Estatus y correos:** cuando el cambio de estatus sea automático (ej. pasar a `suspended` por vencimiento), disparar el correo correspondiente desde ese mismo job.

---

### Fase J – Añadir planes y servicios extra; formulario por país y método de pago

- **Añadir planes y servicios extra:**
  - Desde Super Admin: CRUD de **planes** (nombre, precio, max_branches, métodos de pago permitidos por país si aplica).
  - CRUD de **add-ons** (dominio propio, personalización, etc.) y asociación a planes si aplica.
  - Ya cubierto en Fases B y C; aquí se recalca que la UI permita “añadir” y “editar” sin depender de migraciones manuales.

- **Formulario de registro (paso 2):**
  - El cliente selecciona **país** (Chile / Venezuela por ahora).
  - Según país, se cargan **solo los métodos de pago del plan** disponibles para ese país (Stripe, Pago Móvil, Zelle, Transferencia, etc.).
  - El cliente elige **uno** como “método con el que pagaré mi plan”; se guarda en la solicitud.
  - En paso 3, según ese método: si es Stripe, redirigir a Stripe; si es manual (Pago Móvil, Zelle, Transferencia), mostrar precio en USD, conversión si es Venezuela (BCV), instrucciones del método y subida de referencia; luego estado “pendiente de validación” hasta que el admin valide (Fase H).

- **Métodos de pago del negocio (sucursales):** siguen siendo los que el negocio configura para **sus** clientes (efectivo, tarjeta, etc.) en cada sucursal; no se mezclan con el “método de pago del plan” en el formulario de registro.

---

## 4. Orden sugerido de implementación

| Orden | Fase | Acción |
|-------|------|--------|
| 1 | A | Mejorar panel de solicitudes: más columnas (plan nombre, custom_plan, custom_domain), estado de pago (Pagado/Pendiente), método de pago del plan, opcional detalle por solicitud. |
| 2 | B | Definir tabla `addons` y, si quieres, `company_addons`; migración en Supabase. |
| 3 | G (parcial) | Modelo de métodos de pago del plan: tabla/config por país (Chile/Venezuela), edición de datos de cada método; en paso 2 cargar métodos según país y guardar el elegido. |
| 4 | H | Flujo pago manual: paso 3 para métodos sin auto-verificación (USD + conversión BCV para Venezuela), subida de referencia; en Super Admin validar pago y actualizar empresa. |
| 5 | F | Ciclo de vida: reactivar (permitir completar pago), suspender (sin borrar); estatus automático por vencimiento o tras validación. |
| 6 | I | Sistema de correos: plantillas y envío para deuda, vencimiento, factura, “página lista”, cambio de estatus; cron para recordatorios y vencimientos. |
| 7 | C | En paso 2, bloques opcionales de add-ons; en checkout/finalize, guardar y facturar extras; actualizar finalize para escribir `company_addons` o equivalente. |
| 8 | J | CRUD planes y add-ons en Super Admin; en formulario paso 2: país → métodos del plan; paso 3 según método (Stripe vs manual). |
| 9 | D | Documentar o añadir UI para “cómo configurar dominio propio” y qué incluye cada extra. |
| 10 | E | En ficha de empresa, sección “Extras contratados”, método de pago del plan, historial de pagos con desglose plan vs extras. |

---

## 5. Resumen

- **Dos “métodos de pago”:** (1) **del plan** = cómo el negocio paga su suscripción al SaaS (por país: Chile/Venezuela; elegido en registro). (2) **del negocio** = lo que el negocio ofrece a sus clientes en sucursales (ya existe).
- **Los 3 formularios:** (1) contacto y negocio, (2) datos legales + **plan, extras y método de pago del plan según país**, (3) pago (Stripe o manual con referencia y validación desde SaaS).
- **Negocios:** no se borran; se **suspenden** o **reactivan**. Cambio de estatus puede ser manual (admin) o automático (vencimiento, validación de pago).
- **Venezuela:** precio en USD + conversión BCV; cliente sube referencia; admin valida el pago desde el SaaS.
- **Correos:** verificación (ya existe), deudas, vencimiento, facturación, “página lista”, cambio de estatus; parte automática por cron.
- **Sistema completo:** panel de solicitudes (A), add-ons en BD (B), métodos de pago del plan por país y edición (G), pagos manuales y validación (H), ciclo de vida reactivar/suspender (F), correos (I), onboarding con extras y método por país (C, J), dominio y personalización (D), ficha de empresa (E).

Si quieres, el siguiente paso concreto puede ser **Fase A** (panel de solicitudes con plan, extras, método de pago y estado de pago) y en paralelo **G parcial** (configuración de métodos por país y selección en el paso 2).
