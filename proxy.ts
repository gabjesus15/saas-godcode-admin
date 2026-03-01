import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const adminPaths = ["/dashboard", "/companies", "/login", "/plans"];
const tenantBypassPaths = ["/api", "/_next", "/favicon.ico"];
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const extractSubdomain = (hostHeader: string | null) => {
  if (!hostHeader) {
    return null;
  }

  const hostname = hostHeader.split(":")[0].toLowerCase();

  if (hostname === "localhost") {
    return null;
  }

  const parts = hostname.split(".");

  if (hostname.endsWith("localhost")) {
    // Comentario: soporta subdominio.localhost durante desarrollo.
    return parts.length >= 2 ? parts[0] : null;
  }

  // Comentario: para dominios reales esperamos algo como subdominio.godcode.com.
  return parts.length >= 3 ? parts[0] : null;
};

async function applySessionRefresh(request: NextRequest, response: NextResponse) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

export async function proxy(req: NextRequest) {

  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req.headers.get("host"));

  if (subdomain) {
    if (
      tenantBypassPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".")
    ) {
      const response = NextResponse.next({ request: req });
      return applySessionRefresh(req, response);
    }

    const rewriteUrl = new URL(`/${subdomain}${pathname}`, req.url);
    rewriteUrl.search = req.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    return applySessionRefresh(req, response);
  }

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next({ request: req });
    return applySessionRefresh(req, response);
  }

  const response = NextResponse.next({ request: req });
  return applySessionRefresh(req, response);
}

export const config = {
  matcher: "/:path*",
};
