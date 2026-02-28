import { createSupabaseServerClient } from "../supabase/server";

const FALLBACK_ALLOWED_ROLES = new Set(["owner", "super_admin", "admin"]);

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

		const email = user.email;
		let role: string | null = null;

		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("role")
			.eq("email", email)
			.maybeSingle();

		if (adminError) {
			return { ok: false, status: 500, error: "No se pudo validar permisos" };
		}

		role = adminUser?.role ?? null;

		if (!role) {
			const { data: userRow, error: roleError } = await supabase
				.from("users")
				.select("role")
				.eq("email", email)
				.maybeSingle();

			if (roleError) {
				return { ok: false, status: 500, error: "No se pudo validar permisos" };
			}

			role = userRow?.role ?? null;
		}

		if (!role) {
			return { ok: false, status: 403, error: "No tienes permisos asignados." };
		}

		if (!allowedRoles.includes(role)) {
			return { ok: false, status: 403, error: "No tienes permisos para esta accion." };
		}

		return { ok: true, status: 200, email, role };
	} catch {
		return { ok: false, status: 500, error: "Error al validar sesion" };
	}
}

