# Optimizaciones de rendimiento

Resumen en lenguaje claro de lo que se hizo para que la app cargue más rápido y consuma menos recursos, sin cambiar cómo se ve ni cómo se usa.

---

## Optimizaciones ya aplicadas

### 1. No pedir dos veces los datos de la empresa (página del local)

**Qué se hizo:** Cuando entras a la página de un local (tenant), antes el servidor preguntaba dos veces a la base de datos por los datos de esa empresa: una para el layout (título, colores, etc.) y otra para la página principal. Ahora esa información se pide una sola vez y se reutiliza.

**Por qué importa:** Menos consultas = menos tiempo de espera y menos carga en la base de datos. La home del local abre un poco más rápido.

---

### 2. Cargar el panel de admin por partes (solo lo que ves)

**Qué se hizo:** El panel de administración del local tiene varias pestañas: Pedidos, Productos, Reportes, Clientes, Inventario, Caja, Categorías. Antes se descargaba todo el código de todas las pestañas al abrir el panel. Ahora solo se descarga el código de la pestaña que estás viendo. Cuando cambias de pestaña, se carga ese bloque la primera vez (puedes ver un momento “Cargando…”); después queda guardado y ya no tarda.

**Por qué importa:** La primera vez que abres el admin se descarga menos código, así que la pantalla aparece antes. Sobre todo en móvil o conexiones lentas se nota.

---

### 3. Mostrar el texto antes de que cargue la fuente

**Qué se hizo:** Las fuentes del sitio (Geist y Geist Mono) están configuradas para que el texto sea visible enseguida con una fuente por defecto del navegador y, cuando termine de cargar la fuente bonita, se cambie sin que la página “salte” o se quede en blanco.

**Por qué importa:** Evitas que el usuario vea una pantalla vacía o que el texto aparezca de golpe después. La sensación es de que la página responde más rápido.

---

## Resumen rápido

| Qué | Beneficio |
|-----|-----------|
| Una sola petición de datos del local en la home | Menos espera y menos carga en la base de datos |
| Código del admin por pestañas | El panel abre más rápido; cada pestaña carga solo cuando la usas |
| Fuentes con “swap” | El texto se ve enseguida, sin pantalla en blanco |

---

## Posibles mejoras a futuro (no aplicadas aún)

- **Imágenes:** Usar el componente optimizado de Next.js para logos y fotos de productos (tamaños adecuados y carga bajo demanda).
- **Código extra:** Valorar cargar bajo demanda las librerías de gráficos (Reportes), QR y animaciones del panel de super-admin, para reducir aún más el peso inicial.
- **Base de datos:** En la home del local se siguen haciendo varias consultas (sucursales, turnos de caja, horarios). Si el tráfico crece, se podría unificar en una sola consulta o vista para reducir idas y vueltas al servidor.
- **Estilos y build:** Revisar que no se carguen estilos de rutas que no se usan y usar el informe de build (`npm run build`) para ver qué partes del código pesan más y si conviene dividirlas o simplificarlas.
