"use client";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const height = size === "sm" ? "h-7 text-xs" : "h-8 text-sm";

  return (
    <div className={`portal-scrollbar-none max-w-full overflow-x-auto py-0.5 ${className}`}>
      <div role="tablist" className={`inline-flex min-w-max items-center gap-0.5 rounded-xl bg-[#f5f5f7] p-1`}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-medium transition-all sm:px-3 ${height} ${
                active
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {opt.label}
              {opt.count != null && (
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                    active ? "bg-indigo-100 text-indigo-700" : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
