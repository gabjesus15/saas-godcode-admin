# Explicación del proyecto (lenguaje claro, sin código)

Este texto describe el repositorio **saas-godcode-admin** tal como está en el código y la documentación interna del propio proyecto. Si algo no se puede deducir con seguridad, se indica explícitamente.

**Nota:** En la raíz del repositorio no aparece un archivo `AGENTS.MD` (solicitado en las reglas del equipo); no está claro si vive en otra ruta o aún no se añadió.

**Arquitectura (capas, diagrama, microservicio, integraciones):** ver `docs/arquitectura.md`.

---

## 1. ¿Qué hace este proyecto?

### Explicación como negocio

Imagina una **plataforma tipo “franquicia digital”**: una empresa matriz (GodCode en los ejemplos de configuración) ofrece a muchos negocios independientes su propia **presencia en internet** (página pública, menú online, pedidos) y un **panel interno** para que cada negocio gestione su operación (pedidos, caja, productos, etc.). La matriz también tiene un **panel de control central** para dar de alta clientes, planes, revisar solicitudes de incorporación y dar soporte.

### Para qué sirve

- Que **cada negocio** tenga su espacio identificable (por ejemplo, por un subdominio asociado a su nombre público en el sistema).
- Que los **clientes finales** vean la tienda o el menú y puedan hacer pedidos.
- Que el **personal del negocio** entre a un panel privado con roles (dueño, admin, cajero, etc.).
- Que el **equipo central** administre empresas, planes de suscripción, onboarding de nuevos negocios, tickets de soporte y avisos.

### Qué problema resuelve

Evita que cada negocio monte su propia infraestructura desde cero: comparten la misma aplicación, pero los datos y la marca se separan por **empresa** (multi-tenant).

### Quién lo usaría

- **Super administradores** del producto SaaS (equipo GodCode u operador de la plataforma).
- **Dueños o staff** de cada negocio suscrito.
- **Clientes** que visitan la web del negocio (menú, pedidos, información de sucursales).

---

## 2. Tipo de sistema

### ¿Qué es?

Es principalmente una **aplicación web** (sitio que se usa en el navegador), construida con tecnología moderna de “sitio que también hace de servidor”. Incluye:

- **Páginas** para humanos (login, paneles, onboarding, menú público).
- **Puntos de contacto tipo API** (el sistema responde a peticiones automáticas para guardar datos, pagos, verificaciones, etc.).

En el mismo repositorio hay un **segundo proyecto web más pequeño** dentro de la carpeta de servicios, pensado como **microservicio** separado para parte del flujo de **alta de clientes y facturación**, que la app principal puede **reenviar** o **duplicar** según configuración.

### ¿Es SaaS?

Sí encaja con el modelo **SaaS multi-tenant**: un solo producto, muchos clientes (empresas), datos separados por tenant.

### Cómo interactúa el usuario

- **Dominio principal** (ejemplo en documentación: sitio tipo `godcode.me`): acceso al login del equipo central y al flujo público de **onboarding** (dar de alta un nuevo negocio).
- **Subdominio por negocio** (ejemplo: `mitienda` + dominio base): página del negocio, menú, login del panel del negocio y administración de ese negocio.
- Todo esto es **web**; no hay indicación en lo revisado de apps nativas para móvil en este repositorio.

---

## 3. Estructura del proyecto (como departamentos)

### Carpeta principal de pantallas y rutas (`app`)

Es el **mapa de la oficina**: qué URL muestra qué pantalla. Aquí viven el login central, el panel super admin, las pantallas por negocio (subdominio), el onboarding, el checkout y las rutas que actúan como API. Es el núcleo de “qué ve el usuario y qué se ejecuta en el servidor”.

### Componentes visuales y lógica de interfaz (`components`)

Es el **diseño y montaje de pantallas**: botones, tablas, formularios de onboarding, shell del super admin, y todo el bloque grande del **panel del negocio** (incluye un “kit” con muchas pantallas internas: pedidos, caja, productos, etc.). Depende de lo que definan las rutas en `app`.

### Lógica compartida y servicios (`lib`)

Es el **despacho de procedimientos internos**: conexión privilegiada a base de datos cuando hace falta, validación de entorno, logs, banderas para activar el microservicio de onboarding, y reenvío de peticiones a ese servicio. Actúa como apoyo transversal.

### Utilidades y autenticación en servidor (`utils`)

Es **seguridad y callejones comunes**: clientes de sesión según zona (super admin vs negocio), comprobación de roles de admin, caché del negocio por subdominio para no saturar la base de datos, URLs y auditoría. Refuerza a `app` y `components`.

### Archivos estáticos (`public`)

Es el **almacén de folletos y logos**: fuentes, imágenes, sonidos si existen, iconos. Lo sirve el mismo sitio web.

### Pruebas automáticas (`__tests__`)

Es el **control de calidad interno**: comprueba comportamientos concretos (por ejemplo del reenvío al microservicio). No es visible para el usuario final.

### Servicio aparte (`services/onboarding-billing`)

