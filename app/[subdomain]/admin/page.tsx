import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { AdminApp } from "../../../components/tenant/admin/admin-app";

interface TenantAdminPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantAdminPage({
  params,
}: TenantAdminPageProps) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,theme_config")
    .eq("public_slug", resolvedParams.subdomain)
    .maybeSingle();

  if (!company) {
    redirect("/");
  }

  const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
  const logoUrl = company.theme_config?.logoUrl ?? null;

  return <AdminApp companyName={name} logoUrl={logoUrl} userEmail={user.email ?? null} />;
}
