import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET o POST con header Authorization: Bearer CRON_SECRET
 * Pasa a suspended las empresas con subscription_status = 'active' y subscription_ends_at < now.
 */
export async function GET(req: NextRequest) {
	const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	const now = new Date().toISOString();
	const { data: companies, error } = await supabaseAdmin
		.from("companies")
		.select("id,name,subscription_ends_at")
		.eq("subscription_status", "active")
		.lt("subscription_ends_at", now);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (!companies?.length) {
		return NextResponse.json({ ok: true, suspended: 0, message: "Nada que actualizar" });
	}

	const { error: updateError } = await supabaseAdmin
		.from("companies")
		.update({ subscription_status: "suspended", updated_at: now })
		.eq("subscription_status", "active")
		.lt("subscription_ends_at", now);

	if (updateError) {
		return NextResponse.json({ error: updateError.message }, { status: 500 });
	}

	return NextResponse.json({ ok: true, suspended: companies.length });
}

export async function POST(req: NextRequest) {
	return GET(req);
}