Es una **sucursal independiente** del mismo tipo de aplicación web, enfocada en APIs de onboarding, pagos, cron de suscripciones y salud del servicio. La app principal puede delegar ahí parte del trabajo cuando se configura así.

### Copia o respaldo de funciones (`supabase-functions-backup`)

Es un **archivo histórico o respaldo** relacionado con Supabase; el proyecto excluye esta carpeta de ciertos pasos de compilación para no mezclar tecnologías. No es el flujo principal de la app en día a día salvo que el equipo la use manualmente.

### API legada (`pages`)

Es un **cajón antiguo** del sistema de rutas anterior: al menos un endpoint legacy. Suele mantenerse por compatibilidad mientras exista.

### Raíz del proyecto

Archivos de **configuración** (cómo se construye y despliega), dependencias, TypeScript, ESLint, tests. También hay un archivo llamado `proxy.ts` en la raíz que contiene lógica de enrutamiento por subdominio, pero **en la revisión del repositorio no está enlazado como middleware de la app principal** (no hay `middleware.ts` en la raíz). Eso puede significar que el despliegue usa otra forma de enrutar (por ejemplo reglas en el hosting) o que quedó preparado para un uso futuro; **no está claro sin ver la configuración de Vercel u otro hosting**.

### Documentación ya existente

- `README.md`: cómo arrancar y variables de entorno.
- `ESTRUCTURA.md`: descripción técnica detallada de carpetas y flujos (útil para quien desarrolle).

### Relación entre carpetas

Las peticiones entran por `app`; leen datos vía `utils` y `lib`; pintan con `componentes`; el microservicio en `services` puede recibir trabajo delegado; `public` acompaña la experiencia visual.

---

## 4. Cómo funciona por dentro (flujo)

### Usuario en el dominio principal

1. El sistema **mira la dirección** con la que entraste (host).
2. Si corresponde al **sitio central**, te puede mandar al **login del super admin**.
3. Si entras al flujo de **onboarding**, ves formularios; al enviar, el servidor **registra la solicitud**, puede **enviar correos** y pedir **verificación**.
4. En pasos de **pago**, intervienen **proveedores externos** (tarjeta u otros métodos según configuración).
5. Al cerrar el flujo, el sistema **activa o prepara** el negocio en la base de datos (detalle exacto depende de reglas en servidor y microservicio).

### Usuario en el subdominio de un negocio

1. El sistema **identifica qué negocio** corresponde (por el identificador público tipo “slug”).
2. Si el negocio no existe o está fuera de servicio, muestra **tienda no disponible** o redirige.
3. En la **página pública** carga sucursales, horarios, menú, etc.
4. Si el visitante usa el **menú / pedidos**, se consultan productos y sucursales y se pueden **crear pedidos**.
5. Si un empleado va al **panel**, debe **iniciar sesión**; el servidor comprueba que su usuario esté **vinculado a esa empresa** y tenga **rol permitido**.
6. Dentro del panel, las distintas secciones (pedidos, caja, inventario, etc.) **leen y escriben** en la base de datos según permisos y módulos activos.

### Super admin

1. Login con credenciales válidas y comprobación contra tabla de **administradores**.
2. Navegación por empresas, planes, solicitudes, tickets, herramientas.
3. Las acciones pasan por rutas API o servidor que validan **quién puede hacer qué**.

---

## 5. Partes importantes del sistema

### Piezas clave

- **Supabase** (servicio externo): base de datos, autenticación y reglas de acceso a datos según políticas del proyecto.
- **Aplicación web principal**: une todas las pantallas y la mayoría de APIs.
- **Microservicio onboarding-billing** (opcional según configuración): concentrar lógica de alta y cobros.
- **Proveedores de pago y correo** (cuando están configurados): Stripe, PayPal, Resend, etc.

### El “cerebro”

No hay un solo archivo mágico: el **cerebro distribuido** es la combinación de **reglas en base de datos (Supabase)**, **rutas y APIs en `app`**, y **lógica de negocio en `lib` y en el panel del tenant**. La parte más “pesada” operativa para cada negocio está en el **kit del panel** bajo componentes del tenant.

### Qué controla todo

- **Roles y tablas** en Supabase (quién es super admin, quién pertenece a qué empresa).
- **Variables de entorno** (encender microservicio, claves de pago, dominios).
- **Banderas** (feature flags) para modo de onboarding externo o local.

---

## 6. Dependencias (explicadas simple)

Son **herramientas y bibliotecas** que el proyecto importa para no reinventar ruedas. Sin entrar en nombres de código:

- **Motor del sitio web y React**: base de la interfaz y del servidor integrado.
- **Supabase**: cliente para hablar con autenticación y base de datos en la nube.
- **Stripe y PayPal**: cobros con tarjeta y PayPal.
- **Nodemailer / integración con Resend** (según uso en el código): envío de correos.
- **Formularios y validación**: recoger datos del usuario con comprobaciones.
- **Gráficos**: visualizaciones en panel si aplica.
- **Animaciones ligeras**: movimiento en interfaz.
- **Utilidades de texto y validación** (incluye validación de identificadores tipo RUT en contexto chileno).
- **Estilos (Tailwind, etc.)**: apariencia consistente.
- **Herramientas de desarrollo**: TypeScript, ESLint, Vitest para pruebas.

