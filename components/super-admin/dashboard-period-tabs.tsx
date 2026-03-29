"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { DashboardPeriod } from "../../lib/super-admin-dashboard-shared";
import { DASHBOARD_PERIODS } from "../../lib/super-admin-dashboard-shared";

export function DashboardPeriodTabs({ current }: { current: DashboardPeriod }) {
	const searchParams = useSearchParams();

	function hrefFor(p: DashboardPeriod): string {
		const other = new URLSearchParams(searchParams?.toString() ?? "");
		other.set("period", p);
		return `/dashboard?${other.toString()}`;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{DASHBOARD_PERIODS.map(({ value, label }) => (
				<Link
					key={value}
					href={hrefFor(value)}
					className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
						current === value
							? "bg-violet-600 text-white shadow-sm"
							: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
					}`}
				>
					{label}
				</Link>
			))}
		</div>
	);
}
