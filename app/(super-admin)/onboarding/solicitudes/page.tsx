"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Filter, RefreshCw, Search, ShieldAlert, FileBadge2, Sparkles, XCircle } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { createSupabaseBrowserClient } from "../../../../utils/supabase/client";

const STATUS_LABELS: Record<string, string> = {
	pending_verification: "Pendiente verificación",
	email_verified: "Email verificado",
	form_completed: "Formulario completo",
	payment_pending: "Pago pendiente",
	payment_validated: "Pago validado",
	active: "Activo",
	rejected: "Rechazado",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
	pending_verification: "warning",
	email_verified: "neutral",
	form_completed: "neutral",
	payment_pending: "warning",
	payment_validated: "neutral",
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
	delivery_booking: {
		scheduled_for: string | null;
		assigned_to: string | null;
		assigned_admin_id: string | null;
		status: string;
	} | null;
	can_delete?: boolean;
	delete_block_reason?: string | null;
}

export default function OnboardingSolicitudesPage() {
	const [apps, setApps] = useState<SolicitudRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionKey, setActionKey] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "payment_pending" | "with_proof" | "with_booking" | "delivery_today" | "delivery_tomorrow" | "rejected" | "active">("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
 	const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const isSameLocalDay = (value: string | null, reference: Date): boolean => {
		if (!value) return false;
		const date = new Date(value);
		return (
			date.getFullYear() === reference.getFullYear() &&
			date.getMonth() === reference.getMonth() &&
			date.getDate() === reference.getDate()
		);
	};

	const loadRequests = useCallback(async (options?: { silent?: boolean }) => {
		if (!options?.silent) {
			setLoading(true);
		}
		setError(null);
		try {
			const res = await fetch("/api/super-admin/solicitudes", { cache: "no-store" });
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = json?.error ?? (res.status === 401 ? "No autorizado" : res.status === 403 ? "Sin permisos" : "Error al cargar");
				throw new Error(msg);
			}
			setApps(json.data ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al cargar");
		} finally {
			if (!options?.silent) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		void loadRequests();
	}, [loadRequests]);

	useEffect(() => {
		const supabase = createSupabaseBrowserClient("super-admin");
		const channel = supabase
			.channel("super-admin-solicitudes-realtime")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "onboarding_applications" },
				() => {
					if (refreshTimerRef.current) {
						clearTimeout(refreshTimerRef.current);
					}
					refreshTimerRef.current = setTimeout(() => {
						void loadRequests({ silent: true });
					}, 250);
				}
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "payments_history" },
				() => {
					if (refreshTimerRef.current) {
						clearTimeout(refreshTimerRef.current);
					}
					refreshTimerRef.current = setTimeout(() => {
						void loadRequests({ silent: true });
					}, 250);
				}
			)
			.subscribe();

		return () => {
			if (refreshTimerRef.current) {
				clearTimeout(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
			supabase.removeChannel(channel);
		};
	}, [loadRequests]);

	const summary = useMemo(() => {
		const total = apps.length;
		const pending = apps.filter((row) => ["pending_verification", "email_verified", "form_completed", "payment_pending"].includes(row.status ?? "")).length;
		const withProof = apps.filter((row) => Boolean(row.last_payment?.reference_file_url)).length;
		const withBooking = apps.filter((row) => Boolean(row.delivery_booking?.scheduled_for)).length;
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const deliveryToday = apps.filter((row) => isSameLocalDay(row.delivery_booking?.scheduled_for ?? null, now)).length;
		const deliveryTomorrow = apps.filter((row) => isSameLocalDay(row.delivery_booking?.scheduled_for ?? null, tomorrow)).length;
		const paymentPending = apps.filter((row) => row.payment_status === "pending_validation").length;
		const rejected = apps.filter((row) => row.status === "rejected" || row.payment_status === "rejected").length;
		return { total, pending, withProof, withBooking, deliveryToday, deliveryTomorrow, paymentPending, rejected };
	}, [apps]);

	const filteredApps = useMemo(() => {
		const term = query.trim().toLowerCase();
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		return apps.filter((row) => {
			const matchesSearch =
				!term ||
				[row.business_name, row.responsible_name, row.email, row.plan_label, row.subscription_payment_method, row.custom_domain_value]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(term));

			const matchesFilter =
				statusFilter === "all"
					? true
					: statusFilter === "pending"
						? ["pending_verification", "email_verified", "form_completed", "payment_pending"].includes(row.status ?? "")
						: statusFilter === "payment_pending"
							? row.status === "payment_pending"
							: statusFilter === "with_proof"
								? Boolean(row.last_payment?.reference_file_url)
								: statusFilter === "with_booking"
									? Boolean(row.delivery_booking?.scheduled_for)
									: statusFilter === "delivery_today"
										? isSameLocalDay(row.delivery_booking?.scheduled_for ?? null, now)
										: statusFilter === "delivery_tomorrow"
											? isSameLocalDay(row.delivery_booking?.scheduled_for ?? null, tomorrow)
								: statusFilter === "rejected"
									? row.status === "rejected" || row.payment_status === "rejected"
									: row.status === "active";

			return matchesSearch && matchesFilter;
		});
	}, [apps, query, statusFilter]);

	const selectedApp = useMemo(() => {
		if (!filteredApps.length) return null;
		return filteredApps.find((row) => row.id === selectedId) ?? filteredApps[0] ?? null;
	}, [filteredApps, selectedId]);

	const canDeleteSelected = Boolean(selectedApp?.can_delete);

	const handleDeleteSelected = useCallback(async () => {
		if (!selectedApp) return;
		if (!selectedApp.can_delete) {
			setError(selectedApp.delete_block_reason ?? "Esta solicitud no puede eliminarse en su estado actual");
			return;
		}

		if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;

		const currentId = selectedApp.id;
		setActionKey(`delete:${currentId}`);
		setError(null);
		try {
			const res = await fetch("/api/super-admin/solicitudes/delete", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: currentId }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(json?.error ?? "No se pudo eliminar la solicitud");
			}

			setApps((prev) => prev.filter((row) => row.id !== currentId));
			setSelectedId((prev) => (prev === currentId ? null : prev));
			await loadRequests({ silent: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo eliminar la solicitud");
		} finally {
			setActionKey(null);
		}
	}, [loadRequests, selectedApp]);

	const canReviewSelectedPayment =
		selectedApp?.payment_status === "pending_validation" &&
		Boolean(selectedApp.last_payment?.payment_reference);

	const filterChips: Array<{
		id: typeof statusFilter;
		label: string;
		count: number;
		icon: typeof Filter;
	}> = [
		{ id: "all", label: "Todas", count: summary.total, icon: Filter },
		{ id: "pending", label: "Pendientes", count: summary.pending, icon: Clock3 },
		{ id: "payment_pending", label: "Pago pendiente", count: apps.filter((row) => row.status === "payment_pending").length, icon: ShieldAlert },
		{ id: "with_proof", label: "Con comprobante", count: summary.withProof, icon: FileBadge2 },
		{ id: "with_booking", label: "Con agenda", count: summary.withBooking, icon: Sparkles },
		{ id: "delivery_today", label: "Entregas hoy", count: summary.deliveryToday, icon: Clock3 },
		{ id: "delivery_tomorrow", label: "Entregas mañana", count: summary.deliveryTomorrow, icon: Clock3 },
		{ id: "rejected", label: "Rechazadas", count: summary.rejected, icon: XCircle },
		{ id: "active", label: "Activas", count: apps.filter((row) => row.status === "active").length, icon: CheckCircle2 },
	];

	const pendingCountLabel = summary.pending > 0 ? `${summary.pending} por revisar` : "Todo al día";

	const formatDateTime = (value: string | null) =>
		value
			? new Date(value).toLocaleDateString("es-CL", {
					day: "2-digit",
					month: "short",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})
			: "—";

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
					<div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:p-5">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
							<div className="max-w-3xl">
								<h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
									Solicitudes de onboarding
								</h1>
								<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
									Revisa verificación de correo, comprobantes, pagos pendientes y rechazos.
								</p>
							</div>
							<div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
								<div>
									<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pendientes</p>
									<p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{pendingCountLabel}</p>
								</div>
								<div className="h-10 w-px bg-zinc-200 dark:bg-zinc-700" />
								<div>
									<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Con comprobante</p>
									<p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{summary.withProof}</p>
								</div>
							</div>
						</div>

						<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
						{[
							{ label: "Total", value: summary.total, helper: "Solicitudes cargadas" },
							{ label: "Por revisar", value: summary.pending, helper: "Estados previos a cobro" },
							{ label: "Pago pendiente", value: summary.paymentPending, helper: "Listas para validar" },
							{ label: "Con comprobante", value: summary.withProof, helper: "Pago manual subido" },
							{ label: "Con agenda", value: summary.withBooking, helper: "Entrega asignada" },
							{ label: "Entregas hoy", value: summary.deliveryToday, helper: "Vence hoy" },
							{ label: "Entregas mañana", value: summary.deliveryTomorrow, helper: "Vence mañana" },
							{ label: "Rechazadas", value: summary.rejected, helper: "Revisión pendiente" },
						].map((item) => (
							<div
								key={item.label}
								className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
							>
								<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{item.label}</p>
								<p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{item.value}</p>
								<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.helper}</p>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:p-5">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex min-w-0 items-center gap-2">
							<Filter className="h-4 w-4 shrink-0 text-zinc-400" />
							<div>
								<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Filtros rápidos</p>
								<p className="text-xs text-zinc-500 dark:text-zinc-400">Estado, comprobante o búsqueda textual.</p>
							</div>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
							<label className="relative min-w-0 flex-1">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
								<input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Buscar por negocio, email, plan o método..."
									className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
								/>
							</label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setQuery("");
									setStatusFilter("all");
								}}
							>
								<RefreshCw className="h-4 w-4" />
								Limpiar
							</Button>
						</div>
					</div>

					<div className="mt-4 flex flex-wrap gap-2">
						{filterChips.map((chip) => {
							const Icon = chip.icon;
							const active = statusFilter === chip.id;
							return (
								<button
									key={chip.id}
									type="button"
									onClick={() => setStatusFilter(chip.id)}
									className={active ? "inline-flex items-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"}
								>
									<Icon className="h-4 w-4" />
									<span>{chip.label}</span>
										<span className={active ? "rounded-full bg-white/15 px-2 py-0.5 text-xs text-current dark:bg-zinc-900/10" : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}>
										{chip.count}
									</span>
								</button>
							);
						})}
					</div>
				</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
				<div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
					<div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700 sm:px-5">
						<div>
							<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Negocios</p>
							<p className="text-xs text-zinc-500 dark:text-zinc-400">{filteredApps.length} visibles de {apps.length}</p>
						</div>
						<Badge variant={summary.pending > 0 ? "warning" : "success"} className="gap-1.5">
							<Clock3 className="h-3.5 w-3.5" />
							{summary.pending > 0 ? "Requiere revisión" : "Sin pendientes"}
						</Badge>
					</div>

					<div className="divide-y divide-zinc-100 dark:divide-zinc-800">
						{filteredApps.length === 0 ? (
							<div className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
								No hay solicitudes que coincidan con los filtros actuales
							</div>
						) : (
							filteredApps.map((row) => {
								const isPendingReview = ["pending_verification", "email_verified", "form_completed", "payment_pending"].includes(row.status ?? "");
								const isSelected = selectedApp?.id === row.id;
								return (
									<button
										key={row.id}
										type="button"
										onClick={() => setSelectedId(row.id)}
										className={isSelected ? "w-full text-left bg-zinc-50 px-4 py-4 transition dark:bg-zinc-800/60" : "w-full text-left px-4 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}
									>
										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{row.business_name ?? "—"}</span>
													{isPendingReview ? <Badge variant="warning" className="text-[10px] uppercase tracking-wide">Prioridad</Badge> : null}
													{row.payment_status ? <Badge variant={PAYMENT_STATUS_VARIANTS[row.payment_status] ?? "neutral"}>{PAYMENT_STATUS_LABELS[row.payment_status] ?? row.payment_status}</Badge> : null}
												</div>
												<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
													{row.responsible_name ?? "—"} · {row.email ?? "—"}
												</p>
											</div>
											<div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 lg:justify-end">
												<span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-900">{row.plan_label}</span>
												{row.subscription_payment_method ? <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 capitalize dark:border-zinc-700 dark:bg-zinc-900">{String(row.subscription_payment_method).replace(/_/g, " ")}</span> : null}
												{row.last_payment?.reference_file_url ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">Con comprobante</span> : null}
												{row.delivery_booking?.scheduled_for ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">Entrega: {formatDateTime(row.delivery_booking.scheduled_for)}</span> : null}
											</div>
										</div>
									</button>
								);
							})
						)}
					</div>
				</div>

				<aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-5 xl:sticky xl:top-6 xl:h-fit">
					{selectedApp ? (
						<div className="flex flex-col gap-5">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Detalle de solicitud</p>
									<h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selectedApp.business_name ?? "Sin nombre"}</h2>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedApp.responsible_name ?? "—"} · {selectedApp.email ?? "—"}</p>
								</div>
								<Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Cerrar</Button>
							</div>

							<div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Estado</span>
									<Badge variant={STATUS_VARIANTS[selectedApp.status ?? ""] ?? "neutral"}>{STATUS_LABELS[selectedApp.status ?? ""] ?? selectedApp.status ?? "—"}</Badge>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pago</span>
									<Badge variant={PAYMENT_STATUS_VARIANTS[selectedApp.payment_status ?? ""] ?? "neutral"}>{PAYMENT_STATUS_LABELS[selectedApp.payment_status ?? ""] ?? selectedApp.payment_status ?? "—"}</Badge>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Plan</span>
									<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedApp.plan_label}</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fecha</span>
									<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDateTime(selectedApp.created_at)}</span>
								</div>
							</div>

							<div className="grid gap-3 text-sm text-zinc-700 dark:text-zinc-300">
								<div><span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Legal</span><p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{selectedApp.legal_name ?? "—"}</p></div>
								<div><span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dirección fiscal</span><p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{selectedApp.fiscal_address ?? "—"}</p></div>
								<div><span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">País / moneda</span><p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{selectedApp.country ?? "—"} · {selectedApp.currency ?? "—"}</p></div>
								<div><span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dominio</span><p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{selectedApp.custom_domain_value ?? selectedApp.custom_domain ?? "—"}</p></div>
								<div><span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Método de pago</span><p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedApp.subscription_payment_method ? String(selectedApp.subscription_payment_method).replace(/_/g, " ") : "—"}</p></div>
							</div>

							<div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-700">
								<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pago / comprobante</p>
								<div className="mt-2 flex flex-col gap-2 text-sm">
									<p className="font-medium text-zinc-900 dark:text-zinc-100">Referencia: {selectedApp.last_payment?.payment_reference ?? "—"}</p>
									<p className="text-zinc-600 dark:text-zinc-400">Monto: {selectedApp.last_payment ? `$${selectedApp.last_payment.amount_paid}` : "—"}</p>
									<p className="text-zinc-600 dark:text-zinc-400">Fecha de pago: {selectedApp.last_payment ? formatDateTime(selectedApp.last_payment.payment_date) : "—"}</p>
									{selectedApp.last_payment?.reference_file_url ? (
										<a href={selectedApp.last_payment.reference_file_url} target="_blank" rel="noreferrer noopener" className="inline-flex w-fit items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40">
											Ver comprobante
										</a>
									) : null}
								</div>
							</div>

							<div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-700">
								<p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Booking de entrega</p>
								<div className="mt-2 flex flex-col gap-2 text-sm">
									<p className="font-medium text-zinc-900 dark:text-zinc-100">Fecha agendada: {selectedApp.delivery_booking?.scheduled_for ? formatDateTime(selectedApp.delivery_booking.scheduled_for) : "Sin agenda"}</p>
									<p className="text-zinc-600 dark:text-zinc-400">Asignado a: {selectedApp.delivery_booking?.assigned_to ?? "Pendiente de asignar"}</p>
									<p className="text-zinc-600 dark:text-zinc-400">Estado interno: {selectedApp.delivery_booking?.status ?? "—"}</p>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								{canReviewSelectedPayment ? (
									<>
								<Button
									type="button"
									size="sm"
									disabled={actionKey === `validate:${selectedApp.last_payment?.payment_reference ?? selectedApp.id}` || !selectedApp.last_payment?.payment_reference}
									onClick={() => void handleValidatePayment(selectedApp.last_payment?.payment_reference ?? null, "validate")}
								>
									{actionKey === `validate:${selectedApp.last_payment?.payment_reference ?? selectedApp.id}` ? "Validando..." : "Aceptar pago"}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="destructive"
									disabled={actionKey === `reject:${selectedApp.last_payment?.payment_reference ?? selectedApp.id}` || !selectedApp.last_payment?.payment_reference}
									onClick={() => void handleValidatePayment(selectedApp.last_payment?.payment_reference ?? null, "reject")}
								>
									{actionKey === `reject:${selectedApp.last_payment?.payment_reference ?? selectedApp.id}` ? "Rechazando..." : "Rechazar"}
								</Button>
									</>
								) : null}
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={!canDeleteSelected || actionKey === `delete:${selectedApp.id}`}
									title={
										!canDeleteSelected
											? selectedApp.delete_block_reason ?? "Esta solicitud no se puede eliminar"
											: undefined
									}
									onClick={() => void handleDeleteSelected()}
								>
									{actionKey === `delete:${selectedApp.id}` ? "Eliminando..." : "Eliminar solicitud"}
								</Button>
								{!canDeleteSelected ? (
									<p className="text-xs text-zinc-500 dark:text-zinc-400">
										{selectedApp.delete_block_reason ?? "Esta solicitud no se puede eliminar"}
									</p>
								) : null}
							</div>
						</div>
					) : (
						<div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
							<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Selecciona una solicitud</p>
							<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Haz click en un negocio para ver toda la información y actuar desde aquí.</p>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
