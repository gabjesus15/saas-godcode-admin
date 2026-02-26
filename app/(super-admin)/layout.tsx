import { redirect } from "next/navigation";

import { AdminShell } from "../../components/super-admin/admin-shell";
import { createSupabaseServerClient } from "../../utils/supabase/server";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      redirect("/login");
    }

    // Comentario: validamos que el email exista en admin_users antes de mostrar el panel.
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (adminError || !adminUser) {
      redirect("/login");
    }

    return <AdminShell>{children}</AdminShell>;
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
          No se pudo validar tu acceso. Intenta nuevamente.
        </div>
      </div>
    );
  }
}
