import { NextResponse } from "next/server";
import { SAAS_READ_ROLES, validateAdminRolesOnServer } from "../../../../utils/admin/server-auth";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET() {
	const permission = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	const { data: methods, error } = await supabaseAdmin
		.from("plan_payment_methods")
		.select("id,slug,name,countries,auto_verify,sort_order,is_active")
		.order("sort_order", { ascending: true });

	if (error) {
		console.error("[plan-payment-methods] DB error:", error.message);
		return NextResponse.json({ error: "Error al cargar métodos de pago" }, { status: 500 });
	}

	const withConfig = await Promise.all(
		(methods ?? []).map(async (m) => {
			const { data: rows } = await supabaseAdmin
				.from("plan_payment_method_config")
				.select("key,value")
				.eq("method_id", m.id);
			const config: Record<string, string> = {};
			for (const row of rows ?? []) {
				if (row.key) config[row.key] = row.value ?? "";
			}
			return { ...m, config };
		})
	);

	return NextResponse.json({ data: withConfig });
}
