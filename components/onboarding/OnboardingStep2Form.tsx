"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { uploadImage } from "../tenant/utils/cloudinary";

type Plan = { id: string; name: string | null; price: number | null; max_branches: number | null };

export function OnboardingStep2Form({
  token,
  initialData,
  plans,
}: {
  token: string;
  initialData: {
    legal_name?: string | null;
    logo_url?: string | null;
    fiscal_address?: string | null;
    billing_address?: string | null;
    billing_rut?: string | null;
    social_instagram?: string | null;
    social_facebook?: string | null;
    social_twitter?: string | null;
    description?: string | null;
    plan_id?: string | null;
    business_name?: string | null;
  };
  plans: Plan[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({
    legal_name: initialData.legal_name ?? "",
    logo_url: initialData.logo_url ?? "",
    fiscal_address: initialData.fiscal_address ?? "",
    billing_address: initialData.billing_address ?? "",
    billing_rut: initialData.billing_rut ?? "",
    social_instagram: initialData.social_instagram ?? "",
    social_facebook: initialData.social_facebook ?? "",
    social_twitter: initialData.social_twitter ?? "",
    description: initialData.description ?? "",
    plan_id: initialData.plan_id ?? "",
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadImage(file, "onboarding");
      setForm((p) => ({ ...p, logo_url: url }));
    } catch {
      setError("No se pudo subir el logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          legal_name: form.legal_name || undefined,
          logo_url: form.logo_url || undefined,
          fiscal_address: form.fiscal_address || undefined,
          billing_address: form.billing_address || undefined,
          billing_rut: form.billing_rut || undefined,
          social_instagram: form.social_instagram || undefined,
          social_facebook: form.social_facebook || undefined,
          social_twitter: form.social_twitter || undefined,
          description: form.description || undefined,
          plan_id: form.plan_id || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      window.location.href = `/onboarding/pago?token=${encodeURIComponent(token)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const currency = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="onboarding-card space-y-6 p-6 sm:p-8">
        <div className="border-b border-zinc-100 pb-5">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Datos del negocio</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Completa la información para activar tu empresa.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Nombre legal del negocio
          <Input
            className="onboarding-input"
            value={form.legal_name}
            onChange={(e) => setForm((p) => ({ ...p, legal_name: e.target.value }))}
            placeholder={initialData.business_name ?? "Razón social"}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Logo
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Logo"
                className="h-16 w-16 rounded-xl border border-zinc-200 object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              disabled={logoUploading}
              className="text-sm text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700"
            />
            {logoUploading ? <span className="text-xs text-zinc-500">Subiendo...</span> : null}
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Dirección fiscal
          <Input
            className="onboarding-input"
            value={form.fiscal_address}
            onChange={(e) => setForm((p) => ({ ...p, fiscal_address: e.target.value }))}
            placeholder="Calle, número, comuna"
          />
        </label>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5">
          <h3 className="text-sm font-medium text-zinc-700">Datos de facturación</h3>
          <div className="mt-3 space-y-3">
            <Input
              className="onboarding-input bg-white"
              value={form.billing_address}
              onChange={(e) => setForm((p) => ({ ...p, billing_address: e.target.value }))}
              placeholder="Dirección de facturación"
            />
            <Input
              className="onboarding-input bg-white"
              value={form.billing_rut}
              onChange={(e) => setForm((p) => ({ ...p, billing_rut: e.target.value }))}
              placeholder="RUT o documento tributario"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-700">Redes sociales</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Input
              className="onboarding-input bg-white"
              value={form.social_instagram}
              onChange={(e) => setForm((p) => ({ ...p, social_instagram: e.target.value }))}
              placeholder="@instagram"
            />
            <Input
              className="onboarding-input bg-white"
              value={form.social_facebook}
              onChange={(e) => setForm((p) => ({ ...p, social_facebook: e.target.value }))}
              placeholder="Facebook"
            />
            <Input
              className="onboarding-input bg-white"
              value={form.social_twitter}
              onChange={(e) => setForm((p) => ({ ...p, social_twitter: e.target.value }))}
              placeholder="Twitter / X"
            />
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Descripción del negocio
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Breve descripción de tu negocio..."
            rows={3}
            className="onboarding-input w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:bg-white"
          />
        </label>

        <div>
          <h3 className="text-sm font-medium text-zinc-700">Plan de pago *</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {plans
              .filter((p) => !p.name?.toLowerCase().includes("dev"))
              .map((plan) => (
                <label
                  key={plan.id}
                  className={`onboarding-plan-option flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 ${
                    form.plan_id === plan.id ? "selected" : "border-zinc-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan_id"
                    value={plan.id}
                    checked={form.plan_id === plan.id}
                    onChange={(e) => setForm((p) => ({ ...p, plan_id: e.target.value }))}
                    className="sr-only"
                  />
                  <div>
                    <span className="font-medium text-zinc-900">{plan.name ?? "Plan"}</span>
                    <span className="ml-2 text-sm text-zinc-500">
                      hasta {plan.max_branches ?? 1} sucursal{Number(plan.max_branches) > 1 ? "es" : ""}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-900">
                    {currency.format(Number(plan.price ?? 0))}/mes
                  </span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          type="submit"
          loading={loading}
          disabled={!form.plan_id}
          size="lg"
          className="onboarding-btn-primary order-2 sm:order-1 w-full rounded-xl py-6 text-base sm:w-auto sm:px-8"
        >
          Continuar al pago
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/onboarding")}
          size="lg"
          className="onboarding-btn-outline order-1 sm:order-2 w-full rounded-xl sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
