"use client";

import { useState, useEffect, useMemo } from "react";
import { Check } from "lucide-react";

import { Button } from "../ui/button";

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

const MANUAL_SUBSCRIPTION_SLUGS = new Set(["pago_movil", "zelle", "transferencia"]);

function normalizeSubscriptionMethod(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "paypal") return "paypal";
  if (MANUAL_SUBSCRIPTION_SLUGS.has(t)) return t;
  return "stripe";
}

const usdFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const COUNTRIES = [
  "Venezuela",
  "Chile",
  "Colombia",
  "Argentina",
  "México",
  "Perú",
  "Ecuador",
  "España",
  "Estados Unidos",
  "Otro",
] as const;

const CURRENCIES = [
  { value: "VES", label: "Bolívar (VES)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "COP", label: "Peso Colombiano (COP)" },
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "CLP", label: "Peso Chileno (CLP)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "Otro", label: "Otro" },
] as const;

export function OnboardingStep2Form({
  token,
  initialData,
  plans,
  addons = [],
}: {
  token: string;
  initialData: {
    plan_id?: string | null;
    country?: string | null;
    currency?: string | null;
    subscription_payment_method?: string | null;
    addons?: { addon_id: string; quantity?: number; price_snapshot?: number | null }[];
    email?: string | null;
  };
  plans: Plan[];
  addons?: Addon[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planPaymentMethods, setPlanPaymentMethods] = useState<PlanPaymentMethod[]>([]);
  const [planMethodsLoadState, setPlanMethodsLoadState] = useState<"idle" | "loading" | "ready">("idle");

  const [selectedAddons, setSelectedAddons] = useState<AddonChoice[]>(() => {
    const fromInitial = initialData.addons ?? [];
    return fromInitial.map((a) => ({
      addon_id: a.addon_id,
      quantity: Math.max(1, Number(a.quantity) || 1),
      price_snapshot: a.price_snapshot != null ? Number(a.price_snapshot) : null,
    }));
  });

  const [country, setCountry] = useState(initialData.country ?? "");
  const [currency, setCurrency] = useState(initialData.currency ?? "");
  const [planId, setPlanId] = useState(initialData.plan_id ?? "");
  const [subMethod, setSubMethod] = useState(normalizeSubscriptionMethod(initialData.subscription_payment_method));

  // Beta restriction
  const [betaDisabled, setBetaDisabled] = useState(false);
  useEffect(() => {
    async function checkBeta() {
      const betaPlan = plans.find(p => p.name?.toLowerCase().includes("beta"));
      if (!betaPlan || !initialData.email) { setBetaDisabled(false); return; }
      try {
        const res = await fetch(`/api/onboarding/check-beta?email=${encodeURIComponent(initialData.email)}&plan_id=${betaPlan.id}`);
        const json = await res.json();
        setBetaDisabled(json.used === true);
      } catch { setBetaDisabled(false); }
    }
    checkBeta();
  }, [initialData.email, plans]);

  // Load payment methods by country
  useEffect(() => {
    const c = country.trim();
    if (!c) { setPlanPaymentMethods([]); setPlanMethodsLoadState("idle"); return; }
    setPlanMethodsLoadState("loading");
    let cancelled = false;
    fetch(`/api/onboarding/plan-payment-methods?country=${encodeURIComponent(c)}`)
      .then((res) => res.json())
      .then((json: { data?: PlanPaymentMethod[] }) => {
        if (!cancelled && Array.isArray(json.data)) setPlanPaymentMethods(json.data);
      })
      .catch(() => { if (!cancelled) setPlanPaymentMethods([]); })
      .finally(() => { if (!cancelled) setPlanMethodsLoadState("ready"); });
    return () => { cancelled = true; };
  }, [country]);

  // Reset manual method if not available
  useEffect(() => {
    if (planMethodsLoadState !== "ready") return;
    setSubMethod((prev) => {
      if (!MANUAL_SUBSCRIPTION_SLUGS.has(prev)) return prev;
      const allowed = new Set(planPaymentMethods.map((p) => p.slug));
      return allowed.has(prev) ? prev : "stripe";
    });
  }, [planPaymentMethods, planMethodsLoadState]);

  const manualMethods = planPaymentMethods.filter((m) => MANUAL_SUBSCRIPTION_SLUGS.has(m.slug));
  const selectedPlan = plans.find((p) => p.id === planId);

  // Cart summary
  const cartLines = useMemo(() => {
    const lines: { label: string; amount: number; type: "monthly" | "one_time" }[] = [];
    if (selectedPlan) {
      lines.push({ label: selectedPlan.name ?? "Plan", amount: Number(selectedPlan.price ?? 0), type: "monthly" });
    }
    for (const sa of selectedAddons) {
      const addon = addons.find((a) => a.id === sa.addon_id);
      if (!addon) continue;
      const price = addon.type === "monthly" ? addon.price_monthly : addon.price_one_time;
      lines.push({
        label: addon.name ?? addon.slug,
        amount: Number(price ?? 0),
        type: addon.type === "monthly" ? "monthly" : "one_time",
      });
    }
    return lines;
  }, [selectedPlan, selectedAddons, addons]);

  const monthlyTotal = cartLines.filter((l) => l.type === "monthly").reduce((s, l) => s + l.amount, 0);
  const oneTimeTotal = cartLines.filter((l) => l.type === "one_time").reduce((s, l) => s + l.amount, 0);

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
          plan_id: planId || undefined,
          country: country || undefined,
          currency: currency || undefined,
          subscription_payment_method: subMethod,
          addons: selectedAddons.length > 0 ? selectedAddons : undefined,
          payment_methods: [],
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

  const visiblePlans = plans.filter((p) => !p.name?.toLowerCase().includes("dev"));

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">

      {/* Country + Currency */}
      <div className="onboarding-card grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          País *
          <select
            className="onboarding-input h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="">Selecciona tu país</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Moneda del negocio *
          <select
            className="onboarding-input h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          >
            <option value="">Selecciona moneda</option>
            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
      </div>

      {/* Plans */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Elige tu plan *</h3>
        <div className={`grid gap-3 ${visiblePlans.length >= 3 ? "sm:grid-cols-3" : visiblePlans.length === 2 ? "sm:grid-cols-2" : ""}`}>
          {visiblePlans.map((plan) => {
            const isBeta = plan.name?.toLowerCase().includes("beta");
            const selected = planId === plan.id;
            const disabled = isBeta && betaDisabled;
            return (
              <button
                key={plan.id}
                type="button"
                disabled={disabled}
                onClick={() => setPlanId(plan.id)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition sm:p-6 ${
                  selected
                    ? "border-indigo-500 bg-indigo-50/40 shadow-md shadow-indigo-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="text-sm font-bold text-slate-900">{plan.name ?? "Plan"}</span>
                <span className="mt-1 text-2xl font-bold text-slate-900">
                  {usdFmt.format(Number(plan.price ?? 0))}
                  <span className="text-sm font-normal text-slate-400">/mes</span>
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  Hasta {isBeta ? 2 : plan.max_branches ?? 1} sucursal{(isBeta ? 2 : Number(plan.max_branches)) > 1 ? "es" : ""}
                </span>
                {isBeta && betaDisabled && (
                  <span className="mt-2 text-xs text-red-500">Ya usaste el plan beta.</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Addons */}
      {addons.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Servicios extra</h3>
          <div className="space-y-2">
            {addons.map((addon) => {
              const price = addon.type === "monthly" ? addon.price_monthly : addon.price_one_time;
              const suffix = addon.type === "monthly" ? "/mes" : " único";
              const isSelected = selectedAddons.some((a) => a.addon_id === addon.id);
              return (
                <label
                  key={addon.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition ${
                    isSelected ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedAddons((prev) => {
                          if (checked) {
                            const snap = addon.type === "monthly"
                              ? addon.price_monthly != null ? Number(addon.price_monthly) : null
                              : addon.price_one_time != null ? Number(addon.price_one_time) : null;
                            return [...prev.filter((a) => a.addon_id !== addon.id), { addon_id: addon.id, quantity: 1, price_snapshot: snap }];
                          }
                          return prev.filter((a) => a.addon_id !== addon.id);
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900">{addon.name ?? addon.slug}</span>
                      {addon.description && <p className="text-xs text-slate-400">{addon.description}</p>}
                    </div>
                  </div>
                  {price != null && (
                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {usdFmt.format(Number(price))}{suffix}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart summary */}
      {cartLines.length > 0 && (
        <div className="onboarding-card p-5 sm:p-7">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Resumen</h3>
          <div className="space-y-2">
            {cartLines.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{line.label}</span>
                <span className="font-medium text-slate-900">
                  {usdFmt.format(line.amount)}{line.type === "monthly" ? "/mes" : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {monthlyTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Total mensual</span>
                <span className="text-lg font-bold text-slate-900">{usdFmt.format(monthlyTotal)}/mes</span>
              </div>
            )}
            {oneTimeTotal > 0 && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-slate-500">Pago único</span>
                <span className="text-sm font-semibold text-slate-700">{usdFmt.format(oneTimeTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment method */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Método de pago *</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition hover:border-slate-300">
            <input
              type="radio"
              name="sub_method"
              value="stripe"
              checked={subMethod === "stripe"}
              onChange={() => setSubMethod("stripe")}
              className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">Tarjeta (Stripe)</span>
              <p className="text-xs text-slate-400">Débito o crédito.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition hover:border-slate-300">
            <input
              type="radio"
              name="sub_method"
              value="paypal"
              checked={subMethod === "paypal"}
              onChange={() => setSubMethod("paypal")}
              className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">PayPal</span>
              <p className="text-xs text-slate-400">Redirigido a PayPal.</p>
            </div>
          </label>
          {manualMethods.map((method) => (
            <label
              key={method.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition hover:border-slate-300"
            >
              <input
                type="radio"
                name="sub_method"
                value={method.slug}
                checked={subMethod === method.slug}
                onChange={() => setSubMethod(method.slug)}
                className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-900">{method.name ?? method.slug}</span>
                <p className="text-xs text-slate-400">Instrucciones en el siguiente paso.</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={!planId || !country || !currency}
        size="lg"
        className="onboarding-btn-primary w-full rounded-xl py-5 text-sm font-semibold sm:text-base"
      >
        Ir a pagar
      </Button>
    </form>
  );
}
