import { NextRequest, NextResponse } from "next/server";
import { flags, getOnboardingBillingBaseUrl } from "./feature-flags";

const SERVICE_API_KEY = process.env.SERVICE_API_KEY ?? "";

export async function proxyToOnboardingBilling(
	req: NextRequest,
	path: string
): Promise<NextResponse | null> {
	if (!flags.ONBOARDING_BILLING_EXTERNAL) return null;

	const baseUrl = getOnboardingBillingBaseUrl();
	if (!baseUrl) return null;

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

		return new NextResponse(responseBody, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				"content-type": upstream.headers.get("content-type") ?? "application/json",
				"x-proxied-to": "onboarding-billing",
			},
		});
	} catch (err) {
		console.error("[service-proxy] Error proxying to onboarding-billing:", err);
		return null;
	}
}
