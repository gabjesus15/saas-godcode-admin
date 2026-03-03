import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

function getSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
	}
	return createClient(url, key);
}

type CeoResult = { companyId: string; userId: string } | { error: string };

/**
 * Comprueba si el usuario de la sesión es CEO en la tabla users (no admin_users).
 * Así, si el mismo correo es super_admin y CEO, puede usar Equipo en el panel del local.
 */
async function getCeoCompanyId(supabaseAdmin: ReturnType<typeof createClient>): Promise<CeoResult> {
	const supabase = await createSupabaseServerClient();
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

	if (error) return { error: error.message };
	if (!rows?.length) return { error: "Usuario no encontrado en la empresa" };
	const row = rows.find((r) => (r.role || "").toLowerCase() === "ceo");
	if (!row?.company_id) return { error: "Tu usuario no tiene rol CEO en esta empresa" };
	return { companyId: row.company_id, userId: row.id };
}

export async function GET() {
	try {
		const supabaseAdmin = getSupabaseAdmin();
		const ceo = await getCeoCompanyId(supabaseAdmin);
		if ("error" in ceo) {
			return NextResponse.json({ error: ceo.error }, { status: 403 });
		}

		// Selección sin allowed_tabs para no fallar si la columna no existe (migración pendiente)
		const { data, error } = await supabaseAdmin
			.from("users")
			.select("id,email,role,branch_id,created_at,branch:branches(name)")
			.eq("company_id", ceo.companyId)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json({ users: data ?? [] });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const supabaseAdmin = getSupabaseAdmin();
		const ceo = await getCeoCompanyId(supabaseAdmin);
		if ("error" in ceo) {
			return NextResponse.json({ error: ceo.error }, { status: 403 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
		}
		const email = typeof (body as Record<string, unknown>)?.email === "string" ? (body as { email: string }).email.trim().toLowerCase() : "";
		const password = typeof (body as Record<string, unknown>)?.password === "string" ? (body as { password: string }).password : "";
		const branchId =
			typeof (body as Record<string, unknown>)?.branch_id === "string" && (body as { branch_id: string }).branch_id.trim().length > 0
				? (body as { branch_id: string }).branch_id.trim()
				: null;
		const allowedTabs = Array.isArray((body as Record<string, unknown>)?.allowed_tabs)
			? (body as { allowed_tabs: unknown[] }).allowed_tabs.filter((t: unknown) => typeof t === "string")
			: null;

		if (!email || !password) {
			return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
		}

		if (branchId) {
			const { data: branch, error: branchError } = await supabaseAdmin
				.from("branches")
				.select("id,company_id")
				.eq("id", branchId)
				.maybeSingle();
			if (branchError || !branch || branch.company_id !== ceo.companyId) {
				return NextResponse.json({ error: "La sucursal no pertenece a tu empresa" }, { status: 400 });
			}
		}

		const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
		});
		if (authError) {
			return NextResponse.json({ error: authError.message }, { status: 400 });
		}

		const insertPayload: Record<string, unknown> = {
			email,
			role: "staff",
			company_id: ceo.companyId,
			branch_id: branchId,
			auth_user_id: authUser.user?.id,
			auth_id: authUser.user?.id,
			created_by: ceo.userId,
		};
		if (allowedTabs && allowedTabs.length > 0) {
			insertPayload.allowed_tabs = allowedTabs;
		}

		const { error } = await supabaseAdmin.from("users").insert(insertPayload);
		if (error) {
			// Si falla por columna allowed_tabs inexistente, reintentar sin ella
			if (insertPayload.allowed_tabs && (error.message?.includes("allowed_tabs") || error.message?.includes("column"))) {
				delete insertPayload.allowed_tabs;
				const retry = await supabaseAdmin.from("users").insert(insertPayload);
				if (retry.error) {
					return NextResponse.json({ error: retry.error.message }, { status: 400 });
				}
			} else {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const supabaseAdmin = getSupabaseAdmin();
		const ceo = await getCeoCompanyId(supabaseAdmin);
		if ("error" in ceo) {
			return NextResponse.json({ error: ceo.error }, { status: 403 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
		}
		const b = body as Record<string, unknown>;
		const id = typeof b?.id === "string" ? b.id.trim() : null;
		const email = typeof b?.email === "string" ? (b.email as string).trim().toLowerCase() : "";
		const role = typeof b?.role === "string" ? (b.role as string).trim().toLowerCase() : "";
		const password = typeof b?.password === "string" && (b.password as string).trim().length > 0 ? (b.password as string).trim() : null;
		const branchId =
			typeof b?.branch_id === "string" && (b.branch_id as string).trim().length > 0
				? (b.branch_id as string).trim()
				: null;
		const allowedTabs = Array.isArray(b?.allowed_tabs)
			? (b.allowed_tabs as unknown[]).filter((t: unknown) => typeof t === "string")
			: null;

		if (!id || !email || !role) {
			return NextResponse.json({ error: "Faltan id, correo o rol" }, { status: 400 });
		}
		if (!["ceo", "staff"].includes(role)) {
			return NextResponse.json({ error: "Rol debe ser ceo o staff" }, { status: 400 });
		}

		const { data: userRow, error: userError } = await supabaseAdmin
			.from("users")
			.select("id,auth_id,company_id")
			.eq("id", id)
			.maybeSingle();

		if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
		if (!userRow) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
		if (userRow.company_id !== ceo.companyId) {
			return NextResponse.json({ error: "Solo puedes editar usuarios de tu empresa" }, { status: 403 });
		}

		if (branchId) {
			const { data: branch, error: branchError } = await supabaseAdmin
				.from("branches")
				.select("id,company_id")
				.eq("id", branchId)
				.maybeSingle();
			if (branchError || !branch || branch.company_id !== ceo.companyId) {
				return NextResponse.json({ error: "La sucursal no pertenece a tu empresa" }, { status: 400 });
			}
		}

		if (userRow.auth_id) {
			if (password) {
				const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, { password });
				if (passError) return NextResponse.json({ error: passError.message }, { status: 400 });
			}
			const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, { email });
			if (emailError) return NextResponse.json({ error: emailError.message }, { status: 400 });
		}

		const updatePayload: Record<string, unknown> = {
			email,
			role,
			branch_id: branchId,
		};
		if (allowedTabs !== null) updatePayload.allowed_tabs = allowedTabs.length > 0 ? allowedTabs : null;

		const { error } = await supabaseAdmin.from("users").update(updatePayload).eq("id", id);
		if (error) {
			if (updatePayload.allowed_tabs !== undefined && (error.message?.includes("allowed_tabs") || error.message?.includes("column"))) {
				delete updatePayload.allowed_tabs;
				const retry = await supabaseAdmin.from("users").update(updatePayload).eq("id", id);
				if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
			} else {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const supabaseAdmin = getSupabaseAdmin();
		const ceo = await getCeoCompanyId(supabaseAdmin);
		if ("error" in ceo) {
			return NextResponse.json({ error: ceo.error }, { status: 403 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
		}
		const id = typeof (body as Record<string, unknown>)?.id === "string" ? (body as { id: string }).id.trim() : null;
		if (!id) {
			return NextResponse.json({ error: "Falta el id del usuario" }, { status: 400 });
		}

		if (id === ceo.userId) {
			return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
		}

		const { data: userRow, error: userError } = await supabaseAdmin
			.from("users")
			.select("id,auth_id,email,company_id")
			.eq("id", id)
			.maybeSingle();

		if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
		if (!userRow) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
		if (userRow.company_id !== ceo.companyId) {
			return NextResponse.json({ error: "Solo puedes eliminar usuarios de tu empresa" }, { status: 403 });
		}

		if (userRow.auth_id) {
			const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userRow.auth_id);
			if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
		}
		const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
		if (error) return NextResponse.json({ error: error.message }, { status: 400 });
		return NextResponse.json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
