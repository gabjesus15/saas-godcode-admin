export function SaasLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-9 h-9" : size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const text =
    size === "lg"
      ? "text-xl"
      : size === "sm"
        ? "text-sm"
        : "text-base";

  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dims} shrink-0`}
        aria-hidden
      >
        <rect width="28" height="28" rx="8" className="fill-indigo-600" />
        {/* G: apertura arriba-derecha + barra; evita lectura tipo “E” / Э espejada */}
        <path
          d="M17.2 9.8C11.6 9 8.2 12.1 8.2 15.6c0 3.6 3.1 6.5 7 6.5 1.3 0 2.5-.3 3.6-1M18.6 14h-6.6"
          className="stroke-white"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className={`${text} font-bold tracking-tight text-zinc-900 dark:text-white`}>
        God<span className="text-indigo-600 dark:text-indigo-400">Code</span>
      </span>
    </span>
  );
}
