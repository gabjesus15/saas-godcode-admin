import { createSupabaseServerClient } from "../../utils/supabase/server";
import { StoreUnavailable } from "../../components/tenant/store-unavailable";

interface TenantPageProps {
  params: { subdomain: string };
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "GC";
};

export default async function TenantPage({ params }: TenantPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id,name,public_slug,subscription_status,theme_config")
    .eq("public_slug", params.subdomain)
    .maybeSingle();

  if (error || !company) {
    return <StoreUnavailable />;
  }

  const status = company.subscription_status?.toLowerCase();
  if (status === "suspended" || status === "cancelled") {
    return <StoreUnavailable />;
  }

  const name = company.name ?? "GodCode";
  const logoUrl = company.theme_config?.logoUrl ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800"
            style={{ backgroundColor: "var(--tenant-primary)" }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xl font-semibold text-white">
                {getInitials(name)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              GodCode Digital Menu
            </p>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">
              {name}
            </h1>
          </div>
        </div>
        <p className="max-w-2xl text-base text-zinc-300 md:text-lg">
          Explora el menu digital, descubre los destacados del dia y realiza tu
          pedido en segundos.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <button
          className="flex items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white transition"
          style={{ backgroundColor: "var(--tenant-primary)" }}
        >
          Ver Menu
        </button>
        <button
          className="flex items-center justify-center rounded-2xl border border-zinc-700 px-6 py-4 text-base font-semibold text-zinc-100 transition hover:border-zinc-500"
        >
          Hacer Pedido
        </button>
      </section>

      <section className="grid gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-sm font-semibold text-white">Menu actualizado</p>
          <p className="text-sm text-zinc-400">
            Precios y disponibilidad en tiempo real.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-sm font-semibold text-white">Pedidos rapidos</p>
          <p className="text-sm text-zinc-400">
            Recibe confirmacion automatica al instante.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-sm font-semibold text-white">Experiencia premium</p>
          <p className="text-sm text-zinc-400">
            Branding del restaurante con estilo GodCode.
          </p>
        </div>
      </section>
    </main>
  );
}
