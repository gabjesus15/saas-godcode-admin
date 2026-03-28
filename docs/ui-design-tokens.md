# UI: onboarding vs panel (super-admin / tenant)

## Dos capas visuales

| Capa | Área | Enfoque |
| --- | --- | --- |
| **Marca / captación** | Rutas `app/onboarding/*` | Clases `onboarding-*` en [`app/onboarding/onboarding.css`](../app/onboarding/onboarding.css), acento **violeta** (`violet-600`, `violet-100`), tipografía hero orientada a conversión |
| **Consola producto** | `(super-admin)`, `[subdomain]/admin` | Tailwind utilitario (`zinc`, grid, cards), componentes en [`components/ui`](../components/ui) |

No es un error de producto que difieran: onboarding es “sitio público”; el panel es “herramienta”. Al añadir pantallas nuevas, elegir explícitamente una de las dos familias para no mezclar violeta marketing dentro del admin sin criterio.

## Tokens globales

- Tema claro/oscuro: variables `:root` / `.dark` y `@theme inline` en [`app/globals.css`](../app/globals.css).
- Fuentes: `Outfit` en `body` + variables Geist del layout; onboarding puede seguir usando las mismas bases.

## Accesibilidad

- Formularios: preferir `label` + `htmlFor` o componentes UI que lo encapsulen.
- Contraste: revisar zinc en modo oscuro (hay overrides `.dark .text-zinc-*` en `globals.css`).
