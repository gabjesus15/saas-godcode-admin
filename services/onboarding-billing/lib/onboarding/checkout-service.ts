import type { SupabaseClient } from "@supabase/supabase-js";

import { slugify as slugifyBase } from "../../../../utils/slugify";

function slugifyCompanyPublicSlug(value: string): string {
	return slugifyBase(value, { maxLength: 80, emptyFallback: "negocio" });
}

export type OnboardingApplication = {
	id: string;
	business_name: string;
	email: string;
	billing_rut?: string | null;
	fiscal_address?: string | null;
	logo_url?: string | null;
	social_instagram?: string | null;
	custom_domain?: string | null;
	custom_plan_name?: string | null;
	custom_plan_price?: number | string | null;
	plan_id: string;
	company_id?: string | null;
	subscription_payment_method?: string | null;
};

export type CheckoutPlan = {
	id: string;
	name: string;
	price: number;
};

const MANUAL_METHOD_SLUGS = new Set(["pago_movil", "zelle", "transferencia"]);

export function isManualMethod(method: string): boolean {
	return MANUAL_METHOD_SLUGS.has(method);
}

export async function resolveCheckoutPlan(
	supabaseAdmin: SupabaseClient,
	app: OnboardingApplication,
): Promise<{ plan: CheckoutPlan | null; error?: string; status?: number }> {
	if (app.plan_id === "custom") {
		return {
			plan: {
				id: "custom",
				name: app.custom_plan_name ?? "Plan personalizado",
				price: Number(app.custom_plan_price ?? 0),
			},
		};
	}

	if (!app.plan_id) {
		return { plan: null, error: "Debes seleccionar un plan antes de pagar", status: 400 };
	}

	const { data: planData, error: planError } = await supabaseAdmin
		.from("plans")
		.select("id,name,price")
		.eq("id", app.plan_id)
		.maybeSingle();

	if (planError || !planData) {
		return { plan: null, error: "Plan no encontrado", status: 404 };
	}

	return { plan: planData as CheckoutPlan };
}

export async function calculateAddonsTotalUsd(
	supabaseAdmin: SupabaseClient,
	applicationId: string,
	months: number,
): Promise<number> {
	const { data: applicationAddonsRows } = await supabaseAdmin
		.from("onboarding_application_addons")
		.select("addon_id,quantity,price_snapshot")
		.eq("application_id", applicationId);

	const applicationAddons = applicationAddonsRows ?? [];
	if (applicationAddons.length === 0) return 0;

	const addonIds = [...new Set(applicationAddons.map((a: { addon_id: string }) => a.addon_id))];
	const { data: addonsMeta } = await supabaseAdmin
		.from("addons")
		.select("id,type")
		.in("id", addonIds);
	const typeById = new Map(
		((addonsMeta ?? []) as { id: string; type?: string }[]).map((a) => [a.id, a.type]),
	);

	let total = 0;
	for (const row of applicationAddons as { addon_id: string; quantity?: number; price_snapshot?: number }[]) {
		const price = Number(row.price_snapshot ?? 0);
		const qty = Math.max(1, Number(row.quantity) || 1);
		const type = typeById.get(row.addon_id) ?? "one_time";
		if (type === "monthly") total += price * qty * months;
		else total += price * qty;
	}

	return total;
}

export type ProvisionCompanyResult =
	| { ok: true; company: { id: string } }
	| { ok: false; error: string; status: number };

