"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

type Addon = {
	id: string;
	slug: string;
	name: string | null;
	description: string | null;
	price_one_time: number | null;
	price_monthly: number | null;
	type: string;
	is_active: boolean;
	sort_order: number;
};

const currency = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2,
});

export default function AddonsPage() {
	const [addons, setAddons] = useState<Addon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showNew, setShowNew] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		slug: "",
		name: "",
		description: "",
		price_one_time: "" as string | number,
		price_monthly: "" as string | number,
		type: "monthly" as "one_time" | "monthly",
		is_active: true,
		sort_order: 0,
	});

	const load = () => {
		fetch("/api/super-admin/addons")
			.then((res) => res.json())
			.then((json: { data?: Addon[] }) => setAddons(json.data ?? []))
			.catch(() => setError("Error al cargar"))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		load();
	}, []);

	const resetForm = () => {
		setForm({
			slug: "",
			name: "",
			description: "",
			price_one_time: "",
			price_monthly: "",
			type: "monthly",
			is_active: true,
			sort_order: addons.length,
		});
		setShowNew(false);
		setEditingId(null);
	};

	const startNew = () => {
		resetForm();
		setForm((f) => ({ ...f, sort_order: addons.length }));
		setShowNew(true);
	};

	const startEdit = (a: Addon) => {
		setForm({
			slug: a.slug,
			name: a.name ?? "",
			description: a.description ?? "",
			price_one_time: a.price_one_time ?? "",
			price_monthly: a.price_monthly ?? "",
			type: (a.type === "monthly" ? "monthly" : "one_time") as "one_time" | "monthly",
			is_active: a.is_active,
			sort_order: a.sort_order,
		});
		setEditingId(a.id);
		setShowNew(false);
	};

	const saveNew = async () => {
		setSaving(true);
		setError(null);
		try {
			const res = await fetch("/api/super-admin/addons", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slug: form.slug,
					name: form.name,
					description: form.description || undefined,
					price_one_time: form.price_one_time === "" ? null : Number(form.price_one_time),
					price_monthly: form.price_monthly === "" ? null : Number(form.price_monthly),
					type: form.type,
					is_active: form.is_active,
					sort_order: form.sort_order,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error ?? "Error al crear");
			load();
			resetForm();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al crear");
		} finally {
			setSaving(false);
		}
	};

	const saveEdit = async () => {
		if (!editingId) return;
		setSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/super-admin/addons/${editingId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slug: form.slug,
					name: form.name,
					description: form.description || undefined,
					price_one_time: form.price_one_time === "" ? null : Number(form.price_one_time),
					price_monthly: form.price_monthly === "" ? null : Number(form.price_monthly),
					type: form.type,
					is_active: form.is_active,
					sort_order: form.sort_order,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error ?? "Error al guardar");
			load();
			resetForm();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-4 sm:gap-6">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
						Servicios extra (add-ons)
					</h1>
					<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
						Servicios opcionales que los clientes pueden contratar en el registro (dominio propio, personalización, etc.).
					</p>
				</div>
				<Button type="button" onClick={startNew} disabled={showNew}>
					Nuevo add-on
				</Button>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
					{error}
				</div>
			)}

			{(showNew || editingId) && (
				<Card className="p-4 sm:p-5">
					<h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{editingId ? "Editar add-on" : "Nuevo add-on"}
					</h2>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Slug (único)</span>
							<Input
								value={form.slug}
								onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
								placeholder="custom_domain"
								className="h-10"
								disabled={!!editingId}
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Nombre</span>
							<Input
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
								placeholder="Dominio propio"
								className="h-10"
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm sm:col-span-2">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Descripción</span>
							<Input
								value={form.description}
								onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
								placeholder="Opcional"
								className="h-10"
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Tipo</span>
							<select
								className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
								value={form.type}
								onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "one_time" | "monthly" }))}
							>
								<option value="one_time">Pago único</option>
								<option value="monthly">Mensual</option>
							</select>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Precio único (USD)</span>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={form.price_one_time === "" ? "" : form.price_one_time}
								onChange={(e) =>
									setForm((p) => ({
										...p,
										price_one_time: e.target.value === "" ? "" : Number(e.target.value),
									}))
								}
								placeholder="50"
								className="h-10"
								disabled={form.type === "monthly"}
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Precio mensual (USD)</span>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={form.price_monthly === "" ? "" : form.price_monthly}
								onChange={(e) =>
									setForm((p) => ({
										...p,
										price_monthly: e.target.value === "" ? "" : Number(e.target.value),
									}))
								}
								placeholder="5"
								className="h-10"
								disabled={form.type === "one_time"}
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Orden</span>
							<Input
								type="number"
								min="0"
								value={form.sort_order}
								onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
								className="h-10"
							/>
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={form.is_active}
								onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
								className="h-4 w-4 rounded border-zinc-300"
							/>
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Activo (visible en registro)</span>
						</label>
					</div>
					<div className="mt-4 flex gap-2">
						<Button
							type="button"
							onClick={editingId ? saveEdit : saveNew}
							disabled={saving || !form.slug || !form.name}
						>
							{saving ? "Guardando…" : editingId ? "Guardar" : "Crear"}
						</Button>
						<Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
							Cancelar
						</Button>
					</div>
				</Card>
			)}

			<div className="grid gap-4">
				{addons.map((a) => (
					<Card key={a.id} className="p-4 sm:p-5">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div>
								<p className="font-medium text-zinc-900 dark:text-zinc-100">{a.name ?? a.slug}</p>
								<p className="text-xs text-zinc-500">{a.slug}</p>
								{a.description ? (
									<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{a.description}</p>
								) : null}
							</div>
							<div className="flex items-center gap-2">
								{a.type === "monthly" && a.price_monthly != null ? (
									<Badge variant="neutral">{currency.format(Number(a.price_monthly))}/mes</Badge>
								) : null}
								{a.type === "one_time" && a.price_one_time != null ? (
									<Badge variant="neutral">{currency.format(Number(a.price_one_time))} único</Badge>
								) : null}
								{!a.is_active ? (
									<Badge variant="destructive">Oculto</Badge>
								) : null}
								<Button type="button" variant="outline" size="sm" onClick={() => startEdit(a)}>
									Editar
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>

			{addons.length === 0 && !showNew && (
				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
					No hay add-ons. Clic en &quot;Nuevo add-on&quot; para crear uno (ej. dominio propio, personalización).
				</div>
			)}
		</div>
	);
}
