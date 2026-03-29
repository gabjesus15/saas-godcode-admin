import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";

import { AdminRoleProvider } from "../../components/super-admin/admin-role-context";
import { SaasAdminPwaRegister } from "../../components/super-admin/saas-admin-pwa-register";
import { AdminShell } from "../../components/super-admin/admin-shell";
import { SaasThemeScope } from "../../components/theme/saas-theme-scope";
import { ThemeToggle } from "../../components/theme/theme-toggle";
import { createSupabaseServerClient } from "../../utils/supabase/server";

export const metadata: Metadata = {
	manifest: "/saas-admin/manifest.webmanifest",
	icons: {
		icon: "/globe.svg",
		apple: "/globe.svg",
	},
	appleWebApp: {
		capable: true,
		title: "GodCode Admin",
		statusBarStyle: "default",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#111827",
};

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
	const allowedRoles = new Set(["super_admin", "support"]);

	if (adminError || !adminUser || !allowedRoles.has(role)) {
		redirect("/login");
	}

	return (
		<>
			<SaasAdminPwaRegister />
			<SaasThemeScope />
			<ThemeToggle />
			<AdminRoleProvider role={role}>
				<AdminShell>{children}</AdminShell>
			</AdminRoleProvider>
		</>
	);
}
