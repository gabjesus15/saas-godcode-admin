import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminRolesOnServer } from "../../../utils/admin/server-auth";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateSuperAdminAccess() {
	const result = await validateAdminRolesOnServer(["owner", "super_admin", "admin"]);
	if (!result.ok) {
		return {
			ok: false as const,
			response: NextResponse.json(
				{ error: result.error ?? "No autorizado" },
				{ status: result.status }
			),
		};
	}
	return { ok: true as const };
}

export async function POST(req: NextRequest) {
	const access = await validateSuperAdminAccess();
	if (!access.ok) {
		return access.response;
	}

	const { email, password, role, company_id, branch_id } = await req.json();
	if (!email || !password || !role || !company_id) {
		return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
	}
	const normalizedBranchId =
		typeof branch_id === "string" && branch_id.trim().length > 0
			? branch_id.trim()
			: null;

	if (normalizedBranchId) {
		const { data: branch, error: branchError } = await supabaseAdmin
			.from("branches")
			.select("id,company_id")
			.eq("id", normalizedBranchId)
			.maybeSingle();

		if (branchError) {
			return NextResponse.json({ error: branchError.message }, { status: 400 });
		}

		if (!branch || branch.company_id !== company_id) {
			return NextResponse.json({ error: "La sucursal no pertenece a la empresa" }, { status: 400 });
		}
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	// 1. Crear usuario en Auth
	const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
		email: normalizedEmail,
		password,
		email_confirm: true,
	});
	if (authError) {
		return NextResponse.json({ error: authError.message }, { status: 400 });
	}
	// 2. Guardar en tabla users
	const { error } = await supabaseAdmin.from("users").insert({
		email: normalizedEmail,
		role,
		company_id,
		branch_id: normalizedBranchId,
		auth_user_id: authUser.user?.id,
		auth_id: authUser.user?.id,
	});
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	const { data: existingAdminUser } = await supabaseAdmin
		.from("admin_users")
		.select("id")
		.ilike("email", normalizedEmail)
		.maybeSingle();

	if (existingAdminUser?.id) {
		const { error: adminUpdateError } = await supabaseAdmin
			.from("admin_users")
			.update({ email: normalizedEmail, role })
			.eq("id", existingAdminUser.id);

		if (adminUpdateError) {
			return NextResponse.json({ error: adminUpdateError.message }, { status: 400 });
		}
	} else {
		const { error: adminInsertError } = await supabaseAdmin
			.from("admin_users")
			.insert({
				email: normalizedEmail,
				role,
			});

		if (adminInsertError) {
			return NextResponse.json({ error: adminInsertError.message }, { status: 400 });
		}
	}
	return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
	const access = await validateSuperAdminAccess();
	if (!access.ok) {
		return access.response;
	}

	const { id } = await req.json();
	if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
	// Buscar auth_id
	const { data: userRow, error: userError } = await supabaseAdmin
		.from("users")
		.select("auth_id,email,company_id")
		.eq("id", id)
		.maybeSingle();
	if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });

	if (userRow?.email) {
		const { error: adminDeleteError } = await supabaseAdmin
			.from("admin_users")
			.delete()
			.ilike("email", String(userRow.email).trim().toLowerCase());
		if (adminDeleteError) {
			return NextResponse.json({ error: adminDeleteError.message }, { status: 400 });
		}
	}

	if (userRow?.auth_id) {
		const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userRow.auth_id);
		if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
	}
	const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
	const access = await validateSuperAdminAccess();
	if (!access.ok) {
		return access.response;
	}

	const { id, email, role, password, branch_id } = await req.json();
	if (!id || !email || !role) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
	const normalizedEmail = String(email).trim().toLowerCase();
	const normalizedBranchId =
		typeof branch_id === "string" && branch_id.trim().length > 0
			? branch_id.trim()
			: null;

	if (normalizedBranchId) {
		const { data: userCompany, error: userCompanyError } = await supabaseAdmin
			.from("users")
			.select("company_id")
			.eq("id", id)
			.maybeSingle();

		if (userCompanyError || !userCompany?.company_id) {
			return NextResponse.json({ error: "No se pudo validar la empresa del usuario" }, { status: 400 });
		}

		const { data: branch, error: branchError } = await supabaseAdmin
			.from("branches")
			.select("id,company_id")
			.eq("id", normalizedBranchId)
			.maybeSingle();

		if (branchError) {
			return NextResponse.json({ error: branchError.message }, { status: 400 });
		}

		if (!branch || branch.company_id !== userCompany.company_id) {
			return NextResponse.json({ error: "La sucursal no pertenece a la empresa" }, { status: 400 });
		}
	}
	// Buscar auth_id
	const { data: userRow, error: userError } = await supabaseAdmin
		.from("users")
		.select("auth_id,company_id,email")
		.eq("id", id)
		.maybeSingle();
	if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
	if (userRow?.auth_id) {
		if (password) {
			const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
				userRow.auth_id,
				{ password }
			);
			if (passError) return NextResponse.json({ error: passError.message }, { status: 400 });
		}
		if (email) {
			const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
				userRow.auth_id,
				{ email: normalizedEmail }
			);
			if (emailError) return NextResponse.json({ error: emailError.message }, { status: 400 });
		}
	}
	const { error } = await supabaseAdmin
		.from("users")
		.update({ email: normalizedEmail, role, branch_id: normalizedBranchId })
		.eq("id", id);
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });

	if (userRow) {
		const previousEmail = String(userRow.email ?? "").trim().toLowerCase();
		const { data: existingAdminUser } = await supabaseAdmin
			.from("admin_users")
			.select("id")
			.ilike("email", previousEmail)
			.maybeSingle();

		if (existingAdminUser?.id) {
			const { error: adminUpdateError } = await supabaseAdmin
				.from("admin_users")
				.update({ email: normalizedEmail, role })
				.eq("id", existingAdminUser.id);
			if (adminUpdateError) {
				return NextResponse.json({ error: adminUpdateError.message }, { status: 400 });
			}
		} else {
			const { error: adminInsertError } = await supabaseAdmin
				.from("admin_users")
				.insert({
					email: normalizedEmail,
					role,
				});
			if (adminInsertError) {
				return NextResponse.json({ error: adminInsertError.message }, { status: 400 });
			}
		}
	}

	return NextResponse.json({ success: true });
}
