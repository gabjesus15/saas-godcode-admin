"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { useLocale } from "next-intl";

const COPY = {
  es: {
    invalid: "Enlace inválido. Falta el token de verificación.",
    verifyError: "Error al verificar el correo",
    connectionError: "Error de conexión. Intenta de nuevo.",
    verifying: "Verificando tu correo...",
    redirecting: "Redirigiendo...",
    back: "Volver al inicio",
  },
  en: {
    invalid: "Invalid link. Verification token is missing.",
    verifyError: "Could not verify email",
    connectionError: "Connection error. Please try again.",
    verifying: "Verifying your email...",
    redirecting: "Redirecting...",
    back: "Back to start",
  },
} as const;

function VerifyContent() {
  const locale = useLocale();
  const t = COPY[locale.toLowerCase().startsWith("es") ? "es" : "en"];
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get ? searchParams.get("token") : null;
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setStatus("error");
        setMessage(t.invalid);
      });
      return;
    }

    fetch(`/api/onboarding/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("ok");
          router.replace(`/onboarding/complete?token=${token}`);
        } else {
          setStatus("error");
          setMessage(data.error ?? t.verifyError);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage(t.connectionError);
      });
  }, [token, router, t.connectionError, t.invalid, t.verifyError]);

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-5 py-16">
      <div className="onboarding-card max-w-md p-6 text-center sm:p-8">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <p className="text-sm text-slate-500">{t.verifying}</p>
          </>
        )}
        {status === "ok" && (
          <>
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-600">{t.redirecting}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <X className="h-5 w-5" />
            </div>
            <p className="text-sm text-red-600">{message}</p>
            <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              {t.back}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function OnboardingVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
