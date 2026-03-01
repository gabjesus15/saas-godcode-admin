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
}

export function AdminApp({ companyId, companyName, logoUrl, userEmail, roleNavPermissions }: AdminAppProps) {
	return (
		<LocationProvider>
			<CashProvider>
				<BusinessProvider>
					<AdminProvider companyId={companyId} roleNavPermissions={roleNavPermissions}>
						<AdminPage companyName={companyName} logoUrl={logoUrl} userEmail={userEmail} />
					</AdminProvider>
				</BusinessProvider>
			</CashProvider>
		</LocationProvider>
	);
}
