import { GodcodeFintesaFeatureIllustration } from "./godcode-fintesa-feature-illustration";

const highlights = [
  {
    n: "1",
    title: "Diseñado para tu operación real",
    body:
      "Catálogo por categorías, precios por sucursal, retiro o delivery: todo configurable para que la web refleje cómo trabajas, no un template genérico.",
  },
  {
    n: "2",
    title: "Experiencia clara para tu cliente",
    body:
      "Menú legible, carrito con pasos y totales coherentes: tus clientes piden sin fricción desde el subdominio de tu marca.",
  },
  {
    n: "3",
    title: "Un solo ecosistema GodCode",
    body:
      "Onboarding con verificación y planes, pedidos validados en servidor y panel central para el equipo: menos integraciones sueltas.",
  },
] as const;

/**
 * Bloque estilo [Fintesa “Our Feature”](https://themesdesign.in/fintesa/layout/index.html):
 * ilustración + titular con acento + lista con números grandes.
 */
export function FintesaFeatureSpotlight() {
  return (
    <div className="mb-12 sm:mb-16 lg:mb-24">
      <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <GodcodeFintesaFeatureIllustration />
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 sm:mb-3 sm:text-sm dark:text-indigo-400">
            Nuestras funciones
          </p>
          <h2 className="text-balance text-2xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-[2.65rem] dark:text-white">
            Marca la diferencia en el{" "}
            <span className="text-indigo-600 dark:text-indigo-400">mundo de los pedidos online</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:mt-6 sm:text-base dark:text-zinc-400">
            GodCode concentra tu tienda pública, el carrito y la operación en una plataforma multi-tenant: cada negocio con su
            subdominio, su marca y sus datos aislados, mientras el equipo central gestiona planes y soporte desde un solo
            producto.
          </p>

          <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-12">
            {highlights.map((item) => (
              <div key={item.n} className="flex gap-4 sm:gap-6 md:gap-8">
                <span
                  className="shrink-0 text-5xl font-extralight leading-none tabular-nums text-slate-200 sm:text-6xl md:text-7xl dark:text-zinc-800"
                  aria-hidden
                >
                  {item.n}
                </span>
                <div className="min-w-0 pt-0.5 sm:pt-1">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm dark:text-zinc-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
