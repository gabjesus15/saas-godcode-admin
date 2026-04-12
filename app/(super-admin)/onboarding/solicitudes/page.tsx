"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

const STATUS_LABELS: Record<string, string> = {
	pending_verification: "Pendiente verificación",
	email_verified: "Email verificado",
	form_completed: "Formulario completo",
	payment_pending: "Pago pendiente",
	active: "Activo",
	rejected: "Rechazado",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
	pending_verification: "warning",
	email_verified: "neutral",
	form_completed: "neutral",
	payment_pending: "warning",
	active: "success",
	rejected: "destructive",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
	paid: "Pagado",
	pending: "Pendiente",
	pending_validation: "Pend. validación",
	rejected: "Rechazado",
};

const PAYMENT_STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
	paid: "success",
	pending: "warning",
	pending_validation: "warning",
	rejected: "destructive",
};

interface SolicitudRow {
	id: string;
	business_name: string | null;
	responsible_name: string | null;
	email: string | null;
	sector: string | null;
	status: string | null;
	created_at: string | null;
	updated_at: string | null;
	company_id: string | null;
	country: string | null;
	currency: string | null;
	plan_id: string | null;
	custom_plan_name: string | null;
	custom_plan_price: string | null;
	custom_domain: string | null;
	custom_domain_value: string | null;
	legal_name: string | null;
	fiscal_address: string | null;
	subscription_payment_method: string | null;
	plan_label: string;
	plan_price: number | null;
	payment_status: string | null;
	last_payment: {
		status: string;
		amount_paid: number;
		payment_date: string;
		payment_reference: string | null;
		reference_file_url: string | null;
	} | null;
}

