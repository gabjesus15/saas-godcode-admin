/**
 * Service worker del panel super-admin.
 * Service-Worker-Allowed: / permite scope / aunque el script viva bajo /saas-admin/.
 * Solo intercepta rutas del panel y estáticos de Next; el resto pasa al navegador.
 */
export async function GET() {
	const offlineHtml =
		"<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" /><title>Sin conexión</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#fff;margin:0;display:grid;place-items:center;min-height:100vh;padding:24px}main{max-width:420px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{opacity:.85;margin:0}</style></head><body><main><h1>Sin conexión</h1><p>Comprueba tu conexión e intenta de nuevo.</p></main></body></html>";

	const script = `"use strict";
const OFFLINE_HTML = ${JSON.stringify(offlineHtml)};
const PAGE_CACHE = "saas-admin-pages-v1";
const STATIC_CACHE = "saas-admin-static-v1";

const SAAS_ADMIN_PREFIXES = [
	"/dashboard",
	"/companies",
	"/plans",
	"/addons",
	"/plan-payment-methods",
	"/herramientas",
	"/tickets",
	"/login",
	"/onboarding/solicitudes",
];

function isSaasAdminPath(pathname) {
	const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
	return SAAS_ADMIN_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
}

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(
			keys
				.filter((key) => key.startsWith("saas-admin-") && key !== PAGE_CACHE && key !== STATIC_CACHE)
				.map((key) => caches.delete(key))
		);
		await self.clients.claim();
	})());
});

const isSameOrigin = (url) => url.origin === self.location.origin;
const isCacheableMethod = (request) => request.method === "GET";

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (!isCacheableMethod(request)) return;

	const url = new URL(request.url);
	if (!isSameOrigin(url)) return;

	const pathname = url.pathname;

	if (pathname.startsWith("/_next/static/")) {
		event.respondWith((async () => {
			const cache = await caches.open(STATIC_CACHE);
			const cached = await cache.match(request);
			if (cached) return cached;
			try {
				const networkResponse = await fetch(request);
				if (networkResponse.ok) {
					cache.put(request, networkResponse.clone());
				}
				return networkResponse;
			} catch {
				return cached || Response.error();
			}
		})());
		return;
	}

	if (request.mode === "navigate" && isSaasAdminPath(pathname)) {
		event.respondWith((async () => {
			try {
				const networkResponse = await fetch(request);
				const cache = await caches.open(PAGE_CACHE);
				if (networkResponse.ok) {
					cache.put(request, networkResponse.clone());
				}
				return networkResponse;
			} catch {
				const cached = await caches.match(request);
				if (cached) return cached;
				return new Response(OFFLINE_HTML, {
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			}
		})());
	}
});
`;

	return new Response(script, {
		headers: {
			"Content-Type": "application/javascript; charset=utf-8",
			"Cache-Control": "no-store",
			"Service-Worker-Allowed": "/",
		},
	});
}
