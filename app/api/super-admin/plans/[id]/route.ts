import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { logAdminAudit } from "../../../../../lib/admin-audit";
import { normalizeMarketingLines } from "../../../../../lib/plan-marketing-lines";
import { adminUpdatePlanById } from "../../../../../lib/plans-db-query";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { SAAS_READ_ROLES, validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";

type PatchBody = {
	name?: string;
	price?: number;
	max_branches?: number;
	max_users?: number;
	is_public?: boolean;
	is_active?: boolean;
	features?: Record<string, boolean>;
	marketing_lines?: unknown;
};

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const permission = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	const rawId = (await params).id;
	const id = typeof rawId === "string" ? rawId.trim() : "";
	if (!id) {
		return NextResponse.json({ error: "id faltante" }, { status: 400 });
	}

	const body = (await req.json().catch(() => ({}))) as PatchBody;
	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) {
		const trimmed = String(body.name).trim();
		if (!trimmed) {
			return NextResponse.json({ error: "El nombre del plan no puede estar vacío." }, { status: 400 });
		}
		updates.name = trimmed;
	}
	if (body.price !== undefined) updates.price = Math.max(0, Number(body.price));
	if (body.max_branches !== undefined) updates.max_branches = Math.max(0, Math.min(9999, Number(body.max_branches)));
	if (body.max_users !== undefined) updates.max_users = Math.max(0, Math.min(999999, Number(body.max_users)));
	if (body.is_public !== undefined) updates.is_public = Boolean(body.is_public);
	if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
	if (body.features !== undefined) updates.features = typeof body.features === "object" ? body.features : {};
	if (body.marketing_lines !== undefined) {
		updates.marketing_lines = normalizeMarketingLines(body.marketing_lines);
	}

	if (Object.keys(updates).length === 0) {
		return NextResponse.json({ error: "No hay cambios que guardar." }, { status: 400 });
	}

	const { data: updatedRows, error, marketingLinesSkipped } = await adminUpdatePlanById(id, updates);

	if (error) {
		console.error("[plans/update] DB error:", error.message);
		const detail = process.env.NODE_ENV === "development" ? error.message : undefined;
		return NextResponse.json({ error: "Error al actualizar plan", detail }, { status: 500 });
	}

	const returnedRow = Array.isArray(updatedRows) && updatedRows.length > 0;
	if (!returnedRow) {
		/* PostgREST a veces devuelve cuerpo vacío pese a UPDATE OK (proxy/réplica). Si la fila existe, damos por bueno. */
		const { data: stillThere, error: readErr } = await supabaseAdmin
			.from("plans")
			.select("id")
			.eq("id", id)
			.maybeSingle();
		if (readErr) {
			console.error("[plans/update] verify error:", readErr.message);
			return NextResponse.json({ error: "Error al verificar el plan" }, { status: 500 });
		}
		if (!stillThere) {
			return NextResponse.json({ error: "No se encontró el plan." }, { status: 404 });
		}
	}
	await logAdminAudit({
		actorEmail: permission.email ?? "",
		actorRole: permission.role,
		action: "plan.update",
		resourceType: "plan",
		resourceId: id,
		metadata: { fields: Object.keys(updates) },
	});
	revalidatePath("/");
	return NextResponse.json({
		ok: true,
		...(marketingLinesSkipped
			? {
					warning:
						"Las viñetas no se guardaron: falta la columna marketing_lines en la base de datos. Ejecuta la migración en Supabase.",
				}
			: {}),
	});
}
