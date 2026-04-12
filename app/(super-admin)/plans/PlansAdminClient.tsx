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
	max_branches: number | null;
	max_users: number | null;
	is_public: boolean | null;
	is_active: boolean | null;
	marketing_lines?: unknown;
	prices_by_continent?: Record<string, { price: number; currency: string }>;
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

type PriceByContinent = {
	id: string;
	continent: "USA/Canada" | "Latinoamérica" | "Europe" | "Asia" | "Africa" | "Oceania";
	price: string | number;
	currency: string;
};

type PlanFormState = {
	name: string;
	max_branches: string | number;
	max_users: string | number;
	is_public: boolean;
	is_active: boolean;
	descriptionLines: DescriptionLine[];
	pricesByContinent: PriceByContinent[];
	// Formulario temporal para agregar múltiples precios a la vez
	tempPrice: string | number;
	tempCurrency: string;
	tempSelectedRegions: PriceByContinent["continent"][];
};

const emptyForm = (): PlanFormState => ({
	name: "",
	max_branches: "",
	max_users: "",
	is_public: true,
	is_active: true,
	descriptionLines: [],
	pricesByContinent: [],
	tempPrice: "",
	tempCurrency: "USD",
	tempSelectedRegions: [],
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
		const pricesByContinent = Object.entries(p.prices_by_continent || {}).map(([continent, data]) => ({
			id: newDescriptionLineId(),
			continent: continent as PriceByContinent["continent"],
			price: data.price,
			currency: data.currency,
		}));
		setForm({
			name: (p.name ?? "").trim(),
			max_branches: p.max_branches ?? "",
			max_users: p.max_users ?? "",
			is_public: p.is_public !== false,
			is_active: p.is_active !== false,
			descriptionLines: normalizeMarketingLines(p.marketing_lines).map((text) => ({
				id: newDescriptionLineId(),
				text,
			})),
			pricesByContinent,
			tempPrice: "",
			tempCurrency: "USD",
			tempSelectedRegions: [],
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
		if (form.pricesByContinent.length === 0) {
			setError("Debes agregar al menos un precio por región.");
			return;
		}
		const maxBranchesNum = form.max_branches === "" ? 1 : Number(form.max_branches);
		const maxUsersNum = form.max_users === "" ? 0 : Number(form.max_users);
		if (Number.isNaN(maxBranchesNum) || maxBranchesNum < 0) {
			setError("Indica un número válido de sucursales.");
			return;
		}
		if (Number.isNaN(maxUsersNum) || maxUsersNum < 0) {
			setError("Indica un número válido de usuarios (0 = sin límite).");
			return;
		}

		const payload = {
			name: nameTrimmed,
			max_branches: maxBranchesNum,
			max_users: maxUsersNum,
			is_public: form.is_public,
			is_active: form.is_active,
			marketing_lines: normalizeMarketingLines(form.descriptionLines.map((l) => l.text)),
			prices_by_continent: form.pricesByContinent.reduce((acc, p) => {
				acc[p.continent] = {
					price: Number(p.price),
					currency: p.currency,
				};
				return acc;
			}, {} as Record<string, { price: number; currency: string }>),
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

					{/* Precios por región */}
					<div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
						<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Precios por región</p>
						<p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
							Ingresa el precio, selecciona las regiones y aplica a todas de una vez.
						</p>

						{/* Formulario para agregar múltiples precios */}
						<div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-zinc-900/50">
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="flex flex-col gap-1 text-sm">
									<span className="font-medium text-zinc-700 dark:text-zinc-300">Precio</span>
									<input
										type="number"
										min="0"
										placeholder="20"
										value={form.tempPrice === "" ? "" : form.tempPrice}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												tempPrice: e.target.value === "" ? "" : Number(e.target.value),
											}))
										}
										className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
									/>
								</label>
								<label className="flex flex-col gap-1 text-sm">
									<span className="font-medium text-zinc-700 dark:text-zinc-300">Moneda</span>
									<input
										type="text"
										placeholder="USD"
										maxLength="3"
										value={form.tempCurrency}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												tempCurrency: e.target.value.toUpperCase(),
											}))
										}
										className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-center text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
									/>
								</label>
							</div>

							<div className="sm:col-span-2">
								<p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Aplicar a estas regiones:</p>
								<div className="grid gap-2 sm:grid-cols-2">
									{["USA/Canada", "Latinoamérica", "Europe", "Asia", "Africa", "Oceania"].map((region) => (
										<label key={region} className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={form.tempSelectedRegions.includes(region as PriceByContinent["continent"])}
												onChange={(e) => {
													const continent = region as PriceByContinent["continent"];
													setForm((p) => ({
														...p,
														tempSelectedRegions: e.target.checked
															? [...p.tempSelectedRegions, continent]
															: p.tempSelectedRegions.filter((c) => c !== continent),
													}));
												}}
												className="h-4 w-4 rounded border-zinc-300"
											/>
											<span className="text-zinc-700 dark:text-zinc-300">{region}</span>
										</label>
									))}
								</div>
							</div>

							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full gap-1.5"
								onClick={() => {
									const price = Number(form.tempPrice);
									if (Number.isNaN(price) || price < 0 || form.tempSelectedRegions.length === 0) {
										setError("Ingresa precio válido y selecciona al menos una región.");
										return;
									}
									setError(null);

									const newPrices = form.tempSelectedRegions.map((continent) => ({
										id: newDescriptionLineId(),
										continent,
										price,
										currency: form.tempCurrency,
									}));

									setForm((p) => ({
										...p,
										pricesByContinent: [...p.pricesByContinent, ...newPrices],
										tempPrice: "",
										tempCurrency: "USD",
										tempSelectedRegions: [],
									}));
								}}
							>
								<Plus className="h-4 w-4" aria-hidden />
								Aplicar precio a {form.tempSelectedRegions.length} región{form.tempSelectedRegions.length !== 1 ? "es" : ""}
							</Button>
						</div>

						{/* Tabla de precios ya agregados */}
						{form.pricesByContinent.length > 0 && (
							<div className="mt-4 space-y-2">
								<p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Precios configurados:</p>
								{form.pricesByContinent.map((pc, idx) => (
									<div key={pc.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
										<div className="flex gap-4 items-center">
											<span className="font-medium text-zinc-900 dark:text-zinc-100">{pc.continent}</span>
											<span className="text-sm text-zinc-600 dark:text-zinc-400">{pc.currency} {pc.price}</span>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-8 w-8 p-0"
											onClick={() => {
												setForm((prev) => ({
													...prev,
													pricesByContinent: prev.pricesByContinent.filter((_, i) => i !== idx),
												}));
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="mt-6 flex gap-2">
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
								{(() => {
									// Buscar precio en orden de preferencia: Latinoamérica (default) o el primero disponible
									const latinPrice = plan.prices_by_continent?.["Latinoamérica"];
									const priceData = latinPrice || Object.values(plan.prices_by_continent || {})[0];
									return (
										<h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
											{priceData
												? currency.format(priceData.price)
												: "Precio no configurado"} / mes
										</h3>
									);
								})()}
								{plan.is_public === false ? (
									<Badge variant="destructive">Solo interno</Badge>
								) : null}
								{plan.is_active === false ? (
									<Badge variant="warning" className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
										Inactivo
									</Badge>
								) : null}
								{rate && (() => {
									const latinPrice = plan.prices_by_continent?.["Latinoamérica"];
									const priceData = latinPrice || Object.values(plan.prices_by_continent || {})[0];
									return priceData ? (
										<span className="text-xs text-zinc-500">
											{clpCurrency.format(priceData.price * rate)} aprox
										</span>
									) : null;
								})()}
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
