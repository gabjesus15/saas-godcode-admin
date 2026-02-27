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
  public_slug?: string | null;
  subscription_status: string | null;
  subscription_ends_at?: string | null;
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
      <div className="grid grid-cols-12 gap-4 border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        <span className="col-span-4">Empresa</span>
        <span className="col-span-3">Plan</span>
        <span className="col-span-2">Estado</span>
        <span className="col-span-3">Acciones</span>
      </div>

      <div className="divide-y divide-zinc-200">
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
              className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm text-zinc-700"
            >
              <div className="col-span-4">
                <Link
                  href={`/companies/${company.id}`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  {company.name ?? "Sin nombre"}
                </Link>
                <p className="text-xs text-zinc-500">ID: {company.id}</p>
                {company.public_slug ? (
                  <Link
                    href={buildTenantUrl(company.public_slug)}
                    className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {buildTenantHost(company.public_slug)}
                  </Link>
                ) : null}
              </div>
              <div className="col-span-3">
                <p className="font-medium text-zinc-900">
                  {plan?.name ?? "Sin plan"}
                </p>
                <p className="text-xs text-zinc-500">
                  {plan?.price ? `$${plan.price}` : "--"} · {plan?.max_branches ?? 0}
                  {" "}
                  sucursales
                </p>
              </div>
              <div className="col-span-2">
                <div className="flex flex-col gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {expiry ? (
                    <Badge variant={expiry.variant}>{expiry.label}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="col-span-3 flex flex-wrap gap-2">
                <CompanyStatusToggle
                  companyId={company.id}
                  currentStatus={company.subscription_status}
                />
                <Link
                  href={`/companies/${company.id}`}
                  className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
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
}
