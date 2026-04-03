"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/button";
import { OnboardingStepBar } from "../../../components/onboarding/OnboardingStepBar";
import { uploadImage } from "../../../components/tenant/utils/cloudinary";

const PAYMENT_INSTRUCTIONS_FALLBACK: Record<string, string> = {
	pago_movil: "Realiza el pago por Pago Móvil con los datos que se muestran abajo. Luego sube el comprobante.",
	zelle: "Realiza el pago por Zelle al correo indicado. Luego sube el comprobante.",
	transferencia: "Realiza la transferencia a los datos bancarios indicados. Luego sube el comprobante.",
	transferencia_bancaria: "Realiza la transferencia a los datos bancarios indicados. Luego sube el comprobante.",
};

const CONFIG_KEY_LABELS: Record<string, string> = {
	banco: "Banco",
	telefono: "Teléfono",
	identificacion: "Cédula / RUT",
	email: "Correo",
	name: "Nombre del titular",
	tipo_cuenta: "Tipo de cuenta",
	nro_cuenta: "Número de cuenta",
	titular: "Nombre del titular",
	reference: "Referencia",
	instructions: "Instrucciones",
	phone: "Teléfono",
	bank: "Banco",
	account_number: "Número de cuenta",
};

function getConfigLabel(key: string): string {
	return CONFIG_KEY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type ManualData = {
	amount_usd: number;
	months: number;
	currency: string;
	country: string | null;
	method_slug: string;
	method_config: Record<string, string>;
	payment_reference: string;
};

function PagoContent() {
	const searchParams = useSearchParams();
	const token = searchParams ? searchParams.get("token") : null;
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [months, setMonths] = useState(1);
	const [manualData, setManualData] = useState<ManualData | null>(null);
	const [bcvRate, setBcvRate] = useState<number | null>(null);
	const [referenceFile, setReferenceFile] = useState<File | null>(null);
	const [referenceUploading, setReferenceUploading] = useState(false);
	const [referenceSubmitted, setReferenceSubmitted] = useState(false);
	const [planSummary, setPlanSummary] = useState<{ name: string; price: number; addons: Array<{ name: string; price: number }> } | null>(null);

	const isVenezuela = manualData?.country === "Venezuela" || manualData?.country === "VE";

	useEffect(() => {
		if (!isVenezuela) return;
		let cancelled = false;
		fetch("/api/onboarding/bcv-rate")
			.then((r) => r.json())
			.then((d: { rate?: number }) => {
				if (!cancelled && typeof d.rate === "number") setBcvRate(d.rate);
			})
			.catch(() => {});
		return () => { cancelled = true; };
	}, [isVenezuela]);

	const handlePay = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		setError(null);
		setManualData(null);

		try {
			const res = await fetch("/api/onboarding/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, months }),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(data.error ?? "Error al crear sesión de pago");
			}

			if (data.plan_name && data.plan_price) {
				setPlanSummary({
					name: data.plan_name,
					price: data.plan_price,
					addons: Array.isArray(data.addons) ? data.addons : [],
				});
			}

			if (data.url) {
				window.location.href = data.url;
				return;
			}

			if (data.manual === true && data.payment_reference) {
				setManualData({
					amount_usd: data.amount_usd ?? 0,
					months: data.months ?? 1,
					currency: data.currency ?? "USD",
					country: data.country ?? null,
					method_slug: data.method_slug ?? "",
					method_config: data.method_config ?? {},
					payment_reference: data.payment_reference,
				});
				return;
			}

			throw new Error("No se recibió la URL de pago. Contacta a soporte.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error inesperado");
		} finally {
			setLoading(false);
		}
	}, [token, months]);

	const handleSubmitReference = useCallback(async () => {
		if (!token || !manualData || !referenceFile) {
			setError("Selecciona el comprobante de pago (imagen o PDF).");
			return;
		}
		setReferenceUploading(true);
		setError(null);
		try {
			const url = await uploadImage(referenceFile, "onboarding");
			const res = await fetch("/api/onboarding/upload-payment-reference", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token,
					payment_reference: manualData.payment_reference,
					reference_file_url: url,
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error ?? "Error al enviar");
			setReferenceSubmitted(true);
			setReferenceFile(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al subir");
		} finally {
			setReferenceUploading(false);
		}
	}, [token, manualData, referenceFile]);

	if (!token) {
		return (
			<main className="onboarding-main relative mx-auto w-full max-w-lg px-5 py-8 sm:px-6 sm:py-12 md:py-16">
				<OnboardingStepBar current={3} />
				<div className="onboarding-card max-w-md p-6 text-center sm:p-8">
					<p className="text-sm text-red-600">Token faltante. Vuelve al formulario.</p>
					<Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
						Volver al inicio
					</Link>
				</div>
			</main>
		);
	}

	/* ── Manual payment ── */
	if (manualData) {
		return (
			<main className="onboarding-main relative mx-auto max-w-lg px-5 py-8 sm:px-6 sm:py-12 md:py-16">
				<OnboardingStepBar current={3} />
				<div className="onboarding-card space-y-5 p-5 sm:p-7">
					{referenceSubmitted ? (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm">
							<p className="font-medium text-emerald-800">Comprobante registrado</p>
							<p className="mt-2 text-emerald-700">Te avisaremos por correo cuando validemos el pago. Puedes cerrar esta página.</p>
						</div>
					) : (
						<>
							<div>
								<p className="text-sm font-medium text-slate-500">Monto a pagar</p>
								<p className="mt-1 text-2xl font-bold text-slate-900">
									${manualData.amount_usd.toFixed(2)} USD
									{manualData.months > 1 && (
										<span className="ml-2 text-base font-normal text-slate-400">({manualData.months} meses)</span>
									)}
								</p>
							</div>
							{isVenezuela && bcvRate != null && (
								<div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
									<p className="text-slate-500">Equivalente aprox. (tasa BCV):</p>
									<p className="font-semibold text-slate-900">{(manualData.amount_usd * bcvRate).toFixed(2)} VES</p>
									<p className="mt-1 text-xs text-slate-400">Tasa de referencia; el monto oficial es en USD.</p>
								</div>
							)}
							<div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-4 text-sm">
								<p className="font-medium text-slate-800">Instrucciones</p>
								<p className="mt-2 text-slate-600">
									{PAYMENT_INSTRUCTIONS_FALLBACK[manualData.method_slug] ?? "Realiza el pago con los datos indicados y sube tu comprobante."}
								</p>
								{Object.keys(manualData.method_config).length > 0 && (
									<dl className="mt-3 space-y-1.5 text-sm">
										{Object.entries(manualData.method_config).map(([key, value]) => (
											value ? (
												<div key={key}>
													<dt className="font-medium text-slate-700">{getConfigLabel(key)}</dt>
													<dd className="mt-0.5 font-mono text-slate-600">{value}</dd>
												</div>
											) : null
										))}
									</dl>
								)}
							</div>
							<div>
								<label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
									Subir comprobante de pago *
									<input
										type="file"
										accept="image/*,.pdf"
										className="text-sm text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
										onChange={(e) => setReferenceFile(e.target.files?.[0] ?? null)}
									/>
								</label>
								{error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
								<Button
									onClick={handleSubmitReference}
									loading={referenceUploading}
									disabled={!referenceFile}
									size="lg"
									className="onboarding-btn-primary mt-4 w-full rounded-xl py-5"
								>
									Enviar comprobante
								</Button>
							</div>
						</>
					)}
				</div>
			</main>
		);
	}

	/* ── Default checkout ── */
	return (
		<main className="onboarding-main relative mx-auto max-w-lg px-5 py-8 sm:px-6 sm:py-12 md:py-16">
			<OnboardingStepBar current={3} />

			<div className="mb-8 text-center sm:mb-10">
				<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Activar suscripción</h1>
				<p className="mx-auto mt-3 max-w-md text-sm text-slate-500 sm:text-base">
					Elige los meses y completa el pago.
				</p>
			</div>

			<div className="onboarding-card space-y-5 p-5 sm:p-7">
				{planSummary && (
					<div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
						<div className="font-medium text-slate-900">Plan: {planSummary.name}</div>
						<div className="mt-1 text-slate-600">
							Precio: <span className="font-semibold text-slate-900">${planSummary.price.toFixed(2)} USD</span>
						</div>
						{planSummary.addons.length > 0 && (
							<div className="mt-2">
								<div className="font-medium text-slate-900">Servicios extra:</div>
								<ul className="ml-4 mt-1 list-disc text-slate-600">
									{planSummary.addons.map((addon, idx) => (
										<li key={idx}>{addon.name} <span className="font-semibold">${addon.price.toFixed(2)} USD</span></li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
					¿Por cuántos meses?
					<select
						value={months}
						onChange={(e) => setMonths(Number(e.target.value))}
						className="onboarding-input h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none"
					>
						{[1, 3, 6, 12].map((m) => (
							<option key={m} value={m}>
								{m} {m === 1 ? "mes" : "meses"}
							</option>
						))}
					</select>
				</label>

				{error && (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
						{error}
					</div>
				)}

				<Button
					onClick={handlePay}
					loading={loading}
					size="lg"
					className="onboarding-btn-primary w-full rounded-xl py-5 text-sm font-semibold sm:text-base"
				>
					Ir a pagar
				</Button>

				<p className="text-center text-xs text-slate-400">
					Al continuar aceptas los términos. Puedes cancelar en cualquier momento.
				</p>
			</div>
		</main>
	);
}

export default function OnboardingPagoPage() {
	return (
		<Suspense fallback={
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
			</div>
		}>
			<PagoContent />
		</Suspense>
	);
}
