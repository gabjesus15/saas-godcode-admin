"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/button";

function PagoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    if (!token) {
      setError("Token faltante. Vuelve al formulario.");
    }
  }, [token]);

  const handlePay = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, months }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Error al crear sesión de pago");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="onboarding-card max-w-md p-8 text-center">
          <p className="text-red-600">{error}</p>
          <a href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Pago seguro
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Activar suscripción</h1>
        <p className="mt-3 text-base text-zinc-600">
          Serás redirigido a un checkout seguro para completar el pago.
        </p>
      </div>

      <div className="onboarding-card space-y-6 p-6 sm:p-8">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          ¿Por cuántos meses deseas suscribirte?
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="onboarding-input h-12 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none focus:bg-white"
          >
            {[1, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? "mes" : "meses"}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-zinc-500">
          Aceptamos tarjetas de crédito y débito a través de Stripe. El pago es seguro y encriptado.
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={handlePay}
          loading={loading}
          size="lg"
          className="onboarding-btn-primary w-full rounded-xl py-6 text-base"
        >
          Ir a pagar
        </Button>

        <p className="text-center text-xs text-zinc-500">
          Al continuar aceptas los términos de pago. Puedes cancelar la suscripción en cualquier momento.
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPagoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    }>
      <PagoContent />
    </Suspense>
  );
}
