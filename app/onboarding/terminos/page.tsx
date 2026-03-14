import Link from "next/link";

export default function TerminosPage() {
	return (
		<div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
			<div className="onboarding-card p-8 sm:p-10">
				<h1 className="text-2xl font-bold text-zinc-900">Términos de servicio</h1>
				<p className="mt-2 text-sm text-zinc-500">Última actualización: {new Date().toLocaleDateString("es-CL")}</p>
				<div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-600">
					<p>
						Este es un placeholder. Añade aquí el contenido legal de tus términos de servicio: uso aceptable del SaaS,
						responsabilidades del proveedor y del cliente, limitación de responsabilidad, resolución de disputas, etc.
					</p>
					<p>
						Recomendamos que un abogado redacte o revise los términos antes de publicarlos en producción.
					</p>
				</div>
				<Link
					href="/onboarding"
					className="mt-8 inline-block text-sm font-medium text-emerald-600 underline hover:no-underline"
				>
					← Volver al registro
				</Link>
			</div>
		</div>
	);
}
