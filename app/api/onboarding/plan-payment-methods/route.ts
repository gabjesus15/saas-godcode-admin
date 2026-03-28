import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

const COUNTRY_NORMALIZE: Record<string, string> = {
	Chile: "CL",
	Venezuela: "VE",
	CL: "CL",
	VE: "VE",
};

export async function GET(req: NextRequest) {
	const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/plan-payment-methods");
	if (proxied) return proxied;

	const country = req.nextUrl.searchParams.get("country");
	const normalized = country ? COUNTRY_NORMALIZE[country.trim()] ?? country.trim() : null;

	const { data: methods, error } = await supabaseAdmin
		.from("plan_payment_methods")
		.select("id,slug,name,countries,auto_verify,sort_order")
		.eq("is_active", true)
		.order("sort_order", { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	let list = methods ?? [];
	if (normalized) {
		list = list.filter(
			(m) =>
				Array.isArray(m.countries) &&
				(m.countries.includes(normalized) || m.countries.includes(country?.trim() ?? ""))
		);
	}

	const withConfig = await Promise.all(
		list.map(async (m) => {
			const { data: configRows } = await supabaseAdmin
				.from("plan_payment_method_config")
				.select("key,value")
				.eq("method_id", m.id);
			const config: Record<string, string> = {};
			for (const row of configRows ?? []) {
				if (row.key) config[row.key] = row.value ?? "";
			}
			return { ...m, config };
		})
	);

	return NextResponse.json({ data: withConfig });
}
