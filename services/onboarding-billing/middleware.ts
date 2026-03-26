import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
	const start = Date.now();
	const requestId = crypto.randomUUID();

	const response = NextResponse.next();
	response.headers.set("x-request-id", requestId);

	const method = req.method;
	const path = req.nextUrl.pathname;

	response.headers.set("x-response-time", String(Date.now() - start));

	if (path.startsWith("/api/") && path !== "/api/health") {
		console.log(
			JSON.stringify({
				level: "info",
				message: "incoming_request",
				service: "onboarding-billing",
				requestId,
				method,
				path,
				timestamp: new Date().toISOString(),
			})
		);
	}

	return response;
}

export const config = {
	matcher: "/api/:path*",
};
