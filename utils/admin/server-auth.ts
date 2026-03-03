import { createSupabaseServerClient } from "../supabase/server";

const FALLBACK_ALLOWED_ROLES = new Set(["super_admin"]);

export interface ServerAdminPermissionResult {
	ok: boolean;
	status: number;
	email?: string;
	role?: string;
	error?: string;
}

export async function validateAdminRolesOnServer(
	allowedRoles: string[] = Array.from(FALLBACK_ALLOWED_ROLES)
): Promise<ServerAdminPermissionResult> {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user?.email) {
			return { ok: false, status: 401, error: "No autenticado" };
		}

		const email = user.email.trim();
		let role: string | null = null;

		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("role")
			.ilike("email", email)
			.maybeSingle();

		if (adminError) {
			return { ok: false, status: 500, error: "No se pudo validar permisos" };
		}

		role = adminUser?.role ?? null;

		if (!role) {
			const { data: userRow, error: roleError } = await supabase
				.from("users")
				.select("role")
				.ilike("email", email)
				.maybeSingle();

			if (roleError) {
				return { ok: false, status: 500, error: "No se pudo validar permisos" };
			}

			role = userRow?.role ?? null;
		}

		if (!role) {
			return { ok: false, status: 403, error: "No tienes permisos asignados." };
		}

		const roleLower = (role || "").toLowerCase();
		const allowedLower = new Set(allowedRoles.map((r) => r.toLowerCase()));
		if (!allowedLower.has(roleLower)) {
			return { ok: false, status: 403, error: "No tienes permisos para esta accion." };
		}

		return { ok: true, status: 200, email, role };
	} catch {
		return { ok: false, status: 500, error: "Error al validar sesion" };
	}
}

