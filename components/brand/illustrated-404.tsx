
type Cta = { label: string; href: string };

type Illustrated404Props = {
  oops: string;
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
};

const FOUR  = "#B8A45A";   // warm tan for the "4"s
const TEXT  = "#4A3E1E";   // dark text
const MUTED = "#8A7A48";   // muted text

/* ------------------------------------------------------------------ */
/*  SVG food "O" — flat icons arranged in two rings                   */
/*  ViewBox 300×300, centre (150,150)                                 */
/*  Outer ring: 6 items at r=90, every 60°                            */
/*  Inner ring: 4 items at r=44, every 90°                            */
/* ------------------------------------------------------------------ */
function FoodO() {
  return (
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-auto w-full flex-shrink-0"
      style={{ width: "clamp(120px,16vw,240px)", height: "clamp(120px,16vw,240px)" }}
    >
      {/* ── OUTER RING ── */}

      {/* ⭐ STAR at (150,60) */}
      <polygon
        points="150,40 155.9,53.2 170.5,53.2 159.3,62 163.6,75.4 150,67 136.4,75.4 140.7,62 129.5,53.2 144.1,53.2"
        fill="#F0C840"
      />

      {/* 🌶 CHILI at (228,105) */}
      <g transform="translate(228,105)">
        <ellipse cx="0" cy="5" rx="10" ry="24" fill="#D63A2F" transform="rotate(-10)" />
        <ellipse cx="-2" cy="-6" rx="3" ry="8" fill="rgba(255,255,255,0.22)" transform="rotate(-10)" />
        <path d="M6,-20 C8,-32 14,-36 14,-30" stroke="#4A9020" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* 🥕 CARROT at (228,195) */}
      <g transform="translate(228,196)">
        <path d="M0,-28 C6,-28 12,0 8,22 C4,28 -4,28 -8,22 C-12,0 -6,-28 0,-28 Z" fill="#F4922A" />
        <line x1="-5" y1="-26" x2="-12" y2="-42" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0"  y1="-28" x2="0"   y2="-46" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5"  y1="-26" x2="12"  y2="-40" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* 🥦 BROCCOLI at (150,240) */}
      <g transform="translate(150,240)">
        <rect x="-5" y="-6" width="10" height="22" rx="4" fill="#3A8020" />
        <circle cx="-14" cy="-16" r="13" fill="#4A9A2A" />
        <circle cx="14"  cy="-16" r="13" fill="#4A9A2A" />
        <circle cx="0"   cy="-24" r="13" fill="#52AA30" />
        <circle cx="-14" cy="-16" r="6"  fill="#5AB830" />
        <circle cx="14"  cy="-16" r="6"  fill="#5AB830" />
        <circle cx="0"   cy="-24" r="6"  fill="#5AB830" />
      </g>

      {/* 🍎 APPLE at (72,195) */}
      <g transform="translate(72,196)">
        <circle cx="0" cy="4" r="23" fill="#D63A2F" />
        <ellipse cx="-8" cy="0" rx="5" ry="10" fill="rgba(255,255,255,0.18)" />
        <rect x="-2" y="-21" width="4" height="12" rx="2" fill="#7A4818" />
        <path d="M2,-18 C8,-30 20,-26 16,-16" fill="#4A9020" />
      </g>

      {/* 🧅 ONION at (72,105) */}
      <g transform="translate(72,105)">
        <path d="M0,-24 C-20,-22 -24,-6 -22,10 C-19,25 -8,30 0,29 C8,30 19,25 22,10 C24,-6 20,-22 0,-24 Z" fill="#E8D5A0" />
        <path d="M0,-17 C-12,-15 -15,-4 -13,8 C-11,18 -4,21 0,20 C4,21 11,18 13,8 C15,-4 12,-15 0,-17 Z" fill="#F5E8C0" />
        <path d="M0,-10 C-6,-8 -8,-2 -7,5 C-5,11 -2,13 0,12 C2,13 5,11 7,5 C8,-2 6,-8 0,-10 Z" fill="#FAF0D4" />
        <line x1="0" y1="-24" x2="-4" y2="-36" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="-24" x2="4"  y2="-38" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── INNER RING ── */}

      {/* 🫛 SNAP PEA at (150,106) */}
      <g transform="translate(150,108)">
        <path d="M-22,0 C-22,-14 22,-14 22,0 C22,12 -22,12 -22,0 Z" fill="#8AC840" />
        <circle cx="-11" cy="2" r="5" fill="#5A9820" />
        <circle cx="0"   cy="0" r="5" fill="#5A9820" />
        <circle cx="11"  cy="2" r="5" fill="#5A9820" />
        <path d="M-22,0 C-22,-14 22,-14 22,0" stroke="#5A9820" strokeWidth="1.5" fill="none" />
      </g>

      {/* 🍄 MUSHROOM at (194,150) */}
      <g transform="translate(196,150)">
        <path d="M-16,4 C-20,-18 20,-18 16,4 Z" fill="#D63A2F" />
        <circle cx="-5" cy="-6" r="3.5" fill="rgba(255,255,255,0.85)" />
        <circle cx="7"  cy="-10" r="2.5" fill="rgba(255,255,255,0.85)" />
        <rect x="-9" y="4" width="18" height="16" rx="5" fill="#F0E0C4" />
        <line x1="-9" y1="12" x2="9" y2="12" stroke="#D8C4A0" strokeWidth="1" />
      </g>

      {/* 🥬 LEAF at (150,194) */}
      <g transform="translate(150,195)">
        <path d="M0,24 C-14,8 -18,-14 0,-24 C18,-14 14,8 0,24 Z" fill="#52962A" />
        <line x1="0" y1="24"  x2="0" y2="-24" stroke="#3A7018" strokeWidth="2" />
        <path d="M0,8  C-10,2 -14,-10 0,-18" stroke="#3A7018" strokeWidth="1.2" fill="none" />
        <path d="M0,8  C10,2  14,-10 0,-18"  stroke="#3A7018" strokeWidth="1.2" fill="none" />
      </g>

      {/* 🧄 GARLIC at (104,150) */}
      <g transform="translate(104,150)">
        <path d="M0,-22 C-14,-22 -18,-8 -16,6 C-14,18 -6,24 0,22 C6,24 14,18 16,6 C18,-8 14,-22 0,-22 Z" fill="#F0EAD8" />
        <path d="M0,-14 C-9,-14 -11,-4 -10,5 C-8,13 -3,16 0,15 C3,16 8,13 10,5 C11,-4 9,-14 0,-14 Z" fill="#EAE0C4" stroke="#D0C4A0" strokeWidth="1" />
        <line x1="-4" y1="-22" x2="-6" y2="-34" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4"  y1="-22" x2="6"  y2="-34" stroke="#4A9020" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-6,-34 C-4,-40 4,-40 6,-34" fill="none" stroke="#4A9020" strokeWidth="2" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
