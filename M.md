1. Dominio y puerto de fallback — utils/tenant-url.ts
Línea 82: return "localhost:3000"
Puerto fijo. Mejor derivarlo de NEXT_PUBLIC_TENANT_BASE_DOMAIN o una variable tipo NEXT_PUBLIC_DEV_PORT.
Línea 84: return "tuapp.com"
Dominio de fallback en producción. Debería salir de env (ej. NEXT_PUBLIC_APP_DOMAIN o NEXT_PUBLIC_TENANT_BASE_DOMAIN).

2. Imagen de fallback (FALLBACK_IMAGE) — repetida y distinta
components/tenant/product-card.tsx (línea 8):
"https://images.unsplash.com/photo-1504674900247-0877df9cc836?..."
components/tenant/admin/kit/cart/components/CartModal.jsx (línea 19) y
components/tenant/admin/kit/products/components/ProductCard.jsx (línea 8):
'https://images.unsplash.com/photo-1553621042-f6e147245754?...'
Son dos URLs distintas y repetidas. Conviene una sola constante compartida (o variable de entorno si quieres configurarla).





3. Icono de fuego (FIRE_ICON) — duplicado
components/tenant/menu-client.tsx (líneas 291-292)
components/tenant/admin/kit/products/pages/Menu.jsx (línea 41)
Misma URL:
"https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif"
Debería ser una única constante compartida.





4. Placeholders de logo / imagen
Rutas fijas en varios archivos:
"/tenant/logo-placeholder.svg":
admin-sidebar.tsx, OrderCard.jsx, ManualOrderModal.jsx, Home.jsx, Menu.jsx
"/placeholder.svg":
components/tenant/cart-modal.tsx
Si cambia la base URL o el asset, hay que tocar muchos sitios. Mejor una constante compartida (ej. en constants/assets.ts o similar).






5. API externa — app/(super-admin)/plans/page.tsx
Línea 19: fetch("https://open.er-api.com/v6/latest/USD")
URL de la API de cambio fija. Si quieres cambiar de proveedor o endpoint, mejor variable de entorno (ej. NEXT_PUBLIC_RATES_API_URL).





6. Lo que está bien
Supabase / Cloudinary en código fuente: solo se usan process.env.NEXT_PUBLIC_*; lo que ves en .next es el build inyectando env, no hardcodeo en tu código.
URLs base de APIs (api.cloudinary.com, api.mercadopago.com, api.stripe.com, api.resend.com): es normal que estén fijas; los secretos van en env.
Detección de localhost en tenant-url.ts y proxy.ts: es lógica de detección, no configuración que deba estar en env.
Si quieres, en el siguiente paso puedo proponerte cambios concretos (constantes compartidas y variables de entorno) y en qué archivos tocar cada cosa.