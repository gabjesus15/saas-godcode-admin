"use client";

import { useMemo, useState } from "react";

import { Input } from "../ui/input";
import { CompaniesTable } from "./companies-table";
import Link from "next/link";

interface CompaniesViewProps {
  companies: Array<{
    id: string;
    name: string | null;
    public_slug?: string | null;
    subscription_status: string | null;
    subscription_ends_at?: string | null;
    plans: {
      name: string | null;
      price: number | null;
      max_branches: number | null;
    } | { name: string | null; price: number | null; max_branches: number | null }[] | null;
  }>;
}

export function CompaniesView({ companies }: CompaniesViewProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return companies;
    }

    return companies.filter((company) =>
      (company.name ?? "").toLowerCase().includes(term)
    );
  }, [companies, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Empresas</h2>
          <p className="text-sm text-zinc-500">
            Busca y gestiona empresas rapidamente.
          </p>
        </div>
        <div className="flex w-full max-w-lg flex-wrap items-center justify-end gap-3">
          <div className="w-full max-w-xs">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar empresa..."
            />
          </div>
          <Link
            href="/companies/new"
            className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Nueva empresa
          </Link>
        </div>
      </div>
      <CompaniesTable companies={filtered} />
    </div>
  );
}
