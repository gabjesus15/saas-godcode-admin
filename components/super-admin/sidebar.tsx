"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, LogOut, Wrench } from "lucide-react";
import { AnimatedLogo } from "./AnimatedLogo";

import { createSupabaseBrowserClient } from "../../utils/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/onboarding/solicitudes", label: "Solicitudes", icon: ClipboardList },
  { href: "/plans", label: "Planes", icon: CreditCard },
  { href: "/tickets", label: "Tickets", icon: LifeBuoy },
  { href: "/herramientas", label: "Herramientas", icon: Wrench },
];

export function Sidebar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createSupabaseBrowserClient("super-admin");
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-10">
      <div className="flex flex-col items-center gap-1 mt-2 mb-2">
        <AnimatedLogo />
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
