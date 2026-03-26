import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

export async function GET(req: NextRequest) {
	const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/addons");
	if (proxied) return proxied;
	const { data, error } = await supabaseAdmin
		.from("addons")
		.select("id,slug,name,description,price_one_time,price_monthly,type,sort_order")
		.eq("is_active", true)
		.order("sort_order", { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	return NextResponse.json({ data: data ?? [] });
}
