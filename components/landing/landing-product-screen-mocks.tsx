import { type ReactNode } from "react";

function ScreenFrame({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <svg viewBox="0 0 280 170" className="h-full w-auto max-w-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="170" rx="12" className="fill-white stroke-slate-200 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="0.8" />
      {/* Top bar */}
      <rect width="280" height="28" rx="12" className="fill-slate-50 dark:fill-zinc-800" />
      <rect y="14" width="280" height="14" className="fill-slate-50 dark:fill-zinc-800" />
      <circle cx="16" cy="14" r="3.5" className="fill-red-400/60" />
      <circle cx="28" cy="14" r="3.5" className="fill-amber-400/60" />
      <circle cx="40" cy="14" r="3.5" className="fill-emerald-400/60" />
      <rect x="100" y="8" width="80" height="10" rx="5" className="fill-slate-200/70 dark:fill-zinc-700" />
      {/* Accent line */}
      <rect y="28" width="280" height="2" className={accent} />
      {children}
    </svg>
  );
}

export function MenuScreenMock() {
  return (
    <ScreenFrame accent="fill-indigo-500">
      {/* Search bar */}
      <rect x="16" y="40" width="248" height="16" rx="8" className="fill-slate-100 dark:fill-zinc-800" />
      <rect x="26" y="45" width="40" height="6" rx="3" className="fill-slate-300 dark:fill-zinc-600" />

      {/* Menu items */}
      {[64, 94, 124].map((y, i) => (
        <g key={y}>
          <rect x="16" y={y} width="22" height="22" rx="6" className={["fill-indigo-100 dark:fill-indigo-900/30", "fill-emerald-100 dark:fill-emerald-900/30", "fill-violet-100 dark:fill-violet-900/30"][i]} />
          <rect x="46" y={y + 3} width={60 - i * 8} height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
          <rect x="46" y={y + 13} width={40 + i * 4} height="5" rx="2.5" className="fill-slate-200 dark:fill-zinc-700" />
          <rect x="220" y={y + 4} width="36" height="12" rx="6" className={["fill-indigo-500/80", "fill-emerald-500/80", "fill-violet-500/80"][i]} />
          <rect x="228" y={y + 7} width="20" height="5" rx="2.5" fill="white" opacity="0.85" />
        </g>
      ))}
    </ScreenFrame>
  );
}

export function CartScreenMock() {
  return (
    <ScreenFrame accent="fill-emerald-500">
      {/* Cart header */}
      <rect x="16" y="38" width="60" height="7" rx="3.5" className="fill-slate-900 dark:fill-zinc-100" />

      {/* Cart items */}
      {[56, 86].map((y, i) => (
        <g key={y}>
          <rect x="16" y={y} width="20" height="20" rx="5" className={i === 0 ? "fill-indigo-100 dark:fill-indigo-900/30" : "fill-amber-100 dark:fill-amber-900/30"} />
          <rect x="44" y={y + 2} width={50 - i * 6} height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
          <rect x="44" y={y + 12} width="30" height="5" rx="2.5" className="fill-slate-200 dark:fill-zinc-700" />
          <rect x="220" y={y + 4} width="36" height="6" rx="3" className="fill-slate-500 dark:fill-zinc-400" />
        </g>
      ))}

      {/* Divider */}
      <line x1="16" y1="116" x2="264" y2="116" className="stroke-slate-200 dark:stroke-zinc-700" strokeWidth="0.6" />

      {/* Total */}
      <rect x="16" y="124" width="30" height="6" rx="3" className="fill-slate-400 dark:fill-zinc-500" />
      <rect x="210" y="122" width="54" height="8" rx="4" className="fill-slate-900 dark:fill-zinc-100" />

      {/* CTA */}
      <rect x="16" y="146" width="248" height="16" rx="8" className="fill-emerald-500" />
      <rect x="108" y="150" width="64" height="6" rx="3" fill="white" opacity="0.9" />
    </ScreenFrame>
  );
}

export function OperationsScreenMock() {
  return (
    <ScreenFrame accent="fill-violet-500">
      {/* Header */}
      <rect x="16" y="38" width="72" height="7" rx="3.5" className="fill-slate-900 dark:fill-zinc-100" />

      {/* Stats row */}
      <rect x="16" y="54" width="78" height="36" rx="8" className="fill-violet-50 dark:fill-violet-950/30" />
      <rect x="26" y="62" width="28" height="7" rx="3.5" className="fill-violet-500/70" />
      <rect x="26" y="74" width="44" height="5" rx="2.5" className="fill-slate-300 dark:fill-zinc-600" />

      <rect x="102" y="54" width="78" height="36" rx="8" className="fill-emerald-50 dark:fill-emerald-950/30" />
      <rect x="112" y="62" width="32" height="7" rx="3.5" className="fill-emerald-500/70" />
      <rect x="112" y="74" width="48" height="5" rx="2.5" className="fill-slate-300 dark:fill-zinc-600" />

      <rect x="188" y="54" width="78" height="36" rx="8" className="fill-indigo-50 dark:fill-indigo-950/30" />
      <rect x="198" y="62" width="24" height="7" rx="3.5" className="fill-indigo-500/70" />
      <rect x="198" y="74" width="38" height="5" rx="2.5" className="fill-slate-300 dark:fill-zinc-600" />

      {/* Order rows */}
      {[102, 122, 142].map((y, i) => (
        <g key={y}>
          <circle cx="28" cy={y + 6} r="6" className={["fill-emerald-100 dark:fill-emerald-900/30", "fill-amber-100 dark:fill-amber-900/30", "fill-indigo-100 dark:fill-indigo-900/30"][i]} />
          <rect x="42" y={y + 2} width={48 - i * 6} height="5" rx="2.5" className="fill-slate-400 dark:fill-zinc-500" />
          <rect x="130" y={y + 2} width="30" height="5" rx="2.5" className="fill-slate-200 dark:fill-zinc-700" />
          <rect x="220" y={y} width="40" height="12" rx="6" className={["fill-emerald-100 dark:fill-emerald-900/30", "fill-amber-100 dark:fill-amber-900/30", "fill-indigo-100 dark:fill-indigo-900/30"][i]} />
          <rect x="228" y={y + 3} width="24" height="5" rx="2.5" className={["fill-emerald-600/70", "fill-amber-600/70", "fill-indigo-600/70"][i]} />
        </g>
      ))}
    </ScreenFrame>
  );
}
