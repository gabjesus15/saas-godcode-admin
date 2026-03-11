"use client";
import dynamic from "next/dynamic";

const RolesManager = dynamic(() => import("@/components/super-admin/roles-manager").then(mod => mod.default), { ssr: false });
const AdminModulesManager = dynamic(() => import("@/components/super-admin/admin-modules-manager").then(mod => mod.default), { ssr: false });
const BroadcastsManager = dynamic(() => import("@/components/super-admin/broadcasts-manager").then(mod => mod.default), { ssr: false });

export function HerramientasClient() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-zinc-900">Herramientas</h2>
				<p className="mt-1 text-sm text-zinc-500">
					Gestión de roles y configuración avanzada del sistema
				</p>
			</div>

			<RolesManager />
			<AdminModulesManager />
			<BroadcastsManager />
		</div>
	);
}
