import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { autoRefreshToken: false, persistSession: false } }
);

type PatchBody = {
	name?: string;
	price?: number;
	max_branches?: number;
	is_public?: boolean;
	features?: Record<string, boolean>;
};

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const permission = await validateAdminRolesOnServer(["super_admin"]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	const { id } = await params;
	if (!id) {
		return NextResponse.json({ error: "id faltante" }, { status: 400 });
	}

	const body = (await req.json().catch(() => ({}))) as PatchBody;
	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) updates.name = String(body.name).trim();
	if (body.price !== undefined) updates.price = Math.max(0, Number(body.price));
	if (body.max_branches !== undefined) updates.max_branches = Math.max(0, Math.min(9999, Number(body.max_branches)));
	if (body.is_public !== undefined) updates.is_public = Boolean(body.is_public);
	if (body.features !== undefined) updates.features = typeof body.features === "object" ? body.features : {};

	const { error } = await supabaseAdmin.from("plans").update(updates).eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	return NextResponse.json({ ok: true });
}
