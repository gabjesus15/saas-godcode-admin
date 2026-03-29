"use client";
import dynamic from "next/dynamic";
import { useAdminRole } from "@/components/super-admin/admin-role-context";

const RolesManager = dynamic(() => import("@/components/super-admin/roles-manager").then(mod => mod.default), { ssr: false });
const AdminModulesManager = dynamic(() => import("@/components/super-admin/admin-modules-manager").then(mod => mod.default), { ssr: false });
const BroadcastsManager = dynamic(() => import("@/components/super-admin/broadcasts-manager").then(mod => mod.default), { ssr: false });

export function HerramientasClient() {
	const { readOnly } = useAdminRole();
	return (
		<div className="min-w-0 space-y-4 sm:space-y-6">
			<div>
				<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
					Herramientas
				</h2>
				<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
					Gestión de roles y configuración avanzada del sistema.
				</p>
			</div>

			{readOnly ? (
				<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
					Modo soporte: solo lectura en esta página. Los cambios requieren rol de super admin.
				</p>
			) : null}

			<RolesManager />
			<AdminModulesManager />
			<BroadcastsManager />
		</div>
	);
}
