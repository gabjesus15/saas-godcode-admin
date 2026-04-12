import { Shield, Mail, Clock } from "lucide-react";

import { OnboardingStep1Form } from "../../components/onboarding/OnboardingStep1Form";
import { OnboardingStepBar } from "../../components/onboarding/OnboardingStepBar";
import { getCurrentMessages } from "@/lib/i18n/server";

export default async function OnboardingPage() {
	const messages = await getCurrentMessages();
	const t = messages.onboarding.start;

	return (
		<main className="onboarding-main relative mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-12 md:py-16">
			<OnboardingStepBar current={1} />

			<div className="mb-8 text-center sm:mb-10">
				<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
					{t.title}
				</h1>
				<p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500 sm:mt-4 sm:text-base">
					{t.subtitle}
				</p>
			</div>

			<div className="flex justify-center">
				<OnboardingStep1Form />
			</div>

			<div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-500 sm:mt-14 sm:gap-x-8 sm:text-sm">
				<span className="flex items-center gap-1.5">
					<Mail className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
					{t.trust.email}
				</span>
				<span className="flex items-center gap-1.5">
					<Shield className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
					{t.trust.encrypted}
				</span>
				<span className="flex items-center gap-1.5">
					<Clock className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
					{t.trust.time}
				</span>
			</div>
		</main>
	);
}