Las **más críticas para que “arranque”** son el stack web + Supabase; **Stripe, PayPal, Resend, Cloudinary** amplían funciones pero parte del sistema puede arrancar con advertencias si faltan (según qué pantalla uses).

---

## 7. Configuración

### Qué necesita para funcionar

- **Node.js** moderno y **npm**, según el README.
- **Proyecto Supabase** con URL y claves: una clave pública para el navegador y una clave de servicio para operaciones privilegiadas del servidor.
- **Dominio base multi-tenant** configurado (cómo se nombran los subdominios de cada negocio).

### Recomendado o opcional

- URL canónica de la app para correos y redirecciones.
- Claves de **Stripe**, **PayPal**, **Resend**, **reCAPTCHA** para onboarding.
- **Cloudinary** para subida de imágenes.
- Secreto para **tareas programadas** (cron) si se usan.
- Variables del **microservicio**: URL del servicio, clave interna entre aplicaciones, y bandera que indica si se reenvía todo, solo a veces, o solo al microservicio.

### Qué puede romperlo si está mal

- **Claves o URL de Supabase incorrectas**: login y datos fallan de forma general.
- **Dominio mal configurado**: subdominios no resuelven al negocio correcto o redirecciones erróneas.
- **Modo “solo microservicio” activado sin URL válida**: onboarding o pagos devuelven error de servicio no disponible.
- **Pagos / correo sin claves**: esas partes concretas no funcionan o quedan degradadas.
- **Cron sin secreto** donde se exige: tareas automáticas rechazadas.

---

## 8. Problemas o cosas raras

- **Dos niveles de lógica para onboarding**: la app principal y el microservicio pueden contener lógica parecida; hay un modo de **reenviar** peticiones. Eso es potente pero exige **disciplina** para no corregir un sitio y olvidar el otro.
- **Panel del negocio “kit”**: gran parte está en JavaScript dentro de una estructura grande; el resto del proyecto usa TypeScript. Es **heterogéneo** y puede costar más mantener coherencia.
- **`proxy.ts` en raíz sin middleware visible en la app principal**: puede generar **confusión** sobre cómo se enrutan los subdominios en cada entorno.
- **Documentación interna muy técnica** (`ESTRUCTURA.md`) vs guías que aparecen **borradas** en el estado de git (según el usuario, carpetas `docs` con guías de fases); el historial puede haber perdido explicaciones de despliegue.
- **Placeholders conscientes**: por ejemplo métricas de ingresos recurrentes en dashboard pueden estar marcadas como no integradas aún (según `ESTRUCTURA.md`).
- **Muchos bloques de error silencioso** (intencionales para no romper la UI): facilita la experiencia pero **dificulta depurar** si algo falla.

Valoración de madurez: **no es un proyecto de “primer día”** (multi-tenant, pagos, roles, microservicio, tests puntuales), pero la **mezcla de estilos y duplicación posible** sugiere evolución orgánica más que un producto mínimo recién nacido.

---

## 9. Cómo aprender este proyecto rápido

### Entender primero

1. **`README.md` y `.env.example`**: qué enciende el sistema.
2. **Flujo de tres mundos** en `ESTRUCTURA.md`: super admin, tenant, onboarding.
3. **Carpeta `app`**: solo los nombres de rutas, sin leer implementación línea a línea.
4. **`utils` relacionados con Supabase y admin**: idea de cómo se separa super admin vs tenant.

### Ignorar al inicio

- `supabase-functions-backup`
- Detalle completo del **kit** bajo `components/tenant/admin/kit` hasta que domines el flujo general
- Carpeta `services/onboarding-billing` hasta que necesites despliegue separado o el flag externo

### Modificar sin romper todo

- Cambios pequeños en **una pantalla** dentro de `app` + su componente en `components`.
- Tocar **variables de entorno** solo en entorno de prueba.
- Si cambias onboarding o pagos, verificar si el **microservicio** está en juego y si la **bandera** está en local o proxy.
- Ejecutar **lint y tests** del proyecto antes de subir cambios (scripts definidos en `package.json`).

---

## 10. Resumen final

| Pregunta | Respuesta breve |
|----------|------------------|
| **Qué es** | Plataforma web SaaS multi-tenant: panel central, sitio y panel por negocio, onboarding y cobros. |
| **Cómo está construido** | Aplicación web moderna + Supabase + integraciones de pago y correo + microservicio opcional para onboarding/facturación. |
| **Qué tan bueno es** | Funcionalmente ambicioso y estructurado; con zonas de deuda técnica (mezcla JS/TS, posible duplicación, archivo proxy sin cablear claro). |
| **Mantenimiento** | **Medio-alto**: muchos flujos y dependencias externas; se beneficia de documentación al día y acuerdos claros sobre microservicio vs monolito. |

Si en el futuro el equipo añade `AGENTS.MD` o restaura guías en `docs`, conviene enlazarlas desde el `README` para que nuevas personas no dependan solo de este resumen.
