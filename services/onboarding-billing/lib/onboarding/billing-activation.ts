import type { SupabaseClient } from "@supabase/supabase-js";

type PaymentStatusRow = {
	status?: string | null;
	months_paid?: number | null;
};

type ApplicationAddonRow = {
	addon_id: string;
	quantity?: number | null;
	price_snapshot?: number | null;
};

type AddonMetaRow = {
	id: string;
	type?: string | null;
};

export function getMonthsPaidFromPayment(payment: PaymentStatusRow, fallback = 1): number {
	return Math.max(1, Number(payment.months_paid ?? fallback) || fallback);
}

export function getSubscriptionEndsAt(monthsPaid: number, now = new Date()): string {
	const endsAt = new Date(now);
	endsAt.setDate(endsAt.getDate() + Math.max(1, Number(monthsPaid) || 1) * 30);
	return endsAt.toISOString();
}

export async function activateCompanySubscription(params: {
	supabaseAdmin: SupabaseClient;
	companyId: string;
	monthsPaid: number;
	now?: Date;
}): Promise<void> {
	const now = params.now ?? new Date();
	await params.supabaseAdmin
		.from("companies")
		.update({
			subscription_status: "active",
			subscription_ends_at: getSubscriptionEndsAt(params.monthsPaid, now),
			updated_at: now.toISOString(),
		})
		.eq("id", params.companyId);
}

export type SuspendExpiredResult = {
	suspended: number;
	error?: string;
};

export async function suspendExpiredSubscriptions(params: {
	supabaseAdmin: SupabaseClient;
	now?: Date;
}): Promise<SuspendExpiredResult> {
	const now = (params.now ?? new Date()).toISOString();

	const { data: companies, error: selectError } = await params.supabaseAdmin
		.from("companies")
		.select("id")
		.eq("subscription_status", "active")
		.lt("subscription_ends_at", now);

	if (selectError) {
		return { suspended: 0, error: selectError.message };
	}

	if (!companies?.length) {
		return { suspended: 0 };
	}

	const { error: updateError } = await params.supabaseAdmin
		.from("companies")
		.update({ subscription_status: "suspended", updated_at: now })
		.eq("subscription_status", "active")
		.lt("subscription_ends_at", now);

	if (updateError) {
		return { suspended: 0, error: updateError.message };
	}

	return { suspended: companies.length };
}

export async function activateCompanyAddonsFromApplication(params: {
	supabaseAdmin: SupabaseClient;
	applicationId: string;
	companyId: string;
	monthsPaid: number;
	now?: Date;
}): Promise<void> {
	const now = params.now ?? new Date();
	const { data: appAddons } = await params.supabaseAdmin
		.from("onboarding_application_addons")
		.select("addon_id,quantity,price_snapshot")
		.eq("application_id", params.applicationId);

	if (!Array.isArray(appAddons) || appAddons.length === 0) {
		return;
	}

	const typedAddons = appAddons as ApplicationAddonRow[];
	const addonIds = [...new Set(typedAddons.map((row) => row.addon_id))];
	const { data: addonsMeta } = await params.supabaseAdmin
		.from("addons")
		.select("id,type")
		.in("id", addonIds);

	const typeById = new Map(
		((addonsMeta ?? []) as AddonMetaRow[]).map((row) => [row.id, row.type ?? "one_time"])
	);
	const expiresBase = new Date(now);
	expiresBase.setDate(expiresBase.getDate() + Math.max(1, Number(params.monthsPaid) || 1) * 30);

	for (const row of typedAddons) {
		const type = typeById.get(row.addon_id) ?? "one_time";
		await params.supabaseAdmin.from("company_addons").upsert(
			{
				company_id: params.companyId,
				addon_id: row.addon_id,
				status: "active",
				price_paid: row.price_snapshot != null ? Number(row.price_snapshot) : null,
				expires_at: type === "monthly" ? expiresBase.toISOString() : null,
				updated_at: now.toISOString(),
			},
			{ onConflict: "company_id,addon_id" }
		);
	}
}