export async function provisionCompanyFromApplication(
	supabaseAdmin: SupabaseClient,
	app: OnboardingApplication,
	isManualPayment: boolean,
): Promise<ProvisionCompanyResult> {
	if (app.company_id) {
		const { data: existing } = await supabaseAdmin
			.from("companies")
			.select("id")
			.eq("id", app.company_id)
			.maybeSingle();
		if (existing) return { ok: true, company: existing };
	}

	const baseSlug = slugifyCompanyPublicSlug(app.business_name);
	let publicSlug = baseSlug;
	let suffix = 0;
	while (true) {
		const { data: existing } = await supabaseAdmin
			.from("companies")
			.select("id")
			.eq("public_slug", publicSlug)
			.maybeSingle();
		if (!existing) break;
		suffix += 1;
		publicSlug = `${baseSlug}-${suffix}`;
	}

	const companyPayload = {
		name: app.business_name,
		legal_rut: app.billing_rut ?? null,
		email: app.email,
		phone: null,
		address: app.fiscal_address ?? null,
		public_slug: publicSlug,
		plan_id: app.plan_id,
		subscription_status: isManualPayment ? "payment_pending" : "trial",
		custom_domain: app.custom_domain ?? null,
		custom_plan_name: app.custom_plan_name ?? null,
		custom_plan_price: app.custom_plan_price ?? null,
		theme_config: {
			displayName: app.business_name,
			logoUrl: app.logo_url ?? null,
			primaryColor: "#111827",
			secondaryColor: "#111827",
			roleNavPermissions: {
				owner: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings", "company"],
				admin: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings", "company"],
				ceo: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings"],
				cashier: ["orders", "caja"],
			},
		},
	};

	const { data: inserted, error: companyError } = await supabaseAdmin
		.from("companies")
		.insert(companyPayload)
		.select("id")
		.single();

	if (companyError || !inserted) {
		if (companyError?.code === "23505") {
			return { ok: false, error: "Ya existe una empresa con datos similares", status: 409 };
		}
		console.error("onboarding checkout company insert:", companyError);
		return { ok: false, error: "Error al crear la empresa", status: 500 };
	}

	const { error: branchError } = await supabaseAdmin.from("branches").insert({
		company_id: inserted.id,
		name: "Principal",
		slug: "principal",
		address: app.fiscal_address ?? null,
		is_active: true,
	});
	if (branchError) console.error("onboarding checkout branch insert:", branchError);

	await supabaseAdmin.from("business_info").insert({
		company_id: inserted.id,
		name: app.business_name,
		address: app.fiscal_address ?? null,
		instagram: app.social_instagram ?? null,
		schedule: null,
	}).then(() => {});

	await supabaseAdmin
		.from("onboarding_applications")
		.update({
			company_id: inserted.id,
			status: "payment_pending",
			updated_at: new Date().toISOString(),
		})
		.eq("id", app.id);

	return { ok: true, company: inserted };
}

export async function recordPayment(
	supabaseAdmin: SupabaseClient,
	params: {
		companyId: string;
		planId: string;
		amountPaid: number;
		paymentMethod: string;
		paymentMethodSlug: string;
		paymentReference: string;
		status: string;
		monthsPaid: number;
	},
): Promise<{ id?: string; error?: string }> {
	const { data, error } = await supabaseAdmin
		.from("payments_history")
		.insert({
			company_id: params.companyId,
			plan_id: params.planId,
			amount_paid: params.amountPaid,
			payment_method: params.paymentMethod,
			payment_method_slug: params.paymentMethodSlug,
			payment_reference: params.paymentReference,
			payment_date: new Date().toISOString(),
			status: params.status,
			months_paid: params.monthsPaid,
		})
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("onboarding checkout payment insert:", error);
		return { error: error.message };
	}

	return { id: data?.id };
}

export async function getManualMethodConfig(
	supabaseAdmin: SupabaseClient,
	methodSlug: string,
): Promise<Record<string, string>> {
	const config: Record<string, string> = {};
	const { data: methodRow } = await supabaseAdmin
		.from("plan_payment_methods")
		.select("id")
		.eq("slug", methodSlug)
		.maybeSingle();

	if (methodRow) {
		const { data: configRows } = await supabaseAdmin
			.from("plan_payment_method_config")
			.select("key,value")
			.eq("method_id", methodRow.id);
		for (const row of (configRows ?? []) as { key?: string; value?: string }[]) {
			if (row.key) config[row.key] = row.value ?? "";
		}
	}

	return config;
}
