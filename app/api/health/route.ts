import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../lib/supabase-admin";
import { flags, getOnboardingBillingBaseUrl } from "../../../lib/feature-flags";
import { startTimer } from "../../../lib/logger";

const startedAt = new Date().toISOString();

export async function GET() {
	const checks: Record<string, string> = {};
	let healthy = true;

	try {
		const elapsed = startTimer();
		const { error } = await supabaseAdmin
			.from("companies")
			.select("id")
			.limit(1)
			.maybeSingle();
		checks.database = error ? "unhealthy" : "ok";
		checks.database_latency_ms = String(elapsed());
		if (error) healthy = false;
	} catch {
		checks.database = "unhealthy";
		healthy = false;
	}

	checks.env_supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing";
	checks.env_service_role = process.env.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "missing";
	checks.env_tenant_domain = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ? "ok" : "missing";

	if (
		!process.env.NEXT_PUBLIC_SUPABASE_URL ||
		!process.env.SUPABASE_SERVICE_ROLE_KEY ||
		!process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
	) {
		healthy = false;
	}

	const proxy: Record<string, string> = {
		feature_flag: flags.ONBOARDING_BILLING_MODE,
	};

	if (flags.ONBOARDING_BILLING_EXTERNAL) {
		const microUrl = getOnboardingBillingBaseUrl();
		proxy.target_url = microUrl || "(not configured)";

		if (microUrl) {
			try {
				const elapsed = startTimer();
				const resp = await fetch(`${microUrl}/api/health`, {
					signal: AbortSignal.timeout(5000),
				});
				proxy.status = resp.ok ? "reachable" : `http_${resp.status}`;
				proxy.latency_ms = String(elapsed());
			} catch {
				proxy.status = "unreachable";
				healthy = false;
			}
		}
	}

	return NextResponse.json(
		{
			service: "bff",
			status: healthy ? "healthy" : "degraded",
			started_at: startedAt,
			timestamp: new Date().toISOString(),
			checks,
			proxy,
		},
		{ status: healthy ? 200 : 503 }
	);
}
