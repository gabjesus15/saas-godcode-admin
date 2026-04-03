import { NextRequest, NextResponse } from "next/server";
import { logAdminAudit } from "../../../../../lib/admin-audit";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { SAAS_MUTATE_ROLES, validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";

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
	const permission = await validateAdminRolesOnServer([...SAAS_MUTATE_ROLES]);
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
		console.error("[plans/update] DB error:", error.message);
		return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
	}
	await logAdminAudit({
		actorEmail: permission.email ?? "",
		actorRole: permission.role,
		action: "plan.update",
		resourceType: "plan",
		resourceId: id,
		metadata: { fields: Object.keys(updates) },
	});
	return NextResponse.json({ ok: true });
}
