import Link from "next/link";

import { Badge } from "../ui/badge";
import { CompanyStatusToggle } from "./company-status-toggle";
import { getTenantHost, getTenantUrl } from "../../utils/tenant-url";
import { getEffectiveCustomDomain } from "../../lib/tenant-effective-custom-domain";
import { CopyFieldButton } from "./copy-field-button";

type PlanInfo = {
  name: string | null;
  price: number | null;
  max_branches: number | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
  legal_rut?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  public_slug?: string | null;
  custom_domain?: string | null;
  plan_id?: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
  country?: string | null;
  currency?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  email_verified_at?: string | null;
  plans: PlanInfo | PlanInfo[] | null;
};

interface CompaniesTableProps {
  companies: CompanyRow[];
}

type StatusVariant = "success" | "warning" | "destructive" | "neutral";
const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: "Activo", variant: "success" },
  suspended: { label: "Suspendido", variant: "warning" },
  trial: { label: "Trial", variant: "neutral" },
  cancelled: { label: "Cancelado", variant: "warning" },
  canceled: { label: "Cancelado", variant: "warning" },
  past_due: { label: "Pago atrasado", variant: "destructive" },
  unpaid: { label: "Sin pago", variant: "warning" },
  incomplete: { label: "Incompleto", variant: "neutral" },
};

const dayMs = 1000 * 60 * 60 * 24;

const getExpiryBadge = (subscriptionEndsAt?: string | null) => {
  if (!subscriptionEndsAt) {
    return null;
  }

  const diffMs = new Date(subscriptionEndsAt).getTime() - Date.now();
  const days = Math.ceil(diffMs / dayMs);

  if (Number.isNaN(days)) {
    return null;
  }

  if (days <= 0) {
    return { label: "Vencido", variant: "destructive" as const };
  }

  if (days <= 7) {
    return { label: `Vence en ${days} dias`, variant: "warning" as const };
  }

  return { label: `Vence en ${days} dias`, variant: "neutral" as const };
};

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const buildTenantHost = (
    slug: string | null | undefined,
    customDomain?: string | null,
    subscriptionEndsAt?: string | null,
    subscriptionStatus?: string | null
  ) =>
    slug
      ? getTenantHost(
          slug,
          getEffectiveCustomDomain(customDomain, subscriptionEndsAt, subscriptionStatus)
        )
      : "";
  const buildTenantUrl = (
    slug: string | null | undefined,
    customDomain?: string | null,
    subscriptionEndsAt?: string | null,
    subscriptionStatus?: string | null
  ) =>
    slug
      ? getTenantUrl(
          slug,
          getEffectiveCustomDomain(customDomain, subscriptionEndsAt, subscriptionStatus)
        )
      : "";


  return (
    <div className="flex flex-col gap-6">
      {companies.map((company) => {
        const plan = Array.isArray(company.plans) ? company.plans[0] : company.plans;
        const status = statusMap[company.subscription_status ?? ""] ?? {
          label: company.subscription_status ?? "—",
          variant: "neutral" as const,
        };
        const expiry = getExpiryBadge(company.subscription_ends_at);
        return (
          <div
            key={company.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-6 md:py-4"
          >
                      <div className="min-w-0 md:col-span-4">
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                        >
                          {company.name ?? "Sin nombre"}
                        </Link>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {company.id}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <CopyFieldButton value={company.id} label="ID" />
                          {company.public_slug ? (
                            <CopyFieldButton value={company.public_slug} label="Slug" />
                          ) : null}
                          {company.email ? <CopyFieldButton value={company.email} label="Email" /> : null}
                        </div>
                        {company.public_slug ? (
                          <Link
                            href={buildTenantUrl(
                              company.public_slug,
                              company.custom_domain,
                              company.subscription_ends_at,
                              company.subscription_status
                            )}
                            className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {buildTenantHost(
                              company.public_slug,
                              company.custom_domain,
                              company.subscription_ends_at,
                              company.subscription_status
                            )}
                          </Link>
                        ) : null}
                      </div>
                      <div className="min-w-0 md:col-span-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:normal-case md:tracking-normal md:text-zinc-900 dark:md:text-zinc-100">
                          Plan
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {plan?.name ?? "Sin plan"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {plan?.price ? `$${plan.price}` : "--"} · {plan?.max_branches ?? 0} sucursales
                        </p>
                        {expiry && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {expiry.label}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2 flex flex-col items-start">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:normal-case md:tracking-normal md:text-zinc-900 dark:md:text-zinc-100">ESTADO</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {expiry ? (
                            <Badge variant={expiry.variant}>{expiry.label}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="md:col-span-1 flex flex-col items-start">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:normal-case md:tracking-normal md:text-zinc-900 dark:md:text-zinc-100">EMAIL VERIFICADO</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {company.status === "email_verified" || company.status === "form_completed" || company.email_verified_at ? (
                            <span className="text-green-600 font-medium text-sm">Sí</span>
                          ) : (
                            <span className="text-red-600 font-medium text-sm">No</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                        <CompanyStatusToggle
                          companyId={company.id}
                          currentStatus={company.subscription_status}
                        />
                        <Link
                          href="/dashboard/salud-pagos"
                          className="inline-flex h-9 min-w-0 items-center rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                        >
                          Salud pagos
                        </Link>
                        <Link
                          href={`/companies/${company.id}`}
                          className="inline-flex h-9 min-w-0 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Gestionar
                        </Link>
                      </div>
                    </div>
        );
      })}
    </div>
  );
}
