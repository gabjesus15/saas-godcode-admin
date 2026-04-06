"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { normalizeMarketingLines } from "../../../lib/plan-marketing-lines";

function newDescriptionLineId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `desc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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

type Plan = {
	id: string;
	name: string | null;
	price: number | null;
	max_branches: number | null;
	max_users: number | null;
	is_public: boolean | null;
	is_active: boolean | null;
	marketing_lines?: unknown;
};

function planCardLines(plan: Plan): string[] {
	const base: string[] = [];
	const mb = plan.max_branches ?? 0;
	base.push(mb === 1 ? "1 sucursal incluida." : `Hasta ${mb} sucursales.`);
	const mu = plan.max_users ?? 0;
	if (mu > 0) {
		base.push(mu === 1 ? "Hasta 1 usuario." : `Hasta ${mu} usuarios.`);
	}
	const custom = normalizeMarketingLines(plan.marketing_lines);
	return [...base, ...custom];
}

type DescriptionLine = { id: string; text: string };

type PlanFormState = {
	name: string;
	price: string | number;
	max_branches: string | number;
	max_users: string | number;
	is_public: boolean;
	is_active: boolean;
	descriptionLines: DescriptionLine[];
};

const emptyForm = (): PlanFormState => ({
	name: "",
	price: "",
	max_branches: "",
	max_users: "",
	is_public: true,
	is_active: true,
	descriptionLines: [],
});

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
	const [notice, setNotice] = useState<string | null>(null);
	const [form, setForm] = useState<PlanFormState>(emptyForm());

	const clearFormFields = () => {
		setForm(emptyForm());
		setShowNew(false);
		setEditingId(null);
	};

	const resetForm = () => {
		clearFormFields();
		setNotice(null);
	};

	const startNew = () => {
		resetForm();
		setShowNew(true);
	};

	const startEdit = (p: Plan) => {
		setNotice(null);
		setForm({
			name: (p.name ?? "").trim(),
			price: p.price ?? "",
			max_branches: p.max_branches ?? "",
			max_users: p.max_users ?? "",
			is_public: p.is_public !== false,
			is_active: p.is_active !== false,
			descriptionLines: normalizeMarketingLines(p.marketing_lines).map((text) => ({
				id: newDescriptionLineId(),
				text,
			})),
		});
		setEditingId(p.id);
		setShowNew(false);
	};

	const save = async () => {
		const nameTrimmed = form.name.trim();
		if (!nameTrimmed) {
			setError("El nombre del plan es obligatorio.");
			return;
		}
		const priceNum = form.price === "" ? 0 : Number(form.price);
		const maxBranchesNum = form.max_branches === "" ? 1 : Number(form.max_branches);
		const maxUsersNum = form.max_users === "" ? 0 : Number(form.max_users);
		if (Number.isNaN(priceNum) || priceNum < 0) {
			setError("Indica un precio válido (USD/mes).");
			return;
		}
		if (Number.isNaN(maxBranchesNum) || maxBranchesNum < 0) {
			setError("Indica un número válido de sucursales.");
			return;
		}
		if (Number.isNaN(maxUsersNum) || maxUsersNum < 0) {
			setError("Indica un número válido de usuarios (0 = sin límite en copy / usa solo sucursales).");
			return;
		}

		const payload = {
			name: nameTrimmed,
			price: priceNum,
			max_branches: maxBranchesNum,
			max_users: maxUsersNum,
			is_public: form.is_public,
			is_active: form.is_active,
			marketing_lines: normalizeMarketingLines(form.descriptionLines.map((l) => l.text)),
		};

		setSaving(true);
		setError(null);
		setNotice(null);
		try {
			if (editingId) {
				const res = await fetch(`/api/super-admin/plans/${editingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
					detail?: string;
					warning?: string;
				};
				if (!res.ok) {
					const extra = typeof data.detail === "string" ? ` (${data.detail})` : "";
					throw new Error((data.error ?? "Error al guardar") + extra);
				}
				if (typeof data.warning === "string") setNotice(data.warning);
			} else {
				const res = await fetch("/api/super-admin/plans", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
					detail?: string;
					warning?: string;
				};
				if (!res.ok) {
					const extra = typeof data.detail === "string" ? ` (${data.detail})` : "";
					throw new Error((data.error ?? "Error al crear") + extra);
				}
				if (typeof data.warning === "string") setNotice(data.warning);
			}
			router.refresh();
			clearFormFields();
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
						Precio, sucursales, usuarios, descripciones extra y visibilidad. Las descripciones van debajo del
						resumen de sucursales y usuarios en la tarjeta y en la landing; al añadir líneas, la tarjeta se
						alarga.
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

			{notice && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100">
					{notice}
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

						<div className="sm:col-span-2">
							<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Descripciones del plan
							</p>
							<p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
								Se añaden después del resumen automático (sucursales y usuarios). Escribe el texto y usa
								quitar o añadir otra.
							</p>
							<div className="mt-3 flex flex-col gap-4">
								{form.descriptionLines.map((line, i) => (
									<label key={line.id} className="flex flex-col gap-1 text-sm">
										<span className="font-medium text-zinc-700 dark:text-zinc-300">
											Descripción {i + 1}
										</span>
										<div className="flex gap-2">
											<Textarea
												value={line.text}
												onChange={(e) => {
													const v = e.target.value;
													setForm((prev) => ({
														...prev,
														descriptionLines: prev.descriptionLines.map((row) =>
															row.id === line.id ? { ...row, text: v } : row
														),
													}));
												}}
												placeholder="Ej. Incluye menú digital, caja y soporte por chat."
												rows={2}
												className="flex-1"
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-10 w-10 shrink-0 self-start p-0"
												onClick={() =>
													setForm((prev) => ({
														...prev,
														descriptionLines: prev.descriptionLines.filter((row) => row.id !== line.id),
													}))
												}
												aria-label={`Quitar descripción ${i + 1}`}
											>
												<Trash2 className="h-4 w-4" aria-hidden />
											</Button>
										</div>
									</label>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-fit gap-1.5"
									onClick={() =>
										setForm((prev) => ({
											...prev,
											descriptionLines: [
												...prev.descriptionLines,
												{ id: newDescriptionLineId(), text: "" },
											],
										}))
									}
								>
									<Plus className="h-4 w-4" aria-hidden />
									Añadir descripción
								</Button>
							</div>
						</div>

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
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Max usuarios</span>
							<Input
								type="number"
								min="0"
								value={form.max_users === "" ? "" : form.max_users}
								onChange={(e) =>
									setForm((p) => ({
										...p,
										max_users: e.target.value === "" ? "" : Number(e.target.value),
									}))
								}
								placeholder="0 = no mostrar en copy"
								className="h-10"
							/>
							<span className="text-xs font-normal text-zinc-500">
								En landing: si es 0 no se añade línea de usuarios; si es mayor, muestra el tope.
							</span>
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={form.is_public}
								onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
								className="h-4 w-4 rounded border-zinc-300"
							/>
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Visible en registro y landing</span>
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={form.is_active}
								onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
								className="h-4 w-4 rounded border-zinc-300"
							/>
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Plan activo</span>
						</label>
					</div>
					<div className="mt-4 flex gap-2">
						<Button type="button" onClick={save} disabled={saving}>
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
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
									{currency.format(Number(plan.price ?? 0))} / mes
								</h3>
								{plan.is_public === false ? (
									<Badge variant="destructive">Solo interno</Badge>
								) : null}
								{plan.is_active === false ? (
									<Badge variant="warning" className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
										Inactivo
									</Badge>
								) : null}
								{rate ? (
									<span className="text-xs text-zinc-500">
										{clpCurrency.format(Number(plan.price ?? 0) * rate)} aprox
									</span>
								) : null}
							</div>
						</div>
						<div className="flex flex-col gap-3">
							<ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
								{planCardLines(plan).map((line, i) => (
									<li key={`${plan.id}-${i}`} className="whitespace-pre-wrap">
										{line}
									</li>
								))}
							</ul>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
