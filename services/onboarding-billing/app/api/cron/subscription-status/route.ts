import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { suspendExpiredSubscriptions } from "../../../../lib/onboarding/billing-activation";

export async function GET(req: NextRequest) {
	const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	const result = await suspendExpiredSubscriptions({ supabaseAdmin });

	if (result.error) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}

	if (result.suspended === 0) {
		return NextResponse.json({ ok: true, suspended: 0, message: "Nada que actualizar" });
	}

	return NextResponse.json({ ok: true, suspended: result.suspended });
}

export async function POST(req: NextRequest) {
	return GET(req);
}
