"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { useLocale } from "next-intl";

const COPY = {
	es: {
		invalid: "Enlace inválido. Falta el token de verificación.",
		verifyError: "Error al verificar el correo",
		connectionError: "Error de conexión. Intenta de nuevo.",
		verifying: "Verificando tu correo...",
		redirecting: "Redirigiendo...",
		back: "Volver al inicio",
	},
	en: {
		invalid: "Invalid link. Verification token is missing.",
		verifyError: "Could not verify email",
		connectionError: "Connection error. Please try again.",
		verifying: "Verifying your email...",
		redirecting: "Redirecting...",
		back: "Back to start",
	},
} as const;

export default function OnboardingVerifyTokenPage() {
	const locale = useLocale();
	const t = COPY[locale.toLowerCase().startsWith("es") ? "es" : "en"];
	const params = useParams();
	const token = typeof params?.token === "string" ? params.token : null;
	const [status, setStatus] = useState<"loading" | "ok" | "error">(() =>
		token ? "loading" : "error"
	);
	const [message, setMessage] = useState(() =>
		token ? "" : t.invalid
	);

	useEffect(() => {
		if (!token) return;

		fetch(`/api/onboarding/verify?token=${encodeURIComponent(token)}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.ok) {
					setStatus("ok");
					const tokenToUse = (data.token != null && data.token !== "") ? data.token : token;
					const params = new URLSearchParams({ token: tokenToUse });
					params.set("_", String(Date.now()));
					const completePath = `/onboarding/complete?${params.toString()}`;
					const completeUrl = typeof window !== "undefined"
						? window.location.origin + completePath
						: completePath;
					setTimeout(() => {
						window.location.assign(completeUrl);
					}, 2000);
				} else {
					setStatus("error");
					setMessage(data.error ?? t.verifyError);
				}
			})
			.catch(() => {
				setStatus("error");
				setMessage(t.connectionError);
			});
	}, [token, t.connectionError, t.verifyError]);

	return (
		<div className="relative flex min-h-[60vh] items-center justify-center px-5 py-16">
			<div className="onboarding-card max-w-md p-6 text-center sm:p-8">
				{status === "loading" && (
					<>
						<div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
						<p className="text-sm text-slate-500">{t.verifying}</p>
					</>
				)}
				{status === "ok" && (
					<>
						<div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
							<Check className="h-5 w-5" />
						</div>
						<p className="text-sm text-slate-600">{t.redirecting}</p>
					</>
				)}
				{status === "error" && (
					<>
						<div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
							<X className="h-5 w-5" />
						</div>
						<p className="text-sm text-red-600">{message}</p>
						<Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
							{t.back}
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
