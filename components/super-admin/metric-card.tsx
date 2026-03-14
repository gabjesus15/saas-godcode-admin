import { Card } from "../ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

export default function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-2 p-4 sm:gap-3 sm:p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="min-w-0 truncate text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        {value}
      </div>
      {helper ? (
        <p className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">{helper}</p>
      ) : null}
    </Card>
  );
}
