import { createSupabaseBrowserClient } from "./supabase/client";

export type AdminRole = "owner" | "super_admin" | "admin" | "support" | string;

export const roleSets = {
  billing: ["owner", "super_admin", "admin"],
  destructive: ["owner", "super_admin"],
};

export async function requireAdminRole(allowedRoles: string[]) {
  const supabase = createSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    return { ok: false, error: "No se pudo validar el usuario." } as const;
  }

  const email = userData.user.email;
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  if (adminError || !adminUser?.role) {
    return { ok: false, error: "No tienes permisos asignados." } as const;
  }

  if (!allowedRoles.includes(adminUser.role)) {
    return { ok: false, error: "No tienes permisos para esta accion." } as const;
  }

  return { ok: true, email, role: adminUser.role } as const;
}
