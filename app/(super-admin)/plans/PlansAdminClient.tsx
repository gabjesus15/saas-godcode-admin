"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

const currency = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const clpCurrency = new Intl.NumberFormat("es-CL", {
	style: "currency",
	currency: "CLP",
	maximumFractionDigits: 0,
});

const featureLabels: Record<string, string> = {
	crm: "CRM",
	cash: "Caja",
	menu: "Menu",
};

type Plan = {
	id: string;
	name: string | null;
	price: number | null;
	max_branches: number | null;
	is_public: boolean | null;
	features: Record<string, boolean> | null;
};

export function PlansAdminClient({
	plans,
	rate,
}: {
	plans: Plan[];
	rate: number | null;
}) {
	const router = useRouter();
	const [showNew, setShowNew] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState({
		name: "",
		price: "" as string | number,
		max_branches: "" as string | number,
		is_public: true,
	});

	const resetForm = () => {
		setForm({ name: "", price: "", max_branches: "", is_public: true });
		setShowNew(false);
		setEditingId(null);
	};

	const startNew = () => {
		resetForm();
		setShowNew(true);
	};

	const startEdit = (p: Plan) => {
		setForm({
			name: p.name ?? "",
			price: p.price ?? "",
			max_branches: p.max_branches ?? "",
			is_public: p.is_public !== false,
		});
		setEditingId(p.id);
		setShowNew(false);
	};

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			if (editingId) {
				const res = await fetch(`/api/super-admin/plans/${editingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: form.name,
						price: form.price === "" ? 0 : Number(form.price),
						max_branches: form.max_branches === "" ? 1 : Number(form.max_branches),
						is_public: form.is_public,
					}),
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data.error ?? "Error al guardar");
			} else {
				const res = await fetch("/api/super-admin/plans", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: form.name,
						price: form.price === "" ? 0 : Number(form.price),
						max_branches: form.max_branches === "" ? 1 : Number(form.max_branches),
						is_public: form.is_public,
					}),
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data.error ?? "Error al crear");
			}
			router.refresh();
			resetForm();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex min-w-0 flex-col gap-4 sm:gap-6">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
						Planes
					</h2>
					<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
						Controla la oferta y límites del SaaS.
					</p>
				</div>
				<Button type="button" onClick={startNew} disabled={showNew}>
					Nuevo plan
				</Button>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
					{error}
				</div>
			)}

			{(showNew || editingId) && (
				<Card className="p-4 sm:p-5">
					<h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{editingId ? "Editar plan" : "Nuevo plan"}
					</h3>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</span>
							<Input
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
								placeholder="Básico"
								className="h-10"
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Precio (USD/mes)</span>
							<Input
								type="number"
								min="0"
								step="1"
								value={form.price === "" ? "" : form.price}
								onChange={(e) =>
									setForm((p) => ({ ...p, price: e.target.value === "" ? "" : Number(e.target.value) }))
								}
								placeholder="0"
								className="h-10"
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Max sucursales</span>
							<Input
								type="number"
								min="0"
								value={form.max_branches === "" ? "" : form.max_branches}
								onChange={(e) =>
									setForm((p) => ({
										...p,
										max_branches: e.target.value === "" ? "" : Number(e.target.value),
									}))
								}
								placeholder="1"
								className="h-10"
							/>
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={form.is_public}
								onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
								className="h-4 w-4 rounded border-zinc-300"
							/>
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Visible en registro</span>
						</label>
					</div>
					<div className="mt-4 flex gap-2">
						<Button type="button" onClick={save} disabled={saving || !form.name.trim()}>
							{saving ? "Guardando…" : editingId ? "Guardar" : "Crear"}
						</Button>
						<Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
							Cancelar
						</Button>
					</div>
				</Card>
			)}

			<div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				   {plans.map((plan) => (
					   <Card key={plan.id} className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
						   <div className="flex flex-col gap-2">
							   <div className="flex items-center justify-between">
								   <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									   {plan.name ?? "Sin nombre"}
								   </p>
								   <Button type="button" variant="outline" size="sm" onClick={() => startEdit(plan)}>
									   Editar
								   </Button>
							   </div>
							   <div className="flex items-center gap-2 mt-2">
								   <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
									   {currency.format(Number(plan.price ?? 0))} / mes
								   </h3>
								   {plan.is_public === false ? (
									   <Badge variant="destructive">Solo interno</Badge>
								   ) : null}
								   {rate ? (
									   <span className="text-xs text-zinc-500">
										   {clpCurrency.format(Number(plan.price ?? 0) * rate)} aprox
									   </span>
								   ) : null}
							   </div>
						   </div>
						   <div className="flex flex-col gap-3">
							   {/* Descripción y features unificados */}
							   {plan.name?.toLowerCase() === "basico" && (
								   <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
									   Incluye CRM, Caja y Menu.
								   </div>
							   )}
							   {plan.name?.toLowerCase().includes("beta") && (
								   <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
									   Acceso gratis por 1 mes a casi todas las funciones.
								   </div>
							   )}
							   {plan.name?.toLowerCase().includes("dev") && (
								   <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
									   Plan interno con acceso ilimitado.
								   </div>
							   )}
							   {plan.features && Object.keys(plan.features).length > 0 && (
								   <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
									   Modulos incluidos:
								   </div>
							   )}
							   <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
								   {/* Features y descripción */}
								   {plan.name?.toLowerCase() === "basico" && (
									   <>
										   <li>1 sucursal incluida.</li>
										   <li>Sucursales extra: $100 / mes c/u.</li>
										   <li>Soporte basico.</li>
									   </>
								   )}
								   {plan.name?.toLowerCase().includes("beta") && (
									   <>
										   <li>CRM, Caja y Menu incluidos.</li>
										   <li>Sucursales ilimitadas durante el beta.</li>
										   <li>Soporte prioritario durante el mes gratis.</li>
									   </>
								   )}
								   {plan.name?.toLowerCase().includes("dev") && (
									   <>
										   <li>Acceso completo a todas las funciones.</li>
										   <li>Sucursales ilimitadas sin vencimiento.</li>
										   <li>Soporte directo para el equipo interno.</li>
									   </>
								   )}
								   {plan.features && Object.keys(plan.features).length > 0 && (
									   Object.entries(plan.features)
										   .filter(([, enabled]) => enabled)
										   .map(([key]) => (
											   <li key={key}>{featureLabels[key] ?? key}</li>
										   ))
								   )}
								   {!(plan.name?.toLowerCase() === "basico" || plan.name?.toLowerCase().includes("beta") || plan.name?.toLowerCase().includes("dev")) && !plan.features && (
									   <li>Max sucursales: <span className="font-semibold">{plan.max_branches ?? 0}</span></li>
								   )}
							   </ul>
						   </div>
					   </Card>
				   ))}
			</div>
		</div>
	);
}
