"use client";

import { useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function OnboardingStep1Form() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    responsible_name: "",
    email: "",
    phone: "",
    sector: "",
    message: "",
    terms_accepted: false,
    privacy_accepted: false,
    recaptcha_token: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business_name,
          responsible_name: form.responsible_name,
          email: form.email,
          phone: form.phone || undefined,
          sector: form.sector || undefined,
          message: form.message || undefined,
          terms_accepted: form.terms_accepted,
          privacy_accepted: form.privacy_accepted,
          recaptcha_token: form.recaptcha_token || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Error al enviar la solicitud");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="onboarding-success-card w-full max-w-lg p-8 text-center sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-emerald-900 sm:text-2xl">Solicitud enviada</h2>
        <p className="mt-3 text-base text-emerald-800">
          Hemos enviado un correo de verificación a <strong className="font-semibold">{form.email}</strong>.
          Revisa tu bandeja y haz clic en el enlace para continuar.
        </p>
        <p className="mt-4 text-sm text-emerald-700/90">
          Si no ves el correo en unos minutos, revisa la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      <div className="onboarding-card space-y-6 p-6 sm:p-8">
        <div className="border-b border-zinc-100 pb-5">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Solicita acceso</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Te enviaremos un correo de verificación para continuar.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Nombre del negocio *
            <Input
              className="onboarding-input"
              value={form.business_name}
              onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
              placeholder="Ej: Mi Restaurante"
              required
              minLength={2}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Tu nombre *
            <Input
              className="onboarding-input"
              value={form.responsible_name}
              onChange={(e) => setForm((p) => ({ ...p, responsible_name: e.target.value }))}
              placeholder="Ej: Juan Pérez"
              required
              minLength={2}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Email *
            <Input
              className="onboarding-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="contacto@empresa.com"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Teléfono
            <Input
              className="onboarding-input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+56 9 1234 5678"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Rubro / sector
          <Input
            className="onboarding-input"
            value={form.sector}
            onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
            placeholder="Ej: Gastronomía, Retail, Servicios"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Mensaje adicional
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="Cuéntanos brevemente sobre tu negocio..."
            rows={3}
            className="onboarding-input w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-white"
          />
        </label>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.terms_accepted}
              onChange={(e) => setForm((p) => ({ ...p, terms_accepted: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            <span className="text-sm text-zinc-600">
              Acepto los <a href="/terminos" className="underline hover:text-zinc-900">términos de servicio</a> *
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.privacy_accepted}
              onChange={(e) => setForm((p) => ({ ...p, privacy_accepted: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            <span className="text-sm text-zinc-600">
              Acepto la <a href="/privacidad" className="underline hover:text-zinc-900">política de privacidad</a> *
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        size="lg"
        className="onboarding-btn-primary w-full rounded-xl py-6 text-base sm:w-auto sm:px-8"
      >
        Enviar solicitud
      </Button>
    </form>
  );
}
