export type AdminRole = "owner" | "super_admin" | "admin" | "support" | string;

export const roleSets = {
	billing: ["owner", "super_admin", "admin"],
	destructive: ["owner", "super_admin"],
};

export async function requireAdminRole(allowedRoles: string[]) {
	try {
		const response = await fetch("/api/admin-permissions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ allowedRoles }),
		});

		const data = (await response.json()) as
			| { ok: true; email: string; role: string }
			| { ok: false; error?: string };

		if (!response.ok || !data.ok) {
			return {
				ok: false,
				error: data.ok ? "No autorizado" : data.error ?? "No autorizado",
			} as const;
		}

		return { ok: true, email: data.email, role: data.role } as const;
	} catch {
		return { ok: false, error: "No se pudo validar el usuario." } as const;
	}
}
