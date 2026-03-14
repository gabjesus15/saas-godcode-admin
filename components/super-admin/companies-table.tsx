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
