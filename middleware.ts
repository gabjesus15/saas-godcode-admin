import { NextRequest, NextResponse } from "next/server";

const adminPaths = ["/dashboard", "/companies", "/login", "/plans"];
const tenantBypassPaths = ["/api", "/_next", "/favicon.ico"];

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req.headers.get("host"));

  if (subdomain) {
    if (
      tenantBypassPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Comentario: reescribimos hacia la ruta dinamica del tenant.
    const rewriteUrl = new URL(`/${subdomain}${pathname}`, req.url);
    rewriteUrl.search = req.nextUrl.search;

    return NextResponse.rewrite(rewriteUrl);
  }

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
