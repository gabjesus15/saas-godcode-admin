import type { Metadata, Viewport } from "next";

import "../super-admin.tailwind.css";
import { SaasAdminPwaRegister } from "../../components/super-admin/saas-admin-pwa-register";
import { SaasThemeScope } from "../../components/theme/saas-theme-scope";
import { ThemeToggle } from "../../components/theme/theme-toggle";

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

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<SaasAdminPwaRegister />
			<SaasThemeScope />
			<ThemeToggle />
			{children}
		</>
	);
}
