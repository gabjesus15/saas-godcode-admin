import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../utils/supabase/server";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYMENT_METHODS_ALLOWED_ROLES = new Set(["owner", "ceo"]);

async function getContext(): Promise<
	{ companyId: string } | { error: string }
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
	return { companyId: row.company_id };
}

function sanitizeObject(obj: unknown): Record<string, string> | null {
	if (obj === null || obj === undefined) return null;
	if (typeof obj !== "object" || Array.isArray(obj)) return null;
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (typeof k !== "string") continue;
		if (v === null || v === undefined) continue;
		out[k] = String(v).trim();
	}
	return out;
}

/** PUT: actualizar datos de pago de una sucursal (pago_movil, zelle, transferencia_bancaria) */
export async function PUT(req: NextRequest) {
	try {
		const ctx = await getContext();
		if ("error" in ctx) {
			return NextResponse.json({ error: ctx.error }, { status: 403 });
		}

		const body = (await req.json().catch(() => ({}))) as {
			branch_id?: string;
			pago_movil?: Record<string, unknown> | null;
			zelle?: Record<string, unknown> | null;
			transferencia_bancaria?: Record<string, unknown> | null;
		};

		const branchId = body.branch_id;
		if (!branchId || typeof branchId !== "string") {
			return NextResponse.json(
				{ error: "branch_id es obligatorio" },
				{ status: 400 }
			);
		}

		const { data: branch } = await supabaseAdmin
			.from("branches")
			.select("id")
			.eq("id", branchId)
			.eq("company_id", ctx.companyId)
			.maybeSingle();
		if (!branch) {
			return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
		}

		const updates: {
			pago_movil?: Record<string, string> | null;
			zelle?: Record<string, string> | null;
			transferencia_bancaria?: Record<string, string> | null;
			updated_at: string;
		} = { updated_at: new Date().toISOString() };

		if (Object.prototype.hasOwnProperty.call(body, "pago_movil")) {
			updates.pago_movil = body.pago_movil === null ? null : sanitizeObject(body.pago_movil);
		}
		if (Object.prototype.hasOwnProperty.call(body, "zelle")) {
			updates.zelle = body.zelle === null ? null : sanitizeObject(body.zelle);
		}
		if (Object.prototype.hasOwnProperty.call(body, "transferencia_bancaria")) {
			updates.transferencia_bancaria =
				body.transferencia_bancaria === null ? null : sanitizeObject(body.transferencia_bancaria);
		}

		await supabaseAdmin
			.from("branches")
			.update(updates)
			.eq("id", branchId)
			.eq("company_id", ctx.companyId);

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("branch-config put:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Error al guardar" },
			{ status: 500 }
		);
	}
}