export default function OnboardingSolicitudesPage() {
	const [apps, setApps] = useState<SolicitudRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionKey, setActionKey] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch("/api/super-admin/solicitudes")
			.then(async (res) => {
				const json = await res.json().catch(() => ({}));
				if (!res.ok) {
					const msg = json?.error ?? (res.status === 401 ? "No autorizado" : res.status === 403 ? "Sin permisos" : "Error al cargar");
					throw new Error(msg);
				}
				return json as { data?: SolicitudRow[] };
			})
			.then((json) => {
				if (!cancelled) setApps(json.data ?? []);
			})
			.catch((e) => {
				if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleValidatePayment = async (paymentReference: string | null, action: "validate" | "reject") => {
		if (!paymentReference) return;
		const key = `${action}:${paymentReference}`;
		setActionKey(key);
		try {
			let reason: string | undefined;
			if (action === "reject") {
				reason = window.prompt("Motivo del rechazo (opcional)")?.trim() || undefined;
			}
			const endpoint = action === "validate" ? "/api/super-admin/payments/validate" : "/api/super-admin/payments/reject";
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ payment_reference: paymentReference, reason }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(json?.error ?? "No se pudo procesar el pago");
			}
			window.location.reload();
		} catch (err) {
			alert(err instanceof Error ? err.message : "No se pudo procesar el pago");
		} finally {
			setActionKey(null);
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">
				Error al cargar solicitudes: {error}
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-4 sm:gap-6">
			<div>
				<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
					Solicitudes de onboarding
				</h1>
				<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
					Revisa las solicitudes de nuevos negocios, plan, extras y estado de pago.
				</p>
			</div>

			<div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[800px] text-left text-sm">
						<thead>
							<tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Negocio</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Responsable</th>
								<th className="hidden px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:table-cell sm:px-4 sm:py-3">Email</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Plan</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Extras</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Pago</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Comprobante</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Método pago</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Estado</th>
								<th className="hidden px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 md:table-cell sm:px-4 sm:py-3">Fecha</th>
								<th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{apps.map((row) => (
								<tr
									key={row.id}
									className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
								>
									<td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100 sm:px-4 sm:py-3">
										{row.business_name ?? "—"}
									</td>
									<td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 sm:px-4 sm:py-3">
										{row.responsible_name ?? "—"}
									</td>
									<td className="hidden max-w-[140px] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400 sm:table-cell sm:max-w-none sm:px-4 sm:py-3">
										{row.email ?? "—"}
									</td>
									<td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
										<span className="font-medium">{row.plan_label}</span>
										{row.plan_price != null && (
											<span className="ml-1 text-xs text-zinc-500">
												${row.plan_price}
											</span>
										)}
									</td>
									<td className="px-3 py-2 sm:px-4 sm:py-3">
										{row.custom_domain ? (
											<Badge variant="neutral" className="text-xs">
												Dominio: {row.custom_domain_value ?? "sí"}
											</Badge>
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</td>
									<td className="px-3 py-2 sm:px-4 sm:py-3">
										{row.payment_status ? (
											<Badge variant={PAYMENT_STATUS_VARIANTS[row.payment_status] ?? "neutral"}>
												{PAYMENT_STATUS_LABELS[row.payment_status] ?? row.payment_status}
											</Badge>
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</td>
									<td className="px-3 py-2 sm:px-4 sm:py-3">
										{row.last_payment?.reference_file_url ? (
											<a
												href={row.last_payment.reference_file_url}
												target="_blank"
												rel="noreferrer noopener"
												className="text-zinc-900 underline hover:no-underline dark:text-zinc-100"
											>
												Ver comprobante
											</a>
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</td>
									<td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 sm:px-4 sm:py-3">
										{row.subscription_payment_method
											? String(row.subscription_payment_method).replace(/_/g, " ")
											: "—"}
									</td>
									<td className="px-3 py-2 sm:px-4 sm:py-3">
										<Badge variant={STATUS_VARIANTS[row.status ?? ""] ?? "neutral"}>
											{STATUS_LABELS[row.status ?? ""] ?? row.status ?? "—"}
										</Badge>
									</td>
									<td className="hidden px-3 py-2 text-zinc-500 dark:text-zinc-400 md:table-cell sm:px-4 sm:py-3">
										{row.created_at
											? new Date(row.created_at).toLocaleDateString("es-CL", {
													day: "2-digit",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "—"}
									</td>
									<td className="px-3 py-2 sm:px-4 sm:py-3">
										<div className="flex flex-wrap items-center gap-2">
											{row.company_id ? (
												<Link
													href={`/companies/${row.company_id}`}
													className="text-zinc-900 underline hover:no-underline dark:text-zinc-100"
												>
													Ver empresa
												</Link>
											) : (
												<span className="text-zinc-400">—</span>
											)}
											{row.last_payment?.status === "pending_validation" && row.last_payment.payment_reference ? (
												<>
													<Button
														variant="default"
														size="sm"
														type="button"
														disabled={actionKey === `validate:${row.last_payment.payment_reference}`}
														onClick={() => void handleValidatePayment(row.last_payment?.payment_reference ?? null, "validate")}
													>
														{actionKey === `validate:${row.last_payment.payment_reference}` ? "Validando..." : "Aprobar"}
													</Button>
													<Button
														variant="destructive"
														size="sm"
														type="button"
														disabled={actionKey === `reject:${row.last_payment.payment_reference}`}
														onClick={() => void handleValidatePayment(row.last_payment?.payment_reference ?? null, "reject")}
													>
														{actionKey === `reject:${row.last_payment.payment_reference}` ? "Rechazando..." : "Rechazar"}
													</Button>
												</>
											) : null}
											<Button
												variant="destructive"
												size="sm"
												type="button"
												onClick={async () => {
													if (!confirm("¿Eliminar esta solicitud?")) return;
													await fetch("/api/onboarding/delete", {
														method: "DELETE",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify({ id: row.id }),
													});
													window.location.reload();
												}}
											>
												Eliminar
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{(!apps || apps.length === 0) && (
					<div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
						No hay solicitudes aún
					</div>
				)}
			</div>
		</div>
	);
}
