"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";

type Method = {
	id: string;
	slug: string;
	name: string | null;
	countries: string[];
	auto_verify: boolean;
	sort_order: number;
	is_active: boolean;
	config: Record<string, string>;
};

/** Métodos que se cobran con .env; no tienen formulario de datos */
const ONLINE_METHOD_SLUGS = ["paypal", "stripe"];

/** Campos por método: solo los que tienen sentido para cada uno (datos que verá el cliente al pagar) */
const METHOD_FIELDS: Record<string, { key: string; label: string; placeholder?: string }[]> = {
	pago_movil: [
		{ key: "banco", label: "Banco", placeholder: "Ej: Mercantil, Banesco" },
		{ key: "telefono", label: "Teléfono", placeholder: "Ej: 0412-1234567" },
		{ key: "identificacion", label: "Cédula", placeholder: "Ej: V-12345678" },
	],
	zelle: [
		{ key: "email", label: "Correo Zelle", placeholder: "Ej: pagos@tuempresa.com" },
		{ key: "name", label: "Nombre del titular", placeholder: "Ej: Juan Pérez" },
	],
	transferencia: [
		{ key: "banco", label: "Banco", placeholder: "Ej: Banco de Chile" },
		{ key: "tipo_cuenta", label: "Tipo de cuenta", placeholder: "Ej: Cuenta corriente" },
		{ key: "nro_cuenta", label: "Número de cuenta", placeholder: "Ej: 1234567890" },
		{ key: "identificacion", label: "RUT / Cédula", placeholder: "Ej: 12.345.678-9" },
		{ key: "titular", label: "Nombre del titular", placeholder: "Ej: Tu empresa SpA" },
		{ key: "email", label: "Correo (opcional)", placeholder: "Para confirmación" },
	],
	transferencia_bancaria: [
		{ key: "banco", label: "Banco", placeholder: "Ej: Banco de Chile" },
		{ key: "tipo_cuenta", label: "Tipo de cuenta", placeholder: "Ej: Cuenta corriente" },
		{ key: "nro_cuenta", label: "Número de cuenta", placeholder: "Ej: 1234567890" },
		{ key: "identificacion", label: "RUT / Cédula", placeholder: "Ej: 12.345.678-9" },
		{ key: "titular", label: "Nombre del titular", placeholder: "Ej: Tu empresa SpA" },
		{ key: "email", label: "Correo (opcional)", placeholder: "Para confirmación" },
	],
};

/** Si el método no está en METHOD_FIELDS, usamos estos como fallback */
const FALLBACK_KEYS = [
	{ key: "phone", label: "Teléfono", placeholder: "Ej: 0412-1234567" },
	{ key: "email", label: "Correo", placeholder: "Ej: pagos@ejemplo.com" },
	{ key: "bank", label: "Banco", placeholder: "Ej: Nombre del banco" },
	{ key: "account_number", label: "Número de cuenta", placeholder: "Ej: 1234567890" },
	{ key: "instructions", label: "Instrucciones", placeholder: "Ej: Indicar nombre en el pago" },
];

function getFieldsForMethod(slug: string) {
	return METHOD_FIELDS[slug] ?? FALLBACK_KEYS;
}

export default function PlanPaymentMethodsPage() {
	const [methods, setMethods] = useState<Method[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editConfig, setEditConfig] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch("/api/super-admin/plan-payment-methods")
			.then((res) => res.json())
			.then((json: { data?: Method[] }) => setMethods(json.data ?? []))
			.catch(() => setError("Error al cargar"))
			.finally(() => setLoading(false));
	}, []);

	const startEdit = (m: Method) => {
		setEditingId(m.id);
		setEditConfig({ ...m.config });
	};

	const saveConfig = async () => {
		if (!editingId) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/super-admin/plan-payment-methods/${editingId}/config`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ config: editConfig }),
			});
			if (!res.ok) throw new Error("Error al guardar");
			setMethods((prev) =>
				prev.map((m) => (m.id === editingId ? { ...m, config: { ...editConfig } } : m))
			);
			setEditingId(null);
		} catch {
			setError("No se pudo guardar");
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
			<div>
				<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
					Métodos de pago del plan
				</h1>
				<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
					Configura los datos que verá el cliente al pagar (teléfono Pago Móvil, email Zelle, banco, etc.).
				</p>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
					{error}
				</div>
			)}

			<div className="grid gap-4">
				{methods.map((m) => {
					const isOnline = ONLINE_METHOD_SLUGS.includes(m.slug);
					return (
						<Card key={m.id} className="p-4 sm:p-5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<p className="font-medium text-zinc-900 dark:text-zinc-100">{m.name ?? m.slug}</p>
									<p className="text-xs text-zinc-500">
										{m.countries?.join(", ") || "—"} · {m.auto_verify ? "Auto-verificación" : "Validación manual"}
									</p>
								</div>
								{!isOnline && (
									editingId !== m.id ? (
										<Button type="button" variant="outline" size="sm" onClick={() => startEdit(m)}>
											Editar datos
										</Button>
									) : (
										<div className="flex gap-2">
											<Button type="button" size="sm" onClick={saveConfig} disabled={saving}>
												{saving ? "Guardando…" : "Guardar"}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => { setEditingId(null); }}
											>
												Cancelar
											</Button>
										</div>
									)
								)}
							</div>
							{isOnline ? (
								<p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
									Se configura con las variables de entorno (.env): {m.slug === "paypal" ? "PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET" : "STRIPE_SECRET_KEY"}. No hace falta cargar datos aquí; el cliente paga en la página de {m.name ?? m.slug}.
								</p>
							) : editingId === m.id ? (
								<div className="mt-4 grid gap-3 sm:grid-cols-2">
									{getFieldsForMethod(m.slug).map(({ key, label, placeholder }) => (
										<label key={key} className="flex flex-col gap-1 text-sm">
											<span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
											<Input
												value={editConfig[key] ?? ""}
												onChange={(e) =>
													setEditConfig((prev) => ({ ...prev, [key]: e.target.value }))
												}
												placeholder={placeholder ?? ""}
												className="h-10"
											/>
										</label>
									))}
								</div>
							) : null}
							{!isOnline && editingId !== m.id && Object.keys(m.config).length > 0 && (
								<dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
									{Object.entries(m.config).map(([k, v]) => (
										v ? (
											<div key={k}>
												<dt className="text-zinc-500 capitalize">{k.replace(/_/g, " ")}</dt>
												<dd className="font-medium text-zinc-900 dark:text-zinc-100">{v}</dd>
											</div>
										) : null
									))}
								</dl>
							)}
						</Card>
					);
				})}
			</div>

			{methods.length === 0 && !loading && (
				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
					No hay métodos configurados. Ejecuta la migración de Supabase que crea la tabla plan_payment_methods y el seed.
				</div>
			)}
		</div>
	);
}
