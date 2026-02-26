"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
}

interface CompanyFormProps {
  plans: PlanOption[];
}

const baseDomain =
  process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "tuapp.com";

export function CompanyForm({ plans }: CompanyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [form, setForm] = useState({
    name: "",
    public_slug: "",
    plan_id: "",
    primary_color: "#111827",
    logo_url: "",
  });

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
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("No se pudo validar el usuario actual.");
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (userError || !userRow?.id) {
        throw new Error("No se encontro el usuario interno para crear la empresa.");
      }

      // Comentario: empaquetamos el branding dentro de theme_config antes de insertar.
      const { error: insertError } = await supabase.from("companies").insert({
        name: form.name,
        public_slug: form.public_slug,
        plan_id: form.plan_id || null,
        subscription_status: "active",
        created_by: userRow.id,
        theme_config: {
          primaryColor: form.primary_color,
          logoUrl: form.logo_url,
        },
      });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("Ese subdominio ya esta en uso.");
        }
        throw insertError;
      }

      await logAdminAction({
        action: "company.create",
        targetType: "company",
        targetId: form.public_slug,
        metadata: { plan_id: form.plan_id },
      });

      router.push("/companies");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear la empresa.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Nueva empresa</h2>
          <p className="text-sm text-zinc-500">
            Crea un tenant con dominio y configuracion visual.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Nombre
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => {
                  const nextName = event.target.value;
                  if (slugTouched) {
                    return { ...prev, name: nextName };
                  }

                  // Comentario: el slug se auto-genera mientras no haya edicion manual.
                  return {
                    ...prev,
                    name: nextName,
                    public_slug: slugify(nextName),
                  };
                })
              }
              placeholder="Oishi Sushi"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Subdominio
            <div className="flex items-center rounded-xl border border-zinc-200 bg-white px-3">
              <Input
                className="h-11 border-none px-0 focus:border-none"
                value={form.public_slug}
                onChange={(event) => {
                  if (!slugTouched) {
                    setSlugTouched(true);
                  }
                  setForm((prev) => ({
                    ...prev,
                    // Comentario: saneamos el slug en tiempo real.
                    public_slug: slugify(event.target.value),
                  }));
                }}
                placeholder="oishi"
                required
              />
              <span className="text-xs text-zinc-400">.{baseDomain}</span>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Plan
            <select
              value={form.plan_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, plan_id: event.target.value }))
              }
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            >
              <option value="">Selecciona un plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name ?? "Plan"} · {currency.format(Number(plan.price ?? 0))}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Color primario
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, primary_color: event.target.value }))
                }
                className="h-8 w-12 cursor-pointer rounded-lg border border-zinc-200"
              />
              <span className="text-xs text-zinc-500">{form.primary_color}</span>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 md:col-span-2">
            Logo URL
            <Input
              value={form.logo_url}
              onChange={(event) => {
                setLogoError(false);
                setForm((prev) => ({ ...prev, logo_url: event.target.value }));
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
            style={{ borderLeft: `4px solid ${form.primary_color}` }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200"
              style={{ backgroundColor: form.primary_color }}
            >
              {form.logo_url && !logoError ? (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                // Comentario: usamos iniciales si el logo no carga.
                <span className="text-xs font-semibold text-white">
                  {getInitials(form.name || "GodCode")}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900">
                {form.name || "Nombre del tenant"}
              </span>
              <span className="text-xs text-zinc-500">
                {form.public_slug ? `${form.public_slug}.${baseDomain}` : "subdominio"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Crear empresa
        </Button>
      </div>
    </form>
  );
}
