import Link from "next/link";
import { ArrowRight } from "lucide-react";

import "../super-admin.tailwind.css";
import "./onboarding.css";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const saasName = process.env.NEXT_PUBLIC_SAAS_NAME?.trim() || "GodCode Admin";

  return (
    <div className="onboarding-page">
      <header className="onboarding-header sticky top-0 z-10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/onboarding"
            className="text-base font-semibold text-zinc-800 transition hover:text-zinc-900 sm:text-lg"
          >
            {saasName}
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
          >
            Ya tengo cuenta
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
