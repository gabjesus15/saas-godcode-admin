import { CompaniesView } from "../../../components/super-admin/companies-view";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

export default async function CompaniesPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("companies")
      .select(
        "id,name,public_slug,custom_domain,subscription_status,subscription_ends_at,plans(name,price,max_branches)"
      )
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return <CompaniesView companies={data ?? []} />;
  } catch (err) {
    console.error("[super-admin/companies]", err);
  
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar el listado de empresas.
      </div>
    );
  }
}
