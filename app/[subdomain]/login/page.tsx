import { createSupabasePublicServerClient } from "../../../utils/supabase/server";
import { TenantLoginShell } from "../../../components/tenant/tenant-login-shell";
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
    .select("name,theme_config")
    .eq("public_slug", resolvedParams.subdomain)
    .maybeSingle();

  const themeConfig = (company?.theme_config ?? null) as Record<string, unknown> | null;
  const displayName = (themeConfig?.displayName as string) ?? company?.name ?? "Panel privado";
  const logoUrl = (themeConfig?.logoUrl as string) ?? null;
  const primaryColor = (themeConfig?.primaryColor as string) ?? "#e63946";
  const loginThemeCss = `.login-shell,.login-container{--login-accent:${primaryColor.replace(/<|>|"|'|`/g, "")};}`;

  return (
    <>
      <style>{loginThemeCss}</style>
      <TenantLoginShell
        subdomain={resolvedParams.subdomain}
        displayName={displayName}
        logoUrl={logoUrl}
      />
    </>
  );
}
