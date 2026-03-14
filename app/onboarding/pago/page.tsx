"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/button";
import { uploadImage } from "../../../components/tenant/utils/cloudinary";

const PAYMENT_INSTRUCTIONS_FALLBACK: Record<string, string> = {
	pago_movil: "Realiza el pago por Pago Móvil con los datos que se muestran abajo. Luego sube el comprobante.",
	zelle: "Realiza el pago por Zelle al correo indicado. Luego sube el comprobante.",
	transferencia: "Realiza la transferencia a los datos bancarios indicados. Luego sube el comprobante.",
	transferencia_bancaria: "Realiza la transferencia a los datos bancarios indicados. Luego sube el comprobante.",
};

/** Etiquetas amigables para los datos de pago que ve quien paga */
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
	const [paymentOptions, setPaymentOptions] = useState<string[]>(["Stripe"]);
	const [selectedPayment, setSelectedPayment] = useState<string>("Stripe");
	const [currency, setCurrency] = useState<string>("USD");
	const [instructionsShown, setInstructionsShown] = useState<string | null>(null);
	const [manualData, setManualData] = useState<ManualData | null>(null);
	const [bcvRate, setBcvRate] = useState<number | null>(null);
	const [referenceFile, setReferenceFile] = useState<File | null>(null);
	const [referenceUploading, setReferenceUploading] = useState(false);
	const [referenceSubmitted, setReferenceSubmitted] = useState(false);

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
		setInstructionsShown(null);
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

			if (data.currency) setCurrency(data.currency);
			if (data.paymentOptions && Array.isArray(data.paymentOptions) && data.paymentOptions.length > 0) {
				setPaymentOptions(data.paymentOptions);
				setSelectedPayment(data.paymentOptions.includes("Stripe") ? "Stripe" : data.paymentOptions[0]);
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

			const method = data.paymentOptions?.[0] ?? selectedPayment;
			if (method && method !== "Stripe") {
				setSelectedPayment(method);
				setInstructionsShown(method);
			} else {
				throw new Error("No se recibió la URL de pago. Contacta a soporte.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error inesperado");
		} finally {
			setLoading(false);
		}
	}, [token, months, selectedPayment]);

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
			<div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
				<div className="onboarding-card max-w-md p-8 text-center">
					<p className="text-red-600">Token faltante. Vuelve al formulario.</p>
					<Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
						Volver al inicio
					</Link>
				</div>
			</div>
		);
	}

	if (manualData) {
		return (
			<main className="onboarding-main relative mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
				<div className="mb-8 flex justify-center">
					<div className="onboarding-step-pill inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 min-[480px]:px-4 min-[480px]:py-2">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold shadow-sm">3</span>
						<span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider min-[480px]:text-[0.75rem]">Paso 3 de 3 — Pago manual</span>
					</div>
				</div>
				<div className="onboarding-card space-y-6 p-6 sm:p-8">
					{referenceSubmitted ? (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
							<p className="font-medium">Comprobante registrado</p>
							<p className="mt-2">Te avisaremos por correo cuando validemos el pago. Puedes cerrar esta página.</p>
						</div>
					) : (
						<>
							<p className="text-sm font-medium text-zinc-700">Monto a pagar (USD)</p>
							<p className="text-2xl font-bold text-zinc-900">
								${manualData.amount_usd.toFixed(2)} USD
								{manualData.months > 1 && (
									<span className="ml-2 text-base font-normal text-zinc-500">
										({manualData.months} meses)
									</span>
								)}
							</p>
							{isVenezuela && bcvRate != null && (
								<div className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm">
									<p className="text-zinc-600">Equivalente aprox. (tasa BCV):</p>
									<p className="font-semibold text-zinc-900">
										{(manualData.amount_usd * bcvRate).toFixed(2)} VES
									</p>
									<p className="mt-1 text-xs text-zinc-500">Tasa de referencia; el monto oficial es en USD.</p>
								</div>
							)}
							<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-800">
								<p className="font-medium">Instrucciones</p>
								<p className="mt-2">
									{PAYMENT_INSTRUCTIONS_FALLBACK[manualData.method_slug] ?? "Realiza el pago con los datos indicados y sube tu comprobante."}
								</p>
								{Object.keys(manualData.method_config).length > 0 && (
									<dl className="mt-3 space-y-1.5 text-sm">
										{Object.entries(manualData.method_config).map(([key, value]) => (
											value ? (
												<div key={key}>
													<dt className="font-medium text-emerald-900">{getConfigLabel(key)}</dt>
													<dd className="mt-0.5 font-mono text-emerald-800">{value}</dd>
												</div>
											) : null
										))}
									</dl>
								)}
							</div>
							<div>
								<label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
									Subir comprobante de pago *
									<input
										type="file"
										accept="image/*,.pdf"
										className="text-sm text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700"
										onChange={(e) => setReferenceFile(e.target.files?.[0] ?? null)}
									/>
								</label>
								{error && (
									<p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
								)}
								<Button
									onClick={handleSubmitReference}
									loading={referenceUploading}
									disabled={!referenceFile}
									size="lg"
									className="mt-4 w-full rounded-xl py-6"
								>
									Enviar comprobante
								</Button>
							</div>
						</>
					)}
				</div>
				<footer className="relative mt-12 px-4 py-5 text-center text-zinc-600 sm:mt-16 sm:py-6">
					Protegido con verificación de correo y encriptación.
				</footer>
			</main>
		);
	}

	return (
		<>
			<main className="onboarding-main relative mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
				<div className="mb-8 flex justify-center">
					<div className="onboarding-step-pill inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 min-[480px]:px-4 min-[480px]:py-2">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold shadow-sm">3</span>
						<span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider min-[480px]:text-[0.75rem]">Paso 3 de 3 — Pago</span>
					</div>
				</div>
				<div className="mb-4 text-right text-xs text-zinc-500">
					<span>Moneda: <strong>{currency}</strong></span>
				</div>
				<div className="mb-10 text-center">
					<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-800">
						Pago seguro
					</div>
					<h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Activar suscripción</h1>
					<p className="mt-3 text-base text-zinc-600">
						Elige los meses y el método de pago. Con Stripe serás redirigido a un checkout seguro.
					</p>
				</div>

				<div className="onboarding-card space-y-6 p-6 sm:p-8">
					<label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
						¿Por cuántos meses deseas suscribirte?
						<select
							value={months}
							onChange={(e) => setMonths(Number(e.target.value))}
							className="onboarding-input h-12 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none focus:bg-white"
						>
							{[1, 3, 6, 12].map((m) => (
								<option key={m} value={m}>
									{m} {m === 1 ? "mes" : "meses"}
								</option>
							))}
						</select>
					</label>

					{paymentOptions.length > 1 && (
						<div>
							<label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
								Método de pago
								<select
									value={selectedPayment}
									onChange={(e) => {
										setSelectedPayment(e.target.value);
										setInstructionsShown(null);
									}}
									className="onboarding-input h-12 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none focus:bg-white"
								>
									{paymentOptions.map((opt) => (
										<option key={opt} value={opt}>{opt}</option>
									))}
								</select>
							</label>
							{selectedPayment !== "Stripe" && (
								<p className="mt-2 text-xs text-zinc-500">
									Al continuar verás las instrucciones para pagar con {selectedPayment}.
								</p>
							)}
						</div>
					)}

					<p className="text-sm text-zinc-500">
						{selectedPayment === "Stripe"
							? "Aceptamos tarjetas de crédito y débito a través de Stripe. El pago es seguro y encriptado."
							: `Pago con ${selectedPayment}. Sigue las instrucciones que te mostraremos.`}
					</p>

					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
							{error}
						</div>
					)}

					{instructionsShown && !manualData && (
						<div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-800">
							<p className="font-medium">Método manual</p>
							<p className="mt-2">Haz clic en &quot;Ir a pagar&quot; para ver el monto en USD, la conversión (si aplica) y subir tu comprobante.</p>
						</div>
					)}

					<Button
						onClick={handlePay}
						loading={loading}
						size="lg"
						className="onboarding-btn-primary w-full rounded-xl py-6 text-base"
					>
						{selectedPayment === "Stripe" ? "Ir a pagar" : "Continuar con pago manual"}
					</Button>

					<p className="text-center text-xs text-zinc-500">
						Al continuar aceptas los términos de pago. Puedes cancelar la suscripción en cualquier momento.
					</p>
				</div>
			</main>
			<footer className="relative mt-12 px-4 py-5 text-center text-zinc-600 sm:mt-16 sm:py-6">
				Protegido con verificación de correo y encriptación.
			</footer>
		</>
	);
}

export default function OnboardingPagoPage() {
	return (
		<Suspense fallback={
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
			</div>
		}>
			<PagoContent />
		</Suspense>
	);
}
