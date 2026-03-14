"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, ExternalLink } from "lucide-react";

type CompanyPublic = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

function getTenantUrl(slug: string): string {
	if (typeof window !== "undefined") {
		const host = window.location.host.toLowerCase();
		if (host.includes("localhost") || host.includes(".vercel.app")) {
			return `/${slug}`;
		}
	}
	const base = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || "";
	if (base && (base.includes("localhost") || base.includes(".vercel.app"))) {
		return `/${slug}`;
	}
	return slug && base ? `https://${slug}.${base}` : `/${slug}`;
}

export default function NegociosPage() {
	const [companies, setCompanies] = useState<CompanyPublic[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/companies-public")
			.then((res) => res.json())
			.then((data) => {
				if (data.error) setError(data.error);
				else setCompanies(data.companies ?? []);
			})
			.catch(() => setError("No se pudo cargar el listado"))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
			<div className="mb-8 text-center sm:mb-10">
				<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-700">
					<Store className="h-3.5 w-3.5 shrink-0" />
					Directorio
				</div>
				<h1 className="text-xl font-bold text-zinc-800 min-[480px]:text-2xl sm:text-3xl">
					Negocios en la plataforma
				</h1>
				<p className="mt-3 mx-auto max-w-xl text-sm font-medium text-zinc-700 min-[480px]:text-base">
					Estos negocios ya confían en nosotros para gestionar sus pedidos, menú y caja.
				</p>
			</div>

			{loading && (
				<div className="flex justify-center py-16">
					<div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-600" />
				</div>
			)}

			{error && (
				<div className="onboarding-card max-w-md mx-auto p-8 text-center">
					<p className="text-red-600">{error}</p>
					<Link
						href="/onboarding"
						className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline"
					>
						Volver al inicio
					</Link>
				</div>
			)}

			{!loading && !error && companies.length === 0 && (
				<div className="onboarding-card max-w-md mx-auto p-10 text-center">
					<Store className="mx-auto h-12 w-12 text-zinc-300" />
					<p className="mt-4 text-zinc-600">Aún no hay negocios publicados.</p>
					<p className="mt-1 text-sm text-zinc-500">Sé el primero en unirte.</p>
					<Link
						href="/onboarding"
						className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
					>
						Registrar mi negocio
					</Link>
				</div>
			)}

			{!loading && !error && companies.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{companies.map((c) => (
						<a
							key={c.id}
							href={getTenantUrl(c.slug)}
							target="_blank"
							rel="noopener noreferrer"
							className="onboarding-card flex items-center gap-4 p-5 transition hover:shadow-lg hover:border-emerald-200"
						>
							<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
								{c.logoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={c.logoUrl}
										alt=""
										className="h-full w-full object-contain"
									/>
								) : (
									<Store className="h-7 w-7 text-zinc-400" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-zinc-900">{c.name}</p>
								<p className="flex items-center gap-1 text-xs text-zinc-500">
									<ExternalLink className="h-3 w-3" />
									Visitar
								</p>
							</div>
						</a>
					))}
				</div>
			)}

			<div className="mt-12 text-center">
				<Link
					href="/onboarding"
					className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
				>
					← Volver a registrar mi negocio
				</Link>
			</div>
		</div>
	);
}
