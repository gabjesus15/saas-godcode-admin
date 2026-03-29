import { NextResponse } from "next/server";
import { SAAS_READ_ROLES, validateAdminRolesOnServer } from "../../../../utils/admin/server-auth";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET() {
	const permission = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
	if (!permission.ok) {
		return NextResponse.json(
			{ error: permission.error ?? "No autorizado" },
			{ status: permission.status ?? 403 }
		);
	}

	type AppRow = {
		id: string;
		plan_id: string | null;
		company_id: string | null;
		custom_plan_name: string | null;
		custom_plan_price: string | null;
		custom_domain: string | null;
		subscription_payment_method: string | null;
		[key: string]: unknown;
	};

	try {
		const { data: apps, error } = await supabaseAdmin
			.from("onboarding_applications")
			.select(
				"id,business_name,responsible_name,email,status,created_at,updated_at,company_id,country,currency," +
					"plan_id,custom_plan_name,custom_plan_price,custom_domain,legal_name,fiscal_address,subscription_payment_method"
			)
			.order("created_at", { ascending: false })
			.limit(200);

		if (error) {
			return NextResponse.json(
				{ error: `Error al cargar solicitudes: ${error.message}` },
				{ status: 500 }
		);
	}

		const listData = (apps ?? []) as unknown as AppRow[];
		const planIds = [...new Set(listData.map((a) => a.plan_id).filter(Boolean))] as string[];
		const companyIds = [...new Set(listData.map((a) => a.company_id).filter(Boolean))] as string[];

		const [plansRes, lastPaymentsRes] = await Promise.all([
		planIds.length
			? supabaseAdmin.from("plans").select("id,name,price").in("id", planIds)
			: Promise.resolve({ data: [] as { id: string; name: string | null; price: number | null }[] }),
		companyIds.length
			? (async () => {
					const { data: payments } = await supabaseAdmin
						.from("payments_history")
						.select("company_id,status,amount_paid,payment_date")
						.in("company_id", companyIds)
						.order("payment_date", { ascending: false });
					const byCompany = new Map<string, { status: string; amount_paid: number; payment_date: string }>();
					for (const p of payments ?? []) {
						if (!p.company_id || byCompany.has(p.company_id)) continue;
						byCompany.set(p.company_id, {
							status: p.status ?? "pending",
							amount_paid: p.amount_paid ?? 0,
							payment_date: p.payment_date ?? "",
						});
					}
					return byCompany;
			  })()
			: Promise.resolve(new Map<string, { status: string; amount_paid: number; payment_date: string }>()),
		]);

		const plansMap = new Map((plansRes.data ?? []).map((p) => [p.id, p]));

		const list = listData.map((app) => {
			const plan = app.plan_id ? plansMap.get(app.plan_id) : null;
			const planLabel =
				app.plan_id === "custom"
					? `Custom: ${app.custom_plan_name ?? "—"} – ${app.custom_plan_price ?? "—"}`
					: plan?.name ?? (app.plan_id ? `Plan ${app.plan_id}` : "—");
			const lastPayment = app.company_id ? lastPaymentsRes.get(app.company_id) : null;
			const paymentStatus = lastPayment
				? lastPayment.status === "paid" || lastPayment.status === "approved"
					? "paid"
					: lastPayment.status === "pending_validation"
						? "pending_validation"
						: "pending"
				: app.status === "payment_pending" && app.company_id
					? "pending"
					: null;

			return {
				...app,
				plan_label: planLabel,
				plan_price: plan?.price ?? (app.plan_id === "custom" ? Number(app.custom_plan_price) || null : null),
				custom_domain: !!app.custom_domain,
				custom_domain_value: app.custom_domain ?? null,
				payment_status: paymentStatus,
				last_payment: lastPayment ?? null,
			};
		});

		return NextResponse.json({ data: list });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error inesperado";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
