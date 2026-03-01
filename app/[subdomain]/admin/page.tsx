import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { AdminApp } from "../../../components/tenant/admin/admin-app";

interface TenantAdminPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantAdminPage({
	params,
}: TenantAdminPageProps) {
	const resolvedParams = await params;
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		redirect("/login");
	}

	const { data: company } = await supabase
		.from("companies")
		.select("id,name,theme_config")
		.eq("public_slug", resolvedParams.subdomain)
		.maybeSingle();

	if (!company) {
		redirect("/");
	}

	const { data: adminRows, error: adminError } = await supabase
		.from("admin_users")
		.select("id,role")
		.ilike("email", user.email)
		.in("role", ["owner", "super_admin", "admin", "ceo", "cashier"]);

	if (adminError) {
		redirect("/login");
	}

	const adminMatches = Array.isArray(adminRows) ? adminRows : [];
	let hasAccess = adminMatches.length > 0;

	if (!hasAccess) {
		const { data: userRow } = await supabase
			.from("users")
			.select("role")
			.ilike("email", user.email)
			.eq("company_id", company.id)
			.maybeSingle();

		const allowedRoles = new Set(["owner", "super_admin", "admin", "ceo", "cashier"]);
		hasAccess = Boolean(userRow?.role && allowedRoles.has(String(userRow.role).toLowerCase()));
	}

	if (!hasAccess) {
		redirect("/login");
	}

	const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
	const logoUrl = company.theme_config?.logoUrl ?? null;
	const roleNavPermissions =
		(company.theme_config as Record<string, unknown> | null)?.roleNavPermissions ?? null;

	return (
		<AdminApp
			companyId={company.id}
			companyName={name}
			logoUrl={logoUrl}
			userEmail={user.email ?? null}
			roleNavPermissions={roleNavPermissions as Record<string, string[]> | null}
		/>
	);
}
