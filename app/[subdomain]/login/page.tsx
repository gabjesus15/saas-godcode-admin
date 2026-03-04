import Link from "next/link";
import { Lock } from "lucide-react";

import { createSupabasePublicServerClient } from "../../../utils/supabase/server";
import { TenantLoginForm } from "../../../components/tenant/tenant-login-form";
import "../styles/Login.css";

interface TenantLoginPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantLoginPage({
  params,
}: TenantLoginPageProps) {
  const resolvedParams = await params;
  const supabase = createSupabasePublicServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("public_slug", resolvedParams.subdomain)
    .maybeSingle();

  return (
    <main className="login-container">
      <div className="login-card glass animate-fade">
        <header className="login-header">
          <div className="login-icon-circle">
            <Lock size={32} />
          </div>
          <h2 className="section-title login-title">
            Acceso Admin
          </h2>
          <p className="login-subtitle">
            {company?.name ?? "Panel privado"}
          </p>
        </header>
        <TenantLoginForm subdomain={resolvedParams.subdomain} />
        <div className="login-footer">
          <Link href={`/${resolvedParams.subdomain}`} className="btn btn-secondary">
            Volver al home
          </Link>
        </div>
      </div>
    </main>
  );
}
