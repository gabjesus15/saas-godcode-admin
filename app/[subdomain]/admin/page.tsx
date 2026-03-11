import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { AdminApp } from "../../../components/tenant/admin/admin-app";

interface TenantAdminPageProps {
  params: Promise<{ subdomain: string }>;
}

interface DynamicAdminModule {
	id: string;
	tab_id: string;
	label: string;
	description: string | null;
	nav_group: "root" | "sales" | "menu";
	nav_order: number;
	allowed_roles: string[] | null;
	is_active: boolean;
}

export default async function TenantAdminPage({
	params,
}: TenantAdminPageProps) {
	const resolvedParams = await params;
	const supabase = await createSupabaseServerClient("tenant");
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		redirect(`/${resolvedParams.subdomain}/login`);
	}

	const { data: company } = await supabase
		.from("companies")
		.select("id,name,theme_config")
		.eq("public_slug", resolvedParams.subdomain)
		.maybeSingle();

	if (!company) {
		redirect("/");
	}

	// Validar acceso por auth_user_id + company_id (tenant scoped)
	const { data: adminRows, error: adminError } = await supabase
		.from("users")
		.select("id,role,allowed_tabs")
		.eq("company_id", company.id)
		.eq("auth_user_id", user.id)
		.maybeSingle();

	if (adminError) {
		redirect(`/${resolvedParams.subdomain}/login`);
	}

	const allowedRoles = new Set(["admin", "ceo", "cashier"]);
	let resolvedRole = String(adminRows?.role ?? "").toLowerCase() || null;

	// Fallback: buscar por email si auth_user_id no retorna nada
	if (!resolvedRole) {
		const { data: userRow } = await supabase
			.from("users")
			.select("role,allowed_tabs")
			.ilike("email", user.email)
			.eq("company_id", company.id)
			.maybeSingle();

		resolvedRole = String(userRow?.role ?? "").toLowerCase() || null;
		if (userRow && adminRows) {
			adminRows.allowed_tabs = userRow.allowed_tabs;
		}
	}

	const hasAccess = Boolean(resolvedRole && allowedRoles.has(resolvedRole));

	if (!hasAccess) {
		redirect(`/${resolvedParams.subdomain}/login`);
	}

	const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
	const logoUrl = company.theme_config?.logoUrl ?? null;
	const roleNavPermissions =
		(company.theme_config as Record<string, unknown> | null)?.roleNavPermissions ?? null;

	const userAllowedTabs = Array.isArray(adminRows?.allowed_tabs)
		? adminRows.allowed_tabs
		: null;

	const { data: dynamicModulesData } = await supabase
		.from("saas_admin_modules")
		.select("id,tab_id,label,description,nav_group,nav_order,allowed_roles,is_active")
		.eq("is_active", true)
		.order("nav_group", { ascending: true })
		.order("nav_order", { ascending: true })
		.order("label", { ascending: true });

	const dynamicModules = ((dynamicModulesData ?? []) as DynamicAdminModule[]).map((module) => ({
		id: module.id,
		tabId: module.tab_id,
		label: module.label,
		description: module.description ?? "",
		navGroup: module.nav_group,
		navOrder: module.nav_order,
		allowedRoles: Array.isArray(module.allowed_roles) ? module.allowed_roles : ["admin", "ceo"],
		isActive: module.is_active,
	}));

	const hasTicketsModule = dynamicModules.some((module) => module.tabId === "module:tickets");
	if (!hasTicketsModule) {
		dynamicModules.push({
			id: "system-module-tickets",
			tabId: "module:tickets",
			label: "Soporte",
			description: "Crea y da seguimiento a tickets de soporte.",
			navGroup: "root",
			navOrder: 85,
			allowedRoles: ["admin", "ceo", "cashier"],
			isActive: true,
		});
	}

	return (
		<AdminApp
			companyId={company.id}
			companyName={name}
			logoUrl={logoUrl}
			userEmail={user.email ?? null}
			roleNavPermissions={roleNavPermissions as Record<string, string[]> | null}
			userAllowedTabs={userAllowedTabs}
			dynamicModules={dynamicModules}
		/>
	);
}
