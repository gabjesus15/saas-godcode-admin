import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OnboardingAntiZoom } from "../../components/onboarding/OnboardingAntiZoom";
import "../super-admin.tailwind.css";
import "./onboarding.css";

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingAntiZoom>
    <div className="onboarding-page">
      <header className="onboarding-header sticky top-0 z-10 px-3 py-3 min-[480px]:px-4 min-[480px]:py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link
            href="/onboarding"
            className="flex flex-col items-start justify-center shrink-0 transition opacity-90 hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <span
              className="font-bold tracking-tight"
              style={{
                fontFamily: "Nevis, sans-serif",
                fontSize: "clamp(1.2rem, 4.5vw, 1.5rem)",
                color: "#6d28d9",
                letterSpacing: "-1px",
              }}
            >
              GodCode
            </span>
            <span
              className="text-[0.65rem] min-[480px]:text-[0.7rem]"
              style={{
                fontFamily: "Aleo-Light, serif",
                color: "#4b5563",
                marginTop: "-2px",
              }}
            >
              Tu visión, nuestro código.
            </span>
          </Link>
          <Link
            href="/onboarding/negocios"
            className="onboarding-header-cta flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold min-[480px]:gap-2 min-[480px]:px-4 min-[480px]:text-sm"
          >
            <span className="hidden sm:inline">Ver negocios en la plataforma</span>
            <span className="sm:hidden">Negocios</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        </div>
      </header>
      {children}
    </div>
    </OnboardingAntiZoom>
  );
}
