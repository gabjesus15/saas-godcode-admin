"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import { getTenantUrl } from "../../../utils/tenant-url";

const COPY = {
	es: {
		loadError: "No se pudo cargar el listado",
		directory: "Directorio",
		title: "Negocios en la plataforma",
		desc: "Estos negocios ya confían en nosotros para gestionar sus pedidos, menú y caja.",
		backStart: "Volver al inicio",
		emptyTitle: "Aún no hay negocios publicados.",
		emptySub: "Sé el primero en unirte.",
		register: "Registrar mi negocio",
		visit: "Visitar",
		backRegister: "Volver al registro",
	},
	en: {
		loadError: "Could not load the list",
		directory: "Directory",
		title: "Businesses on the platform",
		desc: "These businesses already trust us to manage orders, menu and checkout.",
		backStart: "Back to start",
		emptyTitle: "There are no published businesses yet.",
		emptySub: "Be the first to join.",
		register: "Register my business",
		visit: "Visit",
		backRegister: "Back to registration",
	},
} as const;

type CompanyPublic = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

export default function NegociosPage() {
	const locale = useLocale();
	const t = COPY[locale.toLowerCase().startsWith("es") ? "es" : "en"];
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
			.catch(() => setError(t.loadError))
			.finally(() => setLoading(false));
	}, [t.loadError]);

	return (
		<div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-12 md:py-16">
			<div className="mb-8 text-center sm:mb-10">
				<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
					<Store className="h-3.5 w-3.5 shrink-0" />
					{t.directory}
				</div>
				<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
					{t.title}
				</h1>
				<p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
					{t.desc}
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
						{t.backStart}
					</Link>
				</div>
			)}

			{!loading && !error && companies.length === 0 && (
				<div className="onboarding-card mx-auto max-w-md p-8 text-center sm:p-10">
					<Store className="mx-auto h-10 w-10 text-slate-300" />
					<p className="mt-4 text-sm text-slate-600">{t.emptyTitle}</p>
					<p className="mt-1 text-xs text-slate-400">{t.emptySub}</p>
					<Link
						href="/onboarding"
						className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
					>
						{t.register}
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
									{t.visit}
								</p>
							</div>
						</a>
					))}
				</div>
			)}

			<div className="mt-10 text-center">
				<Link href="/onboarding" className="text-sm font-medium text-slate-500 hover:text-slate-900">
					← {t.backRegister}
				</Link>
			</div>
		</div>
	);
}
