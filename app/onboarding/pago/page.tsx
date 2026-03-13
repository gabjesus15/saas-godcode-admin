"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/button";

function PagoContent() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get("token") : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    if (!token) {
      setError("Token faltante. Vuelve al formulario.");
    }
  }, [token]);

  const [paymentOptions, setPaymentOptions] = useState<string[]>(["Stripe"]);
  const [selectedPayment, setSelectedPayment] = useState<string>("Stripe");
  const [, setCountry] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");

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

      // Leer país, métodos de pago y moneda
      if (data.paymentOptions && Array.isArray(data.paymentOptions)) {
        setPaymentOptions(data.paymentOptions);
        setCountry(data.country || "");
        setCurrency(data.currency || "USD");
        // Si Stripe está disponible, seleccionarlo por defecto
        setSelectedPayment(data.paymentOptions.includes("Stripe") ? "Stripe" : data.paymentOptions[0]);
      }

      // Si el método es Stripe, redirigir
      if (selectedPayment === "Stripe" && data.url) {
        window.location.href = data.url;
        return;
      }

      // Si es otro método, mostrar instrucciones
      if (selectedPayment !== "Stripe") {
        // Aquí puedes mostrar instrucciones específicas
        alert(`Instrucciones para pagar con ${selectedPayment}:\n\n` +
          (selectedPayment === "Pago Móvil" ? "Solicita los datos de Pago Móvil al soporte." :
           selectedPayment === "Zelle" ? "Solicita el correo Zelle al soporte." :
           selectedPayment === "Transferencia" ? "Solicita los datos bancarios al soporte." : ""));
        return;
      }

      if (!data.url) {
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
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-4 text-right text-xs text-zinc-500">
        <span>Moneda: <strong>{currency}</strong></span>
      </div>
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

        {/* Métodos de pago según país */}
        {paymentOptions.length > 1 && (
          <div className="mt-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Método de pago
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="onboarding-input h-12 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none focus:bg-white"
              >
                {paymentOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            {selectedPayment !== "Stripe" && (
              <div className="mt-2 text-xs text-zinc-500">
                <strong>Instrucciones:</strong> Solicita los datos de pago al soporte. Elige el método y sigue las instrucciones para completar el pago.
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-zinc-500">
          {selectedPayment === "Stripe"
            ? "Aceptamos tarjetas de crédito y débito a través de Stripe. El pago es seguro y encriptado."
            : `Pago manual (${selectedPayment}).`}
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
          {selectedPayment === "Stripe" ? "Ir a pagar" : `Ver instrucciones de ${selectedPayment}`}
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
