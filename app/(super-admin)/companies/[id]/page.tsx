import { notFound } from "next/navigation";

import { BranchesCreateForm } from "../../../../components/super-admin/branches-create-form";
import { BranchesTable } from "../../../../components/super-admin/branches-table";
import { CompanyGlobalTab } from "../../../../components/super-admin/company-global-tab";
import { CompanyTabs } from "../../../../components/super-admin/company-tabs";
import { createSupabaseServerClient } from "../../../../utils/supabase/server";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  try {
    const supabase = await createSupabaseServerClient();

    const [
      { data: company, error: companyError },
      { data: businessInfo, error: businessError },
      { data: branches, error: branchesError },
      { data: plans, error: plansError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabase
        .from("companies")
        .select(
          "id,name,legal_rut,email,phone,address,public_slug,plan_id,subscription_status,subscription_ends_at,theme_config"
        )
        .eq("id", resolvedParams.id)
        .maybeSingle(),
      supabase
        .from("business_info")
        .select("name,phone,address,instagram,schedule")
        .eq("company_id", resolvedParams.id)
        .maybeSingle(),
      supabase
        .from("branches")
        .select("id,name,slug,address,phone,is_active")
        .eq("company_id", resolvedParams.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("plans")
        .select("id,name,price,max_branches")
        .order("price", { ascending: true }),
      supabase
        .from("payments_history")
        .select("id,amount_paid,payment_method,status,payment_date,payment_reference,months_paid")
        .eq("company_id", resolvedParams.id)
        .order("payment_date", { ascending: false })
        .limit(10),
    ]);

    if (companyError || businessError || branchesError || plansError || paymentsError) {
      throw (
        companyError ??
        businessError ??
        branchesError ??
        plansError ??
        paymentsError
      );
    }

    if (!company) {
      notFound();
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Empresa
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900">
            {company.name ?? "Sin nombre"}
          </h2>
          <p className="text-sm text-zinc-500">ID: {company.id}</p>
        </div>

        <CompanyTabs
          tabs={[
            {
              id: "global",
              label: "Global",
              content: (
                <CompanyGlobalTab
                  company={company}
                  businessInfo={businessInfo}
                  plans={plans ?? []}
                  payments={payments ?? []}
                />
              ),
            },
            {
              id: "branches",
              label: "Sucursales",
              content: (
                <div className="flex flex-col gap-6">
                  <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        Nueva sucursal
                      </h3>
                      <p className="text-sm text-zinc-500">
                        Agrega una ubicacion y activala.
                      </p>
                    </div>
                    <BranchesCreateForm companyId={company.id} />
                  </div>
                  <BranchesTable branches={branches ?? []} />
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar la empresa.
      </div>
    );
  }
}
