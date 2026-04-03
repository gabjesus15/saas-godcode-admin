type RouteContext = {
	params: Promise<{ subdomain: string }>;
};

const escapeJsString = (value: string) =>
	value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const SW_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
	process.env.BUILD_ID?.slice(0, 8) ||
	String(Math.floor(Date.now() / 86_400_000));

export async function GET(_req: Request, context: RouteContext) {
	const { subdomain } = await context.params;
	const safeSubdomain = escapeJsString(subdomain);
	const ver = escapeJsString(SW_VERSION);

	const script = `"use strict";
const TENANT_SLUG = "${safeSubdomain}";
const SCOPE_PREFIX = "/" + TENANT_SLUG + "/menu";
const SW_VER = "${ver}";
const STATIC_CACHE = "tenant-menu-static-" + SW_VER + "-" + TENANT_SLUG;
const PAGE_CACHE = "tenant-menu-pages-" + SW_VER + "-" + TENANT_SLUG;
const OFFLINE_HTML = "<!doctype html><html><head><meta charset=\\"utf-8\\" /><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\" /><title>Sin conexion</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#fff;margin:0;display:grid;place-items:center;min-height:100vh;padding:24px}main{max-width:420px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{opacity:.85;margin:0}</style></head><body><main><h1>Sin conexion</h1><p>Revisa tu internet y vuelve a intentar abrir el menu.</p></main></body></html>";

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(
			keys
				.filter((key) => {
					const isTenantMenuCache = key.includes("-" + TENANT_SLUG);
					const isCurrentVersion = key === STATIC_CACHE || key === PAGE_CACHE;
					return isTenantMenuCache && !isCurrentVersion;
				})
				.map((key) => caches.delete(key))
		);
		await self.clients.claim();
	})());
});

const isSameOrigin = (url) => url.origin === self.location.origin;
const isInMenuScope = (pathname) => pathname.startsWith(SCOPE_PREFIX);
const isCacheableMethod = (request) => request.method === "GET";
const isStaticDestination = (request) => ["style", "script", "image", "font"].includes(request.destination);
const isAdminPath = (pathname) => pathname.includes("/admin");

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (!isCacheableMethod(request)) return;

	const url = new URL(request.url);
	if (!isSameOrigin(url)) return;
	if (!isInMenuScope(url.pathname)) return;
	if (isAdminPath(url.pathname)) return;

	if (request.mode === "navigate") {
		event.respondWith((async () => {
			try {
				const networkResponse = await fetch(request);
				const cache = await caches.open(PAGE_CACHE);
				cache.put(request, networkResponse.clone());
				return networkResponse;
			} catch {
				const cached = await caches.match(request);
				if (cached) return cached;
				return new Response(OFFLINE_HTML, {
					headers: {
						"Content-Type": "text/html; charset=utf-8",
					},
				});
			}
		})());
		return;
	}

	if (isStaticDestination(request)) {
		event.respondWith((async () => {
			const cache = await caches.open(STATIC_CACHE);
			const cached = await cache.match(request);
			if (cached) return cached;
			try {
				const networkResponse = await fetch(request);
				cache.put(request, networkResponse.clone());
				return networkResponse;
			} catch {
				return cached || Response.error();
			}
		})());
		return;
	}

	event.respondWith((async () => {
		try {
			const networkResponse = await fetch(request);
			const cache = await caches.open(PAGE_CACHE);
			cache.put(request, networkResponse.clone());
			return networkResponse;
		} catch {
			const cached = await caches.match(request);
			return cached || Response.error();
		}
	})());
});
`;

	return new Response(script, {
		headers: {
			"Content-Type": "application/javascript; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
