import Link from "next/link";
import { Sparkles, Shield, Mail, Store } from "lucide-react";

import { OnboardingStep1Form } from "../../components/onboarding/OnboardingStep1Form";

export default function OnboardingPage() {
	return (
		<>
			<main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 min-[480px]:px-5 sm:px-6 sm:py-12 md:py-14">
				{/* Indicador de paso (paginador) */}
				<div className="mb-6 flex justify-center sm:mb-8">
					<div className="onboarding-step-pill inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 min-[480px]:px-4 min-[480px]:py-2">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold shadow-sm">1</span>
						<span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider min-[480px]:text-[0.75rem]">Paso 1 de 3 — Solicitud</span>
					</div>
				</div>

				{/* Hero */}
				<div className="mb-8 text-center sm:mb-10 md:mb-12">
					<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100/90 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-violet-800 min-[480px]:px-4 min-[480px]:text-xs">
						<Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-600" />
						Nuevos negocios
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-800 min-[480px]:text-3xl sm:text-4xl sm:leading-tight">
						Registra tu negocio en minutos
					</h1>
					<div className="onboarding-hero-accent mt-4" aria-hidden />
					<p className="onboarding-hero-desc mt-4 mx-auto max-w-xl text-base leading-relaxed text-zinc-700 min-[480px]:sm:text-lg">
						Completa los datos y te enviaremos un correo de verificación. Luego podrás elegir tu plan y activar la suscripción de forma segura.
					</p>
				</div>

				{/* Formulario */}
				<div className="flex justify-center">
					<OnboardingStep1Form />
				</div>

				{/* Confianza */}
				<div className="onboarding-trust-line mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-zinc-600 sm:mt-14 sm:gap-x-8">
					<span className="flex items-center gap-2">
						<Mail className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
						Verificación por correo
					</span>
					<span className="flex items-center gap-2">
						<Shield className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
						Datos encriptados
					</span>
					<span className="flex items-center gap-2">
						<Store className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
						<Link href="/onboarding/negocios" className="underline hover:text-zinc-900">
							Ver negocios en la plataforma
						</Link>
					</span>
				</div>
			</main>

			<footer className="relative mt-12 px-4 py-5 text-center text-zinc-600 sm:mt-16 sm:py-6">
				Protegido con verificación de correo y encriptación.
			</footer>
		</>
	);
}
