import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYMENT_METHODS_ALLOWED_ROLES = new Set(["owner", "ceo"]);

async function getTenantPaymentMethodsContext(): Promise<
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
		return { error: "Solo el dueño o CEO puede configurar métodos de pago." };
	}
	return { companyId: row.company_id, userId: row.id };
}

/** GET: listar cuentas conectadas y configuración por sucursal */
export async function GET() {
	try {
		const ctx = await getTenantPaymentMethodsContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		const branchesRes = await supabaseAdmin
			.from("branches")
			.select("id,name,payment_methods,pago_movil,zelle,transferencia_bancaria,paypal,stripe")
			.eq("company_id", ctx.companyId)
			.order("name");
		const branches = branchesRes.data ?? [];
		const branchIds = branches.map((b) => b.id);

		const [accountsRes, branchMethodsRes] = await Promise.all([
			supabaseAdmin
				.from("tenant_connected_accounts")
				.select("id,provider,display_name,status,created_at")
				.eq("company_id", ctx.companyId),
			branchIds.length > 0
				? supabaseAdmin
						.from("branch_payment_methods")
						.select("branch_id,provider,is_enabled")
						.in("branch_id", branchIds)
				: { data: [] as { branch_id: string; provider: string; is_enabled: boolean }[] },
		]);

		const branchMethods = (branchMethodsRes.data ?? []) as {
			branch_id: string;
			provider: string;
			is_enabled: boolean;
		}[];

		return NextResponse.json({
			connectedAccounts: accountsRes.data ?? [],
			branchMethods,
			branches,
		});
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error" },
			{ status: 500 }
		);
	}
}

/** PATCH: habilitar/deshabilitar un método en una sucursal */
export async function PATCH(req: NextRequest) {
	try {
		const ctx = await getTenantPaymentMethodsContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		const body = (await req.json().catch(() => ({}))) as {
			branch_id?: string;
			provider?: string;
			is_enabled?: boolean;
		};
		const branchId = body.branch_id;
		const provider = body.provider === "paypal" || body.provider === "stripe" ? body.provider : null;
		const isEnabled = Boolean(body.is_enabled);

		if (!branchId || !provider) {
			return NextResponse.json(
				{ error: "branch_id y provider (paypal|stripe) son obligatorios" },
				{ status: 400 }
			);
		}

		const { data: branch } = await supabaseAdmin
			.from("branches")
			.select("id,payment_methods")
			.eq("id", branchId)
			.eq("company_id", ctx.companyId)
			.maybeSingle();
		if (!branch) {
			return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
		}

		await supabaseAdmin.from("branch_payment_methods").upsert(
			{
				branch_id: branchId,
				provider,
				is_enabled: isEnabled,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "branch_id,provider" }
		);

		// Sincronizar con branches para que el cliente vea el método en el menú/carrito
		const currentMethods = Array.isArray(branch.payment_methods) ? branch.payment_methods : [];
		const hasProvider = currentMethods.includes(provider);
		let newMethods: string[];
		const updates: { payment_methods?: string[]; paypal?: object | null; stripe?: object | null } = {};
		if (isEnabled && !hasProvider) {
			newMethods = [...currentMethods.filter((m) => m !== provider), provider];
			updates.payment_methods = newMethods;
			if (provider === "paypal") {
				const { data: acc } = await supabaseAdmin
					.from("tenant_connected_accounts")
					.select("display_name,external_id")
					.eq("company_id", ctx.companyId)
					.eq("provider", "paypal")
					.eq("status", "active")
					.maybeSingle();
				updates.paypal = acc ? { email: acc.display_name || acc.external_id || "" } : {};
			}
			if (provider === "stripe") {
				const { data: acc } = await supabaseAdmin
					.from("tenant_connected_accounts")
					.select("id")
					.eq("company_id", ctx.companyId)
					.eq("provider", "stripe")
					.eq("status", "active")
					.maybeSingle();
				updates.stripe = acc ? { connected: true } : {};
			}
		} else if (!isEnabled && hasProvider) {
			newMethods = currentMethods.filter((m) => m !== provider);
			updates.payment_methods = newMethods;
			if (provider === "paypal") updates.paypal = null;
			if (provider === "stripe") updates.stripe = null;
		}
		if (Object.keys(updates).length > 0) {
			await supabaseAdmin
				.from("branches")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", branchId)
				.eq("company_id", ctx.companyId);
		}

		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error" },
			{ status: 500 }
		);
	}
}
