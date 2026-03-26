import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function GET() {
	const checks: Record<string, string> = {};
	let healthy = true;

	try {
		const { error } = await supabaseAdmin
			.from("companies")
			.select("id")
			.limit(1)
			.maybeSingle();
		checks.database = error ? "unhealthy" : "ok";
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

	return NextResponse.json(
		{
			status: healthy ? "healthy" : "degraded",
			timestamp: new Date().toISOString(),
			checks,
		},
		{ status: healthy ? 200 : 503 }
	);
}
