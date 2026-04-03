"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, ExternalLink } from "lucide-react";
import { getTenantUrl } from "../../../utils/tenant-url";

type CompanyPublic = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

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
		<div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-12 md:py-16">
			<div className="mb-8 text-center sm:mb-10">
				<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
					<Store className="h-3.5 w-3.5 shrink-0" />
					Directorio
				</div>
				<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
					Negocios en la plataforma
				</h1>
				<p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
					Estos negocios ya confían en nosotros para gestionar sus pedidos, menú y caja.
				</p>
			</div>

			{loading && (
				<div className="flex justify-center py-16">
					<div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
				</div>
			)}

			{error && (
				<div className="onboarding-card mx-auto max-w-md p-6 text-center sm:p-8">
					<p className="text-sm text-red-600">{error}</p>
					<Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
						Volver al inicio
					</Link>
				</div>
			)}

			{!loading && !error && companies.length === 0 && (
				<div className="onboarding-card mx-auto max-w-md p-8 text-center sm:p-10">
					<Store className="mx-auto h-10 w-10 text-slate-300" />
					<p className="mt-4 text-sm text-slate-600">Aún no hay negocios publicados.</p>
					<p className="mt-1 text-xs text-slate-400">Sé el primero en unirte.</p>
					<Link
						href="/onboarding"
						className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
					>
						Registrar mi negocio
					</Link>
				</div>
			)}

			{!loading && !error && companies.length > 0 && (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{companies.map((c) => (
						<a
							key={c.id}
							href={getTenantUrl(c.slug)}
							target="_blank"
							rel="noopener noreferrer"
							className="onboarding-card flex items-center gap-4 p-4 transition hover:border-indigo-200 hover:shadow-lg"
						>
							<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
								{c.logoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
								) : (
									<Store className="h-6 w-6 text-slate-400" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
								<p className="flex items-center gap-1 text-xs text-slate-400">
									<ExternalLink className="h-3 w-3" />
									Visitar
								</p>
							</div>
						</a>
					))}
				</div>
			)}

			<div className="mt-10 text-center">
				<Link href="/onboarding" className="text-sm font-medium text-slate-500 hover:text-slate-900">
					← Volver al registro
				</Link>
			</div>
		</div>
	);
}
