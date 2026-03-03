import { redirect } from "next/navigation";

import { AdminShell } from "../../components/super-admin/admin-shell";
import { createSupabaseServerClient } from "../../utils/supabase/server";

export default async function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user?.email) {
		redirect("/login");
	}

	// Comentario: validamos que el email exista en admin_users antes de mostrar el panel.
	const { data: adminUser, error: adminError } = await supabase
		.from("admin_users")
		.select("id,role")
		.ilike("email", user.email)
		.maybeSingle();

	const role = String(adminUser?.role ?? "").toLowerCase();
	const allowedRoles = new Set(["super_admin"]);

	if (adminError || !adminUser || !allowedRoles.has(role)) {
		redirect("/login");
	}

	return <AdminShell>{children}</AdminShell>;
}
