import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../../utils/supabase/server";
import Stripe from "stripe";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";
const PAYMENT_METHODS_ALLOWED_ROLES = new Set(["owner", "ceo"]);

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

/** POST: crear cuenta Stripe Connect Express y devolver URL de onboarding */
export async function POST() {
	try {
		if (!STRIPE_SECRET) {
			return NextResponse.json(
				{ error: "Stripe no está configurado en la plataforma." },
				{ status: 503 }
			);
		}

		const ctx = await getContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2025-02-24.acacia" });

		const existing = await supabaseAdmin
			.from("tenant_connected_accounts")
			.select("id,external_id,status")
			.eq("company_id", ctx.companyId)
			.eq("provider", "stripe")
			.maybeSingle();

		let accountId: string;

		if (existing?.data?.external_id && existing.data.status === "active") {
			return NextResponse.json(
				{ error: "Ya tienes una cuenta Stripe conectada." },
				{ status: 400 }
			);
		}

		if (existing?.data?.external_id && existing.data.status === "pending") {
			accountId = existing.data.external_id;
		} else {
			const account = await stripe.accounts.create({
				type: "express",
				country: "US",
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
				metadata: { company_id: ctx.companyId },
			});
			accountId = account.id;

			await supabaseAdmin.from("tenant_connected_accounts").upsert(
				{
					company_id: ctx.companyId,
					provider: "stripe",
					external_id: accountId,
					display_name: null,
					status: "pending",
					metadata: {},
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "company_id,provider" }
			);
		}

		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
			"http://localhost:3000";
		const returnUrl = `${baseUrl}/api/tenant-payment-methods/stripe-return?company_id=${encodeURIComponent(ctx.companyId)}`;
		const refreshUrl = `${baseUrl}/api/tenant-payment-methods/stripe-return?company_id=${encodeURIComponent(ctx.companyId)}&refresh=1`;

		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: refreshUrl,
			return_url: returnUrl,
			type: "account_onboarding",
		});

		return NextResponse.json({ url: accountLink.url });
	} catch (err) {
		console.error("stripe connect create:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error al crear enlace" },
			{ status: 500 }
		);
	}
}
