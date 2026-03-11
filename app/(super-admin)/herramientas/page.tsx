import { RolesManager } from "@/components/super-admin/roles-manager";
import { AdminModulesManager } from "@/components/super-admin/admin-modules-manager";
import { BroadcastsManager } from "@/components/super-admin/broadcasts-manager";

export default function HerramientasPage() {
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
