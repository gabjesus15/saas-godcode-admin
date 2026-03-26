import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../utils/supabase/server";

import { supabaseAdmin } from "../../../../../lib/supabase-admin";

const PAYMENT_METHODS_ALLOWED_ROLES = new Set(["owner", "ceo"]);

function isValidEmail(email: string): boolean {
	const trimmed = email?.trim();
	if (!trimmed || trimmed.length > 254) return false;
	const at = trimmed.indexOf("@");
	return at > 0 && at < trimmed.length - 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function getContext(): Promise<
	{ companyId: string; userId: string } | { error: string }
> {
	const supabase = await createSupabaseServerClient("tenant");
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user?.email) {
		return { error: "No autenticado" };
	}

	const email = user.email.trim();
	const { data: rows, error } = await supabaseAdmin
		.from("users")
		.select("id,company_id,role")
		.ilike("email", email);

	if (error || !rows?.length) {
		return { error: "Usuario no encontrado en la empresa." };
	}

	const row = rows.find((r) =>
		PAYMENT_METHODS_ALLOWED_ROLES.has(String(r.role ?? "").toLowerCase())
	);
	if (!row?.company_id) {
		return { error: "Solo el dueño o CEO puede conectar métodos de pago." };
	}
	return { companyId: row.company_id, userId: row.id };
}

/** POST: vincular cuenta PayPal del negocio por email (donde quieren recibir pagos) */
export async function POST(req: NextRequest) {
	try {
		const ctx = await getContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		const body = (await req.json().catch(() => ({}))) as { paypal_email?: string };
		const paypalEmail = typeof body.paypal_email === "string" ? body.paypal_email.trim() : "";
		if (!paypalEmail) {
			return NextResponse.json(
				{ error: "Indica el email de la cuenta PayPal donde quieres recibir los pagos." },
				{ status: 400 }
			);
		}
		if (!isValidEmail(paypalEmail)) {
			return NextResponse.json(
				{ error: "El email de PayPal no es válido." },
				{ status: 400 }
			);
		}

		await supabaseAdmin.from("tenant_connected_accounts").upsert(
			{
				company_id: ctx.companyId,
				provider: "paypal",
				external_id: paypalEmail.toLowerCase(),
				display_name: paypalEmail,
				status: "active",
				metadata: {},
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "company_id,provider" }
		);

		// Actualizar sucursales que ya tenían PayPal activado para que el cliente vea el email correcto
		const { data: enabledBranches } = await supabaseAdmin
			.from("branch_payment_methods")
			.select("branch_id")
			.eq("provider", "paypal")
			.eq("is_enabled", true);
		const branchIds = (enabledBranches ?? []).map((r) => r.branch_id).filter(Boolean);
		if (branchIds.length > 0) {
			await supabaseAdmin
				.from("branches")
				.update({ paypal: { email: paypalEmail }, updated_at: new Date().toISOString() })
				.in("id", branchIds)
				.eq("company_id", ctx.companyId);
		}

		return NextResponse.json({ ok: true, display_name: paypalEmail });
	} catch (err) {
		console.error("paypal connect:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error al conectar PayPal" },
			{ status: 500 }
		);
	}
}

/** DELETE: desconectar la cuenta PayPal del negocio */
export async function DELETE() {
	try {
		const ctx = await getContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		await supabaseAdmin
			.from("tenant_connected_accounts")
			.delete()
			.eq("company_id", ctx.companyId)
			.eq("provider", "paypal");

		// Quitar PayPal de métodos visibles en todas las sucursales para el cliente
		const { data: companyBranches } = await supabaseAdmin
			.from("branches")
			.select("id,payment_methods")
			.eq("company_id", ctx.companyId);
		for (const b of companyBranches ?? []) {
			const methods = Array.isArray(b.payment_methods) ? b.payment_methods : [];
			if (!methods.includes("paypal")) continue;
			const newMethods = methods.filter((m) => m !== "paypal");
			await supabaseAdmin
				.from("branches")
				.update({
					payment_methods: newMethods,
					paypal: null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", b.id);
		}

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("paypal disconnect:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error al desconectar" },
			{ status: 500 }
		);
	}
}
