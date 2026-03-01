"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { getTenantScopedPath } from "./utils/tenant-route";

interface TenantLoginFormProps {
  subdomain: string;
}

export function TenantLoginForm({ subdomain }: TenantLoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("public_slug", subdomain)
        .maybeSingle();

      if (companyError || !company?.id) {
        await supabase.auth.signOut();
        throw new Error("No se pudo validar la empresa del subdominio.");
      }

      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id,role")
        .ilike("email", normalizedEmail)
        .in("role", ["owner", "super_admin", "admin", "ceo", "cashier"]);

      if (adminError) {
        await supabase.auth.signOut();
        throw new Error("No se pudo validar tus permisos de administrador.");
      }

      const adminRows = Array.isArray(adminUser) ? adminUser : [];
      let hasAccess = adminRows.length > 0;

      if (!hasAccess) {
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id,role")
          .ilike("email", normalizedEmail)
          .eq("company_id", company.id)
          .maybeSingle();

        if (userError) {
          await supabase.auth.signOut();
          throw new Error("No se pudo validar tus permisos de usuario.");
        }

        const allowedRoles = new Set(["owner", "super_admin", "admin", "ceo", "cashier"]);
        hasAccess = Boolean(userRow?.role && allowedRoles.has(String(userRow.role).toLowerCase()));
      }

      if (!hasAccess) {
        await supabase.auth.signOut();
        throw new Error("No tienes permisos para acceder al panel admin.");
      }

      router.push(getTenantScopedPath(pathname ?? "/", "/admin"));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
      {error ? (
        <div
          style={{
            background: "rgba(230, 57, 70, 0.1)",
            color: "#ff4d5a",
            padding: "12px",
            borderRadius: "12px",
            fontSize: "0.9rem",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "20px",
            border: "1px solid rgba(230, 57, 70, 0.2)",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="form-group">
        <label>Correo Electrónico</label>
        <div className="input-with-icon" style={{ position: "relative" }}>
          <Mail
            size={18}
            style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}
          />
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@oishi.cl"
            required
            style={{ paddingLeft: "44px" }}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contraseña</label>
        <div className="input-with-icon" style={{ position: "relative" }}>
          <Lock
            size={18}
            style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}
          />
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            style={{ paddingLeft: "44px" }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "10px", justifyContent: "center" }}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Entrando...</span>
          </>
        ) : (
          <span>Iniciar Sesión</span>
        )}
      </button>
    </form>
  );
}
