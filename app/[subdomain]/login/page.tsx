import { Lock } from "lucide-react";

import { createSupabasePublicServerClient } from "../../../utils/supabase/server";
import { TenantLoginForm } from "../../../components/tenant/tenant-login-form";

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
        <header style={{ marginBottom: "30px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(230, 57, 70, 0.15)",
              color: "var(--accent-primary)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Lock size={32} />
          </div>
          <h2 className="section-title" style={{ marginBottom: "5px", fontSize: "1.8rem" }}>
            Acceso Admin
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {company?.name ?? "Panel privado"}
          </p>
        </header>
        <TenantLoginForm subdomain={resolvedParams.subdomain} />
      </div>
    </main>
  );
}
