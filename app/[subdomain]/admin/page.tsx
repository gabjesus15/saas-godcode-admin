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

	// Comentario: evitar acceso cross-tenant validando pertenencia del usuario al tenant actual.
	const { data: tenantUser } = await supabase
		.from("users")
		.select("id")
		.eq("email", user.email)
		.eq("company_id", company.id)
		.maybeSingle();

	if (!tenantUser) {
		redirect("/login");
	}

	const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
	const logoUrl = company.theme_config?.logoUrl ?? null;

	return (
		<AdminApp
			companyId={company.id}
			companyName={name}
			logoUrl={logoUrl}
			userEmail={user.email ?? null}
		/>
	);
}
