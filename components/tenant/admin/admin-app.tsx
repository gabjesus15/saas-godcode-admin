"use client";

import { AdminPage } from "./kit/admin/pages/Admin";
import { AdminProvider } from "./kit/admin/pages/AdminProvider";
import { LocationProvider } from "./kit/context/LocationContext";
import { CashProvider } from "./kit/context/CashContext";
import { BusinessProvider } from "./kit/context/BusinessContext";

interface AdminAppProps {
	companyId: string;
	companyName: string;
	logoUrl?: string | null;
	userEmail?: string | null;
	roleNavPermissions?: Record<string, string[]> | null;
	userAllowedTabs?: string[] | null;
	dynamicModules?: {
		id: string;
		tabId: string;
		label: string;
		description: string;
		navGroup: "root" | "sales" | "menu";
		navOrder: number;
		allowedRoles: string[];
		isActive: boolean;
	}[];
	primaryColor?: string;
}

export function AdminApp({ companyId, companyName, logoUrl, userEmail, roleNavPermissions, userAllowedTabs, dynamicModules = [], primaryColor }: AdminAppProps) {
	return (
		<LocationProvider>
			<CashProvider>
				<BusinessProvider>
					<AdminProvider
						companyId={companyId}
						roleNavPermissions={roleNavPermissions}
						userAllowedTabs={userAllowedTabs}
						dynamicModules={dynamicModules}
					>
						<AdminPage companyName={companyName} logoUrl={logoUrl} userEmail={userEmail} primaryColor={primaryColor} />
					</AdminProvider>
				</BusinessProvider>
			</CashProvider>
		</LocationProvider>
	);
}
