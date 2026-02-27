# Plantilla Base (tenant-template/oishi-prueba)

Este folder es una copia limpia del proyecto "oishi prueba" con branding neutral.

Objetivo
- Usar este UI como base para nuevos locales sin referencias a una marca especifica.
- Mantener el diseño del menu y el panel admin, pero con placeholders genericos.

Puntos de personalizacion
- Nombre del local: `businessInfo.name`
- Colores: CSS variables `--tenant-primary` y `--tenant-secondary` (ver [src/index.css](src/index.css))
- Logo: [src/assets/logo-placeholder.svg](src/assets/logo-placeholder.svg) (reemplazar por logo real)
- Mensajes de WhatsApp y recibos: textos genericos listos para adaptar

Notas
- Este template no esta integrado al App Router de GodCode. Es una base modular para migracion.
- Para edicion por cliente usa el kit modular en tenant-kit/.
