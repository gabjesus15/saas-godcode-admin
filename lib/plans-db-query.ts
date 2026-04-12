import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseAdmin } from "./supabase-admin";

const ADMIN_PLANS_SELECT_BASE =
	"id,name,price,max_branches,max_users,is_public,is_active,features";

const PUBLIC_LANDING_SELECT_BASE =
	"id,name,price,max_branches,max_users,features,is_active";

function isPlansMarketingLinesColumnError(error: PostgrestError | null): boolean {
	const msg = (error?.message ?? "").toLowerCase();
	const hint = (error?.hint ?? "").toLowerCase();
	return msg.includes("marketing_lines") || hint.includes("marketing_lines");
}

/** Listado panel super-admin (orden por precio). Reintenta sin `marketing_lines` si la migración aún no está aplicada. */
export async function queryAdminPlansList() {
	const full = `${ADMIN_PLANS_SELECT_BASE},marketing_lines`;
	const first = await supabaseAdmin
		.from("plans")
		.select(full)
		.order("price", { ascending: true });

	if (!first.error) {
		return { data: first.data ?? [], error: null as PostgrestError | null };
	}

	if (!isPlansMarketingLinesColumnError(first.error)) {
		return { data: null, error: first.error };
	}

	const second = await supabaseAdmin
		.from("plans")
		.select(ADMIN_PLANS_SELECT_BASE)
		.order("price", { ascending: true });

	if (second.error) {
		return { data: null, error: second.error };
	}

	return {
		data: (second.data ?? []).map((row) => ({ ...row, marketing_lines: [] })),
		error: null as PostgrestError | null,
	};
}

/** Filas para landing pública (`is_public`). */
export async function queryPublicPlansLandingRows() {
	const full = `${PUBLIC_LANDING_SELECT_BASE},marketing_lines`;
	const first = await supabaseAdmin
		.from("plans")
		.select(full)
		.eq("is_public", true)
		.order("price", { ascending: true });

	if (!first.error) {
		return { data: first.data ?? [], error: null as PostgrestError | null };
	}

	if (!isPlansMarketingLinesColumnError(first.error)) {
		return { data: null, error: first.error };
	}

	const second = await supabaseAdmin
		.from("plans")
		.select(PUBLIC_LANDING_SELECT_BASE)
		.eq("is_public", true)
		.order("price", { ascending: true });

	if (second.error) {
		return { data: null, error: second.error };
	}

	return {
		data: (second.data ?? []).map((row) => ({ ...row, marketing_lines: [] })),
		error: null as PostgrestError | null,
	};
}

export type AdminPlanMutationResult = {
	data: { id: string }[] | null;
	error: PostgrestError | null;
	/** Se omitió `marketing_lines` porque la columna no existe aún en la base de datos. */
	marketingLinesSkipped: boolean;
};

/** UPDATE por id (service role). Si falla por columna `marketing_lines` ausente, reintenta sin ella. */
export async function adminUpdatePlanById(
	id: string,
	updates: Record<string, unknown>
): Promise<AdminPlanMutationResult> {
	const first = await supabaseAdmin.from("plans").update(updates).eq("id", id).select("id");

	if (!first.error) {
		return { data: first.data, error: null, marketingLinesSkipped: false };
	}

	const hasMarketingLines = Object.prototype.hasOwnProperty.call(updates, "marketing_lines");
	if (!hasMarketingLines || !isPlansMarketingLinesColumnError(first.error)) {
		return { data: first.data, error: first.error, marketingLinesSkipped: false };
	}

	const rest = { ...updates };
	delete (rest as Record<string, unknown>).marketing_lines;
	if (Object.keys(rest).length === 0) {
		return { data: null, error: first.error, marketingLinesSkipped: false };
	}

	const second = await supabaseAdmin.from("plans").update(rest).eq("id", id).select("id");
	if (second.error) {
		return { data: second.data, error: second.error, marketingLinesSkipped: false };
	}
	return { data: second.data, error: null, marketingLinesSkipped: true };
}

export type AdminInsertPlanResult = AdminPlanMutationResult & { singleId: string | null };

/** INSERT plan (service role). Si falla por columna `marketing_lines` ausente, reintenta sin ella. */
export async function adminInsertPlan(payload: Record<string, unknown>): Promise<AdminInsertPlanResult> {
	const first = await supabaseAdmin.from("plans").insert(payload).select("id").single();

	if (!first.error) {
		const id = first.data?.id ?? null;
		return {
			data: id ? [{ id }] : null,
			error: null,
			marketingLinesSkipped: false,
			singleId: id,
		};
	}

	const hasMarketingLines = Object.prototype.hasOwnProperty.call(payload, "marketing_lines");
	if (!hasMarketingLines || !isPlansMarketingLinesColumnError(first.error)) {
		return { data: null, error: first.error, marketingLinesSkipped: false, singleId: null };
	}

	const rest = { ...payload };
	delete (rest as Record<string, unknown>).marketing_lines;
	const second = await supabaseAdmin.from("plans").insert(rest).select("id").single();

	if (second.error) {
		return { data: null, error: second.error, marketingLinesSkipped: false, singleId: null };
	}
	const id = second.data?.id ?? null;
	return {
		data: id ? [{ id }] : null,
		error: null,
		marketingLinesSkipped: true,
		singleId: id,
	};
}
