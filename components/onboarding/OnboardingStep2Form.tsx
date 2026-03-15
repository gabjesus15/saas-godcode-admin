"use client";

import { useState, useEffect } from "react";
import rut from 'rut.js';
import validator from 'validator';

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { uploadImage } from "../tenant/utils/cloudinary";

type Plan = { id: string; name: string | null; price: number | null; max_branches: number | null };

type PlanPaymentMethod = { id: string; slug: string; name: string | null; auto_verify: boolean; sort_order: number };

type Addon = {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  price_one_time: number | null;
  price_monthly: number | null;
  type: string;
  sort_order: number;
};

type AddonChoice = { addon_id: string; quantity: number; price_snapshot: number | null };

export function OnboardingStep2Form({
  token,
  initialData,
  plans,
  addons = [],
}: {
  token: string;
  initialData: {
    legal_name?: string | null;
    logo_url?: string | null;
    fiscal_address?: string | null;
    billing_address?: string | null;
    billing_rut?: string | null;
    billing_document?: string | null;
    social_instagram?: string | null;
    social_facebook?: string | null;
    social_twitter?: string | null;
    description?: string | null;
    plan_id?: string | null;
    country?: string | null;
    payment_methods?: string[] | null;
    currency?: string | null;
    custom_plan_name?: string | null;
    custom_plan_price?: string | null;
    custom_domain?: string | null;
    business_name?: string | null;
    subscription_payment_method?: string | null;
    addons?: { addon_id: string; quantity?: number; price_snapshot?: number | null }[];
    email?: string | null;
  };
  plans: Plan[];
  addons?: Addon[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [planPaymentMethods, setPlanPaymentMethods] = useState<PlanPaymentMethod[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<AddonChoice[]>(() => {
    const fromInitial = initialData.addons ?? [];
    return fromInitial.map((a) => ({
      addon_id: a.addon_id,
      quantity: Math.max(1, Number(a.quantity) || 1),
      price_snapshot: a.price_snapshot != null ? Number(a.price_snapshot) : null,
    }));
  });
  const [form, setForm] = useState({
    legal_name: initialData.legal_name ?? "",
    logo_url: initialData.logo_url ?? "",
    fiscal_address: initialData.fiscal_address ?? "",
    billing_address: initialData.billing_address ?? "",
    billing_document: initialData.billing_document ?? "",
    billing_rut: initialData.billing_rut ?? "",
    social_instagram: initialData.social_instagram ?? "",
    social_facebook: initialData.social_facebook ?? "",
    social_twitter: initialData.social_twitter ?? "",
    description: initialData.description ?? "",
    plan_id: initialData.plan_id ?? "",
    country: initialData.country ?? "",
    payment_methods: initialData.payment_methods ?? [],
    currency: initialData.currency ?? "",
    custom_plan_name: initialData.custom_plan_name ?? "",
    custom_plan_price: initialData.custom_plan_price ?? "",
    custom_domain: initialData.custom_domain ?? "",
    subscription_payment_method: initialData.subscription_payment_method ?? "",
  });

  // Restricción para plan beta
  const [betaDisabled, setBetaDisabled] = useState(false);
  useEffect(() => {
    async function checkBeta() {
      // El id del plan beta debe ser el correcto
      const betaPlan = plans.find(p => p.name?.toLowerCase().includes("beta"));
      if (!betaPlan || !initialData.email) {
        setBetaDisabled(false);
        return;
      }
      try {
        const res = await fetch(`/api/onboarding/check-beta?email=${encodeURIComponent(initialData.email)}&plan_id=${betaPlan.id}`);
        const json = await res.json();
        setBetaDisabled(json.used === true);
      } catch {
        setBetaDisabled(false);
      }
    }
    checkBeta();
  }, [initialData.email, plans]);

  useEffect(() => {
    const country = form.country?.trim();
    if (!country) {
      setPlanPaymentMethods([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/onboarding/plan-payment-methods?country=${encodeURIComponent(country)}`)
      .then((res) => res.json())
      .then((json: { data?: PlanPaymentMethod[] }) => {
        if (!cancelled && Array.isArray(json.data)) setPlanPaymentMethods(json.data);
      })
      .catch(() => {
        if (!cancelled) setPlanPaymentMethods([]);
      });
    return () => { cancelled = true; };
  }, [form.country]);

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
          country: form.country || undefined,
          payment_methods: form.payment_methods,
          currency: form.currency || undefined,
          custom_plan_name: form.custom_plan_name || undefined,
          custom_plan_price: form.custom_plan_price || undefined,
          custom_domain: form.custom_domain || undefined,
          subscription_payment_method: form.subscription_payment_method || undefined,
          addons: selectedAddons.length > 0 ? selectedAddons : undefined,
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
          Moneda principal del negocio *
          <select
            className="onboarding-input h-12 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none focus:bg-white"
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
            required
          >
            <option value="">Selecciona una moneda</option>
            <option value="VES">Bolívar (VES)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="COP">Peso Colombiano (COP)</option>
            <option value="ARS">Peso Argentino (ARS)</option>
            <option value="CLP">Peso Chileno (CLP)</option>
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="Otro">Otro</option>
          </select>
        </label>

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
              // eslint-disable-next-line @next/next/no-img-element -- logo URL is dynamic (user upload)
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
              value={form.billing_document}
              onChange={(e) => setForm((p) => ({ ...p, billing_document: e.target.value }))}
              placeholder={form.country === 'Chile' ? 'RUT (Ej: 12.345.678-9)' : form.country === 'Venezuela' ? 'CI (Ej: 12345678)' : 'Documento tributario'}
              type={form.country === 'Venezuela' ? 'number' : 'text'}
              maxLength={form.country === 'Chile' ? 12 : 20}
              required
            />
            {/* Validación visual */}
            {form.billing_document.length > 3 && !(
              (form.country === 'Chile' && rut.validate(form.billing_document)) ||
              (form.country === 'Venezuela' && validator.isNumeric(form.billing_document) && form.billing_document.length >= 6 && form.billing_document.length <= 9) ||
              (form.country !== 'Chile' && form.country !== 'Venezuela' && form.billing_document.length > 4)
            ) && (
              <span className="onboarding-field-error">Documento inválido</span>
            )}
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
              .map((plan) => {
                const isBeta = plan.name?.toLowerCase().includes("beta");
                return (
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
                      onChange={(e) => setForm((p) => ({ ...p, plan_id: e.target.value, custom_plan_name: "", custom_plan_price: "" }))}
                      className="sr-only"
                      disabled={isBeta && betaDisabled}
                    />
                    <div>
                      <span className="font-medium text-zinc-900">{plan.name ?? "Plan"}</span>
                      <span className="ml-2 text-sm text-zinc-500">
                        hasta {isBeta ? 2 : plan.max_branches ?? 1} sucursal{(isBeta ? 2 : Number(plan.max_branches)) > 1 ? "es" : ""}
                      </span>
                      {isBeta && (
                        <span className="block text-xs text-violet-600 mt-1">El plan beta permite máximo 2 sucursales.</span>
                      )}
                      {isBeta && betaDisabled && (
                        <span className="block text-xs text-red-600 mt-1">Ya has usado el plan beta con este correo.</span>
                      )}
                    </div>
                    <span className="font-semibold text-zinc-900">
                      {currency.format(Number(plan.price ?? 0))}/mes
                    </span>
                  </label>
                );
              })}
          </div>
        </div>

        {addons.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5">
            <h3 className="text-sm font-medium text-zinc-700">Servicios extra (opcional)</h3>
            <p className="mt-1 text-xs text-zinc-500">Puedes añadir estos servicios a tu plan.</p>
            <div className="mt-3 space-y-2">
              {addons.map((addon) => {
                const price = addon.type === "monthly" ? addon.price_monthly : addon.price_one_time;
                const priceLabel =
                  addon.type === "monthly"
                    ? price != null
                      ? `${currency.format(Number(price))}/mes`
                      : ""
                    : price != null
                      ? `${currency.format(Number(price))} (pago único)`
                      : "";
                const isSelected = selectedAddons.some((a) => a.addon_id === addon.id);
                return (
                  <label
                    key={addon.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedAddons((prev) => {
                            if (checked) {
                              const snap =
                                addon.type === "monthly"
                                  ? addon.price_monthly != null
                                    ? Number(addon.price_monthly)
                                    : null
                                  : addon.price_one_time != null
                                    ? Number(addon.price_one_time)
                                    : null;
                              return [...prev.filter((a) => a.addon_id !== addon.id), { addon_id: addon.id, quantity: 1, price_snapshot: snap }];
                            }
                            return prev.filter((a) => a.addon_id !== addon.id);
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <div>
                        <span className="font-medium text-zinc-900">{addon.name ?? addon.slug}</span>
                        {addon.description ? (
                          <p className="text-xs text-zinc-500">{addon.description}</p>
                        ) : null}
                      </div>
                    </div>
                    {priceLabel ? <span className="text-sm font-medium text-zinc-700">{priceLabel}</span> : null}
                  </label>
                );
              })}
            </div>
          </div>
        )}

                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 mt-6">
                  Dominio propio (opcional)
                  <Input
                    className="onboarding-input"
                    value={form.custom_domain}
                    onChange={(e) => setForm((p) => ({ ...p, custom_domain: e.target.value }))}
                    placeholder="Ejemplo: midominio.com"
                  />
                  <span className="text-xs text-zinc-500">Puedes conectar un dominio personalizado para tu empresa.</span>
                </label>
        {/* Mostrar métodos de pago según país seleccionado */}
        {form.country === "Venezuela" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 mt-6">
            <h3 className="text-sm font-medium text-zinc-700 mb-2">Métodos de pago disponibles en Venezuela</h3>
            <ul className="text-sm text-zinc-600 list-disc pl-5">
              <li>Pago Móvil</li>
              <li>Zelle</li>
              <li>Transferencia bancaria nacional</li>
              <li>Stripe (tarjeta internacional)</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">Podrás elegir el método de pago en el siguiente paso.</p>
          </div>
        )}
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
