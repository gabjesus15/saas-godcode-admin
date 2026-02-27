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
  // Buscar primero en admin_users
  let { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  let role = adminUser?.role;
  if ((!role || adminError) && email) {
    // Si no está en admin_users, buscar en users
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (!userError && userRow?.role) {
      role = userRow.role;
    }
  }

  if (!role) {
    return { ok: false, error: "No tienes permisos asignados." } as const;
  }

  if (!allowedRoles.includes(role)) {
    return { ok: false, error: "No tienes permisos para esta accion." } as const;
  }

  return { ok: true, email, role } as const;
}
