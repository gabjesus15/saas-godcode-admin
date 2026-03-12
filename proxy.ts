import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseAuthScope } from "./utils/supabase/auth-scope";

const adminPaths = ["/dashboard", "/companies", "/login", "/plans", "/onboarding/solicitudes"];
const tenantBypassPaths = ["/api", "/_next", "/favicon.ico"];
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

  await supabase.auth.getUser();
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
    ]);

    return reserved.has(first) ? null : segments[0];
  } catch {
    return null;
  }
};

export async function proxy(req: NextRequest) {

  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req.headers.get("host"));

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
    if (
      tenantBypassPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".")
    ) {
      const response = NextResponse.next({ request: req });
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
