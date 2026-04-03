export function LandingHeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none" aria-hidden>
      <svg
        viewBox="0 0 440 320"
        className="relative h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Browser frame */}
        <rect
          x="0" y="0" width="440" height="320" rx="18"
          className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700"
          strokeWidth="1.2"
        />

        {/* Title bar */}
        <rect x="0" y="0" width="440" height="38" rx="18" className="fill-slate-50 dark:fill-zinc-800" />
        <rect x="0" y="20" width="440" height="18" className="fill-slate-50 dark:fill-zinc-800" />
        <circle cx="22" cy="19" r="5" className="fill-red-400/70" />
        <circle cx="40" cy="19" r="5" className="fill-amber-400/70" />
        <circle cx="58" cy="19" r="5" className="fill-emerald-400/70" />
        <rect x="150" y="12" width="140" height="14" rx="7" className="fill-slate-200/80 dark:fill-zinc-700" />

        {/* Sidebar */}
        <rect x="0" y="38" width="100" height="282" className="fill-slate-50/80 dark:fill-zinc-800/60" />
        <line x1="100" y1="38" x2="100" y2="320" className="stroke-slate-200 dark:stroke-zinc-700" strokeWidth="0.8" />

        {/* Sidebar items */}
        <rect x="16" y="56" width="68" height="8" rx="4" className="fill-indigo-500/80" />
        <rect x="16" y="78" width="52" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />
        <rect x="16" y="96" width="60" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />
        <rect x="16" y="114" width="44" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />
        <rect x="16" y="132" width="56" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />

        {/* Main content area — stats row */}
        <rect x="118" y="54" width="90" height="52" rx="10" className="fill-indigo-50 dark:fill-indigo-950/40" />
        <rect x="128" y="66" width="36" height="8" rx="4" className="fill-indigo-500/70" />
        <rect x="128" y="82" width="56" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />

        <rect x="222" y="54" width="90" height="52" rx="10" className="fill-emerald-50 dark:fill-emerald-950/30" />
        <rect x="232" y="66" width="40" height="8" rx="4" className="fill-emerald-500/70" />
        <rect x="232" y="82" width="50" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />

        <rect x="326" y="54" width="90" height="52" rx="10" className="fill-violet-50 dark:fill-violet-950/30" />
        <rect x="336" y="66" width="32" height="8" rx="4" className="fill-violet-500/70" />
        <rect x="336" y="82" width="48" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />

        {/* Table header */}
        <rect x="118" y="122" width="298" height="24" rx="6" className="fill-slate-50 dark:fill-zinc-800/50" />
        <rect x="128" y="130" width="44" height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
        <rect x="212" y="130" width="36" height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
        <rect x="296" y="130" width="28" height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
        <rect x="370" y="130" width="36" height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />

        {/* Table rows */}
        {[158, 184, 210, 236, 262].map((y, i) => (
          <g key={y}>
            <rect x="128" y={y + 4} width={52 - i * 4} height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />
            <rect x="212" y={y + 4} width="30" height="6" rx="3" className="fill-slate-200 dark:fill-zinc-700" />
            <rect x="296" y={y + 4} width="24" height="6" rx="3" className="fill-slate-200 dark:fill-zinc-700" />
            <rect
              x="370" y={y} width="42" height="14" rx="7"
              className={i % 2 === 0 ? "fill-emerald-100 dark:fill-emerald-900/30" : "fill-indigo-100 dark:fill-indigo-900/30"}
            />
            <rect
              x="378" y={y + 4} width="26" height="6" rx="3"
              className={i % 2 === 0 ? "fill-emerald-500/60" : "fill-indigo-500/60"}
            />
            {i < 4 && (
              <line x1="118" y1={y + 22} x2="416" y2={y + 22} className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth="0.6" />
            )}
          </g>
        ))}

        {/* CTA button */}
        <rect x="118" y="290" width="80" height="20" rx="10" className="fill-indigo-600" />
        <rect x="130" y="296" width="44" height="6" rx="3" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
}
