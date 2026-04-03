/**
 * Ilustración estilo plano tipo plantilla Fintesa (teléfono + persona + tienda),
 * adaptada a GodCode — sin assets externos.
 */
export function GodcodeFintesaFeatureIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none" aria-hidden>
      {/* Blobs suaves de fondo */}
      <div className="absolute -left-6 top-10 h-48 w-48 rounded-full bg-indigo-200/50 blur-2xl dark:bg-indigo-900/30" />
      <div className="absolute -right-4 bottom-8 h-40 w-40 rounded-full bg-violet-200/45 blur-2xl dark:bg-violet-900/25" />

      <svg
        viewBox="0 0 480 420"
        className="relative h-auto w-full drop-shadow-[0_20px_50px_rgba(79,70,229,0.18)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Teléfono grande */}
        <rect
          x="120"
          y="40"
          width="220"
          height="340"
          rx="36"
          fill="#1e293b"
          className="dark:fill-zinc-800"
        />
        <rect x="132" y="56" width="196" height="300" rx="24" fill="#f8fafc" className="dark:fill-zinc-900" />
        {/* Barra superior */}
        <rect x="152" y="72" width="156" height="10" rx="4" fill="#cbd5e1" className="dark:fill-zinc-700" />
        {/* Contenido: menú + carrito */}
        <circle cx="210" cy="130" r="36" fill="#6366f1" opacity="0.9" />
        <path
          d="M198 130h24M210 118v24"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="160" y="190" width="140" height="12" rx="4" fill="#94a3b8" className="dark:fill-zinc-600" />
        <rect x="160" y="212" width="100" height="12" rx="4" fill="#cbd5e1" className="dark:fill-zinc-700" />
        <rect x="160" y="234" width="120" height="12" rx="4" fill="#cbd5e1" className="dark:fill-zinc-700" />
        <rect x="160" y="268" width="140" height="44" rx="10" fill="#6366f1" opacity="0.85" />
        <path
          d="M200 288h20M210 278v20"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Persona estilizada */}
        <circle cx="72" cy="200" r="22" fill="#64748b" className="dark:fill-zinc-500" />
        <path
          d="M52 268c8-36 24-48 40-48s32 12 40 48"
          stroke="#64748b"
          strokeWidth="14"
          strokeLinecap="round"
          className="dark:stroke-zinc-500"
        />
        {/* Teléfono pequeño en mano */}
        <rect x="38" y="228" width="36" height="64" rx="8" fill="#334155" className="dark:fill-zinc-700" />
        <rect x="42" y="234" width="28" height="48" rx="4" fill="#e2e8f0" className="dark:fill-zinc-800" />
        {/* Decoración: puntos */}
        <circle cx="380" cy="120" r="4" fill="#94a3b8" />
        <circle cx="392" cy="108" r="3" fill="#94a3b8" />
        <circle cx="404" cy="120" r="2" fill="#94a3b8" />
        {/* “Sucursal” / maceta simplificada (como el cactus del demo) */}
        <rect x="360" y="280" width="56" height="56" rx="8" fill="#c7d2fe" className="dark:fill-indigo-950" />
        <path
          d="M388 280v-32c0-8 6-14 14-14s14 6 14 14v32"
          stroke="#6366f1"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="388" cy="248" rx="18" ry="10" fill="#818cf8" opacity="0.9" />
      </svg>
    </div>
  );
}
