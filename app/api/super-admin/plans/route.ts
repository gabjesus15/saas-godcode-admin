import { NextRequest, NextResponse } from "next/server";
import { SAAS_READ_ROLES, SAAS_MUTATE_ROLES, validateAdminRolesOnServer } from "../../../../utils/admin/server-auth";

import { logAdminAudit } from "../../../../lib/admin-audit";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET() {
	const permission = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	const { data, error } = await supabaseAdmin
		.from("plans")
		.select("id,name,price,max_branches,is_public,features,is_active")
		.order("price", { ascending: true });

	if (error) {
		console.error("[plans/list] DB error:", error.message);
		return NextResponse.json({ error: "Error al cargar planes" }, { status: 500 });
	}
	return NextResponse.json({ data: data ?? [] });
}

type CreateBody = {
	name: string;
	price?: number;
	max_branches?: number;
	is_public?: boolean;
	features?: Record<string, boolean>;
};

export async function POST(req: NextRequest) {
	const permission = await validateAdminRolesOnServer([...SAAS_MUTATE_ROLES]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	const body = (await req.json().catch(() => ({}))) as CreateBody;
	const name = String(body.name ?? "").trim();
	if (!name) {
		return NextResponse.json({ error: "name es obligatorio" }, { status: 400 });
	}

	const payload: Record<string, unknown> = {
		name,
		price: Math.max(0, Number(body.price) ?? 0),
		max_branches: Math.max(0, Math.min(9999, Number(body.max_branches) ?? 1)),
		is_public: body.is_public !== false,
		features: body.features && typeof body.features === "object" ? body.features : {},
	};
	const { data, error } = await supabaseAdmin.from("plans").insert(payload).select("id").single();

	if (error) {
		console.error("[plans/create] DB error:", error.message);
		return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
	}
	await logAdminAudit({
		actorEmail: permission.email ?? "",
		actorRole: permission.role,
		action: "plan.create",
		resourceType: "plan",
		resourceId: data?.id ?? undefined,
		metadata: { name },
	});
	return NextResponse.json({ ok: true, id: data?.id });
}
