"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

const ERROR_NO_TOKEN = "Enlace inválido. Falta el token de verificación.";

export default function OnboardingVerifyTokenPage() {
	const params = useParams();
	const router = useRouter();
	const token = typeof params?.token === "string" ? params.token : null;
	const [status, setStatus] = useState<"loading" | "ok" | "error">(() =>
		token ? "loading" : "error"
	);
	const [message, setMessage] = useState(() =>
		token ? "" : ERROR_NO_TOKEN
	);

	useEffect(() => {
		if (!token) return;

		fetch(`/api/onboarding/verify?token=${encodeURIComponent(token)}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.ok) {
					setStatus("ok");
					router.replace(`/onboarding/complete?token=${encodeURIComponent(token)}`);
				} else {
					setStatus("error");
					setMessage(data.error ?? "Error al verificar el correo");
				}
			})
			.catch(() => {
				setStatus("error");
				setMessage("Error de conexión. Intenta de nuevo.");
			});
	}, [token, router]);

	return (
		<div className="relative flex min-h-[60vh] items-center justify-center px-6 py-16">
			<div className="onboarding-card max-w-md p-8 text-center sm:p-10">
				{status === "loading" && (
					<>
						<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
						<p className="text-zinc-600">Verificando tu correo...</p>
					</>
				)}
				{status === "ok" && (
					<>
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<p className="text-zinc-700">Redirigiendo al formulario...</p>
					</>
				)}
				{status === "error" && (
					<>
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<p className="text-red-700">{message}</p>
						<Link
							href="/onboarding"
							className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline"
						>
							Volver al inicio
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
