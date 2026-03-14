import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { CompanyStatusToggle } from "./company-status-toggle";
import { getTenantHost, getTenantUrl } from "../../utils/tenant-url";

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
  plan_id?: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
  country?: string | null;
  currency?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  plans: PlanInfo | PlanInfo[] | null;
};

interface CompaniesTableProps {
  companies: CompanyRow[];
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" }>
  = {
    active: { label: "Activo", variant: "success" },
    suspended: { label: "Suspendido", variant: "warning" },
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
  const buildTenantHost = (slug: string | null | undefined) =>
    slug ? getTenantHost(slug) : "";
  const buildTenantUrl = (slug: string | null | undefined) =>
    slug ? getTenantUrl(slug) : "";

  return (
    <Card className="overflow-hidden p-0">
      {/* Header: solo en desktop */}
      <div className="hidden border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400 md:grid md:grid-cols-12 md:gap-4 md:px-6 md:py-4">
        <span className="col-span-4">Empresa</span>
        <span className="col-span-3">Plan</span>
        <span className="col-span-2">Estado</span>
        <span className="col-span-3">Acciones</span>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {companies.map((company) => {
          const plan = Array.isArray(company.plans)
            ? company.plans[0]
            : company.plans;
          const statusKey = company.subscription_status ?? "inactive";
          const status = statusMap[statusKey] ?? {
            label: "Sin estado",
            variant: "warning",
          };
          const expiry =
            company.subscription_status === "active"
              ? getExpiryBadge(company.subscription_ends_at)
              : null;

          return (
            <div
              key={company.id}
              className="flex flex-col gap-4 border-zinc-200 p-4 dark:border-zinc-700 md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-6 md:py-4 md:border-0"
            >
              <div className="min-w-0 md:col-span-4">
                <Link
                  href={`/companies/${company.id}`}
                  className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {company.name ?? "Sin nombre"}
                </Link>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {company.id}</p>
                {company.public_slug ? (
                  <Link
                    href={buildTenantUrl(company.public_slug)}
                    className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {buildTenantHost(company.public_slug)}
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
              </div>
              return (
                <Card className="overflow-hidden p-0">
                  {/* Header: solo en desktop */}
                  <div className="hidden border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400 md:grid md:grid-cols-13 md:gap-4 md:px-6 md:py-4">
                    <span className="col-span-4">Empresa</span>
                    <span className="col-span-3">Plan</span>
                    <span className="col-span-2">Estado</span>
                    <span className="col-span-2">Email verificado</span>
                    <span className="col-span-2">Acciones</span>
                  </div>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {companies.map((company) => {
                      const plan = Array.isArray(company.plans)
                        ? company.plans[0]
                        : company.plans;
                      const statusKey = company.subscription_status ?? "inactive";
                      const status = statusMap[statusKey] ?? {
                        label: "Sin estado",
                        variant: "warning",
                      };
                      const expiry =
                        company.subscription_status === "active"
                          ? getExpiryBadge(company.subscription_ends_at)
                          : null;

                      return (
                        <div
                          key={company.id}
                          className="flex flex-col gap-4 border-zinc-200 p-4 dark:border-zinc-700 md:grid md:grid-cols-13 md:items-center md:gap-4 md:px-6 md:py-4 md:border-0"
                        >
                          <div className="min-w-0 md:col-span-4">
                            <Link
                              href={`/companies/${company.id}`}
                              className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                            >
                              {company.name ?? "Sin nombre"}
                            </Link>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {company.id}</p>
                            {company.public_slug ? (
                              <Link
                                href={buildTenantUrl(company.public_slug)}
                                className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {buildTenantHost(company.public_slug)}
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
                          </div>
                          <div className="md:col-span-2">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:sr-only">
                              Estado
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={status.variant}>{status.label}</Badge>
                              {expiry ? (
                                <Badge variant={expiry.variant}>{expiry.label}</Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:sr-only">
                              Email verificado
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {company.status === "email_verified" || company.status === "form_completed" || company.email_verified_at ? (
                                <span className="text-green-600 font-semibold">Sí</span>
                              ) : (
                                <span className="text-red-600 font-semibold">No</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                            <CompanyStatusToggle
                              companyId={company.id}
                              currentStatus={company.subscription_status}
                            />
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
                </Card>
              );
