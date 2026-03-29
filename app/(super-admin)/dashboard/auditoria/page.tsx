import Link from "next/link";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import type { Json } from "../../../../types/supabase-database";

export const dynamic = "force-dynamic";

type Row = {
	id: string;
	created_at: string;
	actor_email: string | null;
	action: string;
	target_type: string;
	target_id: string | null;
	metadata: Json | null;
};

function metadataPreview(meta: Json | null): string {
	if (meta == null || typeof meta !== "object" || Array.isArray(meta)) return "—";
	const o = meta as Record<string, unknown>;
	const keys = Object.keys(o).slice(0, 4);
	if (keys.length === 0) return "—";
	return keys.map((k) => `${k}: ${JSON.stringify(o[k])}`).join("; ").slice(0, 120);
}

export default async function AuditoriaPage() {
	const { data, error } = await supabaseAdmin
		.from("admin_audit_logs")
		.select("id,created_at,actor_email,action,target_type,target_id,metadata")
		.order("created_at", { ascending: false })
		.limit(120);

	const rows = (data ?? []) as Row[];

	return (
		<div className="min-w-0 space-y-6">
			<div>
				<Link
					href="/dashboard"
					className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
				>
					← Volver al dashboard
				</Link>
				<h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Auditoría de mutaciones</h2>
				<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
					Registro de mutaciones del API super-admin (tabla <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">admin_audit_logs</code>
					). El rol del actor se guarda dentro de <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">metadata</code>.
				</p>
			</div>

			{error ? (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
					No se pudo leer auditoría: {error.message}
				</div>
			) : null}

			<div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
				<table className="min-w-full text-left text-sm">
					<thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
						<tr>
							<th className="px-3 py-3">Fecha</th>
							<th className="px-3 py-3">Actor</th>
							<th className="px-3 py-3">Acción</th>
							<th className="px-3 py-3">Tipo / id</th>
							<th className="px-3 py-3">Detalle</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
						{rows.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
									{error ? "Corrige el error anterior." : "Aún no hay eventos registrados."}
								</td>
							</tr>
						) : (
							rows.map((r) => (
								<tr key={r.id} className="text-zinc-800 dark:text-zinc-200">
									<td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
										{new Date(r.created_at).toLocaleString("es-CL")}
									</td>
									<td className="max-w-[140px] truncate px-3 py-2.5 text-xs">{r.actor_email ?? "—"}</td>
									<td className="px-3 py-2.5 font-mono text-xs">{r.action}</td>
									<td className="max-w-[180px] truncate px-3 py-2.5 text-xs">
										{r.target_type}
										{r.target_id ? ` · ${r.target_id.slice(0, 10)}${r.target_id.length > 10 ? "…" : ""}` : ""}
									</td>
									<td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
										{metadataPreview(r.metadata)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
