import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURITY_HEADERS: [string, string][] = [
	["X-Content-Type-Options", "nosniff"],
	["X-Frame-Options", "DENY"],
	["Referrer-Policy", "strict-origin-when-cross-origin"],
	["Permissions-Policy", "camera=(), microphone=(), geolocation=(self)"],
	["X-DNS-Prefetch-Control", "on"],
];

export function middleware(request: NextRequest) {
	const response = NextResponse.next();

	for (const [key, value] of SECURITY_HEADERS) {
		response.headers.set(key, value);
	}

	if (request.nextUrl.pathname.startsWith("/api/")) {
		response.headers.set("Cache-Control", "no-store");
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|icon.svg|tenant/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
	],
};
