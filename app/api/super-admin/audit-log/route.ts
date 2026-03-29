import { NextResponse } from "next/server";
import { SAAS_READ_ROLES, validateAdminRolesOnServer } from "../../../../utils/admin/server-auth";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET(req: Request) {
	const permission = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
	if (!permission.ok) {
		return NextResponse.json(
			{ error: permission.error ?? "No autorizado" },
			{ status: permission.status ?? 403 }
		);
	}

	const url = new URL(req.url);
	const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 80));

	const { data, error } = await supabaseAdmin
		.from("admin_audit_logs")
		.select("id,created_at,actor_email,action,target_type,target_id,metadata")
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		return NextResponse.json({ error: error.message, data: [] }, { status: 200 });
	}

	return NextResponse.json({ data: data ?? [] });
}
