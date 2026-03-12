import { Sparkles } from "lucide-react";

import { OnboardingStep1Form } from "../../components/onboarding/OnboardingStep1Form";

export default function OnboardingPage() {
  return (
    <>
    <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Nuevos negocios
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight">
            Únete en pocos minutos
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-base text-zinc-600 sm:text-lg">
            Completa el formulario y te enviaremos un correo para verificar tu cuenta. Después podrás configurar tu negocio y activar tu suscripción.
          </p>
        </div>

        <div className="flex justify-center">
          <OnboardingStep1Form />
        </div>
    </main>

    <footer className="relative mt-16 border-t border-zinc-200/80 bg-white/50 px-4 py-6 text-center text-xs text-zinc-500">
        Protegido con verificación de correo y encriptación.
    </footer>
    </>
  );
}
