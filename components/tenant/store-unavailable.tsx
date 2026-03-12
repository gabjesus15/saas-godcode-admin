import Link from "next/link";

export function StoreUnavailable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Tienda no disponible</h1>
        <p className="text-sm text-zinc-400">
          Esta tienda no esta disponible en este momento.
        </p>
      </div>
      <a
        href="/onboarding"
        className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
      >
        Crea tu propio menu digital con GodCode
      </a>
      <div className="text-xs uppercase tracking-[0.35em] text-zinc-700">
        Powered by GodCode
      </div>
    </div>
  );
}
