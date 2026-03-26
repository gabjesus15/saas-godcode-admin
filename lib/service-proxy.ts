import { NextRequest, NextResponse } from "next/server";
import { flags, getOnboardingBillingBaseUrl } from "./feature-flags";
import { logger, createRequestContext, startTimer } from "./logger";

const SERVICE_API_KEY = process.env.SERVICE_API_KEY ?? "";

export async function proxyToOnboardingBilling(
	req: NextRequest,
	path: string
): Promise<NextResponse | null> {
	if (!flags.ONBOARDING_BILLING_EXTERNAL) return null;

	const baseUrl = getOnboardingBillingBaseUrl();
	if (!baseUrl) return null;

	const ctx = createRequestContext(path, req.method, "bff-proxy");
	const elapsed = startTimer();

	try {
		const url = new URL(path, baseUrl);
		url.search = req.nextUrl.search;

		const headers = new Headers();
		for (const [key, value] of req.headers.entries()) {
			if (key.toLowerCase() === "host") continue;
			headers.set(key, value);
		}
		headers.set("x-internal-api-key", SERVICE_API_KEY);

		const init: RequestInit = {
			method: req.method,
			headers,
		};

		if (req.method !== "GET" && req.method !== "HEAD") {
			try {
				const bodyText = await req.text();
				if (bodyText) init.body = bodyText;
			} catch {
				/* no body */
			}
		}

		const upstream = await fetch(url.toString(), init);
		const responseBody = await upstream.text();
		const durationMs = elapsed();

		logger.info("proxy_request", ctx, {
			upstream_url: url.toString(),
			upstream_status: upstream.status,
			duration_ms: durationMs,
		});

		return new NextResponse(responseBody, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				"content-type": upstream.headers.get("content-type") ?? "application/json",
				"x-proxied-to": "onboarding-billing",
				"x-proxy-duration-ms": String(durationMs),
			},
		});
	} catch (err) {
		const durationMs = elapsed();
		logger.error("proxy_error", ctx, {
			duration_ms: durationMs,
			error: err instanceof Error ? err.message : String(err),
		});
		return null;
	}
}
