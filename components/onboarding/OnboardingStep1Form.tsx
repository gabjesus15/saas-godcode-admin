"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function OnboardingStep1Form() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [form, setForm] = useState({
		business_name: "",
		responsible_name: "",
		email: "",
		phone: "",
		sector: "",
		message: "",
		terms_accepted: false,
		privacy_accepted: false,
		recaptcha_token: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/onboarding/apply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					business_name: form.business_name,
					responsible_name: form.responsible_name,
					email: form.email,
					phone: form.phone || undefined,
					sector: form.sector || undefined,
					message: form.message || undefined,
					terms_accepted: form.terms_accepted,
					privacy_accepted: form.privacy_accepted,
					recaptcha_token: form.recaptcha_token || undefined,
				}),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(data.error ?? "Error al enviar la solicitud");
			}
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error inesperado");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="onboarding-success-card w-full max-w-lg p-6 text-center sm:p-8 md:p-10">
				<div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 sm:mb-5 sm:h-16 sm:w-16">
					<svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 className="text-lg font-bold text-emerald-900 sm:text-xl md:text-2xl">Solicitud enviada</h2>
				<p className="mt-3 text-sm font-medium text-emerald-800 min-[480px]:text-base">
					Hemos enviado un correo de verificación a <strong className="font-semibold">{form.email}</strong>.
					Revisa tu bandeja y haz clic en el enlace para continuar.
				</p>
				<p className="mt-4 text-sm font-medium text-emerald-700/95">
					Si no ves el correo en unos minutos, revisa la carpeta de spam.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="onboarding-form w-full max-w-xl space-y-5 sm:space-y-6">
			<div className="onboarding-card space-y-5 rounded-2xl p-4 sm:space-y-6 sm:p-6 md:p-8">
				<div className="border-b border-zinc-200/80 pb-4 sm:pb-5">
					<h2 className="text-base font-semibold text-zinc-800 sm:text-lg md:text-xl">Datos de contacto</h2>
					<p className="mt-1 text-sm font-medium text-zinc-700 min-[480px]:text-base">
						Te enviaremos un correo de verificación para continuar al siguiente paso.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
					<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
						<span>Nombre del negocio <span className="text-red-600 font-semibold" aria-hidden>*</span></span>
						<Input
							className="onboarding-input"
							value={form.business_name}
							onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
							placeholder="Ej: Mi Restaurante"
							required
							minLength={2}
						/>
					</label>
					<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
						<span>Tu nombre <span className="text-red-600 font-semibold" aria-hidden>*</span></span>
						<Input
							className="onboarding-input"
							value={form.responsible_name}
							onChange={(e) => setForm((p) => ({ ...p, responsible_name: e.target.value }))}
							placeholder="Ej: Juan Pérez"
							required
							minLength={2}
						/>
					</label>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
						<span>Email <span className="text-red-600 font-semibold" aria-hidden>*</span></span>
						<Input
							className="onboarding-input"
							type="email"
							value={form.email}
							onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
							placeholder="contacto@empresa.com"
							required
						/>
					</label>
					<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
						Teléfono
						<Input
							className="onboarding-input"
							type="tel"
							value={form.phone}
							onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
							placeholder="+56 9 1234 5678"
						/>
					</label>
				</div>

				<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
					Rubro / sector
					<Input
						className="onboarding-input"
						value={form.sector}
						onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
						placeholder="Ej: Gastronomía, Retail, Servicios"
					/>
				</label>

				<label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 min-[480px]:gap-2 sm:text-base">
					Mensaje adicional
					<textarea
						value={form.message}
						onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
						placeholder="Cuéntanos brevemente sobre tu negocio (opcional)..."
						rows={3}
						className="onboarding-input w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-white"
					/>
				</label>

				<div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-4">
					<label className="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							checked={form.terms_accepted}
							onChange={(e) => setForm((p) => ({ ...p, terms_accepted: e.target.checked }))}
							className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
							required
						/>
						<span className="text-sm font-medium text-zinc-700 min-[480px]:text-base">
							Acepto los <Link href="/onboarding/terminos" className="font-medium underline hover:text-zinc-900">términos de servicio</Link> <span className="text-red-500">*</span>
						</span>
					</label>
					<label className="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							checked={form.privacy_accepted}
							onChange={(e) => setForm((p) => ({ ...p, privacy_accepted: e.target.checked }))}
							className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
							required
						/>
						<span className="text-sm font-medium text-zinc-700 min-[480px]:text-base">
							Acepto la <Link href="/onboarding/privacidad" className="font-medium underline hover:text-zinc-900">política de privacidad</Link> <span className="text-red-500">*</span>
						</span>
					</label>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					{error}
				</div>
			)}

			<Button
				type="submit"
				loading={loading}
				size="lg"
				className="onboarding-btn-primary w-full rounded-xl py-5 text-base font-semibold min-[480px]:py-6 sm:w-auto sm:px-10"
			>
				Enviar solicitud
			</Button>
		</form>
	);
}
