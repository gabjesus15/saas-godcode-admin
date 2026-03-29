import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseAuthScope } from "./utils/supabase/auth-scope";
import { getAppUrl } from "./lib/app-url";
import {
  normalizeHostForLookup,
  resolveTenantSlugFromCustomDomainHost,
} from "./lib/custom-domain-resolve";

const adminPaths = ["/dashboard", "/companies", "/login", "/plans", "/onboarding/solicitudes"];
// /onboarding debe servirse en el dominio principal; no reescribir a /[subdomain]/onboarding
const tenantBypassPaths = ["/api", "/_next", "/favicon.ico", "/onboarding", "/saas-admin"];
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const tenantBaseDomain = (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "")
  .toLowerCase();

const extractSubdomain = (hostHeader: string | null) => {
  if (!hostHeader) {
    return null;
  }

  const hostname = hostHeader.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "www.localhost") {
    return null;
  }

  if (hostname === "www" || hostname === "www.") {
    return null;
  }

  if (hostname.endsWith(".vercel.app")) {
    return null;
  }

  const parts = hostname.split(".");

  if (hostname.endsWith("localhost")) {
    // Comentario: soporta subdominio.localhost durante desarrollo.
    const candidate = parts.length >= 2 ? parts[0] : null;
    if (!candidate || candidate === "www") return null;
    return candidate;
  }

  if (tenantBaseDomain) {
    if (hostname === tenantBaseDomain || hostname === `www.${tenantBaseDomain}`) {
      return null;
    }

    if (hostname.endsWith(`.${tenantBaseDomain}`)) {
      const candidate = hostname.slice(0, -(`.${tenantBaseDomain}`.length));
      if (!candidate || candidate === "www" || candidate.includes(".")) {
        return null;
      }
      return candidate;
    }

    return null;
  }

  // Comentario: para dominios reales esperamos algo como subdominio.godcode.com.
  const candidate = parts.length >= 3 ? parts[0] : null;
  if (!candidate || candidate === "www") return null;
  return candidate;
};

async function applySessionRefresh(
  request: NextRequest,
  response: NextResponse,
  scope: SupabaseAuthScope
) {

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: scope === "super-admin" ? "sb-super-admin-auth-token" : "sb-tenant-auth-token",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Red o Supabase no disponible (p. ej. CI con URL placeholder): no tumbar la petición.
  }
  return response;
}

const resolveTenantSlugFromReferer = (refererHeader: string | null) => {
  if (!refererHeader) return null;

  try {
    const refererUrl = new URL(refererHeader);
    const segments = refererUrl.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const first = segments[0]?.toLowerCase();
    const reserved = new Set([
      "login",
      "dashboard",
      "companies",
      "plans",
      "checkout",
      "onboarding",
      "api",
      "_next",
      "favicon.ico",
      "saas-admin",
      "addons",
      "plan-payment-methods",
      "herramientas",
      "tickets",
    ]);

    return reserved.has(first) ? null : segments[0];
  } catch {
    return null;
  }
};

export async function proxy(req: NextRequest) {

  const { pathname } = req.nextUrl;
  const hostHeader = req.headers.get("host");
  let subdomain = extractSubdomain(hostHeader);
  if (!subdomain) {
    const normalized = normalizeHostForLookup(hostHeader);
    const base = tenantBaseDomain;
    let skipCustom = false;
    if (normalized && base) {
      const baseNoWww = base.replace(/^www\./, "");
      const hostNoWww = normalized.replace(/^www\./, "");
      skipCustom = hostNoWww === baseNoWww;
    }
    if (!skipCustom) {
      try {
        subdomain = await resolveTenantSlugFromCustomDomainHost(hostHeader);
      } catch {
        subdomain = null;
      }
    }
  }

  if (pathname === "/favicon.ico") {
    const tenantSlug = subdomain ?? resolveTenantSlugFromReferer(req.headers.get("referer"));
    if (tenantSlug) {
      const rewriteUrl = new URL(`/${tenantSlug}/tenant-favicon`, req.url);
      const response = NextResponse.rewrite(rewriteUrl);
      return applySessionRefresh(req, response, "tenant");
    }

    const response = NextResponse.next({ request: req });
    return applySessionRefresh(req, response, "super-admin");
  }

  if (subdomain) {
    // Onboarding es del dominio principal: redirigir a godcode.me/onboarding (o APP_URL)
    if (pathname.startsWith("/onboarding")) {
      const base = getAppUrl().replace(/\/$/, "");
      const target = new URL(pathname + req.nextUrl.search, base);
      return NextResponse.redirect(target, 302);
    }
    if (
      tenantBypassPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".")
    ) {
      const response = NextResponse.next({ request: req });
      return applySessionRefresh(req, response, "tenant");
    }

    // Si la ruta es '/', reescribe a '/[subdomain]'
    if (pathname === "/") {
      const rewriteUrl = new URL(`/${subdomain}`, req.url);
      rewriteUrl.search = req.nextUrl.search;
      const response = NextResponse.rewrite(rewriteUrl);
      return applySessionRefresh(req, response, "tenant");
    }

    const rewriteUrl = new URL(`/${subdomain}${pathname}`, req.url);
    rewriteUrl.search = req.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    return applySessionRefresh(req, response, "tenant");
  }

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next({ request: req });
    return applySessionRefresh(req, response, "super-admin");
  }

  const response = NextResponse.next({ request: req });
  return applySessionRefresh(req, response, "super-admin");
}

export const config = {
  matcher: "/:path*",
};
