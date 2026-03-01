"use client";

import { useState } from "react";

import { cn } from "../../utils/cn";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface CompanyTabsProps {
  tabs: TabItem[];
  initialId?: string;
}

export function CompanyTabs({ tabs, initialId }: CompanyTabsProps) {
  const [activeId, setActiveId] = useState(
    initialId ?? (tabs[0] ? tabs[0].id : "")
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              activeId === tab.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeId === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