export function Illustrated404({
  oops,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: Illustrated404Props) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: "#ffffff" }}
    >
      {/* oops */}
      <p
        className="mb-6 text-[11px] font-bold uppercase tracking-[0.4em]"
        style={{ color: MUTED }}
      >
        {oops}
      </p>

      {/* 4 [food-O] 4 */}
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <span
          className="select-none font-extrabold leading-none"
          style={{ fontSize: "clamp(6rem,17vw,13rem)", color: FOUR, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          4
        </span>

        <FoodO />

        <span
          className="select-none font-extrabold leading-none"
          style={{ fontSize: "clamp(6rem,17vw,13rem)", color: FOUR, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          4
        </span>
      </div>

      {/* copy */}
      <h1
        className="mt-10 font-serif text-xl font-bold leading-snug sm:text-2xl md:text-3xl"
        style={{ color: TEXT, maxWidth: "34rem" }}
      >
        {title}
      </h1>
      <p
        className="mt-2 max-w-xs text-sm leading-relaxed sm:max-w-sm"
        style={{ color: MUTED }}
      >
        {subtitle}
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <a
          href={primaryCta.href}
          className="inline-flex items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: TEXT, color: "#ffffff", padding: "0.875rem 2.5rem", letterSpacing: "0.03em", whiteSpace: "nowrap" }}
        >
          {primaryCta.label}
        </a>
        {secondaryCta && (
          <a
            href={secondaryCta.href}
            className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all hover:bg-stone-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ border: `1.5px solid ${FOUR}`, color: MUTED, padding: "0.875rem 2.5rem", letterSpacing: "0.03em", whiteSpace: "nowrap" }}
          >
            {secondaryCta.label}
          </a>
        )}
      </div>
    </main>
  );
}
