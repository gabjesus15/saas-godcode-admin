import Link from "next/link";
import { Building2, CreditCard, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/plans", label: "Planes", icon: CreditCard },
];

export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          SG
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Super Admin</p>
          <p className="text-xs text-zinc-500">Multi-Tenant SaaS</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
