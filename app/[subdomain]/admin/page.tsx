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

	// Acceso al panel del local solo vía users (por empresa). CEO y staff entran solo a su local.
	const { data: userRow, error: userError } = await supabase
		.from("users")
		.select("role,allowed_tabs")
		.ilike("email", user.email)
		.eq("company_id", company.id)
		.maybeSingle();

	const allowedRoles = new Set(["ceo", "staff"]);
	const hasAccess =
		!userError &&
		Boolean(userRow?.role && allowedRoles.has(String(userRow.role).toLowerCase()));

	if (!hasAccess) {
		redirect("/login");
	}

	const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
	const logoUrl = company.theme_config?.logoUrl ?? null;
	const roleNavPermissions =
		(company.theme_config as Record<string, unknown> | null)?.roleNavPermissions ?? null;

	const userAllowedTabs = Array.isArray((userRow as { allowed_tabs?: string[] } | null)?.allowed_tabs)
		? (userRow as { allowed_tabs: string[] }).allowed_tabs
		: null;

	return (
		<AdminApp
			companyId={company.id}
			companyName={name}
			logoUrl={logoUrl}
			userEmail={user.email ?? null}
			roleNavPermissions={roleNavPermissions as Record<string, string[]> | null}
			userAllowedTabs={userAllowedTabs}
		/>
	);
}
