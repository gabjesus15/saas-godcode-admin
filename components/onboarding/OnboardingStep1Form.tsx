"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

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
		terms_accepted: false,
		privacy_accepted: false,
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
					terms_accepted: form.terms_accepted,
					privacy_accepted: form.privacy_accepted,
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
			<div className="onboarding-success-card w-full max-w-lg p-6 text-center sm:p-8">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
					<Check className="h-6 w-6" />
				</div>
				<h2 className="text-lg font-bold text-slate-900 sm:text-xl">Solicitud enviada</h2>
				<p className="mt-3 text-sm text-slate-600">
					Enviamos un correo de verificación a <strong className="font-semibold text-slate-800">{form.email}</strong>.
					Revisa tu bandeja y haz clic en el enlace para continuar.
				</p>
				<p className="mt-3 text-xs text-slate-400">
					Si no ves el correo, revisa la carpeta de spam.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
			<div className="onboarding-card space-y-5 p-5 sm:p-7">
				<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
					<span>Nombre del negocio <span className="text-red-500" aria-hidden>*</span></span>
					<Input
						className="onboarding-input"
						value={form.business_name}
						onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
						placeholder="Ej: Mi Restaurante"
						required
						minLength={2}
					/>
				</label>

				<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
					<span>Tu nombre <span className="text-red-500" aria-hidden>*</span></span>
					<Input
						className="onboarding-input"
						value={form.responsible_name}
						onChange={(e) => setForm((p) => ({ ...p, responsible_name: e.target.value }))}
						placeholder="Ej: Juan Pérez"
						required
						minLength={2}
					/>
				</label>

				<label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
					<span>Email <span className="text-red-500" aria-hidden>*</span></span>
					<Input
						className="onboarding-input"
						type="email"
						value={form.email}
						onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
						placeholder="contacto@empresa.com"
						required
					/>
				</label>

				<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
					<label className="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							checked={form.terms_accepted}
							onChange={(e) => setForm((p) => ({ ...p, terms_accepted: e.target.checked }))}
							className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
							required
						/>
						<span className="text-sm text-slate-600">
							Acepto los <Link href="/onboarding/terminos" className="font-medium text-indigo-600 hover:underline">términos de servicio</Link> <span className="text-red-500">*</span>
						</span>
					</label>
					<label className="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							checked={form.privacy_accepted}
							onChange={(e) => setForm((p) => ({ ...p, privacy_accepted: e.target.checked }))}
							className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
							required
						/>
						<span className="text-sm text-slate-600">
							Acepto la <Link href="/onboarding/privacidad" className="font-medium text-indigo-600 hover:underline">política de privacidad</Link> <span className="text-red-500">*</span>
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
				className="onboarding-btn-primary w-full rounded-xl py-5 text-sm font-semibold sm:text-base"
			>
				Continuar
			</Button>
		</form>
	);
}
