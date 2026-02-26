"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { logAdminAction } from "../../utils/audit";
import { requireAdminRole, roleSets } from "../../utils/admin";

interface PlanOption {
  id: string;
  name: string | null;
  price: number | null;
  max_branches: number | null;
}

interface CompanyData {
  id: string;
  name: string | null;
  legal_rut: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  public_slug: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
  theme_config?: { primaryColor?: string; logoUrl?: string } | null;
}

interface BusinessInfo {
  name: string | null;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  schedule: string | null;
}

interface CompanyGlobalFormProps {
  company: CompanyData;
  businessInfo: BusinessInfo | null;
  plans: PlanOption[];
  payments: Array<{
    id: string;
    amount_paid: number | null;
    payment_method: string | null;
    status: string | null;
    payment_date: string | null;
    payment_reference: string | null;
    months_paid: number | null;
  }>;
}

export function CompanyGlobalForm({
  company,
  businessInfo,
  plans,
  payments,
}: CompanyGlobalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState<"stripe" | "mp" | null>(
    null
  );
  const [logoError, setLogoError] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: company.name ?? "",
    legal_rut: company.legal_rut ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    address: company.address ?? "",
    public_slug: company.public_slug ?? "",
    plan_id: company.plan_id ?? "",
    subscription_status: company.subscription_status ?? "active",
  });

  const [themeForm, setThemeForm] = useState({
    primaryColor: company.theme_config?.primaryColor ?? "#111827",
    logoUrl: company.theme_config?.logoUrl ?? "",
  });

  const [businessForm, setBusinessForm] = useState({
    name: businessInfo?.name ?? "",
    phone: businessInfo?.phone ?? "",
    address: businessInfo?.address ?? "",
    instagram: businessInfo?.instagram ?? "",
    schedule: businessInfo?.schedule ?? "",
  });

  const [monthsToAdd, setMonthsToAdd] = useState(1);
  const [monthsToBill, setMonthsToBill] = useState(1);
  const initialPlanId = company.plan_id;
  const initialStatus = company.subscription_status;

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    return initials.join("") || "GC";
  };

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }),
    []
  );

  const statusMap: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
    paid: "success",
    approved: "success",
    pending: "warning",
    rejected: "destructive",
    cancelled: "destructive",
  };

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === companyForm.plan_id) ?? null,
    [plans, companyForm.plan_id]
  );

  const isDevPlan = selectedPlan?.name?.toLowerCase().includes("dev") ?? false;
  const isBetaPlan = selectedPlan?.name?.toLowerCase().includes("beta") ?? false;
  const currentEndsAt = company.subscription_ends_at
    ? new Date(company.subscription_ends_at)
    : null;

  const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const baseDomain =
    process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "tuapp.com";

  const handleCheckout = async (provider: "stripe" | "mp") => {
    setBillingError(null);
    setBillingLoading(provider);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      if (!selectedPlan?.id) {
        throw new Error("Selecciona un plan antes de cobrar.");
      }

      if (isDevPlan) {
        throw new Error("El plan interno no se puede cobrar.");
      }

      if (monthsToBill <= 0) {
        throw new Error("Define una cantidad valida de meses.");
      }

      const supabase = createSupabaseBrowserClient();
      const functionName =
        provider === "stripe" ? "stripe-checkout" : "mercadopago-preference";

      // Comentario: delegamos el cobro a la Edge Function para mantener secretos seguros.
      const { data, error: invokeError } = await supabase.functions.invoke(
        functionName,
        {
          body: {
            company_id: company.id,
            plan_id: selectedPlan.id,
            months: monthsToBill,
          },
        }
      );

      if (invokeError) {
        throw invokeError;
      }

      const url =
        provider === "stripe"
          ? (data?.url as string | undefined)
          : (data?.init_point as string | undefined);

      if (!url) {
        throw new Error("No se pudo generar el link de pago.");
      }

      await logAdminAction({
        action: "billing.checkout",
        targetType: "company",
        targetId: company.id,
        companyId: company.id,
        metadata: { provider, months: monthsToBill },
      });

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar el cobro.";
      setBillingError(message);
    } finally {
      setBillingLoading(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      const supabase = createSupabaseBrowserClient();
      const companyUpdate: Record<string, unknown> = {
        name: companyForm.name,
        legal_rut: companyForm.legal_rut,
        email: companyForm.email,
        phone: companyForm.phone,
        address: companyForm.address,
        public_slug: companyForm.public_slug,
        plan_id: companyForm.plan_id || null,
        subscription_status: companyForm.subscription_status,
        updated_at: new Date().toISOString(),
      };

      if (isDevPlan) {
        companyUpdate.subscription_ends_at = null;
      } else if (isBetaPlan) {
        companyUpdate.subscription_ends_at = addDays(new Date(), 30).toISOString();
      }

      const { error: companyError } = await supabase
        .from("companies")
        .update({
          ...companyUpdate,
          theme_config: {
            primaryColor: themeForm.primaryColor,
            logoUrl: themeForm.logoUrl,
          },
        })
        .eq("id", company.id);

      if (companyError) {
        throw companyError;
      }

      const { error: businessError } = await supabase
        .from("business_info")
        .upsert({
          company_id: company.id,
          name: businessForm.name,
          phone: businessForm.phone,
          address: businessForm.address,
          instagram: businessForm.instagram,
          schedule: businessForm.schedule,
          updated_at: new Date().toISOString(),
        });

      if (businessError) {
        throw businessError;
      }

      await logAdminAction({
        action: "company.update",
        targetType: "company",
        targetId: company.id,
        companyId: company.id,
        metadata: {
          plan_changed: initialPlanId !== companyForm.plan_id,
          status_changed: initialStatus !== companyForm.subscription_status,
        },
      });

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    setExtendLoading(true);
    setExtendError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      if (isDevPlan) {
        throw new Error("El plan interno no requiere vencimiento.");
      }

      if (monthsToAdd <= 0) {
        throw new Error("Define una cantidad valida de meses.");
      }

      const supabase = createSupabaseBrowserClient();
      const now = new Date();
      const baseDate =
        currentEndsAt && currentEndsAt > now ? currentEndsAt : now;

      // Comentario: usamos meses comerciales de 30 dias como en planes SaaS tradicionales.
      const newEndsAt = addDays(baseDate, monthsToAdd * 30);
      const amount = Number(selectedPlan?.price ?? 0) * monthsToAdd;

      const { error: updateError } = await supabase
        .from("companies")
        .update({
          subscription_ends_at: newEndsAt.toISOString(),
          subscription_status: "active",
          updated_at: now.toISOString(),
        })
        .eq("id", company.id);

      if (updateError) {
        throw updateError;
      }

      const { error: paymentError } = await supabase
        .from("payments_history")
        .insert({
          company_id: company.id,
          plan_id: selectedPlan?.id ?? companyForm.plan_id ?? null,
          amount_paid: amount,
          payment_method: "manual",
          payment_reference: "admin-extension",
          payment_date: now.toISOString(),
          status: "paid",
          months_paid: monthsToAdd,
        });

      if (paymentError) {
        throw paymentError;
      }

      await logAdminAction({
        action: "billing.extend",
        targetType: "company",
        targetId: company.id,
        companyId: company.id,
        metadata: { months: monthsToAdd, amount },
      });

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo extender la suscripcion.";
      setExtendError(message);
    } finally {
      setExtendLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Empresa</h2>
          <p className="text-sm text-zinc-500">
            Datos generales del cliente y su plan actual.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Nombre
            <Input
              value={companyForm.name}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Nombre comercial"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            RUT legal
            <Input
              value={companyForm.legal_rut}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  legal_rut: event.target.value,
                }))
              }
              placeholder="99.999.999-9"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Email
            <Input
              type="email"
              value={companyForm.email}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="contacto@empresa.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Telefono
            <Input
              value={companyForm.phone}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              placeholder="+56 9 1234 5678"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Direccion
            <Input
              value={companyForm.address}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              placeholder="Av. Siempre Viva 742"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Public slug
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white px-3">
              <Input
                className="h-11 border-none px-0 focus:border-none"
                value={companyForm.public_slug}
                onChange={(event) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    // Comentario: evitamos mayusculas y espacios en el slug.
                    public_slug: slugify(event.target.value),
                  }))
                }
                placeholder="empresa-demo"
              />
              <span className="text-xs text-zinc-400">.{baseDomain}</span>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Estado
            <select
              value={companyForm.subscription_status}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  subscription_status: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            >
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Plan
            <select
              value={companyForm.plan_id}
              onChange={(event) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  plan_id: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            >
              <option value="">Sin plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name ?? "Plan"} · {currency.format(Number(plan.price ?? 0))}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Branding</h3>
          <p className="text-sm text-zinc-500">
            Configura color y logo para el tenant.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Color primario
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <input
                type="color"
                value={themeForm.primaryColor}
                onChange={(event) =>
                  setThemeForm((prev) => ({
                    ...prev,
                    primaryColor: event.target.value,
                  }))
                }
                className="h-8 w-12 cursor-pointer rounded-lg border border-zinc-200"
              />
              <span className="text-xs text-zinc-500">
                {themeForm.primaryColor}
              </span>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Logo URL
            <Input
              value={themeForm.logoUrl}
              onChange={(event) => {
                setLogoError(false);
                setThemeForm((prev) => ({
                  ...prev,
                  logoUrl: event.target.value,
                }));
              }}
              placeholder="https://.../logo.png"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Vista previa
          </p>
          <div
            className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            style={{ borderLeft: `4px solid ${themeForm.primaryColor}` }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200"
              style={{ backgroundColor: themeForm.primaryColor }}
            >
              {themeForm.logoUrl && !logoError ? (
                <img
                  src={themeForm.logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-xs font-semibold text-white">
                  {getInitials(companyForm.name || "GodCode")}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900">
                {companyForm.name || "Nombre del tenant"}
              </span>
              <span className="text-xs text-zinc-500">
                {companyForm.public_slug
                  ? `${companyForm.public_slug}.${baseDomain}`
                  : "subdominio"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Suscripcion</h3>
          <p className="text-sm text-zinc-500">
            Extiende el acceso usando meses de 30 dias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-900">Vence:</span>
          {isDevPlan ? (
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              Ilimitado (interno)
            </span>
          ) : currentEndsAt ? (
            <span>{dateFormatter.format(currentEndsAt)}</span>
          ) : (
            <span>Sin fecha definida</span>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Meses a agregar
            <Input
              type="number"
              min={1}
              value={monthsToAdd}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMonthsToAdd(Number.isNaN(value) ? 0 : value);
              }}
              disabled={isDevPlan}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleExtend}
              loading={extendLoading}
              disabled={isDevPlan}
            >
              Extender suscripcion
            </Button>
          </div>
          <div className="text-xs text-zinc-500">
            Se calcula desde hoy o desde la fecha de vencimiento actual.
          </div>
        </div>

        {extendError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {extendError}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Cobros</h3>
          <p className="text-sm text-zinc-500">
            Genera links de pago con Stripe o MercadoPago.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Meses a cobrar
            <Input
              type="number"
              min={1}
              value={monthsToBill}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMonthsToBill(Number.isNaN(value) ? 0 : value);
              }}
              disabled={!selectedPlan?.id || isDevPlan}
            />
          </label>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              onClick={() => handleCheckout("stripe")}
              loading={billingLoading === "stripe"}
              disabled={!selectedPlan?.id || isDevPlan}
            >
              Pagar con Stripe
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCheckout("mp")}
              loading={billingLoading === "mp"}
              disabled={!selectedPlan?.id || isDevPlan}
            >
              Pagar con MercadoPago
            </Button>
          </div>
          <div className="text-xs text-zinc-500">
            El cobro usa la regla de 30 dias por mes.
          </div>
        </div>

        {billingError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {billingError}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Historial de pagos
          </h3>
          <p className="text-sm text-zinc-500">
            Ultimos movimientos registrados.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
            No hay pagos registrados.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {payments.map((payment) => {
              const statusKey = payment.status?.toLowerCase() ?? "neutral";
              const badge = statusMap[statusKey] ?? "neutral";
              return (
                <div
                  key={payment.id}
                  className="grid gap-3 px-4 py-3 text-sm md:grid-cols-5"
                >
                  <div>
                    <p className="text-xs text-zinc-500">Fecha</p>
                    <p className="font-medium text-zinc-900">
                      {payment.payment_date
                        ? dateFormatter.format(new Date(payment.payment_date))
                        : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Monto</p>
                    <p className="font-medium text-zinc-900">
                      {currency.format(Number(payment.amount_paid ?? 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Metodo</p>
                    <p className="font-medium text-zinc-900">
                      {(payment.payment_method ?? "--").toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Estado</p>
                    <Badge variant={badge}>{payment.status ?? "--"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Referencia</p>
                    <p className="font-medium text-zinc-900">
                      {payment.payment_reference ?? "--"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {payment.months_paid ? `${payment.months_paid} mes(es)` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Informacion de negocio
          </h3>
          <p className="text-sm text-zinc-500">
            Datos visibles para clientes finales.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Nombre publico
            <Input
              value={businessForm.name}
              onChange={(event) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Marca en la tienda"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Telefono publico
            <Input
              value={businessForm.phone}
              onChange={(event) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              placeholder="+56 9 1234 5678"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Direccion
            <Input
              value={businessForm.address}
              onChange={(event) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              placeholder="Direccion de la tienda"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Instagram
            <Input
              value={businessForm.instagram}
              onChange={(event) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  instagram: event.target.value,
                }))
              }
              placeholder="@miempresa"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 md:col-span-2">
            Horarios
            <Input
              value={businessForm.schedule}
              onChange={(event) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  schedule: event.target.value,
                }))
              }
              placeholder="Lunes a viernes 9:00 - 18:00"
            />
          </label>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
